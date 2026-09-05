"""
Seed Script — PeoplePay360 Modules A1–A7 & Phase 1 Refactor
Run: python seed.py
Clears all tables and populates fresh master configuration data.
"""
from datetime import datetime

from database import Base, engine, SessionLocal
from auth import get_password_hash
from models.user import User, UserRole
from models.working_schedule import WorkingSchedule, WorkScheduleInterval
from models.employee import Employee
from models.contract import Contract
from models.attendance import Attendance
from models.leave import TimeOffType, LeaveAllocation, LeaveRequest, LeaveStatus
from models.payroll import SalaryStructure, SalaryRule, Payrun, Payslip, RuleCategory, PayrunStatus

CURRENT_YEAR = 2025


def clear_tables(db):
    """Delete all rows in dependency-safe order."""
    db.query(Payslip).delete()
    db.query(Payrun).delete()
    db.query(SalaryRule).delete()
    db.query(SalaryStructure).delete()
    db.query(LeaveRequest).delete()
    db.query(LeaveAllocation).delete()
    db.query(TimeOffType).delete()
    db.query(Attendance).delete()
    db.query(Contract).delete()
    db.query(User).delete()
    db.query(Employee).delete()
    db.query(WorkScheduleInterval).delete()
    db.query(WorkingSchedule).delete()
    db.commit()


