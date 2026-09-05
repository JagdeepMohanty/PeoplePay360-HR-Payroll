from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import or_
from sqlalchemy.orm import Session
from database import get_db
from auth import require_payroll_read, require_payroll_write
from models.user import User
from models.contract import Contract
from models.employee import Employee
from models.payroll import Payrun, Payslip, PayrunStatus
from schemas.payroll import PayrunCreate, PayrunRead, PayslipRead
from services.salary_engine import compute_payslip
from services.guardian_validator import validate_payrun
from services.pdf_generator import generate_payslip_pdf

router = APIRouter()


@router.get("/", response_model=list[PayrunRead])
def list_payruns(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_payroll_read),
):
    return db.query(Payrun).order_by(Payrun.id.desc()).all()


@router.get("/payslips/{payslip_id}/pdf")
def download_payslip_pdf(
    payslip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_payroll_read),
):
    slip = db.query(Payslip).filter(Payslip.id == payslip_id).first()
    if not slip:
        raise HTTPException(status_code=404, detail="Payslip not found")

    employee = db.query(Employee).filter(Employee.id == slip.employee_id).first()
    payrun = db.query(Payrun).filter(Payrun.id == slip.payrun_id).first()

    emp_name = employee.full_name if employee else f"Employee #{slip.employee_id}"
    payslip_data = {
        "employee_name": emp_name,
        "department": employee.department if employee else "",
        "period_start": payrun.period_start if payrun else "",
        "period_end": payrun.period_end if payrun else "",
        "basic_pay": slip.basic,
        "allowances": slip.allowances,
        "gross": slip.gross,
        "deductions": slip.deductions,
        "net_pay": slip.net,
        "breakdown": slip.breakdown_json,
    }

    pdf_bytes = generate_payslip_pdf(payslip_data)
    filename = (
        f"payslip_{emp_name.replace(' ', '_')}_{payrun.period_start}.pdf"
        if employee and payrun
        else f"payslip_{payslip_id}.pdf"
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{payrun_id}", response_model=PayrunRead)
def get_payrun(
    payrun_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_payroll_read),
):
    payrun = db.query(Payrun).filter(Payrun.id == payrun_id).first()
    if not payrun:
        raise HTTPException(status_code=404, detail="Payrun not found")
    return payrun


@router.post("/wizard", response_model=PayrunRead, status_code=201)
def create_payrun(
    payload: PayrunCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_payroll_write),
):
    payrun = Payrun(**payload.model_dump(), status=PayrunStatus.DRAFT)
    db.add(payrun)
    db.commit()
    db.refresh(payrun)
    return payrun


@router.post("/{payrun_id}/compute", response_model=list[PayslipRead])
def compute_payrun(
    payrun_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_payroll_write),
):
    payrun = db.query(Payrun).filter(Payrun.id == payrun_id).first()
    if not payrun:
        raise HTTPException(status_code=404, detail="Payrun not found")

    # Clear previously computed slips
    db.query(Payslip).filter(Payslip.payrun_id == payrun_id).delete()

    query = db.query(Contract).filter(
        Contract.is_active == True,
        Contract.date_start <= payrun.period_end,
        or_(Contract.date_end >= payrun.period_start, Contract.date_end.is_(None)),
    )

    contracts = query.all()
    payslips = []
    for contract in contracts:
        slip = Payslip(
            payrun_id=payrun_id,
            employee_id=contract.employee_id,
            contract_id=contract.id,
        )
        slip = compute_payslip(db, slip, payrun.period_start, payrun.period_end)
        db.add(slip)
        payslips.append(slip)

    payrun.status = PayrunStatus.COMPUTED
    db.commit()
    for slip in payslips:
        db.refresh(slip)
    return payslips


@router.get("/{payrun_id}/validate")
def validate(
    payrun_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_payroll_read),
):
    payrun = db.query(Payrun).filter(Payrun.id == payrun_id).first()
    if not payrun:
        raise HTTPException(status_code=404, detail="Payrun not found")
    employee_ids = [
        s.employee_id for s in db.query(Payslip).filter(Payslip.payrun_id == payrun_id).all()
    ]
    warnings = validate_payrun(db, payrun_id, employee_ids)
    return {"payrun_id": payrun_id, "warnings": warnings, "warning_count": len(warnings)}


@router.post("/{payrun_id}/confirm", response_model=PayrunRead)
def confirm_payrun(
    payrun_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_payroll_write),
):
    payrun = db.query(Payrun).filter(Payrun.id == payrun_id).first()
    if not payrun:
        raise HTTPException(status_code=404, detail="Payrun not found")
    payrun.status = PayrunStatus.VALIDATED
    db.commit()
    db.refresh(payrun)
    return payrun
