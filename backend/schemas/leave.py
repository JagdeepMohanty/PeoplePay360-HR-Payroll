from typing import Optional
from pydantic import BaseModel
from models.leave import LeaveStatus


class TimeOffTypeBase(BaseModel):
    name: str
    unit: str = "days"
    requires_allocation: bool = True
    is_unpaid: bool = False


class TimeOffTypeCreate(TimeOffTypeBase):
    pass


class TimeOffTypeRead(TimeOffTypeBase):
    id: int

    class Config:
        from_attributes = True


class LeaveAllocationBase(BaseModel):
    employee_id: int
    type_id: int
    allocated_days: float
    used_days: float = 0.0
    year: int


class LeaveAllocationCreate(LeaveAllocationBase):
    pass


class LeaveAllocationRead(LeaveAllocationBase):
    id: int
    remaining_days: float = 0.0

    class Config:
        from_attributes = True


class LeaveRequestBase(BaseModel):
    employee_id: int
    type_id: int
    date_from: str
    date_to: str
    duration_days: float = 1.0
    is_unpaid: bool = False


class LeaveRequestCreate(LeaveRequestBase):
    pass


class LeaveRequestRead(LeaveRequestBase):
    id: int
    status: LeaveStatus

    class Config:
        from_attributes = True
