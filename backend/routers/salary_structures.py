from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from auth import require_salary_structure_read, require_salary_structure_write
from models.user import User
from models.payroll import SalaryStructure, SalaryRule
from schemas.payroll import (
    SalaryStructureCreate,
    SalaryStructureRead,
    SalaryRuleCreate,
    SalaryRuleRead,
)

router = APIRouter()


@router.get("", response_model=list[SalaryStructureRead])
@router.get("/", response_model=list[SalaryStructureRead])
def list_salary_structures(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_salary_structure_read),
):
    return db.query(SalaryStructure).all()


@router.get("/{structure_id}", response_model=SalaryStructureRead)
def get_salary_structure(
    structure_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_salary_structure_read),
):
    struct = db.query(SalaryStructure).filter(SalaryStructure.id == structure_id).first()
    if not struct:
        raise HTTPException(status_code=404, detail="Salary structure not found")
    return struct


@router.post("", response_model=SalaryStructureRead, status_code=201)
@router.post("/", response_model=SalaryStructureRead, status_code=201)
def create_salary_structure(
    payload: SalaryStructureCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_salary_structure_write),
):
    struct = SalaryStructure(**payload.model_dump())
    db.add(struct)
    db.commit()
    db.refresh(struct)
    return struct


@router.put("/{structure_id}", response_model=SalaryStructureRead)
def update_salary_structure(
    structure_id: int,
    payload: SalaryStructureCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_salary_structure_write),
):
    struct = db.query(SalaryStructure).filter(SalaryStructure.id == structure_id).first()
    if not struct:
        raise HTTPException(status_code=404, detail="Salary structure not found")
    for key, value in payload.model_dump().items():
        setattr(struct, key, value)
    db.commit()
    db.refresh(struct)
    return struct


@router.post("/{structure_id}/rules", response_model=SalaryRuleRead, status_code=201)
def create_salary_rule(
    structure_id: int,
    payload: SalaryRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_salary_structure_write),
):
    struct = db.query(SalaryStructure).filter(SalaryStructure.id == structure_id).first()
    if not struct:
        raise HTTPException(status_code=404, detail="Salary structure not found")

    rule_data = payload.model_dump()
    rule_data["structure_id"] = structure_id
    rule = SalaryRule(**rule_data)
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@router.delete("/{structure_id}", status_code=204)
def delete_salary_structure(
    structure_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_salary_structure_write),
):
    struct = db.query(SalaryStructure).filter(SalaryStructure.id == structure_id).first()
    if not struct:
        raise HTTPException(status_code=404, detail="Salary structure not found")
    db.delete(struct)
    db.commit()
    return None


@router.delete("/rules/{rule_id}", status_code=204)
def delete_salary_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_salary_structure_write),
):
    rule = db.query(SalaryRule).filter(SalaryRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Salary rule not found")
    db.delete(rule)
    db.commit()
    return None

