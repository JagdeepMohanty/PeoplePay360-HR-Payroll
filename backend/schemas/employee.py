from typing import Optional
from pydantic import BaseModel, EmailStr


class EmployeeBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    department: Optional[str] = None
    job_position: Optional[str] = None
    manager_id: Optional[int] = None
    working_schedule_id: Optional[int] = None
    bank_account: Optional[str] = ""
    is_active: bool = True


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeRead(EmployeeBase):
    id: int
    full_name: Optional[str] = None
    contracts_count: int = 0
    leaves_count: int = 0
    attendances_count: int = 0
    payslips_count: int = 0
    leave_balance: float = 0.0

    class Config:
        from_attributes = True
