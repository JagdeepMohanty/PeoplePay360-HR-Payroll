from pydantic import BaseModel


class PayrunCreate(BaseModel):
    period_start: str
    period_end: str
    department: str | None = None


class PayrunRead(PayrunCreate):
    id: int
    state: str

    model_config = {"from_attributes": True}


class PayslipRead(BaseModel):
    id: int
    payrun_id: int
    employee_id: int
    basic_pay: float
    allowances: float
    gross: float
    deductions: float
    net_pay: float
    breakdown: str

    model_config = {"from_attributes": True}
