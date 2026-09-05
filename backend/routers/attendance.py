from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.attendance import Attendance
from schemas.attendance import AttendanceCreate, AttendanceRead

router = APIRouter()


@router.get("/", response_model=list[AttendanceRead])
def list_attendance(db: Session = Depends(get_db)):
    return db.query(Attendance).all()


@router.post("/", response_model=AttendanceRead, status_code=201)
def log_attendance(payload: AttendanceCreate, db: Session = Depends(get_db)):
    record = Attendance(**payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record
