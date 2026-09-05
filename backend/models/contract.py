from sqlalchemy import Column, Integer, Float, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Contract(Base):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    wage = Column(Float, nullable=False)
    date_start = Column(String, nullable=False)
    date_end = Column(String, nullable=True)
    department = Column(String, nullable=True)
    job_position = Column(String, nullable=True)
    salary_structure_id = Column(Integer, ForeignKey("salary_structures.id"), nullable=True)
    is_active = Column(Boolean, default=True)

    employee = relationship("Employee", back_populates="contracts")
    salary_structure = relationship("SalaryStructure", back_populates="contracts")
    payslips = relationship("Payslip", back_populates="contract")
