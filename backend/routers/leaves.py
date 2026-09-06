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


@router.put("/types/{type_id}", response_model=TimeOffTypeRead)
def update_time_off_type(
    type_id: int,
    payload: TimeOffTypeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_manager),
):
    tot = db.query(TimeOffType).filter(TimeOffType.id == type_id).first()
    if not tot:
        raise HTTPException(status_code=404, detail="Time Off Type not found")
    for key, value in payload.model_dump().items():
        setattr(tot, key, value)
    db.commit()
    db.refresh(tot)
    return tot


@router.delete("/types/{type_id}", status_code=204)
def delete_time_off_type(
    type_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_manager),
):
    tot = db.query(TimeOffType).filter(TimeOffType.id == type_id).first()
    if not tot:
        raise HTTPException(status_code=404, detail="Time Off Type not found")
    db.delete(tot)
    db.commit()
    return None


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
@router.post("/allocation", response_model=LeaveAllocationRead, status_code=201, include_in_schema=False)
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


@router.put("/allocations/{allocation_id}", response_model=LeaveAllocationRead)
def update_leave_allocation(
    allocation_id: int,
    payload: LeaveAllocationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_manager),
):
    alloc = db.query(LeaveAllocation).filter(LeaveAllocation.id == allocation_id).first()
    if not alloc:
        raise HTTPException(status_code=404, detail="Leave allocation not found")
    for key, value in payload.model_dump().items():
        setattr(alloc, key, value)
    db.commit()
    db.refresh(alloc)
    return alloc


@router.delete("/allocations/{allocation_id}", status_code=204)
def delete_leave_allocation(
    allocation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_manager),
):
    alloc = db.query(LeaveAllocation).filter(LeaveAllocation.id == allocation_id).first()
    if not alloc:
        raise HTTPException(status_code=404, detail="Leave allocation not found")
    db.delete(alloc)
    db.commit()
    return None


# ---------------------------------------------------------------------------
# Leave Requests Endpoints (Module A4 Deduction Business Logic)
# ---------------------------------------------------------------------------

@router.get("", response_model=list[LeaveRequestRead])
@router.get("/", response_model=list[LeaveRequestRead], include_in_schema=False)
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
@router.post("/", response_model=LeaveRequestRead, status_code=201, include_in_schema=False)
@router.post("/request", response_model=LeaveRequestRead, status_code=201, include_in_schema=False)
def submit_leave(
    payload: LeaveRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.EMPLOYEE:
        if not current_user.employee_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User account is not linked to an Employee profile. Contact HR.",
            )
        if payload.employee_id != current_user.employee_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Employees can only submit leave requests for themselves",
            )
    else:
        if not payload.employee_id:
            if current_user.employee_id:
                payload.employee_id = current_user.employee_id
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User account is not linked to an Employee profile. Contact HR.",
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
    leave = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).with_for_update().first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    if leave.status == LeaveStatus.APPROVED:
        raise HTTPException(status_code=400, detail="Leave request is already approved")

    # Module A4: Automatic balance check and deduction on approval with pessimistic row locking
    allocation = (
        db.query(LeaveAllocation)
        .filter(
            LeaveAllocation.employee_id == leave.employee_id,
            LeaveAllocation.type_id == leave.type_id,
        )
        .with_for_update()
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


@router.delete("/{leave_id}", status_code=204)
def delete_leave_request(
    leave_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    leave = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")

    is_admin = current_user.role in [UserRole.HR_MANAGER, UserRole.HR_PAYROLL_MANAGER, UserRole.ADMIN]
    is_owner = current_user.employee_id and current_user.employee_id == leave.employee_id

    if not (is_admin or is_owner):
        raise HTTPException(status_code=403, detail="Operation not permitted for your role")

    db.delete(leave)
    db.commit()
    return None
