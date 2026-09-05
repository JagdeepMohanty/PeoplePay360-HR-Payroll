from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user, require_hr_manager
from models.user import User, UserRole
from models.employee import Employee
from models.attendance import Attendance
from schemas.attendance import (
    AttendanceCreate,
    AttendanceRead,
    AttendanceUpdate,
    PunchRequest,
)

router = APIRouter()


@router.get("", response_model=list[AttendanceRead])
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

    return query.order_by(Attendance.check_in.desc(), Attendance.id.desc()).all()


@router.get("/status", response_model=Optional[AttendanceRead])
@router.get("/status/", response_model=Optional[AttendanceRead])
def get_attendance_status(
    employee_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns today's latest punch status for the employee."""
    target_id = current_user.employee_id if current_user.role == UserRole.EMPLOYEE else (employee_id or current_user.employee_id or 4)
    if not target_id:
        return None

    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    latest = (
        db.query(Attendance)
        .filter(Attendance.employee_id == target_id, Attendance.check_in >= today_start)
        .order_by(Attendance.check_in.desc())
        .first()
    )
    return latest


@router.post("/punch", response_model=AttendanceRead)
@router.post("/punch/", response_model=AttendanceRead)
def punch_attendance(
    payload: Optional[PunchRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    1-Click Smart Kiosk Punch:
    - If user has an open punch today (check_out is None), punches out and computes worked hours.
    - If user has no open punch today, creates a new check-in record.
    """
    if current_user.role == UserRole.EMPLOYEE:
        target_emp_id = current_user.employee_id
        if not target_emp_id:
            emp = db.query(Employee).filter(Employee.email == current_user.email).first()
            if emp:
                target_emp_id = emp.id
                current_user.employee_id = emp.id
                db.commit()
            else:
                raise HTTPException(status_code=400, detail="No employee profile linked to user")
    else:
        target_emp_id = (payload.employee_id if payload and payload.employee_id else None) or current_user.employee_id or 4

    emp = db.query(Employee).filter(Employee.id == target_emp_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail=f"Employee #{target_emp_id} not found")

    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    # Check for active open check-in today
    open_punch = (
        db.query(Attendance)
        .filter(
            Attendance.employee_id == target_emp_id,
            Attendance.check_out.is_(None),
            Attendance.check_in >= today_start,
        )
        .order_by(Attendance.check_in.desc())
        .first()
    )

    now = datetime.utcnow()

    if open_punch:
        # Punch Out
        open_punch.check_out = now
        diff = now - open_punch.check_in
        open_punch.worked_hours = round(max(0.1, diff.total_seconds() / 3600.0), 2)
        db.commit()
        db.refresh(open_punch)
        return open_punch
    else:
        # Punch In
        status_val = "LATE" if now.hour >= 10 else "PRESENT"
        new_punch = Attendance(
            employee_id=target_emp_id,
            check_in=now,
            check_out=None,
            worked_hours=0.0,
            status=status_val,
            is_manual_override=False if current_user.role == UserRole.EMPLOYEE else True,
        )
        db.add(new_punch)
        db.commit()
        db.refresh(new_punch)
        return new_punch


@router.post("", response_model=AttendanceRead, status_code=201)
@router.post("/", response_model=AttendanceRead, status_code=201)
def log_attendance(
    payload: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify employee exists in DB to prevent foreign key violations
    emp = db.query(Employee).filter(Employee.id == payload.employee_id).first()
    if not emp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee with ID {payload.employee_id} does not exist",
        )

    is_override = False

    if current_user.role == UserRole.EMPLOYEE:
        if not current_user.employee_id or payload.employee_id != current_user.employee_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Employees can only log attendance for themselves",
            )
    elif current_user.role in [UserRole.HR_MANAGER, UserRole.ADMIN, UserRole.HR_PAYROLL_MANAGER, UserRole.HR_PAYROLL_USER]:
        is_override = True

    att_dict = payload.model_dump()
    if is_override:
        att_dict["is_manual_override"] = True

    # Compute worked hours if 0 and check_out is provided
    if (not att_dict.get("worked_hours") or att_dict.get("worked_hours") == 0) and att_dict.get("check_out"):
        diff = att_dict["check_out"] - att_dict["check_in"]
        att_dict["worked_hours"] = round(max(0.0, diff.total_seconds() / 3600.0), 2)

    record = Attendance(**att_dict)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.put("/{attendance_id}", response_model=AttendanceRead)
@router.put("/{attendance_id}/", response_model=AttendanceRead)
def update_attendance(
    attendance_id: int,
    payload: AttendanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_manager),
):
    rec = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(rec, key, val)

    rec.is_manual_override = True
    if rec.check_out and rec.check_in and (not rec.worked_hours or rec.worked_hours == 0):
        diff = rec.check_out - rec.check_in
        rec.worked_hours = round(max(0.0, diff.total_seconds() / 3600.0), 2)

    db.commit()
    db.refresh(rec)
    return rec


@router.delete("/{attendance_id}", status_code=204)
@router.delete("/{attendance_id}/", status_code=204)
def delete_attendance(
    attendance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_manager),
):
    rec = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    db.delete(rec)
    db.commit()
    return None

