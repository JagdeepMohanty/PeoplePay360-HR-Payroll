from pydantic import BaseModel


class ContractBase(BaseModel):
    employee_id: int
    wage: float
    state: str = "draft"
    date_start: str
    date_end: str | None = None


class ContractCreate(ContractBase):
    pass


class ContractRead(ContractBase):
    id: int

    model_config = {"from_attributes": True}
