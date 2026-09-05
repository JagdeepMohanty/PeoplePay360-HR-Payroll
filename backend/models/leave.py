from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base


class Leave(Base):
    __tablename__ = "leaves"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    leave_type = Column(String, nullable=False)
    date_from = Column(String, nullable=False)
    date_to = Column(String, nullable=False)
    days = Column(Float, default=1.0)
    state = Column(String, default="draft")  # draft | approved | refused

    employee = relationship("Employee", back_populates="leaves")


class LeaveAllocation(Base):
    __tablename__ = "leave_allocations"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    leave_type = Column(String, nullable=False)   # e.g. "paid" | "unpaid" | "sick"
    allocated_days = Column(Float, nullable=False)
    used_days = Column(Float, default=0.0)
    year = Column(Integer, nullable=False)

    employee = relationship("Employee", back_populates="leave_allocations")
