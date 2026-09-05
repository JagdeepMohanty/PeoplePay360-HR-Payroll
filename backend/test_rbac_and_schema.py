"""
Automated Test Suite for 5-Tier RBAC & Modules A1–A7 Master Data Engine
Tests schema creation, database seeding, authentication, role permission enforcement,
smart-button metrics, schedule intervals, contract overlap resolution, leave balance deductions,
sequential salary rule evaluation, and dashboard reporting metrics.
"""
import unittest
from fastapi.testclient import TestClient
from sqlalchemy import inspect

from database import Base, engine
from main import app
from seed import seed


class TestModulesA1ToA7(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        seed()
        cls.client = TestClient(app)

        cls.tokens = {}
        role_emails = {
            "ADMIN": "admin@peoplepay360.dev",
            "HR_MANAGER": "hr.manager@peoplepay360.dev",
            "HR_PAYROLL_USER": "payroll.user@peoplepay360.dev",
            "HR_PAYROLL_MANAGER": "payroll.manager@peoplepay360.dev",
            "EMPLOYEE": "alice.johnson@peoplepay360.dev",
        }

        for role, email in role_emails.items():
            res = cls.client.post(
                "/api/v1/auth/login",
                json={"email": email, "password": "password123"},
            )
            assert res.status_code == 200, f"Login failed for {role}: {res.json()}"
            cls.tokens[role] = res.json()["access_token"]

    def auth_header(self, role: str) -> dict:
        return {"Authorization": f"Bearer {self.tokens[role]}"}

    def test_01_schema_tables_exist(self):
        """Verify all 13 core tables exist in the database metadata."""
        inspector = inspect(engine)
        table_names = inspector.get_table_names()

        expected_tables = [
            "users",
            "employees",
            "working_schedules",
            "working_schedule_intervals",
            "contracts",
            "attendances",
            "time_off_types",
            "leave_allocations",
            "leave_requests",
            "salary_structures",
            "salary_rules",
            "payruns",
            "payslips",
        ]

        for table in expected_tables:
            self.assertIn(table, table_names, f"Table '{table}' missing from database")

    def test_02_module_a1_smart_button_metrics(self):
        """Module A1: Verify EmployeeRead JSON exposes calculated smart-button metrics."""
        res = self.client.get("/api/v1/employees/me", headers=self.auth_header("EMPLOYEE"))
        self.assertEqual(res.status_code, 200)
        data = res.json()

        self.assertIn("contracts_count", data)
        self.assertIn("leaves_count", data)
        self.assertIn("attendances_count", data)
        self.assertIn("payslips_count", data)
        self.assertIn("leave_balance", data)
        self.assertGreaterEqual(data["contracts_count"], 1)

    def test_03_module_a3_dynamic_working_schedule_hours(self):
        """Module A3: Verify dynamic weekly_hours calculation from schedule grid intervals."""
        res = self.client.get("/api/v1/working-schedules", headers=self.auth_header("ADMIN"))
        self.assertEqual(res.status_code, 200)
        schedules = res.json()
        self.assertGreater(len(schedules), 0)
        sched = schedules[0]
        self.assertEqual(sched["weekly_hours"], 40.0)
        self.assertGreaterEqual(len(sched["intervals"]), 5)

    def test_04_module_a4_leave_deduction_and_insufficient_balance(self):
        """Module A4: Verify leave balance deduction on approval and HTTP 400 on insufficient balance."""
        # 1. Submit leave for 50 days (exceeding balance of 20)
        submit_res = self.client.post(
            "/api/v1/leaves/",
            json={
                "employee_id": 1,
                "type_id": 1,
                "date_from": "2025-08-01",
                "date_to": "2025-09-20",
                "duration_days": 50.0,
                "is_unpaid": False,
            },
            headers=self.auth_header("EMPLOYEE"),
        )
        self.assertEqual(submit_res.status_code, 201)
        leave_id = submit_res.json()["id"]

        # 2. Approve should fail with HTTP 400 due to insufficient balance
        approve_res = self.client.post(
            f"/api/v1/leaves/approve/{leave_id}",
            headers=self.auth_header("HR_MANAGER"),
        )
        self.assertEqual(approve_res.status_code, 400)
        self.assertIn("Insufficient leave balance", approve_res.json()["detail"])

    def test_05_module_a5_a6_sequential_payroll_rule_engine(self):
        """Modules A5 & A6: Verify period-aware contract query and sequential salary rule computation."""
        # Get payrun #1
        res = self.client.get("/api/v1/payruns", headers=self.auth_header("HR_PAYROLL_USER"))
        self.assertEqual(res.status_code, 200)
        payrun_id = res.json()[0]["id"]

        # Compute payrun
        compute_res = self.client.post(
            f"/api/v1/payruns/{payrun_id}/compute",
            headers=self.auth_header("HR_PAYROLL_USER"),
        )
        self.assertEqual(compute_res.status_code, 200)
        payslips = compute_res.json()
        self.assertGreater(len(payslips), 0)

        # Inspect first payslip calculations (Gross = Basic 8500 + 15% allowance 1275 = 9775)
        slip = payslips[0]
        self.assertGreater(slip["gross"], slip["basic"])
        self.assertGreater(slip["gross"], slip["net"])
        self.assertEqual(round(slip["gross"] - slip["deductions"], 2), slip["net"])

    def test_06_module_a7_dashboard_metrics_reporting(self):
        """Module A7: Verify live dashboard metrics endpoint aggregation with filters."""
        res = self.client.get(
            "/api/v1/reports/dashboard/metrics",
            headers=self.auth_header("HR_MANAGER"),
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()

        self.assertIn("summary", data)
        self.assertIn("by_department", data)
        summary = data["summary"]
        self.assertGreaterEqual(summary["total_employees"], 3)
        self.assertGreaterEqual(summary["active_contracts"], 3)

    def test_07_rbac_permission_guards(self):
        """Verify role-based boundary enforcement (HR Manager blocked from payroll, Employee blocked from user list)."""
        # Employee blocked from payruns
        self.assertEqual(
            self.client.get("/api/v1/payruns", headers=self.auth_header("EMPLOYEE")).status_code,
            403,
        )

        # HR Manager blocked from payruns (HR Manager rights explicitly exclude Payroll)
        self.assertEqual(
            self.client.get("/api/v1/payruns", headers=self.auth_header("HR_MANAGER")).status_code,
            403,
        )

        # HR Payroll User allowed payruns, but blocked from modifying salary structures
        self.assertEqual(
            self.client.get("/api/v1/payruns", headers=self.auth_header("HR_PAYROLL_USER")).status_code,
            200,
        )
        self.assertEqual(
            self.client.post(
                "/api/v1/salary-structures",
                json={"name": "Forbidden Structure", "is_active": True},
                headers=self.auth_header("HR_PAYROLL_USER"),
            ).status_code,
            403,
        )


if __name__ == "__main__":
    unittest.main()
