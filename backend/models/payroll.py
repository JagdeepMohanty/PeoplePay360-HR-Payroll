from sqlalchemy import Column, Integer, Float, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base


class Payrun(Base):
    __tablename__ = "payruns"

    id = Column(Integer, primary_key=True, index=True)
    period_start = Column(String, nullable=False)
    period_end = Column(String, nullable=False)
    department = Column(String, nullable=True)
    state = Column(String, default="draft")  # draft | computed | confirmed

    payslips = relationship("Payslip", back_populates="payrun")


class Payslip(Base):
    __tablename__ = "payslips"

    id = Column(Integer, primary_key=True, index=True)
    payrun_id = Column(Integer, ForeignKey("payruns.id"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    basic_pay = Column(Float, default=0.0)
    allowances = Column(Float, default=0.0)
    gross = Column(Float, default=0.0)
    deductions = Column(Float, default=0.0)
    net_pay = Column(Float, default=0.0)
    breakdown = Column(Text, default="{}")  # JSON string of rule line items

    payrun = relationship("Payrun", back_populates="payslips")
    employee = relationship("Employee", back_populates="payslips")
