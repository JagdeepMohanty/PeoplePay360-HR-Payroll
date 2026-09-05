import os
import sys
from datetime import datetime, timezone, timedelta
import pytest
from fastapi.testclient import TestClient

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from main import app
from database import get_db
from models.user import User, UserRole
from models.employee import Employee
from models.contract import Contract
from models.payroll import Payrun, Payslip, PayrunStatus
from models.attendance import Attendance
from routers.attendance import normalize_utc
from auth import get_current_user


def test_timezone_normalization():
    """Verify that normalize_utc correctly normalizes both aware and naive datetimes to naive UTC."""
    assert normalize_utc(None) is None

    # Naive datetime remains naive and unchanged
    naive_dt = datetime(2026, 9, 6, 12, 0, 0)
    assert normalize_utc(naive_dt) == naive_dt
    assert normalize_utc(naive_dt).tzinfo is None

    # Timezone-aware datetime (+05:30)
    tz_ist = timezone(timedelta(hours=5, minutes=30))
    aware_dt = datetime(2026, 9, 6, 17, 30, 0, tzinfo=tz_ist)
    normalized = normalize_utc(aware_dt)
    assert normalized.tzinfo is None
    # 17:30 IST is 12:00 UTC
    assert normalized == datetime(2026, 9, 6, 12, 0, 0)


def test_unlinked_account_cannot_log_or_punch_attendance(db_session):
    """Verify that an account with no linked employee profile cannot log or punch attendance."""
    # Create unlinked user
    class UnlinkedUser:
        id = 999
        email = "unlinked.user@example.com"
        role = UserRole.EMPLOYEE
        is_active = True
        employee_id = None

    def override_unlinked_user():
        return UnlinkedUser()

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_unlinked_user

    with TestClient(app) as client:
        # 1. Attempt to log attendance
        log_res = client.post("/api/v1/attendance", json={
            "check_in": "2026-09-06T09:00:00",
            "check_out": None,
            "worked_hours": 0.0,
            "status": "PRESENT"
        })
        assert log_res.status_code == 400, log_res.text
        assert "User account is not linked to an Employee profile. Contact HR." in log_res.json()["detail"]

        # 2. Attempt to punch attendance
        punch_res = client.post("/api/v1/attendance/punch", json={})
        assert punch_res.status_code == 400, punch_res.text
        assert "User account is not linked to an Employee profile. Contact HR." in punch_res.json()["detail"]

        # 3. Attempt to submit leave
        leave_res = client.post("/api/v1/leaves", json={
            "type_id": 1,
            "date_from": "2026-09-10",
            "date_to": "2026-09-11",
            "duration_days": 2.0,
            "employee_id": 1
        })
        assert leave_res.status_code == 400, leave_res.text
        assert "User account is not linked to an Employee profile. Contact HR." in leave_res.json()["detail"]

    app.dependency_overrides.clear()


def test_idor_payslip_pdf_download(db_session):
    """
    Verify that non-admin employees can ONLY download their own payslips (IDOR prevention),
    while payroll administrators can access any payslip.
    """
    # Set up Employee 1 and Employee 2 and their Contracts
    emp1 = Employee(first_name="Alice", last_name="Smith", email="alice@example.com", department="Eng", job_position="Dev")
    emp2 = Employee(first_name="Bob", last_name="Jones", email="bob@example.com", department="Sales", job_position="Rep")
    db_session.add_all([emp1, emp2])
    db_session.flush()

    c1 = Contract(employee_id=emp1.id, wage=5000.0, is_active=True, date_start="2026-01-01")
    c2 = Contract(employee_id=emp2.id, wage=6000.0, is_active=True, date_start="2026-01-01")
    db_session.add_all([c1, c2])
    db_session.flush()

    # Create a payrun batch
    payrun = Payrun(name="Sep 2026 Payrun", period_start="2026-09-01", period_end="2026-09-30", status=PayrunStatus.COMPUTED)
    db_session.add(payrun)
    db_session.flush()

    # Create payslips
    slip1 = Payslip(payrun_id=payrun.id, employee_id=emp1.id, contract_id=c1.id, basic=5000.0, allowances=500.0, gross=5500.0, deductions=500.0, net=5000.0)
    slip2 = Payslip(payrun_id=payrun.id, employee_id=emp2.id, contract_id=c2.id, basic=6000.0, allowances=600.0, gross=6600.0, deductions=600.0, net=6000.0)
    db_session.add_all([slip1, slip2])
    db_session.commit()

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    # --- Scenario A: Logged in as Employee 1 (Alice) ---
    class AliceUser:
        id = 101
        email = "alice@example.com"
        role = UserRole.EMPLOYEE
        is_active = True
        employee_id = emp1.id

    app.dependency_overrides[get_current_user] = lambda: AliceUser()

    with TestClient(app) as client:
        # Alice requests her own payslip -> 200 OK (PDF content)
        res_own = client.get(f"/api/v1/payruns/payslips/{slip1.id}/pdf")
        assert res_own.status_code == 200, res_own.text
        assert res_own.headers["content-type"] == "application/pdf"

        # Alice attempts to download Bob's payslip -> 403 Forbidden (IDOR blocked!)
        res_other = client.get(f"/api/v1/payruns/payslips/{slip2.id}/pdf")
        assert res_other.status_code == 403, res_other.text
        assert "Forbidden: You can only access your own payslip." in res_other.json()["detail"]

    # --- Scenario B: Logged in as Admin ---
    class AdminUser:
        id = 1
        email = "admin@peoplepay360.dev"
        role = UserRole.ADMIN
        is_active = True
        employee_id = None

    app.dependency_overrides[get_current_user] = lambda: AdminUser()

    with TestClient(app) as client:
        # Admin can access Alice's payslip -> 200 OK
        res_admin_slip1 = client.get(f"/api/v1/payruns/payslips/{slip1.id}/pdf")
        assert res_admin_slip1.status_code == 200, res_admin_slip1.text

        # Admin can access Bob's payslip -> 200 OK
        res_admin_slip2 = client.get(f"/api/v1/payruns/payslips/{slip2.id}/pdf")
        assert res_admin_slip2.status_code == 200, res_admin_slip2.text

    app.dependency_overrides.clear()
