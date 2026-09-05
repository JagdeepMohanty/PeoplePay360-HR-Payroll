from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from database import Base


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    department = Column(String)
    job_title = Column(String)
    email = Column(String, unique=True, index=True)
    bank_account = Column(String, default="")

    contracts = relationship("Contract", back_populates="employee")
    attendances = relationship("Attendance", back_populates="employee")
    leaves = relationship("Leave", back_populates="employee")
    payslips = relationship("Payslip", back_populates="employee")
