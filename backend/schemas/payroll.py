from typing import Optional, List
from pydantic import BaseModel
from models.payroll import RuleCategory, PayrunStatus


class SalaryRuleBase(BaseModel):
    name: str
    code: str
    category: RuleCategory = RuleCategory.BASIC
    sequence: int = 1
    amount_type: str = "FIXED"
    amount_value: float = 0.0


class SalaryRuleCreate(SalaryRuleBase):
    structure_id: Optional[int] = None


class SalaryRuleRead(SalaryRuleBase):
    id: int
    structure_id: int

    class Config:
        from_attributes = True


class SalaryStructureBase(BaseModel):
    name: str
    is_active: bool = True


class SalaryStructureCreate(SalaryStructureBase):
    pass


class SalaryStructureRead(SalaryStructureBase):
    id: int
    rules: List[SalaryRuleRead] = []

    class Config:
        from_attributes = True


class PayrunBase(BaseModel):
    name: str
    structure_id: Optional[int] = None
    period_start: str
    period_end: str


class PayrunCreate(PayrunBase):
    employee_ids: Optional[List[int]] = None


class PayrunComputeRequest(BaseModel):
    employee_ids: Optional[List[int]] = None


class PayrunRead(PayrunBase):
    id: int
    status: PayrunStatus
    payslips: Optional[List["PayslipRead"]] = None

    class Config:
        from_attributes = True


class PayslipRead(BaseModel):
    id: int
    payrun_id: int
    employee_id: int
    contract_id: int
    basic: float
    allowances: float
    deductions: float
    gross: float
    net: float
    worked_days: float
    breakdown_json: str

    class Config:
        from_attributes = True
