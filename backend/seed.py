"""
Seed Script — PeoplePay360
Run: python seed.py
Clears all tables and inserts fresh demo data.
"""
import json
from datetime import datetime

from database import Base, engine, SessionLocal
from models.employee import Employee
from models.contract import Contract
from models.attendance import Attendance
from models.leave import Leave, LeaveAllocation
from models.payroll import Payrun, Payslip

CURRENT_YEAR = 2025


# ---------------------------------------------------------------------------
# Salary structure stored as plain dicts — no ORM model yet, kept in seed
# so the salary engine can reference the rule definitions by name.
# ---------------------------------------------------------------------------
SALARY_STRUCTURE = {
    "name": "Regular Monthly",
    "rules": [
        {"sequence": 1,  "code": "BASIC",         "name": "Basic Pay",          "rate": 1.00,  "base": "wage"},
        {"sequence": 2,  "code": "ALLOWANCE",      "name": "Housing & Transport","rate": 0.15,  "base": "BASIC"},
        {"sequence": 3,  "code": "GROSS",          "name": "Gross Pay",          "rate": None,  "base": "BASIC+ALLOWANCE"},
        {"sequence": 4,  "code": "LOP_DEDUCTION",  "name": "Loss of Pay",        "rate": None,  "base": "daily_rate*lop_days"},
        {"sequence": 5,  "code": "NET",            "name": "Net Pay",            "rate": None,  "base": "GROSS-deductions"},
    ],
}


def clear_tables(db):
    """Delete all rows in dependency-safe order."""
    db.query(Payslip).delete()
    db.query(Payrun).delete()
    db.query(LeaveAllocation).delete()
    db.query(Leave).delete()
    db.query(Attendance).delete()
    db.query(Contract).delete()
    db.query(Employee).delete()
    db.commit()


