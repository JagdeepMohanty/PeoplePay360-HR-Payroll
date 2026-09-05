"""
Salary Rule Engine
Sequential evaluation: Basic → Allowances → Gross → LOP Deduction → Tax/Social → Net
"""
import json
from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..models.contract import Contract
from ..models.leave import Leave
from ..models.payroll import Payslip

# ---------------------------------------------------------------------------
# Rule rates
# ---------------------------------------------------------------------------
ALLOWANCE_RATE  = 0.15   # 15% of basic  (housing + transport)
INCOME_TAX_RATE = 0.07   # 7%  of gross
SOC_SEC_RATE    = 0.03   # 3%  of gross
WORKING_DAYS    = 22     # standard monthly working days for daily-rate calc


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _resolve_contract(db: Session, employee_id: int, period_start: str, period_end: str) -> Contract:
    """
    Return the single running contract whose date range overlaps the payrun period.
    Overlap condition:
        contract.date_start <= period_end
        AND (contract.date_end >= period_start OR contract.date_end IS NULL)
    Raises HTTP 400 if no valid contract is found.
    """
    contract = (
        db.query(Contract)
        .filter(
            Contract.employee_id == employee_id,
            Contract.state == "running",
            Contract.date_start <= period_end,
            or_(Contract.date_end >= period_start, Contract.date_end.is_(None)),
        )
        .first()
    )
    if not contract:
        raise HTTPException(
            status_code=400,
            detail=(
                f"No active contract found for employee {employee_id} "
                f"overlapping period {period_start} → {period_end}."
            ),
        )
    return contract


def _calc_lop_days(db: Session, employee_id: int, period_start: str, period_end: str) -> float:
    """
    Sum the days of all approved unpaid leave requests that overlap the payrun period.
    Overlap condition:
        leave.date_from <= period_end AND leave.date_to >= period_start
    """
    unpaid_leaves = (
        db.query(Leave)
        .filter(
            Leave.employee_id == employee_id,
            Leave.state == "approved",
            Leave.leave_type == "unpaid",
            Leave.date_from <= period_end,
            Leave.date_to >= period_start,
        )
        .all()
    )
    return sum(leave.days for leave in unpaid_leaves)


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

    Rule sequence
    ─────────────
    [1] BASIC          = contract.wage
    [2] ALLOWANCE      = BASIC × 15%  (housing 10% + transport 5%)
    [3] GROSS          = BASIC + ALLOWANCE
    [4] LOP_DEDUCTION  = (BASIC / 22) × approved_unpaid_days_in_period
    [5] INCOME_TAX     = GROSS × 7%
    [6] SOCIAL_SEC     = GROSS × 3%
    [7] NET            = GROSS − LOP_DEDUCTION − INCOME_TAX − SOCIAL_SEC
    """
    # ── Rule 0: resolve period-aware contract ──────────────────────────────
    contract = _resolve_contract(db, payslip.employee_id, period_start, period_end)

    # ── Rule 1: Basic ──────────────────────────────────────────────────────
    basic = contract.wage

    # ── Rule 2: Allowances ─────────────────────────────────────────────────
    housing_allowance   = round(basic * 0.10, 2)
    transport_allowance = round(basic * 0.05, 2)
    allowances          = round(housing_allowance + transport_allowance, 2)

    # ── Rule 3: Gross ──────────────────────────────────────────────────────
    gross = round(basic + allowances, 2)

    # ── Rule 4: LOP Deduction ──────────────────────────────────────────────
    lop_days       = _calc_lop_days(db, payslip.employee_id, period_start, period_end)
    daily_rate     = round(basic / WORKING_DAYS, 4)
    lop_deduction  = round(lop_days * daily_rate, 2)

    # ── Rule 5 & 6: Statutory deductions on gross ─────────────────────────
    income_tax  = round(gross * INCOME_TAX_RATE, 2)
    social_sec  = round(gross * SOC_SEC_RATE, 2)
    total_deductions = round(lop_deduction + income_tax + social_sec, 2)

    # ── Rule 7: Net ────────────────────────────────────────────────────────
    net = round(gross - total_deductions, 2)

    # ── Write back to ORM object ───────────────────────────────────────────
    payslip.basic_pay   = basic
    payslip.allowances  = allowances
    payslip.gross       = gross
    payslip.deductions  = total_deductions
    payslip.net_pay     = net
    payslip.breakdown   = json.dumps({
        "1_Basic_Pay":           basic,
        "2_Housing_Allowance":   housing_allowance,
        "2_Transport_Allowance": transport_allowance,
        "3_Gross":               gross,
        "4_LOP_Days":            lop_days,
        "4_Daily_Rate":          daily_rate,
        "4_LOP_Deduction":       lop_deduction,
        "5_Income_Tax":          income_tax,
        "6_Social_Security":     social_sec,
        "7_Net_Pay":             net,
    })

    return payslip
