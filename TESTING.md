# PeoplePay360 — Testing Guide & Verification Checklist

---

## 1. Automated Test Suite Execution

PeoplePay360 includes automated unit and end-to-end integration tests using `pytest` and `httpx`.

### Running Backend Tests
```bash
cd backend
python -m pytest -v
```

### Running Frontend Verification
```bash
cd frontend
npm run build
```

---

## 2. Test Suites Overview

| Suite | Path | Description | Test Count |
|---|---|---|---|
| **E2E Walkthrough** | `backend/tests/test_e2e_walkthrough.py` | Validates complete lifecycle from employee onboarding to computed payslip PDF | 4 tests |
| **Payrun & Guardian** | `backend/tests/test_payrun_workflow.py` | Validates 2-step wizard, compute idempotency, Guardian warnings, PDF stream, email dispatch | 5 tests |
| **Employee Master** | `backend/tests/test_employee.py` | Tests Employee CRUD, validation, and SmartButtons count properties | 4 tests |
| **RBAC & Authorization** | `backend/tests/test_rbac_and_schema.py` | Enforces 5-tier role boundaries, self-access restrictions, and negative auth scenarios | 5 tests |

---

## 3. End-to-End Regression Walkthrough

```
[1. Login] --------> [2. Create Employee] --------> [3. Active Contract]
                                                            |
                                                            v
[6. Payrun Wizard] <-- [5. Unpaid Leave] <--- [4. Attendance Log]
        |
        v
[7. Guardian Validation Alert Check]
        |
        v
[8. POST /payruns/{id}/compute]  (Repeated 3x -> Verify 0 duplicate payslips)
        |
        v
[9. View Payslip Breakdown & Download PDF]
        |
        v
[10. Analytics Dashboard Verification]
```

### Manual Testing Checklist

- [x] **Compute Idempotency**: Run `POST /payruns/{id}/compute` multiple times on the same payrun. Confirm payslip count remains strictly 1 per eligible employee.
- [x] **Guardian Anomaly Alerts**: Create an employee with missing bank details and overlapping active contracts. Run `/validate` on the payrun and verify warning cards are surfaced.
- [x] **Role Access Verification**:
  - `HR_MANAGER`: Can view employees, approve leaves, but receives `403 Forbidden` on payrun compute.
  - `HR_PAYROLL_USER`: Can compute payruns and generate payslips, but receives `403 Forbidden` on deleting payruns.
  - `EMPLOYEE`: Can only view own profile and payslips; forbidden from accessing other employee records.
- [x] **PDF Stream**: Verify `GET /payruns/payslips/{id}/pdf` produces a valid `%PDF-1.4` binary stream with itemized salary breakdown.
