from sqlalchemy import Column, Integer, String, Date
from sqlalchemy.orm import relationship
from ..database import Base


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    employee_code = Column(String, nullable=False, unique=True, index=True)
    name = Column(String, nullable=False)
    department = Column(String)
    job_title = Column(String)
    joining_date = Column(Date, nullable=False)
    email = Column(String, unique=True, index=True)
    bank_account = Column(String, default="")
    bank_account = Column(String, default="")

    contracts = relationship("Contract", back_populates="employee")
    attendances = relationship("Attendance", back_populates="employee")
    leaves = relationship("Leave", back_populates="employee")
    leave_allocations = relationship("LeaveAllocation", back_populates="employee")
    payslips = relationship("Payslip", back_populates="employee")
