"""
Test Suite for Operational Backend Workflows:
1. 2-Step Payrun Creation Batch Workflow & Idempotency
2. Operational Warnings Engine (missing bank details, overlapping contracts, duplicate payslips)
3. Payslip PDF Generation (binary stream)
4. Bulk Email Dispatch
"""
import unittest
from fastapi.testclient import TestClient

from database import Base, engine, SessionLocal
from main import app
from seed import seed
from models.payroll import Payrun, Payslip, PayrunStatus
from models.employee import Employee
from models.contract import Contract


class TestPayrunWorkflowAndEngine(unittest.TestCase):
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

    def test_01_two_step_payrun_creation_draft_batch(self):
        """Test 2-step setup: Step 1 scope + Step 2 explicit employee selection -> DRAFT batch."""
        payload = {
            "name": "July 2025 Test Payrun",
            "structure_id": 1,
            "period_start": "2025-07-01",
            "period_end": "2025-07-31",
            "employee_ids": [1, 2],  # Explicitly select employees 1 and 2
        }
        res = self.client.post(
            "/api/v1/payruns/wizard",
            json=payload,
            headers=self.auth_header("HR_PAYROLL_USER"),
        )
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["status"], "DRAFT")
        self.assertEqual(data["name"], "July 2025 Test Payrun")
        self.assertIsNotNone(data["id"])

        payrun_id = data["id"]
        # Verify payrun exists in draft state with draft payslip placeholders
        db = SessionLocal()
        slips = db.query(Payslip).filter(Payslip.payrun_id == payrun_id).all()
        emp_ids = [s.employee_id for s in slips]
        self.assertIn(1, emp_ids)
        self.assertIn(2, emp_ids)
        db.close()

    def test_02_idempotent_compute_payrun(self):
        """Test POST /payruns/{id}/compute clears existing slips prior to fresh calculation."""
        # 1. Create a payrun batch for employee 1
        create_res = self.client.post(
            "/api/v1/payruns/wizard",
            json={
                "name": "August 2025 Idempotent Batch",
                "structure_id": 1,
                "period_start": "2025-08-01",
                "period_end": "2025-08-31",
                "employee_ids": [1],
            },
            headers=self.auth_header("HR_PAYROLL_USER"),
        )
        self.assertEqual(create_res.status_code, 201)
        payrun_id = create_res.json()["id"]

        # 2. Compute the payrun (First execution)
        compute1 = self.client.post(
            f"/api/v1/payruns/{payrun_id}/compute",
            headers=self.auth_header("HR_PAYROLL_USER"),
        )
        self.assertEqual(compute1.status_code, 200)
        slips1 = compute1.json()
        self.assertEqual(len(slips1), 1)
        slip1_net = slips1[0]["net"]
        self.assertGreater(slip1_net, 0)

        # 3. Re-compute the payrun (Second execution to test strict idempotency)
        compute2 = self.client.post(
            f"/api/v1/payruns/{payrun_id}/compute",
            headers=self.auth_header("HR_PAYROLL_USER"),
        )
        self.assertEqual(compute2.status_code, 200)
        slips2 = compute2.json()
        self.assertEqual(len(slips2), 1)

        # Confirm old slip was deleted and replaced cleanly without duplicates
        db = SessionLocal()
        total_slips = db.query(Payslip).filter(Payslip.payrun_id == payrun_id).count()
        self.assertEqual(total_slips, 1)
        self.assertEqual(slips2[0]["net"], slip1_net)
        db.close()

    def test_03_operational_warnings_engine(self):
        """Test surface pre-validation alerts: missing bank details, overlapping contracts, duplicate payslips."""
        db = SessionLocal()
        # Ensure employee 2 has no bank account for this test
        emp2 = db.query(Employee).filter(Employee.id == 2).first()
        if emp2:
            emp2.bank_account = ""

        # Create overlapping contract for employee 3 to trigger overlapping contract alert
        existing_dup_contract = db.query(Contract).filter(Contract.employee_id == 3, Contract.date_start == "2025-06-01").first()
        if not existing_dup_contract:
            c_overlap = Contract(
                employee_id=3,
                wage=4500.0,
                salary_structure_id=1,
                date_start="2025-06-01",
                date_end="2025-12-31",
                is_active=True,
            )
            db.add(c_overlap)
        db.commit()
        db.close()

        # Create payrun including employee 2 (missing bank) and employee 3 (overlapping contracts)
        create_res = self.client.post(
            "/api/v1/payruns/wizard",
            json={
                "name": "September 2025 Warnings Test",
                "structure_id": 1,
                "period_start": "2025-09-01",
                "period_end": "2025-09-30",
                "employee_ids": [2, 3],
            },
            headers=self.auth_header("HR_PAYROLL_USER"),
        )
        self.assertEqual(create_res.status_code, 201)
        payrun_id = create_res.json()["id"]

        # Run pre-validation
        val_res = self.client.get(
            f"/api/v1/payruns/{payrun_id}/validate",
            headers=self.auth_header("HR_PAYROLL_USER"),
        )
        self.assertEqual(val_res.status_code, 200)
        data = val_res.json()
        warnings = data["warnings"]
        warning_types = [w["type"] for w in warnings]

        # Verify missing bank account detected for employee 2
        self.assertIn("missing_bank_account", warning_types)
        emp2_warning = next(w for w in warnings if w["type"] == "missing_bank_account")
        self.assertEqual(emp2_warning["employee_id"], 2)

        # Verify overlapping contracts detected for employee 3
        self.assertIn("overlapping_contracts", warning_types)
        emp3_warning = next(w for w in warnings if w["type"] == "overlapping_contracts")
        self.assertEqual(emp3_warning["employee_id"], 3)

        # Test duplicate payslip alert: artificially insert duplicate payslip
        db = SessionLocal()
        dup_slip = Payslip(
            payrun_id=payrun_id,
            employee_id=2,
            contract_id=2,
            basic=5000.0,
            gross=5000.0,
            net=5000.0,
        )
        db.add(dup_slip)
        db.commit()
        db.close()

        # Re-run validation
        val_res2 = self.client.get(
            f"/api/v1/payruns/{payrun_id}/validate",
            headers=self.auth_header("HR_PAYROLL_USER"),
        )
        data2 = val_res2.json()
        warning_types2 = [w["type"] for w in data2["warnings"]]
        self.assertIn("duplicate_payslip", warning_types2)

    def test_04_download_payslip_pdf_stream(self):
        """Test GET /payruns/payslips/{id}/pdf returns binary PDF stream."""
        db = SessionLocal()
        slip = db.query(Payslip).first()
        self.assertIsNotNone(slip)
        slip_id = slip.id
        db.close()

        # Both /api/v1/payruns/payslips/{id}/pdf and /payruns/payslips/{id}/pdf should work
        res = self.client.get(
            f"/api/v1/payruns/payslips/{slip_id}/pdf",
            headers=self.auth_header("HR_PAYROLL_USER"),
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.headers["content-type"], "application/pdf")
        self.assertIn("attachment; filename=", res.headers["content-disposition"])
        self.assertTrue(res.content.startswith(b"%PDF-"))

        # Test direct alias /payruns/payslips/{id}/pdf
        res_alias = self.client.get(
            f"/payruns/payslips/{slip_id}/pdf",
            headers=self.auth_header("HR_PAYROLL_USER"),
        )
        self.assertEqual(res_alias.status_code, 200)
        self.assertEqual(res_alias.headers["content-type"], "application/pdf")
        self.assertTrue(res_alias.content.startswith(b"%PDF-"))

    def test_05_bulk_send_payslips_email(self):
        """Test POST /payruns/{id}/send-payslips dispatches emails with PDF attachment."""
        # 1. Setup payrun with computed payslip
        create_res = self.client.post(
            "/api/v1/payruns/wizard",
            json={
                "name": "October 2025 Send Email Payrun",
                "structure_id": 1,
                "period_start": "2025-10-01",
                "period_end": "2025-10-31",
                "employee_ids": [1],
            },
            headers=self.auth_header("HR_PAYROLL_USER"),
        )
        payrun_id = create_res.json()["id"]

        # Compute
        self.client.post(
            f"/api/v1/payruns/{payrun_id}/compute",
            headers=self.auth_header("HR_PAYROLL_USER"),
        )

        # Dispatch bulk emails
        send_res = self.client.post(
            f"/api/v1/payruns/{payrun_id}/send-payslips",
            headers=self.auth_header("HR_PAYROLL_USER"),
        )
        self.assertEqual(send_res.status_code, 200)
        data = send_res.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["sent_count"], 1)
        dispatched = data["dispatched_details"][0]
        self.assertEqual(dispatched["status"], "SENT")
        self.assertGreater(dispatched["pdf_size_bytes"], 500)


if __name__ == "__main__":
    unittest.main()
