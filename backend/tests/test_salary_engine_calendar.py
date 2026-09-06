import os
import sys
from decimal import Decimal, ROUND_HALF_UP
import pytest

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from services.salary_engine import get_period_working_days, compute_payslip
from models.working_schedule import WorkScheduleInterval
from models.employee import Employee
from models.contract import Contract
from models.payroll import Payslip, Payrun, PayrunStatus
from models.leave import LeaveRequest, LeaveStatus


def test_working_days_calculation_across_months():
    """Verify working day calculations for months with 19, 20, 21, 22, and 23 working days."""
    # 1. 19 working days: 2026-02-02 to 2026-02-26 (partial range)
    assert get_period_working_days("2026-02-02", "2026-02-26") == 19

    # 2. 20 working days: February 2026 (2026-02-01 to 2026-02-28)
    assert get_period_working_days("2026-02-01", "2026-02-28") == 20

    # 3. 21 working days: May 2026 (2026-05-01 to 2026-05-31)
    assert get_period_working_days("2026-05-01", "2026-05-31") == 21

    # 4. 22 working days: September 2026 (2026-09-01 to 2026-09-30)
    assert get_period_working_days("2026-09-01", "2026-09-30") == 22

    # 5. 23 working days: July 2026 (2026-07-01 to 2026-07-31)
    assert get_period_working_days("2026-07-01", "2026-07-31") == 23


def test_working_schedule_custom_overrides():
    """Verify dynamic working days when a custom WorkingSchedule with intervals is provided."""
    # Mon-Sat schedule (days 0, 1, 2, 3, 4, 5)
    mon_sat_intervals = [
        WorkScheduleInterval(day_of_week=i, start_time="09:00", end_time="17:00")
        for i in range(6)
    ]
    # September 2026 Mon-Sat count = 26 days
    days_mon_sat = get_period_working_days("2026-09-01", "2026-09-30", mon_sat_intervals)
    assert days_mon_sat == 26


@pytest.mark.parametrize("start_date, end_date, expected_days", [
    ("2026-02-02", "2026-02-26", 19),
    ("2026-02-01", "2026-02-28", 20),
    ("2026-05-01", "2026-05-31", 21),
    ("2026-09-01", "2026-09-30", 22),
    ("2026-07-01", "2026-07-31", 23),
])
def test_salary_computation_precision_with_lop(db_session, start_date, end_date, expected_days):
    """
    Verify salary computation precision, daily rate derivation, and LOP deduction
    across months with 19, 20, 21, 22, and 23 working days.
    """
    basic_wage = 100000.0  # 100,000 INR basic

    emp = Employee(first_name="Priyanshu", last_name="Sharma", email=f"priyanshu.{expected_days}@example.com")
    db_session.add(emp)
    db_session.flush()

    contract = Contract(
        employee_id=emp.id,
        wage=basic_wage,
        date_start="2026-01-01",
        is_active=True
    )
    db_session.add(contract)
    db_session.flush()

    # 1. Test Full Month (0 LOP)
    payslip1 = Payslip(employee_id=emp.id, contract_id=contract.id)
    compute_payslip(db_session, payslip1, start_date, end_date)

    # Basic = 100,000, Allowances = 15,000 (10% housing + 5% transport), Gross = 115,000
    assert payslip1.basic == 100000.0
    assert payslip1.allowances == 15000.0
    assert payslip1.gross == 115000.0
    assert payslip1.worked_days == float(expected_days)

    # 2. Add 2 days of approved unpaid LOP leave
    unpaid_leave = LeaveRequest(
        employee_id=emp.id,
        type_id=1,
        date_from=start_date,
        date_to=end_date,
        duration_days=2.0,
        status=LeaveStatus.APPROVED,
        is_unpaid=True
    )
    db_session.add(unpaid_leave)
    db_session.commit()

    payslip2 = Payslip(employee_id=emp.id, contract_id=contract.id)
    compute_payslip(db_session, payslip2, start_date, end_date)

    # Calculate expected values using Decimal
    d_basic = Decimal("100000.00")
    d_working_days = Decimal(str(expected_days))
    d_daily_rate = (d_basic / d_working_days).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    d_lop_deduction = (Decimal("2.0") * d_daily_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    d_gross = Decimal("115000.00")
    d_income_tax = (d_gross * Decimal("0.07")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    d_social_sec = (d_gross * Decimal("0.03")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    d_total_deductions = d_lop_deduction + d_income_tax + d_social_sec
    d_expected_net = d_gross - d_total_deductions

    assert payslip2.gross == float(d_gross)
    assert payslip2.deductions == float(d_total_deductions)
    assert payslip2.net == float(d_expected_net)
    assert payslip2.worked_days == float(expected_days - 2)
