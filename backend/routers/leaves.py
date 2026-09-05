from fastapi import APIRouter, Depends, HTTPException, Query, status

from ..enums import UserRole
from ..auth.dependencies import get_current_user, require_officer, require_manager


from sqlalchemy.orm import Session
from ..database import get_db
from models.leave import Leave, LeaveAllocation
from schemas.leave import LeaveCreate, LeaveRead

router = APIRouter()


@router.get("/", response_model=list[LeaveRead])
def list_leaves(
    employee_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Employees can only see their own leaves
    if current_user.role == UserRole.HR_EMPLOYEE:
        if employee_id is not None and employee_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        employee_id = current_user.id
    query = db.query(Leave)
    if employee_id is not None:
        query = query.filter(Leave.employee_id == employee_id)
    return query.all()


@router.post("/", response_model=LeaveRead, status_code=201)
def submit_leave(
    payload: LeaveCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_officer),
):
    # Employees can submit their own leave; officers can submit for any employee
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
    if leave.state == "approved":
        raise HTTPException(status_code=400, detail="Leave request is already approved")

    # Locate the matching allocation for this employee + leave type
    allocation = db.query(LeaveAllocation).filter(
        LeaveAllocation.employee_id == leave.employee_id,
        LeaveAllocation.leave_type == leave.leave_type,
    ).first()

    if not allocation:
        raise HTTPException(
            status_code=400,
            detail=f"No '{leave.leave_type}' allocation found for employee {leave.employee_id}.",
        )

    remaining = allocation.allocated_days - allocation.used_days
    if leave.days > remaining:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Insufficient balance. Requested {leave.days} day(s) but only "
                f"{remaining} day(s) remaining in '{leave.leave_type}' allocation."
            ),
        )

    allocation.used_days += leave.days
    leave.state = "approved"
    db.commit()
    db.refresh(leave)
    return leave


@router.post("/refuse/{leave_id}", response_model=LeaveRead)
def refuse_leave(leave_id: int, db: Session = Depends(get_db)):
    leave = db.query(Leave).filter(Leave.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    if leave.state == "approved":
        raise HTTPException(status_code=400, detail="Cannot refuse an already approved leave")
    leave.state = "refused"
    db.commit()
    db.refresh(leave)
    return leave
