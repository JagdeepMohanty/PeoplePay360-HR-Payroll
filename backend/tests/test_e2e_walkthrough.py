"""
End-to-End Walkthrough & Role Restriction QA Test Suite:
1. Create Employee -> Active Contract -> Attendance / Leave Approval (LOP & Balance Deduction)
2. Execute 2-Step Payrun -> Validate Warnings -> Print PDF Payslip Stream
3. View Live Dashboard Metrics (KPIs, by_department, monthly_trends)
4. Role Restrictions QA: EMPLOYEE and HR_MANAGER blocked from accessing payroll execution routes
"""
import unittest
from fastapi.testclient import TestClient

from database import Base, engine, SessionLocal
from main import app
from seed import seed
from models.user import UserRole
from models.payroll import Payslip, PayrunStatus


class TestE2EWalkthroughAndQARoles(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
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

    def test_01_full_lifecycle_workflow(self):
        """
        Full Lifecycle:
        Create Employee -> Active Contract -> Attendance & Leave Approval ->
        2-Step Payrun Execution -> Validate Warnings -> Print PDF -> Dashboard Metrics
        """
        # Step 1: Create Employee (as HR Manager)
        emp_res = self.client.post(
            "/api/v1/employees",
            json={
                "first_name": "Diana",
                "last_name": "Prince",
                "email": "diana.prince@peoplepay360.dev",
                "department": "Engineering",
                "job_position": "Staff Security Engineer",
                "bank_account": "US99CHASE0001928374",
                "is_active": True,
            },
            headers=self.auth_header("HR_MANAGER"),
        )
        self.assertEqual(emp_res.status_code, 201)
        emp_id = emp_res.json()["id"]

        # Fetch dynamic structure ID from seeded data
        structs = self.client.get("/api/v1/salary-structures", headers=self.auth_header("HR_PAYROLL_MANAGER")).json()
        struct_id = structs[0]["id"] if structs else 1

        # Step 2: Active Contract (as HR Manager)
        contract_res = self.client.post(
            "/api/v1/contracts",
            json={
                "employee_id": emp_id,
                "wage": 10000.0,
                "date_start": "2025-07-01",
                "date_end": "2025-12-31",
                "department": "Engineering",
                "job_position": "Staff Security Engineer",
                "salary_structure_id": struct_id,
                "is_active": True,
            },
            headers=self.auth_header("HR_MANAGER"),
        )
        self.assertEqual(contract_res.status_code, 201)
        contract_id = contract_res.json()["id"]

        # Step 3: Log Attendance
        att_res = self.client.post(
            "/api/v1/attendance",
            json={
                "employee_id": emp_id,
                "check_in": "2025-07-07T09:00:00",
                "check_out": "2025-07-07T17:30:00",
                "worked_hours": 8.5,
                "status": "PRESENT",
            },
            headers=self.auth_header("HR_MANAGER"),
        )
        self.assertEqual(att_res.status_code, 201)

        # Fetch dynamic leave type ID from seeded data
        leave_types = self.client.get("/api/v1/leaves/types", headers=self.auth_header("HR_MANAGER")).json()
        type_id = leave_types[0]["id"] if leave_types else 1

        # Step 4: Create Leave Allocation & Submit Unpaid Leave Request
        alloc_res = self.client.post(
            "/api/v1/leaves/allocation",
            json={
                "employee_id": emp_id,
                "type_id": type_id,
                "allocated_days": 15.0,
                "used_days": 0.0,
                "year": 2025,
            },
            headers=self.auth_header("HR_MANAGER"),
        )
        self.assertEqual(alloc_res.status_code, 201)

        leave_res = self.client.post(
            "/api/v1/leaves/request",
            json={
                "employee_id": emp_id,
                "type_id": type_id,  # Leave Type
                "date_from": "2025-07-14",
                "date_to": "2025-07-15",
                "duration_days": 2.0,
                "is_unpaid": True,
            },
            headers=self.auth_header("HR_MANAGER"),
        )
        self.assertEqual(leave_res.status_code, 201)
        leave_id = leave_res.json()["id"]

        # Approve Leave
        appr_res = self.client.post(
            f"/api/v1/leaves/approve/{leave_id}",
            headers=self.auth_header("HR_MANAGER"),
        )
        self.assertEqual(appr_res.status_code, 200)

        # Step 5: Execute 2-Step Payrun (as HR Payroll User)
        # Step 1 & 2: Wizard batch setup with explicit employee selection
        wizard_res = self.client.post(
            "/api/v1/payruns/wizard",
            json={
                "name": "July 2025 Lifecycle Payrun Batch",
                "structure_id": 1,
                "period_start": "2025-07-01",
                "period_end": "2025-07-31",
                "employee_ids": [emp_id],
            },
            headers=self.auth_header("HR_PAYROLL_USER"),
        )
        self.assertEqual(wizard_res.status_code, 201)
        payrun_id = wizard_res.json()["id"]
        self.assertEqual(wizard_res.json()["status"], PayrunStatus.DRAFT.value)

        # Step 6: Validate Warnings (Pre-validation check)
        val_res = self.client.get(
            f"/api/v1/payruns/{payrun_id}/validate",
            headers=self.auth_header("HR_PAYROLL_USER"),
        )
        self.assertEqual(val_res.status_code, 200)
        self.assertIn("warnings", val_res.json())

        # Step 7: Compute Payrun (Idempotent computation with LOP calculation)
        compute_res = self.client.post(
            f"/api/v1/payruns/{payrun_id}/compute",
            headers=self.auth_header("HR_PAYROLL_USER"),
        )
        self.assertEqual(compute_res.status_code, 200)
        slips = compute_res.json()
        self.assertEqual(len(slips), 1)

        slip = slips[0]
        # Basic = 10000, Allowances = 15% (1500) -> Gross = 11500
        self.assertEqual(slip["basic"], 10000.0)
        self.assertEqual(slip["gross"], 11500.0)
        # Worked days = 22 - 2 (LOP) = 20.0
        self.assertEqual(slip["worked_days"], 20.0)
        self.assertGreater(slip["deductions"], 0.0)
        self.assertGreater(slip["net"], 0.0)

        # Step 8: Print PDF Binary Stream
        pdf_res = self.client.get(
            f"/api/v1/payruns/payslips/{slip['id']}/pdf",
            headers=self.auth_header("HR_PAYROLL_USER"),
        )
        self.assertEqual(pdf_res.status_code, 200)
        self.assertEqual(pdf_res.headers["content-type"], "application/pdf")
        self.assertTrue(pdf_res.content.startswith(b"%PDF-"))

        # Step 9: View Live Dashboard Metrics
        dash_res = self.client.get(
            "/api/v1/reports/dashboard/metrics?period=2025-07&dept=Engineering",
            headers=self.auth_header("HR_MANAGER"),
        )
        self.assertEqual(dash_res.status_code, 200)
        dash_data = dash_res.json()
        summary = dash_data["summary"]
        self.assertGreater(summary["total_net"], 0)
        self.assertGreater(summary["payslip_count"], 0)
        self.assertGreater(summary["average_salary"], 0)
        self.assertGreaterEqual(summary["approved_leaves"], 1)
        self.assertIn("by_department", dash_data)
        self.assertIn("monthly_trends", dash_data)

    def test_02_role_restrictions_on_payroll_routes(self):
        """
        Verify Role Restrictions:
        EMPLOYEE and HR_MANAGER must be strictly blocked (403 Forbidden) from payroll execution routes.
        """
        # 1. EMPLOYEE role checks
        res_emp_payruns = self.client.get(
            "/api/v1/payruns",
            headers=self.auth_header("EMPLOYEE"),
        )
        self.assertEqual(res_emp_payruns.status_code, 403)
        self.assertIn("Operation not permitted", res_emp_payruns.json()["detail"])

        res_emp_wizard = self.client.post(
            "/api/v1/payruns/wizard",
            json={
                "name": "Unauthorized Batch",
                "period_start": "2025-07-01",
                "period_end": "2025-07-31",
            },
            headers=self.auth_header("EMPLOYEE"),
        )
        self.assertEqual(res_emp_wizard.status_code, 403)

        res_emp_compute = self.client.post(
            "/api/v1/payruns/1/compute",
            headers=self.auth_header("EMPLOYEE"),
        )
        self.assertEqual(res_emp_compute.status_code, 403)

        # 2. HR_MANAGER role checks (HR_MANAGER has Employee & Leave CRUD, but is BLOCKED from Payroll!)
        res_hrm_payruns = self.client.get(
            "/api/v1/payruns",
            headers=self.auth_header("HR_MANAGER"),
        )
        self.assertEqual(res_hrm_payruns.status_code, 403)
        self.assertIn("Operation not permitted", res_hrm_payruns.json()["detail"])

        res_hrm_wizard = self.client.post(
            "/api/v1/payruns/wizard",
            json={
                "name": "HR Manager Blocked Batch",
                "period_start": "2025-07-01",
                "period_end": "2025-07-31",
            },
            headers=self.auth_header("HR_MANAGER"),
        )
        self.assertEqual(res_hrm_wizard.status_code, 403)

        res_hrm_compute = self.client.post(
            "/api/v1/payruns/1/compute",
            headers=self.auth_header("HR_MANAGER"),
        )
        self.assertEqual(res_hrm_compute.status_code, 403)


if __name__ == "__main__":
    unittest.main()
