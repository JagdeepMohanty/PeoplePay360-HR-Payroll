from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import or_
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.contract import Contract
from ..models.employee import Employee
from ..models.payroll import Payrun, Payslip
from schemas.payroll import PayrunCreate, PayrunRead, PayslipRead
from services.salary_engine import compute_payslip
from services.guardian_validator import validate_payrun
from services.pdf_generator import generate_payslip_pdf

router = APIRouter()


@router.get("/", response_model=list[PayrunRead])
def list_payruns(db: Session = Depends(get_db)):
    return db.query(Payrun).order_by(Payrun.id.desc()).all()


# Declared before /{payrun_id} routes to avoid wildcard collision
@router.get("/payslips/{payslip_id}/pdf")
def download_payslip_pdf(payslip_id: int, db: Session = Depends(get_db)):
    slip = db.query(Payslip).filter(Payslip.id == payslip_id).first()
    if not slip:
        raise HTTPException(status_code=404, detail="Payslip not found")

    employee = db.query(Employee).filter(Employee.id == slip.employee_id).first()
    payrun = db.query(Payrun).filter(Payrun.id == slip.payrun_id).first()

    payslip_data = {
        "employee_name":  employee.name if employee else f"Employee #{slip.employee_id}",
        "department":     employee.department if employee else "",
        "period_start":   payrun.period_start if payrun else "",
        "period_end":     payrun.period_end if payrun else "",
        "basic_pay":      slip.basic_pay,
        "allowances":     slip.allowances,
        "gross":          slip.gross,
        "deductions":     slip.deductions,
        "net_pay":        slip.net_pay,
        "breakdown":      slip.breakdown,
    }

    pdf_bytes = generate_payslip_pdf(payslip_data)
    filename = f"payslip_{employee.name.replace(' ', '_')}_{payrun.period_start}.pdf" if employee and payrun else f"payslip_{payslip_id}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

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

    # Idempotency guard — clear any previously computed slips before re-running
    db.query(Payslip).filter(Payslip.payrun_id == payrun_id).delete()

    query = (
        db.query(Contract)
        .filter(
            Contract.state == "running",
            Contract.date_start <= payrun.period_end,
            or_(Contract.date_end >= payrun.period_start, Contract.date_end.is_(None)),
        )
    )
    if payrun.department:
        query = query.join(Employee).filter(Employee.department == payrun.department)

    contracts = query.all()
    payslips = []
    for contract in contracts:
        slip = Payslip(payrun_id=payrun_id, employee_id=contract.employee_id)
        slip = compute_payslip(db, slip, payrun.period_start, payrun.period_end)
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
