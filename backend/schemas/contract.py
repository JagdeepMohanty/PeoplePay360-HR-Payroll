from typing import Optional
from pydantic import BaseModel


class ContractBase(BaseModel):
    employee_id: int
    wage: float
    date_start: str
    date_end: Optional[str] = None
    department: Optional[str] = None
    job_position: Optional[str] = None
    salary_structure_id: Optional[int] = None
    is_active: bool = True


class ContractCreate(ContractBase):
    pass


class ContractRead(ContractBase):
    id: int

    class Config:
        from_attributes = True
