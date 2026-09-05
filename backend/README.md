# PeoplePay360 — Backend System Architecture & API Documentation

**FastAPI + SQLAlchemy ORM + Pydantic v2 + Jinja2 + ReportLab / WeasyPrint**

PeoplePay360 is an enterprise workforce-to-payroll management engine featuring a **5-Tier Role-Based Access Control (RBAC)** architecture, **Sequential Salary Rule Engine**, **Payroll Guardian Operational Anomaly Validator**, and **Jinja2 / ReportLab Binary PDF Payslip Generation Engine**.

---

## 🚀 Quickstart & Setup

```bash
# 1. Clone repository and navigate to backend
cd backend

# 2. Create and activate Python 3.11 virtual environment
py -3.11 -m venv venv
venv\Scripts\activate        # Windows (PowerShell / CMD)
source venv/bin/activate     # macOS / Linux

# 3. Install required dependencies
pip install -r requirements.txt

# 4. Seed demo dataset (Populates default 5-Tier RBAC personas & sample records)
python seed.py

# 5. Launch FastAPI development server
uvicorn main:app --reload --port 8000
```

- **API Base URL**: `http://localhost:8000/api/v1`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **ReDoc Specification**: `http://localhost:8000/redoc`

---

## 📂 Project Architecture

```
backend/
├── main.py                    # FastAPI application setup, CORS, and router registrations
├── config.py                  # Pydantic Settings & environment variable configuration
├── database.py                # SQLAlchemy engine, SessionLocal, and DB session dependency
├── auth.py                    # JWT authentication, password hashing, and 5-Tier RBAC dependency guards
├── seed.py                    # Automated database seeder with complete demo personas
├── requirements.txt           # Dependency manifest (FastAPI, SQLAlchemy, ReportLab, WeasyPrint, Jinja2)
│
├── models/                    # SQLAlchemy ORM Data Models (13 Core Tables)
│   ├── user.py                # User account & UserRole Enum (5 Tiers)
│   ├── employee.py            # Employee master with smart-button computed metrics
│   ├── working_schedule.py    # Working schedule & daily interval definitions
│   ├── contract.py            # Active contracts with salary structure association
│   ├── attendance.py          # Clock in/out logs & worked hours
│   ├── leave.py               # Leave types, allocations & leave request workflows
│   └── payroll.py             # Salary structures, rules, payrun batches & payslips
│
├── schemas/                   # Pydantic Schemas for Request Validation & Response Serialization
│   ├── user.py
│   ├── employee.py
│   ├── working_schedule.py
│   ├── contract.py
│   ├── attendance.py
│   ├── leave.py
│   └── payroll.py
│
├── routers/                   # RESTful API Endpoint Controllers (10 Domain Routers)
│   ├── auth.py                # Login JWT issuance & /me endpoint
│   ├── users.py               # User management (Admin only)
│   ├── employees.py           # Employee Directory & Profile CRUD
│   ├── working_schedules.py   # Work schedules & hours calculator
│   ├── contracts.py           # Contract lifecycle management
│   ├── attendance.py          # Attendance logging & exception overrides
│   ├── leaves.py              # Time off requests & manager approval/refusal
│   ├── salary_structures.py   # Salary rules & structure definition
│   ├── payruns.py             # 2-step payrun wizard, compute, validate, PDF & bulk email
│   └── dashboard.py           # Analytics metrics, KPIs & department distribution
│
├── services/                  # Business Logic Engines
│   ├── salary_engine.py       # Sequential salary rule calculation & LOP deduction engine
│   ├── guardian_validator.py  # Payroll Guardian pre-validation anomaly detection
│   └── pdf_generator.py       # ReportLab & WeasyPrint Jinja2 PDF binary stream renderer
│
├── templates/                 # HTML Templates
│   └── payslip.html           # Responsive Jinja2 printable payslip HTML template
│
└── tests/                     # Automated Test Suites (Pytest)
    ├── test_employee.py       # Employee creation & duplicate validation tests
    ├── test_payrun_workflow.py# 2-Step wizard, compute idempotency, PDF & bulk email tests
    ├── test_rbac_and_schema.py# 5-Tier RBAC permission guards & schema verification
    └── test_e2e_walkthrough.py# Full end-to-end lifecycle QA test suite
```

---

## 🔒 5-Tier Role-Based Access Control (RBAC) Matrix

PeoplePay360 enforces strict role segregation across 5 security tiers:

