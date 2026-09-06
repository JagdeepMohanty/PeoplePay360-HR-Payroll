from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user, require_hr_manager
from models.user import User
from models.working_schedule import WorkingSchedule, WorkScheduleInterval
from schemas.working_schedule import (
    WorkingScheduleCreate,
    WorkingScheduleRead,
    WorkScheduleIntervalCreate,
    WorkScheduleIntervalRead,
)

router = APIRouter()


@router.get("", response_model=list[WorkingScheduleRead])
@router.get("/", response_model=list[WorkingScheduleRead], include_in_schema=False)
def list_working_schedules(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return db.query(WorkingSchedule).all()


@router.get("/{schedule_id}", response_model=WorkingScheduleRead)
def get_working_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sched = db.query(WorkingSchedule).filter(WorkingSchedule.id == schedule_id).first()
    if not sched:
        raise HTTPException(status_code=404, detail="Working schedule not found")
    return sched


@router.post("", response_model=WorkingScheduleRead, status_code=201)
@router.post("/", response_model=WorkingScheduleRead, status_code=201, include_in_schema=False)
def create_working_schedule(
    payload: WorkingScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_manager),
):
    sched_data = payload.model_dump(exclude={"intervals"})
    sched = WorkingSchedule(**sched_data)
    db.add(sched)
    db.flush()

    if payload.intervals:
        for interval_data in payload.intervals:
            interval = WorkScheduleInterval(schedule_id=sched.id, **interval_data.model_dump())
            db.add(interval)

    db.commit()
    db.refresh(sched)
    return sched


@router.post("/{schedule_id}/intervals", response_model=WorkScheduleIntervalRead, status_code=201)
def add_schedule_interval(
    schedule_id: int,
    payload: WorkScheduleIntervalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_manager),
):
    sched = db.query(WorkingSchedule).filter(WorkingSchedule.id == schedule_id).first()
    if not sched:
        raise HTTPException(status_code=404, detail="Working schedule not found")

    interval = WorkScheduleInterval(schedule_id=schedule_id, **payload.model_dump())
    db.add(interval)
    db.commit()
    db.refresh(interval)
    return interval


@router.put("/{schedule_id}", response_model=WorkingScheduleRead)
def update_working_schedule(
    schedule_id: int,
    payload: WorkingScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_manager),
):
    sched = db.query(WorkingSchedule).filter(WorkingSchedule.id == schedule_id).first()
    if not sched:
        raise HTTPException(status_code=404, detail="Working schedule not found")
    
    for key, value in payload.model_dump(exclude={"intervals"}).items():
        setattr(sched, key, value)
    db.commit()
    db.refresh(sched)
    return sched


@router.delete("/{schedule_id}", status_code=204)
def delete_working_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_manager),
):
    sched = db.query(WorkingSchedule).filter(WorkingSchedule.id == schedule_id).first()
    if not sched:
        raise HTTPException(status_code=404, detail="Working schedule not found")
    db.delete(sched)
    db.commit()
    return None


@router.delete("/intervals/{interval_id}", status_code=204)
def delete_schedule_interval(
    interval_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_manager),
):
    interval = db.query(WorkScheduleInterval).filter(WorkScheduleInterval.id == interval_id).first()
    if not interval:
        raise HTTPException(status_code=404, detail="Schedule interval not found")
    db.delete(interval)
    db.commit()
    return None
