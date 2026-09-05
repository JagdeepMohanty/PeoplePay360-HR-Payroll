from typing import List, Optional
from pydantic import BaseModel


class WorkScheduleIntervalBase(BaseModel):
    day_of_week: int
    start_time: str = "09:00"
    end_time: str = "17:00"
    break_hours: float = 1.0


class WorkScheduleIntervalCreate(WorkScheduleIntervalBase):
    pass


class WorkScheduleIntervalRead(WorkScheduleIntervalBase):
    id: int
    schedule_id: int

    class Config:
        from_attributes = True


class WorkingScheduleBase(BaseModel):
    name: str
    schedule_type: str = "FULL_TIME"


class WorkingScheduleCreate(WorkingScheduleBase):
    intervals: Optional[List[WorkScheduleIntervalCreate]] = []


class WorkingScheduleRead(WorkingScheduleBase):
    id: int
    weekly_hours: float
    intervals: List[WorkScheduleIntervalRead] = []

    class Config:
        from_attributes = True
