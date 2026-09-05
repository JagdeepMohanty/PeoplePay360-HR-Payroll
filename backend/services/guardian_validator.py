"""
Payroll Guardian Validator
Runs pre-confirmation anomaly checks and surfaces actionable warnings.
"""
from models.employee import Employee
from models.contract import Contract
from models.payroll import Payslip


def validate_payrun(db, payrun_id: int, employee_ids: list[int]) -> list[dict]:
    warnings = []

    for emp_id in employee_ids:
        employee = db.query(Employee).filter(Employee.id == emp_id).first()
        if not employee:
            continue

        emp_name = employee.full_name

        # Check 1: Missing bank account
        if not employee.bank_account:
            warnings.append({
                "employee_id": emp_id,
                "employee_name": emp_name,
                "type": "missing_bank_account",
                "message": f"{emp_name} has no bank account on file.",
            })

        # Check 2: Concurrent active contracts
        active_contracts = (
            db.query(Contract)
            .filter(Contract.employee_id == emp_id, Contract.is_active == True)
            .count()
        )
        if active_contracts > 1:
            warnings.append({
                "employee_id": emp_id,
                "employee_name": emp_name,
                "type": "concurrent_contracts",
                "message": f"{emp_name} has {active_contracts} concurrent active contracts.",
            })

        # Check 3: Duplicate payslip for same payrun
        duplicate = (
            db.query(Payslip)
            .filter(Payslip.employee_id == emp_id, Payslip.payrun_id == payrun_id)
            .count()
        )
        if duplicate > 1:
            warnings.append({
                "employee_id": emp_id,
                "employee_name": emp_name,
                "type": "duplicate_payslip",
                "message": f"{emp_name} has duplicate payslips in this payrun.",
            })

    return warnings
