from datetime import datetime
from pydantic import BaseModel


class AttendanceBase(BaseModel):
    employee_id: int
    check_in: datetime
    check_out: datetime | None = None


class AttendanceCreate(AttendanceBase):
    pass


class AttendanceRead(AttendanceBase):
    id: int

    model_config = {"from_attributes": True}