def seed():
    db = SessionLocal()
    try:
        print("Clearing existing data…")
        clear_tables(db)

        # 1. WORKING SCHEDULES & INTERVALS (Module A3)
        schedule = WorkingSchedule(
            name="Standard 40h Full-Time",
            schedule_type="FULL_TIME",
            stored_weekly_hours=40.0,
        )
        db.add(schedule)
        db.flush()

        intervals = [
            WorkScheduleInterval(schedule_id=schedule.id, day_of_week=day, start_time="09:00", end_time="17:00", break_hours=0.0)
            for day in range(5)
        ]
        db.add_all(intervals)
        db.flush()
        print(f"  [OK] Working Schedule: #{schedule.id} ({schedule.name}) -> Computed {schedule.weekly_hours} weekly hours")

        # 2. EMPLOYEES (Module A1)
        alice = Employee(
            first_name="Alice",
            last_name="Johnson",
            email="alice.johnson@peoplepay360.dev",
            department="Engineering",
            job_position="Senior Software Engineer",
            working_schedule_id=schedule.id,
            bank_account="GB29NWBK60161331926819",
            is_active=True,
        )
        bob = Employee(
            first_name="Bob",
            last_name="Martinez",
            email="bob.martinez@peoplepay360.dev",
            department="Human Resources",
            job_position="HR Specialist",
            working_schedule_id=schedule.id,
            bank_account="GB82WEST12345698765432",
            is_active=True,
        )
        carol = Employee(
            first_name="Carol",
            last_name="White",
            email="carol.white@peoplepay360.dev",
            department="Finance",
            job_position="Payroll Analyst",
            working_schedule_id=schedule.id,
            bank_account="",  # Blank account triggers guardian warning
            is_active=True,
        )
        db.add_all([alice, bob, carol])
        db.flush()
        print(f"  [OK] Employees: {alice.full_name}, {bob.full_name}, {carol.full_name}")

        alice.manager_id = bob.id
        db.flush()

        # 3. USERS (5-TIER RBAC)
        default_password_hash = get_password_hash("password123")
        users = [
            User(
                email="admin@peoplepay360.dev",
                hashed_password=default_password_hash,
                role=UserRole.ADMIN,
                employee_id=None,
            ),
            User(
                email="hr.manager@peoplepay360.dev",
                hashed_password=default_password_hash,
                role=UserRole.HR_MANAGER,
                employee_id=bob.id,
            ),
            User(
                email="payroll.user@peoplepay360.dev",
                hashed_password=default_password_hash,
                role=UserRole.HR_PAYROLL_USER,
                employee_id=carol.id,
            ),
            User(
                email="payroll.manager@peoplepay360.dev",
                hashed_password=default_password_hash,
                role=UserRole.HR_PAYROLL_MANAGER,
                employee_id=None,
            ),
            User(
                email="alice.johnson@peoplepay360.dev",
                hashed_password=default_password_hash,
                role=UserRole.EMPLOYEE,
                employee_id=alice.id,
            ),
        ]
        db.add_all(users)
        db.flush()
        print(f"  [OK] Users created for all 5 roles: {[u.email for u in users]}")

        # 4. SALARY STRUCTURE & RULES
        sal_struct = SalaryStructure(name="Regular Monthly", is_active=True)
        db.add(sal_struct)
        db.flush()

        rules = [
            SalaryRule(
                structure_id=sal_struct.id,
                name="Basic Pay",
                code="BASIC",
                category=RuleCategory.BASIC,
                sequence=1,
                amount_type="FIXED",
                amount_value=0.0,
            ),
            SalaryRule(
                structure_id=sal_struct.id,
                name="Housing & Transport Allowance",
                code="ALLOWANCE",
                category=RuleCategory.ALLOWANCE,
                sequence=2,
                amount_type="PERCENTAGE",
                amount_value=15.0,
            ),
            SalaryRule(
                structure_id=sal_struct.id,
                name="Gross Pay",
                code="GROSS",
                category=RuleCategory.GROSS,
                sequence=3,
                amount_type="CODE",
                amount_value=0.0,
            ),
            SalaryRule(
                structure_id=sal_struct.id,
                name="Loss of Pay",
                code="LOP_DEDUCTION",
                category=RuleCategory.DEDUCTION,
                sequence=4,
                amount_type="CODE",
                amount_value=0.0,
            ),
            SalaryRule(
                structure_id=sal_struct.id,
                name="Income Tax",
                code="INCOME_TAX",
                category=RuleCategory.DEDUCTION,
                sequence=5,
                amount_type="PERCENTAGE",
                amount_value=7.0,
            ),
            SalaryRule(
                structure_id=sal_struct.id,
                name="Social Security",
                code="SOCIAL_SEC",
                category=RuleCategory.DEDUCTION,
                sequence=6,
                amount_type="PERCENTAGE",
                amount_value=3.0,
            ),
            SalaryRule(
                structure_id=sal_struct.id,
                name="Net Pay",
                code="NET",
                category=RuleCategory.NET,
                sequence=7,
                amount_type="CODE",
                amount_value=0.0,
            ),
        ]
        db.add_all(rules)
        db.flush()

        # 5. CONTRACTS
        contracts = [
            Contract(
                employee_id=alice.id,
                wage=8500.00,
                date_start="2025-01-01",
                date_end=None,
                department=alice.department,
                job_position=alice.job_position,
                salary_structure_id=sal_struct.id,
                is_active=True,
            ),
            Contract(
                employee_id=bob.id,
                wage=5800.00,
                date_start="2024-06-01",
                date_end=None,
                department=bob.department,
                job_position=bob.job_position,
                salary_structure_id=sal_struct.id,
                is_active=True,
            ),
            Contract(
                employee_id=carol.id,
                wage=6400.00,
                date_start="2025-01-15",
                date_end=None,
                department=carol.department,
                job_position=carol.job_position,
                salary_structure_id=sal_struct.id,
                is_active=True,
            ),
        ]
        db.add_all(contracts)
        db.flush()

        # 6. TIME OFF TYPES & LEAVE ALLOCATIONS
        paid_leave = TimeOffType(name="Paid Leave", unit="days", requires_allocation=True, is_unpaid=False)
        unpaid_leave = TimeOffType(name="Unpaid Leave", unit="days", requires_allocation=True, is_unpaid=True)
        sick_leave = TimeOffType(name="Sick Leave", unit="days", requires_allocation=True, is_unpaid=False)
        db.add_all([paid_leave, unpaid_leave, sick_leave])
        db.flush()

        allocations = [
            LeaveAllocation(employee_id=alice.id, type_id=paid_leave.id, allocated_days=20.0, used_days=0.0, year=CURRENT_YEAR),
            LeaveAllocation(employee_id=alice.id, type_id=unpaid_leave.id, allocated_days=10.0, used_days=2.0, year=CURRENT_YEAR),
            LeaveAllocation(employee_id=alice.id, type_id=sick_leave.id, allocated_days=8.0, used_days=0.0, year=CURRENT_YEAR),
            LeaveAllocation(employee_id=bob.id, type_id=paid_leave.id, allocated_days=20.0, used_days=0.0, year=CURRENT_YEAR),
            LeaveAllocation(employee_id=carol.id, type_id=paid_leave.id, allocated_days=20.0, used_days=0.0, year=CURRENT_YEAR),
        ]
        db.add_all(allocations)
        db.flush()

        # 7. ATTENDANCE (Including Manual Override record)
        attendances = [
            Attendance(
                employee_id=alice.id,
                check_in=datetime(2025, 7, 1, 9, 0, 0),
                check_out=datetime(2025, 7, 1, 17, 0, 0),
                worked_hours=8.0,
                status="PRESENT",
                is_manual_override=False,
            ),
            Attendance(
                employee_id=bob.id,
                check_in=datetime(2025, 7, 1, 8, 45, 0),
                check_out=datetime(2025, 7, 1, 16, 45, 0),
                worked_hours=8.0,
                status="PRESENT",
                is_manual_override=True,  # Manual correction by HR Manager
            ),
        ]
        db.add_all(attendances)
        db.flush()

        # 8. LEAVE REQUESTS
        leave_requests = [
            LeaveRequest(
                employee_id=alice.id,
                type_id=unpaid_leave.id,
                date_from="2025-07-10",
                date_to="2025-07-11",
                duration_days=2.0,
                status=LeaveStatus.APPROVED,
                is_unpaid=True,
            ),
            LeaveRequest(
                employee_id=bob.id,
                type_id=paid_leave.id,
                date_from="2025-07-14",
                date_to="2025-07-14",
                duration_days=1.0,
                status=LeaveStatus.PENDING,
                is_unpaid=False,
            ),
        ]
        db.add_all(leave_requests)
        db.flush()

        # 9. PAYRUN
        demo_payrun = Payrun(
            name="July 2025 Payrun",
            structure_id=sal_struct.id,
            period_start="2025-07-01",
            period_end="2025-07-31",
            status=PayrunStatus.DRAFT,
        )
        db.add(demo_payrun)
        db.commit()

        print("\n[OK] Seed complete successfully for Phase 1.")

    except Exception as exc:
        db.rollback()
        print(f"\n[ERROR] Seed failed: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    seed()
