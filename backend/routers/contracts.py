from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models.contract import Contract
from schemas.contract import ContractCreate, ContractRead

router = APIRouter()


# /active/{employee_id} MUST be declared before /{contract_id} so FastAPI
# does not greedily match the literal string "active" as an integer param.
@router.get("/active/{employee_id}", response_model=ContractRead)
def get_active_contract(employee_id: int, db: Session = Depends(get_db)):
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
):
    query = db.query(Contract)
    if employee_id is not None:
        query = query.filter(Contract.employee_id == employee_id)
    return query.all()


@router.get("/{contract_id}", response_model=ContractRead)
def get_contract(contract_id: int, db: Session = Depends(get_db)):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    return contract


@router.post("/", response_model=ContractRead, status_code=201)
def create_contract(payload: ContractCreate, db: Session = Depends(get_db)):
    contract = Contract(**payload.model_dump())
    db.add(contract)
    db.commit()
    db.refresh(contract)
    return contract
