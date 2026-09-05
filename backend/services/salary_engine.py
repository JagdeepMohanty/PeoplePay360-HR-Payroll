"""
Salary Rule Engine (Modules A5 & A6)
Sequential evaluation: Basic → Allowances → Gross → LOP Deduction → Tax/Social → Net
"""
import json
from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from models.contract import Contract
from models.leave import LeaveRequest, LeaveStatus
from models.payroll import Payslip, SalaryStructure, SalaryRule, RuleCategory

WORKING_DAYS = 22     # Standard monthly working days for daily-rate calculation


def _resolve_contract(db: Session, employee_id: int, period_start: str, period_end: str) -> Contract:
    """
    Module A2 Requirement:
    Return the active contract overlapping the target payroll period.
    Overlap condition:
        contract.date_start <= period_end
        AND (contract.date_end >= period_start OR contract.date_end IS NULL)
        AND contract.is_active == True
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


def _calc_lop_days(db: Session, employee_id: int, period_start: str, period_end: str) -> float:
    """
    Sum the duration_days of all approved unpaid leave requests overlapping the payrun period.
    Overlap condition:
        leave.date_from <= period_end AND leave.date_to >= period_start
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
    return sum(leave.duration_days for leave in unpaid_leaves)


def compute_payslip(
    db: Session,
    payslip: Payslip,
    period_start: str,
    period_end: str,
) -> Payslip:
    """
    Computes payslip items according to rules defined in assigned SalaryStructure,
    ordered strictly by Rule Sequence (BASIC -> ALLOWANCE -> GROSS -> DEDUCTION -> NET).
    """
    # 1. Resolve period-aware contract
    contract = _resolve_contract(db, payslip.employee_id, period_start, period_end)
    payslip.contract_id = contract.id

    # 2. Resolve salary structure rules
    structure = None
    if contract.salary_structure_id:
        structure = (
            db.query(SalaryStructure)
            .filter(SalaryStructure.id == contract.salary_structure_id)
            .first()
        )
    if not structure:
        structure = db.query(SalaryStructure).filter(SalaryStructure.is_active == True).first()

    rules = []
    if structure and structure.rules:
        rules = sorted(structure.rules, key=lambda r: r.sequence)

    # 3. Base values
    basic = float(contract.wage or 0.0)
    housing_allowance = round(basic * 0.10, 2)
    transport_allowance = round(basic * 0.05, 2)
    allowances = round(housing_allowance + transport_allowance, 2)

    # If rules are configured in the structure, calculate allowances from rules
    if rules:
        rule_allowance_sum = 0.0
        for rule in rules:
            if rule.category == RuleCategory.ALLOWANCE:
                if rule.amount_type == "PERCENTAGE":
                    rule_allowance_sum += round(basic * (rule.amount_value / 100.0), 2)
                elif rule.amount_type == "FIXED":
                    rule_allowance_sum += round(rule.amount_value, 2)
        if rule_allowance_sum > 0:
            allowances = round(rule_allowance_sum, 2)

    # 4. Gross calculation (GROSS = BASIC + ALLOWANCES)
    gross = round(basic + allowances, 2)

    # 5. LOP Deduction & Statutory Deductions
    lop_days = _calc_lop_days(db, payslip.employee_id, period_start, period_end)
    daily_rate = round(basic / WORKING_DAYS, 4)
    lop_deduction = round(lop_days * daily_rate, 2)

    tax_rate = 0.07
    soc_rate = 0.03

    if rules:
        for rule in rules:
            if rule.code == "INCOME_TAX" and rule.amount_type == "PERCENTAGE":
                tax_rate = rule.amount_value / 100.0
            elif rule.code == "SOCIAL_SEC" and rule.amount_type == "PERCENTAGE":
                soc_rate = rule.amount_value / 100.0

    income_tax = round(gross * tax_rate, 2)
    social_sec = round(gross * soc_rate, 2)
    total_deductions = round(lop_deduction + income_tax + social_sec, 2)

    # 6. Net calculation (NET = GROSS - DEDUCTIONS)
    net = round(gross - total_deductions, 2)
    worked_days = max(0.0, float(WORKING_DAYS) - lop_days)

    # 7. Write back to Payslip model
    payslip.basic = basic
    payslip.allowances = allowances
    payslip.gross = gross
    payslip.deductions = total_deductions
    payslip.net = net
    payslip.worked_days = worked_days
    payslip.breakdown_json = json.dumps({
        "1_Basic_Pay": basic,
        "2_Housing_Allowance": housing_allowance,
        "2_Transport_Allowance": transport_allowance,
        "3_Gross": gross,
        "4_LOP_Days": lop_days,
        "4_Daily_Rate": daily_rate,
        "4_LOP_Deduction": lop_deduction,
        "5_Income_Tax": income_tax,
        "6_Social_Security": social_sec,
        "7_Net_Pay": net,
    })

    return payslip
