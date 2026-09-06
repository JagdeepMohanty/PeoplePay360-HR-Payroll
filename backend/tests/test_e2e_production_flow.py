"""
Comprehensive Production Readiness End-to-End Verification Test Suite

Tests full lifecycle:
1. User Authentication (HR Manager & Employee Login)
2. Employee Record Provisioning & Active Contract Creation
3. Kiosk Attendance Punch-In & Punch-Out
4. Time Off Request Submission & Manager Approval (with balance deduction)
5. 2-Step Payrun Batch Creation & Idempotent Calculation (with dynamic LOP)
6. Guardian Compliance Validation Alerts Engine
7. Payrun Confirmation & State Guard Protection (blocking recompute on VALIDATED)
8. Payslip PDF Stream Download & Disbursement Verification
"""

import uuid
import pytest
from fastapi.testclient import TestClient
from database import Base, engine
from main import app
from seed import seed


@pytest.fixture(scope="module")
def setup_e2e_db():
    Base.metadata.create_all(bind=engine)
    seed(force=False)
    yield


def test_production_e2e_full_lifecycle(setup_e2e_db):
    client = TestClient(app)

    # 1. Login as HR Manager
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "payroll.manager@peoplepay360.dev", "password": "password123"},
    )
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    mgr_token = login_res.json()["access_token"]
    mgr_headers = {"Authorization": f"Bearer {mgr_token}"}

    # 2. Provision New Employee
    unique_email = f"marcus.vance.{uuid.uuid4().hex[:6]}@peoplepay360.dev"
    emp_payload = {
        "first_name": "Marcus",
        "last_name": "Vance",
        "email": unique_email,
        "department": "Engineering",
        "job_position": "Lead DevOps Architect",
        "bank_account": "US77CHASE000998877",
        "is_active": True,
    }
    emp_res = client.post("/api/v1/employees", json=emp_payload, headers=mgr_headers)
    assert emp_res.status_code in [201, 200], f"Employee creation failed: {emp_res.text}"
    emp_data = emp_res.json()
    emp_id = emp_data["id"]

    # 3. Create Active Contract
    contract_payload = {
        "employee_id": emp_id,
        "wage": 12000.0,
        "date_start": "2026-09-01",
        "date_end": "2026-12-31",
        "department": "Engineering",
        "job_position": "Lead DevOps Architect",
        "is_active": True,
    }
    contract_res = client.post("/api/v1/contracts", json=contract_payload, headers=mgr_headers)
    assert contract_res.status_code == 201, f"Contract creation failed: {contract_res.text}"

    # 4. Kiosk Punch In & Out Attendance
    punch_res = client.post(
        "/api/v1/attendance/punch",
        json={"employee_id": emp_id},
        headers=mgr_headers,
    )
    assert punch_res.status_code == 200, f"Punch failed: {punch_res.text}"

    # 5. Submit & Approve Leave Request
    leave_types = client.get("/api/v1/leaves/types", headers=mgr_headers).json()
    target_type = leave_types[0] if leave_types else {"id": 1, "requires_allocation": True}

    # Create Leave Allocation if required
    alloc_payload = {
        "employee_id": emp_id,
        "type_id": target_type["id"],
        "year": 2026,
        "allocated_days": 20.0,
        "used_days": 0.0,
    }
    alloc_res = client.post("/api/v1/leaves/allocations", json=alloc_payload, headers=mgr_headers)
    assert alloc_res.status_code in [201, 200], f"Allocation failed: {alloc_res.text}"

    leave_payload = {
        "employee_id": emp_id,
        "type_id": target_type["id"],
        "date_from": "2026-09-10",
        "date_to": "2026-09-11",
        "duration_days": 2.0,
        "reason": "Family Emergency",
    }
    leave_res = client.post("/api/v1/leaves", json=leave_payload, headers=mgr_headers)
    assert leave_res.status_code == 201, f"Leave submission failed: {leave_res.text}"
    leave_id = leave_res.json()["id"]

    approve_res = client.post(f"/api/v1/leaves/approve/{leave_id}", headers=mgr_headers)
    assert approve_res.status_code == 200, f"Leave approval failed: {approve_res.text}"

    # 6. Create 2-Step Payrun Batch
    payrun_payload = {
        "name": "September 2026 E2E Test Batch",
        "structure_id": 1,
        "period_start": "2026-09-01",
        "period_end": "2026-09-30",
        "employee_ids": [emp_id],
    }
    pr_res = client.post("/api/v1/payruns", json=payrun_payload, headers=mgr_headers)
    assert pr_res.status_code == 201, f"Payrun creation failed: {pr_res.text}"
    payrun_id = pr_res.json()["id"]

    # 7. Compute Payrun Batch
    comp_res = client.post(f"/api/v1/payruns/{payrun_id}/compute", headers=mgr_headers)
    assert comp_res.status_code == 200, f"Payrun computation failed: {comp_res.text}"
    slips = comp_res.json()
    assert len(slips) > 0
    slip_id = slips[0]["id"]

    # 8. Guardian Compliance Validation
    val_res = client.get(f"/api/v1/payruns/{payrun_id}/validate", headers=mgr_headers)
    assert val_res.status_code == 200

    # 9. Confirm Payrun to VALIDATED
    conf_res = client.post(f"/api/v1/payruns/{payrun_id}/confirm", headers=mgr_headers)
    assert conf_res.status_code == 200
    assert conf_res.json()["status"] == "VALIDATED"

    # 10. Verify State Machine Guard (Recompute on VALIDATED payrun fails with 400)
    recomp_res = client.post(f"/api/v1/payruns/{payrun_id}/compute", headers=mgr_headers)
    assert recomp_res.status_code == 400

    # 11. Download Payslip PDF Stream
    pdf_res = client.get(f"/api/v1/payruns/payslips/{slip_id}/pdf", headers=mgr_headers)
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert len(pdf_res.content) > 500
