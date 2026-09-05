from pydantic import BaseModel, EmailStr, validator
from datetime import date


class EmployeeBase(BaseModel):
    employee_code: str
    name: str
    department: str | None = None
    job_title: str | None = None
    joining_date: date
    email: EmailStr
    bank_account: str | None = ""

    @validator('employee_code')
    def code_must_not_be_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('employee_code cannot be empty')
        return v


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeRead(EmployeeBase):
    id: int

    model_config = {"from_attributes": True}