| Security Tier | Role Code | Allowed Scope & Permissions |
|---|---|---|
| **Tier 1: Employee** | `EMPLOYEE` | Access own self-profile (`/employees/me`), own attendance logs, and own leave balances; submit own leave requests. Strictly blocked (HTTP 403) from all payroll endpoints. |
| **Tier 2: HR Manager** | `HR_MANAGER` | Full CRUD on Employees, Contracts, Work Schedules, Attendance, and Time Off; approve/refuse leave requests. **Explicitly blocked (HTTP 403)** from payroll creation, computation, and payslip execution. |
| **Tier 3: HR Payroll User** | `HR_PAYROLL_USER` | Includes HR Manager rights + Read/Create/Compute/Confirm on Payrun batches and Payslips; Read-Only access to Salary Structures & Rules. |
| **Tier 4: HR Payroll Manager**| `HR_PAYROLL_MANAGER`| Includes HR Payroll User rights + Full CRUD on Salary Structures & Rules, plus destructive DELETE rights on Payruns. |
| **Tier 5: System Admin** | `ADMIN` | Full unrestricted access across all system endpoints, system configurations, and user management. |

---

## ⚙️ Core Business Engines

### 1. `services/salary_engine.py` — Sequential Salary Rule Engine
Evaluates every employee's payslip through a deterministic 6-phase pipeline:
```
1. Period Contract Resolution  →  2. Rule Sequencing (BASIC → ALLOWANCE → GROSS → DEDUCTION → NET)
3. Allowances Calculation       →  4. Gross Subtotal Calculation
5. Loss of Pay (LOP) & Taxes   →  6. Net Take-Home Salary Calculation
```
- **LOP Unpaid Leave Calculation**: Sums duration of approved unpaid leave requests overlapping the payrun period: `daily_rate = basic / 22.0`, `lop_deduction = lop_days * daily_rate`.
- Itemized rule breakdowns are stored as JSON in `Payslip.breakdown_json`.

### 2. `services/guardian_validator.py` — Pre-Validation Operational Anomaly Engine
Surfaces pre-validation alerts prior to payrun batch confirmation:
- **Missing Bank Details**: Detects missing or empty `employee.bank_account` details.
- **Overlapping Contracts**: Surfaces employees with multiple active contracts overlapping the payrun period or intersecting date ranges.
- **Duplicate Payslips**: Flags duplicate payslips within the current batch or across overlapping payrun periods.

### 3. `services/pdf_generator.py` — PDF Stream Engine
Renders Jinja2 HTML (`templates/payslip.html`) and produces high-fidelity binary PDF streams using **ReportLab** and **WeasyPrint** with automatic byte stream fallback. Returns direct `application/pdf` binary payloads.

---

## 🌐 API Endpoint Reference

### Authentication & Users
- `POST /api/v1/auth/login` — Authenticate and obtain JWT Bearer Token.
- `GET /api/v1/auth/me` — Fetch current user persona details.
- `GET /api/v1/users` — List system users (Admin only).

### Employee Master
- `GET /api/v1/employees` — List all employees.
- `GET /api/v1/employees/me` — Retrieve logged-in employee self-profile.
- `GET /api/v1/employees/{id}` — Retrieve employee profile with SmartButton counts.
- `POST /api/v1/employees` — Create new employee record.
- `PUT /api/v1/employees/{id}` — Update employee profile details.

### Payrun & Payroll Execution
- `POST /api/v1/payruns/wizard` — 2-Step Payrun Wizard batch creation (DRAFT state).
- `POST /api/v1/payruns/{id}/compute` — Idempotent recalculation engine.
- `GET /api/v1/payruns/{id}/validate` — Run Payroll Guardian pre-validation checks.
- `POST /api/v1/payruns/{id}/confirm` — Confirm payrun batch (VALIDATED state).
- `GET /api/v1/payruns/payslips/{id}/pdf` — Return printable PDF binary stream.
- `POST /api/v1/payruns/{id}/send-payslips` — Bulk email distribution of PDF payslips.

### Analytics & Reports
- `GET /api/v1/reports/dashboard/metrics` — Aggregate live KPI metrics (`summary`, `by_department`, `monthly_trends`).

---

## 🧪 Automated Testing

Execute the complete backend Pytest suite:

```bash
$env:PYTHONPATH="backend"
py -3.11 -m pytest backend/tests/ -v --tb=short
```

**Test Coverage (18/18 Passing)**:
- `test_employee.py`: Employee creation, email uniqueness, schema validation.
- `test_payrun_workflow.py`: 2-step wizard, compute idempotency, Guardian warnings, PDF stream, bulk email.
- `test_rbac_and_schema.py`: 5-tier RBAC permission guards & schema verification.
- `test_e2e_walkthrough.py`: Full end-to-end lifecycle QA test suite.
