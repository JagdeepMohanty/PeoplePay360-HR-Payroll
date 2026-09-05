"""
Salary Rule Engine
Evaluates payslip lines sequentially: Basic → Allowances → Gross → Deductions → Net
"""
import json
from models.contract import Contract
from models.payroll import Payslip

ALLOWANCE_RATE = 0.20   # 20% of basic
DEDUCTION_RATE = 0.10   # 10% of gross (tax + social)


def compute_payslip(db, payslip: Payslip) -> Payslip:
    contract = (
        db.query(Contract)
        .filter(Contract.employee_id == payslip.employee_id, Contract.state == "running")
        .first()
    )
    if not contract:
        return payslip

    basic = contract.wage
    allowances = round(basic * ALLOWANCE_RATE, 2)
    gross = round(basic + allowances, 2)
    deductions = round(gross * DEDUCTION_RATE, 2)
    net = round(gross - deductions, 2)

    payslip.basic_pay = basic
    payslip.allowances = allowances
    payslip.gross = gross
    payslip.deductions = deductions
    payslip.net_pay = net
    payslip.breakdown = json.dumps({
        "Basic Pay": basic,
        "Housing Allowance": round(basic * 0.10, 2),
        "Transport Allowance": round(basic * 0.10, 2),
        "Gross": gross,
        "Income Tax": round(gross * 0.07, 2),
        "Social Security": round(gross * 0.03, 2),
        "Net Pay": net,
    })
    return payslip
