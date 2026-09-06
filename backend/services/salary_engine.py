"""
Salary Rule Engine
Sequential evaluation: Basic → Allowances → Gross → LOP Deduction → Tax/Social → Net

Key changes from previous version:
  - WORKING_DAYS constant removed; replaced by get_period_working_days()
  - All financial arithmetic uses Decimal for floating-point precision
  - WorkingSchedule intervals are respected when calculating daily rate
  - LOP daily rate is derived from the exact working days in the pay period
"""
import json
import calendar
from datetime import date, timedelta
from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from models.attendance import Attendance
from models.contract import Contract
from models.leave import LeaveRequest, LeaveStatus
from models.payroll import Payslip, SalaryStructure, RuleCategory
from models.working_schedule import WorkScheduleInterval


# ---------------------------------------------------------------------------
# Decimal helpers
# ---------------------------------------------------------------------------

def _d(value) -> Decimal:
    """Cast any numeric value to Decimal safely."""
    return Decimal(str(value if value is not None else 0))


def _round2(value: Decimal) -> Decimal:
    """Round to exactly 2 decimal places using ROUND_HALF_UP (financial standard)."""
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


# ---------------------------------------------------------------------------
# Working day calculation
# ---------------------------------------------------------------------------

def get_period_working_days(period_start: str, period_end: str, schedule_intervals=None) -> int:
    """
    Dynamically calculate the exact count of working days within [period_start, period_end].

    Default behaviour (no schedule_intervals):
        Count Monday–Friday (weekdays 0–4) within the date range.

    With schedule_intervals (list of WorkScheduleInterval ORM objects):
        Count only days whose day_of_week appears in the configured intervals,
        allowing for non-standard schedules (e.g. Mon–Sat, Sun–Thu).

    Args:
        period_start: ISO date string "YYYY-MM-DD"
        period_end:   ISO date string "YYYY-MM-DD"
        schedule_intervals: optional list of WorkScheduleInterval rows

    Returns:
        Integer count of working days in the period (minimum 1 to avoid division by zero).
    """
    start = date.fromisoformat(period_start)
    end   = date.fromisoformat(period_end)

    if schedule_intervals:
        # Build the set of configured working weekdays (0=Mon … 6=Sun)
        working_weekdays = {interval.day_of_week for interval in schedule_intervals}
    else:
        # Standard Mon–Fri
        working_weekdays = {0, 1, 2, 3, 4}

    count = 0
    current = start
    while current <= end:
        if current.weekday() in working_weekdays:
            count += 1
        current += timedelta(days=1)

    return max(count, 1)  # guard against zero-day periods


# ---------------------------------------------------------------------------
# Contract resolution
# ---------------------------------------------------------------------------

def _resolve_contract(db: Session, employee_id: int, period_start: str, period_end: str) -> Contract:
    """
    Return the single active contract whose date range overlaps the payrun period.
    """
    contract = (
        db.query(Contract)
        .filter(
            Contract.employee_id == employee_id,
            Contract.is_active == True,
            Contract.date_start <= period_end,
            or_(Contract.date_end >= period_start, Contract.date_end.is_(None)),
        )
        .first()
    )
    if not contract:
        raise HTTPException(
            status_code=400,
            detail=(
                f"No active contract found for employee #{employee_id} "
                f"overlapping period {period_start} → {period_end}."
            ),
        )
    return contract


# ---------------------------------------------------------------------------
# LOP & Overtime day/hour accumulation
# ---------------------------------------------------------------------------

def _calc_lop_days(db: Session, employee_id: int, period_start: str, period_end: str) -> Decimal:
    """
    Sum duration_days of all APPROVED unpaid leave requests overlapping the payrun period.
    """
    unpaid_leaves = (
        db.query(LeaveRequest)
        .filter(
            LeaveRequest.employee_id == employee_id,
            LeaveRequest.status == LeaveStatus.APPROVED,
            LeaveRequest.is_unpaid == True,
            LeaveRequest.date_from <= period_end,
            LeaveRequest.date_to >= period_start,
        )
        .all()
    )
    return _d(sum(leave.duration_days for leave in unpaid_leaves))


def _calc_overtime_hours(db: Session, employee_id: int, period_start: str, period_end: str) -> Decimal:
    """
    Calculate accumulated overtime hours for worked attendance records in period where daily worked_hours > 8.0.
    """
    start_dt = datetime.fromisoformat(f"{period_start}T00:00:00")
    end_dt = datetime.fromisoformat(f"{period_end}T23:59:59")
    records = (
        db.query(Attendance)
        .filter(
            Attendance.employee_id == employee_id,
            Attendance.check_in >= start_dt,
            Attendance.check_in <= end_dt,
        )
        .all()
    )
    total_ot = sum(max(0.0, float(r.worked_hours or 0.0) - 8.0) for r in records)
    return _d(round(total_ot, 2))


# ---------------------------------------------------------------------------
# Schedule interval loader
# ---------------------------------------------------------------------------

