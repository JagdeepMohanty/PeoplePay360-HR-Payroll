from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.contract import Contract
from schemas.contract import ContractCreate, ContractRead

router = APIRouter()


@router.get("/", response_model=list[ContractRead])
def list_contracts(db: Session = Depends(get_db)):
    return db.query(Contract).all()


@router.get("/active/{employee_id}", response_model=ContractRead)
def get_active_contract(employee_id: int, db: Session = Depends(get_db)):
    contract = db.query(Contract).filter(
        Contract.employee_id == employee_id, Contract.state == "running"
    ).first()
    if not contract:
        raise HTTPException(status_code=404, detail="No active contract found")
    return contract


@router.post("/", response_model=ContractRead, status_code=201)
def create_contract(payload: ContractCreate, db: Session = Depends(get_db)):
    contract = Contract(**payload.model_dump())
    db.add(contract)
    db.commit()
    db.refresh(contract)
    return contract
