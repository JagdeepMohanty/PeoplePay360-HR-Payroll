from pydantic import BaseModel, validator
from datetime import date
from ..enums import ContractState, WorkingSchedule


class ContractBase(BaseModel):
    employee_id: int
    wage: float
    state: ContractState = ContractState.DRAFT
    working_schedule: WorkingSchedule
    date_start: date
    date_end: date | None = None

    @validator('date_end')
    def end_after_start(cls, v, values):
        if v and 'date_start' in values and v < values['date_start']:
            raise ValueError('date_end must be after date_start')
        return v


class ContractCreate(ContractBase):
    pass


class ContractRead(ContractBase):
    id: int

    model_config = {"from_attributes": True}
