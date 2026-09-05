from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user, require_hr_manager
from models.user import User, UserRole
from models.leave import TimeOffType, LeaveAllocation, LeaveRequest, LeaveStatus
from schemas.leave import (
    TimeOffTypeCreate,
    TimeOffTypeRead,
    LeaveAllocationCreate,
    LeaveAllocationRead,
    LeaveRequestCreate,
    LeaveRequestRead,
)

router = APIRouter()

# ---------------------------------------------------------------------------
# Time Off Types Endpoints
# ---------------------------------------------------------------------------

@router.get("/types", response_model=list[TimeOffTypeRead])
def list_time_off_types(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return db.query(TimeOffType).all()


@router.post("/types", response_model=TimeOffTypeRead, status_code=201)
def create_time_off_type(
    payload: TimeOffTypeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_manager),
):
    tot = TimeOffType(**payload.model_dump())
    db.add(tot)
    db.commit()
    db.refresh(tot)
    return tot


# ---------------------------------------------------------------------------
# Leave Allocations Endpoints
# ---------------------------------------------------------------------------

@router.get("/allocations", response_model=list[LeaveAllocationRead])
def list_leave_allocations(
    employee_id: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(LeaveAllocation)

    if current_user.role == UserRole.EMPLOYEE:
        if not current_user.employee_id:
            return []
        query = query.filter(LeaveAllocation.employee_id == current_user.employee_id)
    else:
        if employee_id is not None:
            query = query.filter(LeaveAllocation.employee_id == employee_id)

    if year is not None:
        query = query.filter(LeaveAllocation.year == year)

    return query.all()


@router.post("/allocations", response_model=LeaveAllocationRead, status_code=201)
@router.post("/allocation", response_model=LeaveAllocationRead, status_code=201)
def create_leave_allocation(
    payload: LeaveAllocationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_manager),
):
    alloc = LeaveAllocation(**payload.model_dump())
    db.add(alloc)
    db.commit()
    db.refresh(alloc)
    return alloc


# ---------------------------------------------------------------------------
# Leave Requests Endpoints (Module A4 Deduction Business Logic)
# ---------------------------------------------------------------------------

@router.get("", response_model=list[LeaveRequestRead])
@router.get("/", response_model=list[LeaveRequestRead])
def list_leave_requests(
    employee_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(LeaveRequest)

    if current_user.role == UserRole.EMPLOYEE:
        if not current_user.employee_id:
            return []
        query = query.filter(LeaveRequest.employee_id == current_user.employee_id)
    else:
        if employee_id is not None:
            query = query.filter(LeaveRequest.employee_id == employee_id)

    return query.all()


@router.post("", response_model=LeaveRequestRead, status_code=201)
@router.post("/", response_model=LeaveRequestRead, status_code=201)
@router.post("/request", response_model=LeaveRequestRead, status_code=201)
def submit_leave(
    payload: LeaveRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.EMPLOYEE:
        if not current_user.employee_id or payload.employee_id != current_user.employee_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Employees can only submit leave requests for themselves",
            )

    leave = LeaveRequest(**payload.model_dump(), status=LeaveStatus.PENDING)
    db.add(leave)
    db.commit()
    db.refresh(leave)
    return leave


@router.post("/approve/{leave_id}", response_model=LeaveRequestRead)
def approve_leave(
    leave_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_manager),
):
    leave = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    if leave.status == LeaveStatus.APPROVED:
        raise HTTPException(status_code=400, detail="Leave request is already approved")

    # Module A4: Automatic balance check and deduction on approval
    allocation = (
        db.query(LeaveAllocation)
        .filter(
            LeaveAllocation.employee_id == leave.employee_id,
            LeaveAllocation.type_id == leave.type_id,
        )
        .first()
    )

    if allocation:
        remaining = float(allocation.allocated_days or 0.0) - float(allocation.used_days or 0.0)
        if leave.duration_days > remaining:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient leave balance. Requested {leave.duration_days} day(s), but remaining balance is {remaining} day(s).",
            )
        allocation.used_days += leave.duration_days
    else:
        # If type requires allocation, throw 400
        time_off_type = db.query(TimeOffType).filter(TimeOffType.id == leave.type_id).first()
        if time_off_type and time_off_type.requires_allocation:
            raise HTTPException(
                status_code=400,
                detail=f"No leave allocation found for employee {leave.employee_id} for '{time_off_type.name}'.",
            )

    leave.status = LeaveStatus.APPROVED
    db.commit()
    db.refresh(leave)
    return leave


@router.post("/refuse/{leave_id}", response_model=LeaveRequestRead)
def refuse_leave(
    leave_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_manager),
):
    leave = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    if leave.status == LeaveStatus.APPROVED:
        raise HTTPException(status_code=400, detail="Cannot refuse an already approved leave")

    leave.status = LeaveStatus.REFUSED
    db.commit()
    db.refresh(leave)
    return leave