def _get_schedule_intervals(db: Session, employee) -> list:
    if not employee or not employee.working_schedule_id:
        return []
    return (
        db.query(WorkScheduleInterval)
        .filter(WorkScheduleInterval.schedule_id == employee.working_schedule_id)
        .all()
    )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def compute_payslip(
    db: Session,
    payslip: Payslip,
    period_start: str,
    period_end: str,
) -> Payslip:
    """
    Compute all salary rule lines for a single payslip and write results back
    onto the Payslip ORM object.
    """
    # ── 0. Resolve period-aware contract ──────────────────────────────────
    contract = _resolve_contract(db, payslip.employee_id, period_start, period_end)
    payslip.contract_id = contract.id

    # ── 0b. Load employee + working schedule intervals ────────────────────
    employee = contract.employee
    schedule_intervals = _get_schedule_intervals(db, employee)

    # ── 0c. Dynamic working days for this exact pay period ────────────────
    working_days = get_period_working_days(period_start, period_end, schedule_intervals or None)

    # ── 1. Basic ──────────────────────────────────────────────────────────
    basic = _round2(_d(contract.wage))

    # ── 2. Allowances & Overtime ──────────────────────────────────────────
    structure = None
    if contract.salary_structure_id:
        structure = db.query(SalaryStructure).filter(
            SalaryStructure.id == contract.salary_structure_id
        ).first()
    if not structure:
        structure = db.query(SalaryStructure).filter(
            SalaryStructure.is_active == True
        ).first()

    rules = sorted(structure.rules, key=lambda r: r.sequence) if structure and structure.rules else []

    housing_allowance   = _round2(basic * _d("0.10"))
    transport_allowance = _round2(basic * _d("0.05"))
    allowances          = _round2(housing_allowance + transport_allowance)

    if rules:
        rule_allowance = _d(0)
        for rule in rules:
            if rule.category == RuleCategory.ALLOWANCE:
                if rule.amount_type == "PERCENTAGE":
                    rule_allowance += _round2(basic * (_d(rule.amount_value) / _d(100)))
                elif rule.amount_type == "FIXED":
                    rule_allowance += _round2(_d(rule.amount_value))
        if rule_allowance > 0:
            allowances = _round2(rule_allowance)
            housing_allowance   = _round2(allowances * _d("0.667"))
            transport_allowance = _round2(allowances - housing_allowance)

    # Overtime Pay (1.5x hourly rate for hours over 8.0)
    lop_days      = _calc_lop_days(db, payslip.employee_id, period_start, period_end)
    daily_rate    = _round2(basic / _d(working_days))
    hourly_rate   = _round2(daily_rate / _d("8.0"))

    ot_hours      = _calc_overtime_hours(db, payslip.employee_id, period_start, period_end)
    overtime_pay  = _round2(ot_hours * hourly_rate * _d("1.5"))

    allowances = _round2(allowances + overtime_pay)

    # ── 3. Gross ──────────────────────────────────────────────────────────
    gross = _round2(basic + allowances)

    # ── 4. LOP Deduction — uses exact calendar working days ───────────────
    lop_deduction = _round2(lop_days * daily_rate)

    # ── 5 & 6. Statutory & Custom deductions ─────────────────────────────
    tax_rate = _d("0.07")
    soc_rate = _d("0.03")
    custom_deductions = _d("0")

    if rules:
        for rule in rules:
            if rule.code == "INCOME_TAX" and rule.amount_type == "PERCENTAGE":
                tax_rate = _d(rule.amount_value) / _d(100)
            elif rule.code == "SOCIAL_SEC" and rule.amount_type == "PERCENTAGE":
                soc_rate = _d(rule.amount_value) / _d(100)
            elif rule.category == RuleCategory.DEDUCTION and rule.code not in ["INCOME_TAX", "SOCIAL_SEC"]:
                if rule.amount_type == "PERCENTAGE":
                    custom_deductions += _round2(gross * (_d(rule.amount_value) / _d(100)))
                elif rule.amount_type == "FIXED":
                    custom_deductions += _round2(_d(rule.amount_value))

    income_tax       = _round2(gross * tax_rate)
    social_sec       = _round2(gross * soc_rate)
    total_deductions = _round2(lop_deduction + income_tax + social_sec + custom_deductions)

    # ── 7. Net ────────────────────────────────────────────────────────────
    net         = _round2(gross - total_deductions)
    worked_days = max(_d(0), _d(working_days) - lop_days)

    # ── Write back to ORM object (float for SQLAlchemy) ───────────────────
    payslip.basic       = float(basic)
    payslip.allowances  = float(allowances)
    payslip.gross       = float(gross)
    payslip.deductions  = float(total_deductions)
    payslip.net         = float(net)
    payslip.worked_days = float(worked_days)
    payslip.breakdown_json = json.dumps({
        "1_Basic_Pay":           float(basic),
        "2_Housing_Allowance":   float(housing_allowance),
        "2_Transport_Allowance": float(transport_allowance),
        "2_Overtime_Hours":      float(ot_hours),
        "2_Overtime_Pay":        float(overtime_pay),
        "3_Gross":               float(gross),
        "4_Working_Days":        working_days,
        "4_LOP_Days":            float(lop_days),
        "4_Daily_Rate":          float(daily_rate),
        "4_LOP_Deduction":       float(lop_deduction),
        "5_Income_Tax":          float(income_tax),
        "6_Social_Security":     float(social_sec),
        "7_Net_Pay":             float(net),
    })

    return payslip
