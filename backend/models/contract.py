from sqlalchemy import Column, Integer, Float, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Contract(Base):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    wage = Column(Float, nullable=False)
    state = Column(String, default="draft")  # draft | running | expired
    date_start = Column(String, nullable=False)
    date_end = Column(String, nullable=True)

    employee = relationship("Employee", back_populates="contracts")