def seed():
    db = SessionLocal()
    try:
        print("Clearing existing data…")
        clear_tables(db)

        # ------------------------------------------------------------------ #
        # 1. EMPLOYEES                                                         #
        # ------------------------------------------------------------------ #
        employees = [
            Employee(
                name="Alice Johnson",
                department="Engineering",
                job_title="Senior Software Engineer",
                email="alice.johnson@peoplepay360.dev",
                bank_account="GB29NWBK60161331926819",
            ),
            Employee(
                name="Bob Martinez",
                department="Human Resources",
                job_title="HR Specialist",
                email="bob.martinez@peoplepay360.dev",
                bank_account="GB82WEST12345698765432",
            ),
            Employee(
                name="Carol White",
                department="Finance",
                job_title="Payroll Analyst",
                email="carol.white@peoplepay360.dev",
                bank_account="",   # intentionally blank → triggers Guardian warning
            ),
        ]
        db.add_all(employees)
        db.flush()   # assigns IDs without committing

        alice, bob, carol = employees
        print(f"  ✔ Employees: {[e.name for e in employees]}")

        # ------------------------------------------------------------------ #
        # 2. CONTRACTS                                                         #
        # ------------------------------------------------------------------ #
        contracts = [
            # Expired past contract for Alice (should NOT be picked by payrun)
            Contract(
                employee_id=alice.id,
                wage=6000.00,
                state="expired",
                date_start="2023-01-01",
                date_end="2024-12-31",
            ),
            # Active contract for Alice — valid for 2025 payrun period
            Contract(
                employee_id=alice.id,
                wage=8500.00,
                state="running",
                date_start="2025-01-01",
                date_end=None,
            ),
            # Active contract for Bob
            Contract(
                employee_id=bob.id,
                wage=5800.00,
                state="running",
                date_start="2024-06-01",
                date_end=None,
            ),
            # Active contract for Carol
            Contract(
                employee_id=carol.id,
                wage=6400.00,
                state="running",
                date_start="2025-01-15",
                date_end=None,
            ),
        ]
        db.add_all(contracts)
        db.flush()
        print(f"  ✔ Contracts: {len(contracts)} (1 expired, 3 running)")

        # ------------------------------------------------------------------ #
        # 3. LEAVE ALLOCATIONS  (year = CURRENT_YEAR)                         #
        # ------------------------------------------------------------------ #
        allocations = [
            LeaveAllocation(employee_id=alice.id, leave_type="paid",   allocated_days=20.0, used_days=0.0, year=CURRENT_YEAR),
            LeaveAllocation(employee_id=alice.id, leave_type="unpaid", allocated_days=10.0, used_days=0.0, year=CURRENT_YEAR),
            LeaveAllocation(employee_id=alice.id, leave_type="sick",   allocated_days=8.0,  used_days=0.0, year=CURRENT_YEAR),
            LeaveAllocation(employee_id=bob.id,   leave_type="paid",   allocated_days=20.0, used_days=0.0, year=CURRENT_YEAR),
            LeaveAllocation(employee_id=bob.id,   leave_type="unpaid", allocated_days=10.0, used_days=0.0, year=CURRENT_YEAR),
            LeaveAllocation(employee_id=carol.id, leave_type="paid",   allocated_days=20.0, used_days=0.0, year=CURRENT_YEAR),
        ]
        db.add_all(allocations)
        db.flush()
        print(f"  ✔ Leave Allocations: {len(allocations)}")

        # ------------------------------------------------------------------ #
        # 4. ATTENDANCE RECORDS                                                #
        # ------------------------------------------------------------------ #
        attendances = [
            Attendance(
                employee_id=alice.id,
                check_in=datetime(2025, 7, 1, 9, 0, 0),
                check_out=datetime(2025, 7, 1, 18, 0, 0),
            ),
            Attendance(
                employee_id=bob.id,
                check_in=datetime(2025, 7, 1, 8, 45, 0),
                check_out=datetime(2025, 7, 1, 17, 30, 0),
            ),
        ]
        db.add_all(attendances)
        db.flush()
        print(f"  ✔ Attendance Records: {len(attendances)}")

        # ------------------------------------------------------------------ #
        # 5. LEAVE REQUESTS — 1 approved unpaid leave for Alice               #
        #    This should trigger LOP deduction in the July 2025 payrun.       #
        # ------------------------------------------------------------------ #
        leaves = [
            Leave(
                employee_id=alice.id,
                leave_type="unpaid",
                date_from="2025-07-10",
                date_to="2025-07-11",
                days=2.0,
                state="approved",
            ),
            Leave(
                employee_id=bob.id,
                leave_type="paid",
                date_from="2025-07-14",
                date_to="2025-07-14",
                days=1.0,
                state="draft",   # pending — should NOT affect payrun yet
            ),
        ]
        db.add_all(leaves)
        db.flush()

        # Reflect Alice's approved unpaid leave in her allocation used_days
        alice_unpaid_alloc = next(
            a for a in allocations
            if a.employee_id == alice.id and a.leave_type == "unpaid"
        )
        alice_unpaid_alloc.used_days += 2.0

        print(f"  ✔ Leave Requests: {len(leaves)} (1 approved unpaid, 1 draft paid)")

        # ------------------------------------------------------------------ #
        # 6. SALARY STRUCTURE — stored as JSON on a demo Payrun for reference #
        # ------------------------------------------------------------------ #
        demo_payrun = Payrun(
            period_start="2025-07-01",
            period_end="2025-07-31",
            department=None,
            state="draft",
        )
        db.add(demo_payrun)
        db.flush()
        print(f"  ✔ Demo Payrun: #{demo_payrun.id} (July 2025, all departments, draft)")
        print(f"  ✔ Salary Structure: '{SALARY_STRUCTURE['name']}' with {len(SALARY_STRUCTURE['rules'])} rules")
        for rule in SALARY_STRUCTURE["rules"]:
            print(f"       [{rule['sequence']}] {rule['code']:15s} — {rule['name']}")

        db.commit()
        print("\n✅ Seed complete.")
        print(f"   Employees        : {len(employees)}")
        print(f"   Contracts        : {len(contracts)} (1 expired, 3 running)")
        print(f"   Leave Allocations: {len(allocations)}")
        print(f"   Attendance       : {len(attendances)}")
        print(f"   Leave Requests   : {len(leaves)}")
        print(f"   Payruns          : 1 (draft, July 2025)")

    except Exception as exc:
        db.rollback()
        print(f"\n❌ Seed failed: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    seed()
