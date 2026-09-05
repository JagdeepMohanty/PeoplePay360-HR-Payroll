from sqlalchemy import Column, Integer, Float, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base


class Contract(Base):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    wage = Column(Float, nullable=False)
    state = Column(String, default="draft", nullable=False)  # draft | running | expired
    working_schedule = Column(String, nullable=False)  # e.g., full_time, part_time, contract, intern
    date_start = Column(Date, nullable=False)
    date_end = Column(Date, nullable=True)

    employee = relationship("Employee", back_populates="contracts")
