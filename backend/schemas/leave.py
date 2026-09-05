from pydantic import BaseModel


class LeaveBase(BaseModel):
    employee_id: int
    leave_type: str
    date_from: str
    date_to: str
    days: float = 1.0
    state: str = "draft"


class LeaveCreate(LeaveBase):
    pass


class LeaveRead(LeaveBase):
    id: int

    model_config = {"from_attributes": True}
