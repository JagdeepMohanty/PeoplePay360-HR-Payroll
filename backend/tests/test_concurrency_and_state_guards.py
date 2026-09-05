import os
import sys
from concurrent.futures import ThreadPoolExecutor
import pytest
from fastapi.testclient import TestClient

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from main import app
from database import get_db, SessionLocal
from models.user import User, UserRole
from models.employee import Employee
from models.contract import Contract
from models.leave import TimeOffType, LeaveAllocation, LeaveRequest, LeaveStatus
from models.payroll import Payrun, Payslip, PayrunStatus
from auth import get_current_user, require_hr_manager, require_payroll_write


def test_payrun_state_machine_guard(db_session):
    """Verify that compute_payrun prevents recomputation of VALIDATED or PAID payruns."""
    emp = Employee(first_name="Test", last_name="User", email="test@example.com")
    db_session.add(emp)
    db_session.flush()

    c = Contract(employee_id=emp.id, wage=4000.0, is_active=True, date_start="2026-01-01")
    db_session.add(c)
    db_session.flush()

    # 1. Test VALIDATED payrun
    payrun_val = Payrun(name="Validated Batch", period_start="2026-09-01", period_end="2026-09-30", status=PayrunStatus.VALIDATED)
    db_session.add(payrun_val)
    db_session.flush()

    # 2. Test PAID payrun
    payrun_paid = Payrun(name="Paid Batch", period_start="2026-09-01", period_end="2026-09-30", status=PayrunStatus.PAID)
    db_session.add(payrun_paid)
    db_session.commit()

    def override_get_db():
        yield db_session

    class PayrollManagerUser:
        id = 2
        email = "payroll@peoplepay360.dev"
        role = UserRole.HR_PAYROLL_MANAGER
        is_active = True
        employee_id = None

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: PayrollManagerUser()
    app.dependency_overrides[require_payroll_write] = lambda: PayrollManagerUser()

    with TestClient(app) as client:
        # Recompute on VALIDATED -> Must fail with 400
        res_val = client.post(f"/api/v1/payruns/{payrun_val.id}/compute")
        assert res_val.status_code == 400, res_val.text
        assert "Cannot recompute payrun in 'VALIDATED' or 'PAID' status." in res_val.json()["detail"]

        # Recompute on PAID -> Must fail with 400
        res_paid = client.post(f"/api/v1/payruns/{payrun_paid.id}/compute")
        assert res_paid.status_code == 400, res_paid.text
        assert "Cannot recompute payrun in 'VALIDATED' or 'PAID' status." in res_paid.json()["detail"]

    app.dependency_overrides.clear()


def test_transaction_rollback_safety():
    """Verify that get_db rolls back on unhandled exceptions."""
    from database import get_db

    db_gen = get_db()
    session = next(db_gen)

    # Add a dummy object but simulate an exception before commit
    emp = Employee(first_name="Rollback", last_name="Test", email="rollback@example.com")
    session.add(emp)

    try:
        # Simulate exception during request
        raise RuntimeError("Simulated mid-transaction failure")
    except RuntimeError:
        try:
            db_gen.throw(RuntimeError, RuntimeError("Simulated failure"), None)
        except RuntimeError:
            pass

    # Verify session is cleaned up and object wasn't committed
    check_session = SessionLocal()
    found = check_session.query(Employee).filter(Employee.email == "rollback@example.com").first()
    check_session.close()
    assert found is None, "Object should have been rolled back and not persisted!"


def test_concurrent_leave_approvals_prevent_overdraw(db_session):
    """
    Verify that concurrent leave approval requests for the same employee cannot over-deduct available balance.
    Allocation = 5.0 days.
    Request A = 3.0 days.
    Request B = 3.0 days.
    Only one should be approved; the other must be rejected with 400 Insufficient balance.
    """
    emp = Employee(first_name="Rohan", last_name="Sharma", email="rohan@example.com")
    db_session.add(emp)
    db_session.flush()

    tot = TimeOffType(name="Paid Vacation", unit="days", requires_allocation=True, is_unpaid=False)
    db_session.add(tot)
    db_session.flush()

    # Initial Allocation of 5 days
    alloc = LeaveAllocation(employee_id=emp.id, type_id=tot.id, allocated_days=5.0, used_days=0.0, year=2026)
    db_session.add(alloc)
    db_session.flush()

    # Two leave requests of 3 days each
    req1 = LeaveRequest(employee_id=emp.id, type_id=tot.id, date_from="2026-09-10", date_to="2026-09-12", duration_days=3.0, status=LeaveStatus.PENDING)
    req2 = LeaveRequest(employee_id=emp.id, type_id=tot.id, date_from="2026-09-15", date_to="2026-09-17", duration_days=3.0, status=LeaveStatus.PENDING)
    db_session.add_all([req1, req2])
    db_session.commit()

    class HRManagerUser:
        id = 1
        email = "hr@peoplepay360.dev"
        role = UserRole.HR_MANAGER
        is_active = True
        employee_id = None

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[require_hr_manager] = lambda: HRManagerUser()
    app.dependency_overrides[get_current_user] = lambda: HRManagerUser()

    results = []

    with TestClient(app) as client:
        def approve_req(req_id):
            res = client.post(f"/api/v1/leaves/approve/{req_id}")
            return res.status_code, res.json()

        # Execute both approvals concurrently using ThreadPoolExecutor
        with ThreadPoolExecutor(max_workers=2) as executor:
            f1 = executor.submit(approve_req, req1.id)
            f2 = executor.submit(approve_req, req2.id)
            results.append(f1.result())
            results.append(f2.result())

    status_codes = [r[0] for r in results]

    # Exactly one approval must succeed (200) and one must fail (400)
    assert 200 in status_codes, f"Expected at least one approval to succeed, got: {status_codes}"
    assert 400 in status_codes, f"Expected one approval to fail due to insufficient balance, got: {status_codes}"

    # Verify that remaining balance is never negative and used_days is exactly 3.0
    db_session.refresh(alloc)
    assert alloc.used_days == 3.0, f"Expected used_days=3.0, but got {alloc.used_days}"
    assert alloc.remaining_days == 2.0, f"Expected remaining_days=2.0, but got {alloc.remaining_days}"

    app.dependency_overrides.clear()
