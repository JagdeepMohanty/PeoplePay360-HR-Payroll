from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    department = Column(String, nullable=True)
    job_position = Column(String, nullable=True)
    manager_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    working_schedule_id = Column(Integer, ForeignKey("working_schedules.id"), nullable=True)
    bank_account = Column(String, default="")
    is_active = Column(Boolean, default=True)

    # Relationships
    user = relationship("User", back_populates="employee", uselist=False)
    manager = relationship("Employee", remote_side=[id], back_populates="subordinates")
    subordinates = relationship("Employee", back_populates="manager")
    working_schedule = relationship("WorkingSchedule", back_populates="employees")
    contracts = relationship("Contract", back_populates="employee", cascade="all, delete-orphan")
    attendances = relationship("Attendance", back_populates="employee", cascade="all, delete-orphan")
    leave_allocations = relationship("LeaveAllocation", back_populates="employee", cascade="all, delete-orphan")
    leave_requests = relationship("LeaveRequest", back_populates="employee", cascade="all, delete-orphan")
    payslips = relationship("Payslip", back_populates="employee", cascade="all, delete-orphan")

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()

    # ---------------------------------------------------------------------------
    # Smart-Button Computed Properties for Frontend & API Views (Module A1)
    # ---------------------------------------------------------------------------
    @property
    def contracts_count(self) -> int:
        return len(self.contracts) if self.contracts else 0

    @property
    def leaves_count(self) -> int:
        return len(self.leave_requests) if self.leave_requests else 0

    @property
    def attendances_count(self) -> int:
        return len(self.attendances) if self.attendances else 0

    @property
    def payslips_count(self) -> int:
        return len(self.payslips) if self.payslips else 0

    @property
    def leave_balance(self) -> float:
        if not self.leave_allocations:
            return 0.0
        return sum(
            max(0.0, float(alloc.allocated_days or 0.0) - float(alloc.used_days or 0.0))
            for alloc in self.leave_allocations
        )
