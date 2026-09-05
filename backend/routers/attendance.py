from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from models.user import User, UserRole
from models.attendance import Attendance
from schemas.attendance import AttendanceCreate, AttendanceRead

router = APIRouter()


@router.get("/", response_model=list[AttendanceRead])
def list_attendance(
    employee_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Attendance)

    if current_user.role == UserRole.EMPLOYEE:
        if not current_user.employee_id:
            return []
        query = query.filter(Attendance.employee_id == current_user.employee_id)
    else:
        if employee_id is not None:
            query = query.filter(Attendance.employee_id == employee_id)

    return query.all()


@router.post("/", response_model=AttendanceRead, status_code=201)
def log_attendance(
    payload: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_override = False

    if current_user.role == UserRole.EMPLOYEE:
        if not current_user.employee_id or payload.employee_id != current_user.employee_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Employees can only log attendance for themselves",
            )
    elif current_user.role in [UserRole.HR_MANAGER, UserRole.ADMIN, UserRole.HR_PAYROLL_MANAGER]:
        # Flag manual correction by administrative roles
        is_override = True

    att_dict = payload.model_dump()
    if is_override:
        att_dict["is_manual_override"] = True

    record = Attendance(**att_dict)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record
