from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.attendance import Attendance
from ..schemas.attendance import AttendanceCreate, AttendanceRead
from ..models.user import User
from ..auth.dependencies import get_current_user, require_officer, require_manager

router = APIRouter()


@router.get("/", response_model=list[AttendanceRead])
def list_attendance(
    employee_id: int | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Attendance)
    if employee_id:
        # Ownership check
        if current_user.role == "HR_EMPLOYEE" and current_user.id != employee_id:
            raise HTTPException(status_code=403, detail="Access denied")
        query = query.filter(Attendance.employee_id == employee_id)
    return query.offset(skip).limit(limit).all()


@router.post("/", response_model=AttendanceRead, status_code=201)
def log_attendance(
    payload: AttendanceCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_officer)
):
    # Ensure employee exists
    employee = db.query(User).filter(User.id == payload.employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    record = Attendance(**payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record
