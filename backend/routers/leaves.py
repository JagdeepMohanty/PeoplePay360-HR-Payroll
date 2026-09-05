from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.leave import Leave
from schemas.leave import LeaveCreate, LeaveRead

router = APIRouter()


@router.get("/", response_model=list[LeaveRead])
def list_leaves(db: Session = Depends(get_db)):
    return db.query(Leave).all()


@router.post("/", response_model=LeaveRead, status_code=201)
def submit_leave(payload: LeaveCreate, db: Session = Depends(get_db)):
    leave = Leave(**payload.model_dump())
    db.add(leave)
    db.commit()
    db.refresh(leave)
    return leave


@router.post("/approve/{leave_id}", response_model=LeaveRead)
def approve_leave(leave_id: int, db: Session = Depends(get_db)):
    leave = db.query(Leave).filter(Leave.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    leave.state = "approved"
    db.commit()
    db.refresh(leave)
    return leave
