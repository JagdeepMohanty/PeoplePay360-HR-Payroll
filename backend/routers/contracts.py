from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user, require_hr_manager, check_employee_self_or_hr
from models.user import User, UserRole
from models.contract import Contract
from schemas.contract import ContractCreate, ContractRead

router = APIRouter()


@router.get("/active/{employee_id}", response_model=ContractRead)
def get_active_contract(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not check_employee_self_or_hr(employee_id, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted for your role",
        )
    contract = (
        db.query(Contract)
        .filter(Contract.employee_id == employee_id, Contract.is_active == True)
        .first()
    )
    if not contract:
        raise HTTPException(status_code=404, detail="No active contract found")
    return contract


@router.get("", response_model=list[ContractRead])
@router.get("/", response_model=list[ContractRead])
def list_contracts(
    employee_id: Optional[int] = Query(None, description="Filter contracts by employee"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Contract)
    if current_user.role == UserRole.EMPLOYEE:
        if not current_user.employee_id:
            return []
        return query.filter(Contract.employee_id == current_user.employee_id).all()

    if employee_id is not None:
        query = query.filter(Contract.employee_id == employee_id)
    return query.all()


@router.get("/{contract_id}", response_model=ContractRead)
def get_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_manager),
):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    return contract


@router.post("", response_model=ContractRead, status_code=201)
@router.post("/", response_model=ContractRead, status_code=201)
def create_contract(
    payload: ContractCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_manager),
):
    contract = Contract(**payload.model_dump())
    db.add(contract)
    db.commit()
    db.refresh(contract)
    return contract


@router.put("/{contract_id}", response_model=ContractRead)
def update_contract(
    contract_id: int,
    payload: ContractCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_manager),
):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    for key, value in payload.model_dump().items():
        setattr(contract, key, value)
    db.commit()
    db.refresh(contract)
    return contract


@router.delete("/{contract_id}", status_code=204)
def delete_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_manager),
):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    db.delete(contract)
    db.commit()
    return None
