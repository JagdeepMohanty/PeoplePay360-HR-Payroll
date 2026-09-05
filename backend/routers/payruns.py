from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.contract import Contract
from models.payroll import Payrun, Payslip
from schemas.payroll import PayrunCreate, PayrunRead, PayslipRead
from services.salary_engine import compute_payslip
from services.guardian_validator import validate_payrun

router = APIRouter()


@router.post("/wizard", response_model=PayrunRead, status_code=201)
def create_payrun(payload: PayrunCreate, db: Session = Depends(get_db)):
    payrun = Payrun(**payload.model_dump())
    db.add(payrun)
    db.commit()
    db.refresh(payrun)
    return payrun


@router.post("/{payrun_id}/compute", response_model=list[PayslipRead])
def compute_payrun(payrun_id: int, db: Session = Depends(get_db)):
    payrun = db.query(Payrun).filter(Payrun.id == payrun_id).first()
    if not payrun:
        raise HTTPException(status_code=404, detail="Payrun not found")

    query = db.query(Contract).filter(Contract.state == "running")
    if payrun.department:
        from models.employee import Employee
        query = query.join(Employee).filter(Employee.department == payrun.department)

    contracts = query.all()
    payslips = []
    for contract in contracts:
        slip = Payslip(payrun_id=payrun_id, employee_id=contract.employee_id)
        slip = compute_payslip(db, slip)
        db.add(slip)
        payslips.append(slip)

    payrun.state = "computed"
    db.commit()
    for slip in payslips:
        db.refresh(slip)
    return payslips


@router.get("/{payrun_id}/validate")
def validate(payrun_id: int, db: Session = Depends(get_db)):
    payrun = db.query(Payrun).filter(Payrun.id == payrun_id).first()
    if not payrun:
        raise HTTPException(status_code=404, detail="Payrun not found")
    employee_ids = [s.employee_id for s in db.query(Payslip).filter(Payslip.payrun_id == payrun_id).all()]
    warnings = validate_payrun(db, payrun_id, employee_ids)
    return {"payrun_id": payrun_id, "warnings": warnings, "warning_count": len(warnings)}


@router.post("/{payrun_id}/confirm", response_model=PayrunRead)
def confirm_payrun(payrun_id: int, db: Session = Depends(get_db)):
    payrun = db.query(Payrun).filter(Payrun.id == payrun_id).first()
    if not payrun:
        raise HTTPException(status_code=404, detail="Payrun not found")
    payrun.state = "confirmed"
    db.commit()
    db.refresh(payrun)
    return payrun
