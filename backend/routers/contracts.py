from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.contract import Contract
from ..schemas.contract import ContractCreate, ContractRead
from ..models.user import User
from ..auth.dependencies import get_current_user, require_officer, require_manager

router = APIRouter()


# /active/{employee_id} MUST be declared before /{contract_id} so FastAPI
# does not greedily match the literal string "active" as an integer param.
@router.get("/active/{employee_id}", response_model=ContractRead)
def get_active_contract(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Access control
    if current_user.role == "HR_EMPLOYEE" and current_user.id != employee_id:
        raise HTTPException(status_code=403, detail="Access denied")
    contract = db.query(Contract).filter(
        Contract.employee_id == employee_id, Contract.state == "running"
    ).first()
    if not contract:
        raise HTTPException(status_code=404, detail="No active contract found")
    return contract


@router.get("/", response_model=list[ContractRead])
def list_contracts(
    employee_id: Optional[int] = Query(None, description="Filter contracts by employee"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Role based access
    if employee_id is not None:
        if current_user.role == "HR_EMPLOYEE" and current_user.id != employee_id:
            raise HTTPException(status_code=403, detail="Access denied")
    else:
        if current_user.role not in ("HR_OFFICER", "HR_MANAGER"):
            raise HTTPException(status_code=403, detail="Access denied")
    query = db.query(Contract)
    if employee_id is not None:
        query = query.filter(Contract.employee_id == employee_id)
    return query.all()


@router.get("/{contract_id}", response_model=ContractRead)
def get_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    # Ownership / role check
    if current_user.role == "HR_EMPLOYEE" and contract.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if current_user.role in ("HR_OFFICER", "HR_MANAGER"):
        return contract
    raise HTTPException(status_code=403, detail="Access denied")


@router.post("/", response_model=ContractRead, status_code=201)
def create_contract(
    payload: ContractCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_officer)
):
    contract = Contract(**payload.model_dump())
    db.add(contract)
    db.commit()
    db.refresh(contract)
    return contract
