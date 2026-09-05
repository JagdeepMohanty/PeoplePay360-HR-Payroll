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


class AttendanceRead(AttendanceBase):
    id: int

    class Config:
        from_attributes = True
