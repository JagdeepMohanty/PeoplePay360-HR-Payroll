import enum
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from database import Base


class LeaveStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REFUSED = "REFUSED"


class TimeOffType(Base):
    __tablename__ = "time_off_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    unit = Column(String, nullable=False, default="days")
    requires_allocation = Column(Boolean, default=True)
    is_unpaid = Column(Boolean, default=False)

    allocations = relationship("LeaveAllocation", back_populates="time_off_type", cascade="all, delete-orphan")
    leave_requests = relationship("LeaveRequest", back_populates="time_off_type", cascade="all, delete-orphan")


class LeaveAllocation(Base):
    __tablename__ = "leave_allocations"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    type_id = Column(Integer, ForeignKey("time_off_types.id"), nullable=False)
    allocated_days = Column(Float, nullable=False)
    used_days = Column(Float, default=0.0)
    year = Column(Integer, nullable=False)

    employee = relationship("Employee", back_populates="leave_allocations")
    time_off_type = relationship("TimeOffType", back_populates="allocations")

    @property
    def remaining_days(self) -> float:
        return max(0.0, float(self.allocated_days or 0.0) - float(self.used_days or 0.0))


class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    type_id = Column(Integer, ForeignKey("time_off_types.id"), nullable=False)
    date_from = Column(String, nullable=False)
    date_to = Column(String, nullable=False)
    duration_days = Column(Float, default=1.0)
    status = Column(Enum(LeaveStatus), nullable=False, default=LeaveStatus.PENDING)
    is_unpaid = Column(Boolean, default=False)

    employee = relationship("Employee", back_populates="leave_requests")
    time_off_type = relationship("TimeOffType", back_populates="leave_requests")
