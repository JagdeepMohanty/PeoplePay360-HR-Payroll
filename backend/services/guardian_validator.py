from typing import List
from sqlalchemy.orm import Session
from ..models.payroll import Payrun, Payslip
from ..models.contract import Contract
from ..models.employee import Employee


def _check_missing_bank_account(employee: Employee) -> List[dict]:
    warnings = []
    if not getattr(employee, "bank_account", None):
        warnings.append({
            "employee_id": employee.id,
            "employee_name": employee.name,
            "type": "missing_bank_account",
            "message": f"{employee.name} has no bank account on file.",
        })
    return warnings


def _check_concurrent_contracts(db: Session, employee_id: int) -> List[dict]:
    warnings = []
    active = (
        db.query(Contract)
        .filter(Contract.employee_id == employee_id, Contract.state == "running")
        .count()
    )
    if active > 1:
        emp = db.query(Employee).filter(Employee.id == employee_id).first()
        warnings.append({
            "employee_id": employee_id,
            "employee_name": emp.name if emp else "",
            "type": "concurrent_contracts",
            "message": f"{emp.name if emp else 'Employee'} has {active} concurrent running contracts.",
        })
    return warnings


def _check_duplicate_payslips(db: Session, payrun_id: int, employee_id: int) -> List[dict]:
    warnings = []
    dup = (
        db.query(Payslip)
        .filter(Payslip.employee_id == employee_id, Payslip.payrun_id == payrun_id)
        .count()
    )
    if dup > 1:
        emp = db.query(Employee).filter(Employee.id == employee_id).first()
        warnings.append({
            "employee_id": employee_id,
            "employee_name": emp.name if emp else "",
            "type": "duplicate_payslip",
            "message": f"{emp.name if emp else 'Employee'} has duplicate payslips in this payrun.",
        })
    return warnings


def validate_payrun(db: Session, payrun_id: int, employee_ids: List[int]) -> List[dict]:
    """Run all Payroll Guardian checks and return a list of warning dictionaries.
    An empty list means the payrun passes all checks.
    """
    warnings: List[dict] = []
    # Ensure payrun exists
    payrun = db.query(Payrun).filter(Payrun.id == payrun_id).first()
    if not payrun:
        warnings.append({"type": "payrun_not_found", "message": f"Payrun {payrun_id} not found"})
        return warnings

    for emp_id in set(employee_ids):
        employee = db.query(Employee).filter(Employee.id == emp_id).first()
        if not employee:
            continue
        warnings.extend(_check_missing_bank_account(employee))
        warnings.extend(_check_concurrent_contracts(db, emp_id))
        warnings.extend(_check_duplicate_payslips(db, payrun_id, emp_id))
    return warnings
