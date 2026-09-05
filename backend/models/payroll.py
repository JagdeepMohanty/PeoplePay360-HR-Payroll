import enum
from sqlalchemy import Column, Integer, Float, String, Boolean, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from database import Base


class RuleCategory(str, enum.Enum):
    BASIC = "BASIC"
    ALLOWANCE = "ALLOWANCE"
    GROSS = "GROSS"
    DEDUCTION = "DEDUCTION"
    NET = "NET"


class PayrunStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    COMPUTED = "COMPUTED"
    VALIDATED = "VALIDATED"
    PAID = "PAID"


class SalaryStructure(Base):
    __tablename__ = "salary_structures"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

    rules = relationship(
        "SalaryRule",
        back_populates="salary_structure",
        cascade="all, delete-orphan",
        order_by="SalaryRule.sequence",
    )
    contracts = relationship("Contract", back_populates="salary_structure")
    payruns = relationship("Payrun", back_populates="salary_structure")


class SalaryRule(Base):
    __tablename__ = "salary_rules"

    id = Column(Integer, primary_key=True, index=True)
    structure_id = Column(Integer, ForeignKey("salary_structures.id"), nullable=False)
    name = Column(String, nullable=False)
    code = Column(String, nullable=False)
    category = Column(Enum(RuleCategory), nullable=False, default=RuleCategory.BASIC)
    sequence = Column(Integer, default=1)
    amount_type = Column(String, default="FIXED")  # FIXED, PERCENTAGE, FORMULA
    amount_value = Column(Float, default=0.0)

    salary_structure = relationship("SalaryStructure", back_populates="rules")


class Payrun(Base):
    __tablename__ = "payruns"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    structure_id = Column(Integer, ForeignKey("salary_structures.id"), nullable=True)
    period_start = Column(String, nullable=False)
    period_end = Column(String, nullable=False)
    status = Column(Enum(PayrunStatus), nullable=False, default=PayrunStatus.DRAFT)

    salary_structure = relationship("SalaryStructure", back_populates="payruns")
    payslips = relationship("Payslip", back_populates="payrun", cascade="all, delete-orphan")


class Payslip(Base):
    __tablename__ = "payslips"

    id = Column(Integer, primary_key=True, index=True)
    payrun_id = Column(Integer, ForeignKey("payruns.id"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=False)
    basic = Column(Float, default=0.0)
    allowances = Column(Float, default=0.0)
    deductions = Column(Float, default=0.0)
    gross = Column(Float, default=0.0)
    net = Column(Float, default=0.0)
    worked_days = Column(Float, default=0.0)
    breakdown_json = Column(Text, default="{}")

    payrun = relationship("Payrun", back_populates="payslips")
    employee = relationship("Employee", back_populates="payslips")
    contract = relationship("Contract", back_populates="payslips")
