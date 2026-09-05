# PeoplePay360 — Backend

**FastAPI + SQLAlchemy + PostgreSQL/SQLite**

---

## Quickstart

```bash
# 1. Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS/Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env         # edit DB_URL, SMTP, etc.

# 4. Seed demo data
python seed.py

# 5. Start the server
uvicorn main:app --reload
```

API is live at `http://localhost:8000`
Swagger UI: `http://localhost:8000/docs`
ReDoc: `http://localhost:8000/redoc`

---

## Project Layout

```
backend/
├── main.py              # FastAPI app, CORS, router registration
├── config.py            # Pydantic Settings (env vars)
├── database.py          # SQLAlchemy engine, SessionLocal, get_db
├── seed.py              # Demo data seeder
├── models/              # SQLAlchemy ORM table definitions
├── schemas/             # Pydantic request/response validation
├── routers/             # FastAPI route handlers (one file per domain)
└── services/            # Core business logic (no HTTP concerns)
    ├── salary_engine.py
    ├── guardian_validator.py
    └── pdf_generator.py
```

---

## Core Services

### `services/salary_engine.py` — Rule Sequencing Engine
Evaluates each payslip through a fixed sequential pipeline:

```
Basic Pay  →  Allowances  →  Gross  →  Deductions  →  Net Pay
```

Each step is a deterministic calculation against the employee's active running contract wage. The breakdown is serialised as JSON onto the `Payslip.breakdown` column for full auditability.

### `services/guardian_validator.py` — Anomaly Engine
Runs three pre-confirmation checks against every employee in a payrun:

| Check | Trigger |
|---|---|
| Missing bank account | `employee.bank_account` is empty |
| Concurrent contracts | More than 1 contract in `running` state |
| Duplicate payslip | More than 1 payslip for same employee + payrun |

Returns a structured list of warnings surfaced in the frontend `GuardianWarningBanner` before the payrun is confirmed.

### `services/pdf_generator.py` — PDF Renderer
Renders a Jinja2 HTML template (`templates/payslip.html`) to PDF bytes via WeasyPrint. The breakdown dict is injected directly into the template context.

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/v1/employees` | List all employees |
| `POST` | `/api/v1/payruns/wizard` | Create payrun (Step 1 scope) |
| `POST` | `/api/v1/payruns/{id}/compute` | Run salary rule engine |
| `GET` | `/api/v1/payruns/{id}/validate` | Run Guardian anomaly checks |
| `POST` | `/api/v1/payruns/{id}/confirm` | Confirm payrun |
| `GET` | `/api/v1/reports/dashboard` | Aggregated analytics (`?dept=` `?period=`) |
