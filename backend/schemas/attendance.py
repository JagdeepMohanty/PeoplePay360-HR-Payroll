from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class AttendanceBase(BaseModel):
    employee_id: int
    check_in: datetime
    check_out: Optional[datetime] = None
    worked_hours: Optional[float] = 0.0
    status: Optional[str] = "PRESENT"
    is_manual_override: Optional[bool] = False


class AttendanceCreate(AttendanceBase):
    pass


class AttendanceUpdate(BaseModel):
    employee_id: Optional[int] = None
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    worked_hours: Optional[float] = None
    status: Optional[str] = None
    is_manual_override: Optional[bool] = True


class PunchRequest(BaseModel):
    employee_id: Optional[int] = None


class AttendanceRead(AttendanceBase):
    id: int
    employee_name: Optional[str] = None

    class Config:
        from_attributes = True
