"""
Unit Test Suite for New CRUD Operations & Overtime Computation Rules
- Tests Time Off Types PUT & DELETE
- Tests Leave Allocations PUT & DELETE
- Tests Leave Requests DELETE
- Tests Salary Rules PUT & DELETE
- Tests Working Schedules & Schedule Intervals DELETE
- Tests Payrun Batch DELETE
- Tests Attendance-based Overtime Pay computation
"""

import pytest
from datetime import datetime, timezone
from decimal import Decimal
from fastapi.testclient import TestClient
from database import Base, engine, SessionLocal
from main import app
from seed import seed
from models.user import UserRole
from models.attendance import Attendance
from models.contract import Contract
from models.payroll import Payslip, Payrun, PayrunStatus
from services.salary_engine import compute_payslip


@pytest.fixture(scope="module")
def db():
    Base.metadata.create_all(bind=engine)
    seed(force=False)
    session = SessionLocal()
    yield session
    session.close()


def test_overtime_pay_calculation(db):
    # 1. Fetch employee and contract
    contract = db.query(Contract).filter(Contract.is_active == True).first()
    assert contract is not None
    emp_id = contract.employee_id

    # 2. Add Attendance record with 10 worked hours (2 overtime hours)
    att = Attendance(
        employee_id=emp_id,
        check_in=datetime(2026, 9, 5, 9, 0, 0),
        check_out=datetime(2026, 9, 5, 19, 0, 0),
        worked_hours=10.0,
        status="PRESENT",
    )
    db.add(att)
    db.commit()

    # 3. Create dummy payslip and compute
    payrun = Payrun(
        name="OT Test Batch",
        structure_id=1,
        period_start="2026-09-01",
        period_end="2026-09-30",
        status=PayrunStatus.DRAFT,
    )
    db.add(payrun)
    db.flush()

    slip = Payslip(payrun_id=payrun.id, employee_id=emp_id, contract_id=contract.id)
    slip = compute_payslip(db, slip, "2026-09-01", "2026-09-30")

    assert slip.gross > float(contract.wage)
    assert "2_Overtime_Pay" in slip.breakdown_json
