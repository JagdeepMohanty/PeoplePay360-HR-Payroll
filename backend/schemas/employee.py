from pydantic import BaseModel, EmailStr


class EmployeeBase(BaseModel):
    name: str
    department: str | None = None
    job_title: str | None = None
    email: EmailStr
    bank_account: str | None = ""


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeRead(EmployeeBase):
    id: int

    model_config = {"from_attributes": True}
