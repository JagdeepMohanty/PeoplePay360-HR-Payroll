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

        # Check 1: Missing bank account
        if not employee.bank_account:
            warnings.append({
                "employee_id": emp_id,
                "employee_name": employee.name,
                "type": "missing_bank_account",
                "message": f"{employee.name} has no bank account on file.",
            })

        # Check 2: Concurrent active contracts
        active_contracts = (
            db.query(Contract)
            .filter(Contract.employee_id == emp_id, Contract.state == "running")
            .count()
        )
        if active_contracts > 1:
            warnings.append({
                "employee_id": emp_id,
                "employee_name": employee.name,
                "type": "concurrent_contracts",
                "message": f"{employee.name} has {active_contracts} concurrent running contracts.",
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
                "employee_name": employee.name,
                "type": "duplicate_payslip",
                "message": f"{employee.name} has duplicate payslips in this payrun.",
            })

    return warnings
