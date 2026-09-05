from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class WorkingSchedule(Base):
    __tablename__ = "working_schedules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    schedule_type = Column(String, nullable=False, default="FULL_TIME")
    stored_weekly_hours = Column("weekly_hours", Float, nullable=False, default=40.0)

    employees = relationship("Employee", back_populates="working_schedule")
    intervals = relationship(
        "WorkScheduleInterval",
        back_populates="working_schedule",
        cascade="all, delete-orphan",
    )

    @property
    def weekly_hours(self) -> float:
        """
        Dynamically computes weekly hours from schedule intervals grid.
        Fallback to stored_weekly_hours if no intervals are configured.
        """
        if not self.intervals:
            return float(self.stored_weekly_hours or 40.0)

        total = 0.0
        for interval in self.intervals:
            try:
                sh, sm = map(int, interval.start_time.split(":"))
                eh, em = map(int, interval.end_time.split(":"))
                start_val = sh + sm / 60.0
                end_val = eh + em / 60.0
                daily = (end_val - start_val) - float(interval.break_hours or 0.0)
                if daily > 0:
                    total += daily
            except Exception:
                pass
        return round(total, 2) if total > 0 else float(self.stored_weekly_hours or 40.0)


class WorkScheduleInterval(Base):
    __tablename__ = "working_schedule_intervals"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("working_schedules.id"), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    start_time = Column(String, nullable=False, default="09:00")
    end_time = Column(String, nullable=False, default="17:00")
    break_hours = Column(Float, default=1.0)

    working_schedule = relationship("WorkingSchedule", back_populates="intervals")
