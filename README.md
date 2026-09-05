# PeoplePay360
### HR & Payroll Operations Platform

> **Unifying Master HR Data, Time Tracking, and Automated Payroll Calculations into One Connected Flow.**

![Build Status](https://img.shields.io/badge/build-passing-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue) ![Stack](https://img.shields.io/badge/stack-FastAPI%20%7C%20React%20%7C%20PostgreSQL-blueviolet) ![Version](https://img.shields.io/badge/version-v1.0.0-orange) ![Hackathon](https://img.shields.io/badge/hackathon-entry-gold)

---

## Architecture — Option C: FastAPI + React

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│   Vite · TanStack Query · Tailwind · Recharts · Lucide  │
│   http://localhost:5173                                  │
└──────────────────────┬──────────────────────────────────┘
                       │  /api/v1/*  (Vite proxy)
┌──────────────────────▼──────────────────────────────────┐
│                   FastAPI Backend                        │
│   Python 3.11 · SQLAlchemy ORM · Pydantic v2            │
│   http://localhost:8000  ·  Swagger: /docs               │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              PostgreSQL / SQLite (dev)                   │
└─────────────────────────────────────────────────────────┘
```

---

## Operational Requirements

| Capability | Implementation |
|---|---|
| **Unified Employee Hub** | Employee profiles with SmartButtons linking to Contracts, Attendance, and Leave |
| **Period-Aware Contract Selection** | Payrun compute queries only `state=running` contracts; period filters applied at DB level |
| **Attendance & Leave Tracking** | Check-in/out logging; leave submit → manager approve → balance deduction |
| **Salary Rule Execution** | `salary_engine.py` evaluates: Basic → Allowances → Gross → Deductions → Net |
| **2-Step Payrun Wizard** | Step 1: period + scope; Step 2: department filter → auto-populate eligible employees |
| **Guardian Anomaly Alerts** | `guardian_validator.py` checks: missing bank account, concurrent contracts, duplicate payslips |
| **Live Analytics Dashboard** | Recharts bar chart aggregated by department; `?dept=` and `?period=` query filters |
| **PDF Payslip Generation** | Jinja2 HTML → WeasyPrint PDF bytes; itemised breakdown from salary engine |

---

## Monorepo Structure

```
peoplepay360/
├── README.md                  ← You are here
├── backend/
│   ├── main.py                # FastAPI app entry point
│   ├── config.py              # Environment settings
│   ├── database.py            # SQLAlchemy engine & session
│   ├── seed.py                # Demo data seeder
│   ├── models/                # ORM: Employee, Contract, Attendance, Leave, Payroll
│   ├── schemas/               # Pydantic validation schemas
│   ├── routers/               # Route handlers per domain
│   ├── services/
│   │   ├── salary_engine.py   # Rule sequencing engine
│   │   ├── guardian_validator.py  # Anomaly detector
│   │   └── pdf_generator.py   # Payslip PDF renderer
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── api/               # Axios client + domain API calls
    │   ├── components/        # Layout, Sidebar, SmartButtons, Wizard, Warnings
    │   └── pages/             # Dashboard, Employees, Payruns, Processing
    ├── package.json
    └── vite.config.js
```

---

## Quick Start

```bash
# Backend
cd backend
python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
python seed.py
uvicorn main:app --reload

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

| Service | URL |
|---|---|
| React App | http://localhost:5173 |
| FastAPI | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |

---

## Team Task Delegation Matrix

| Teammate | Ownership | Key Files |
|---|---|---|
| **Jagdeep** *(Lead)* | FastAPI ORM Models · Routers · Salary Calculation Engine | `models/` · `routers/` · `services/salary_engine.py` |
| **Lucky** | React Frontend UI · Pages · Smart Buttons · Wizard Modal | `pages/` · `components/SmartButtons.jsx` · `components/PayrunWizardModal.jsx` |
| **Tanya** | Payroll Guardian Engine · PDF Generation · Email Dispatcher · Seed Data | `services/guardian_validator.py` · `services/pdf_generator.py` · `seed.py` |
| **Niharika** | Analytics Dashboard · Payslip Breakdown View · Recharts Integration | `pages/Dashboard.jsx` · `pages/PayrunProcessing.jsx` · `api/dashboard.js` |

---

## Data Flow

```
Employee Master  →  Contracts & Schedules  →  Attendance & Leave
       │
       ▼
Payrun Wizard (2-Step: Scope → Employee Filter)
       │
       ▼
Salary Rule Engine  →  Basic → Allowances → Gross → Deductions → Net
       │
       ▼
Guardian Validator  →  Bank / Duplicate / Concurrent Contract Checks
       │
       ▼
PDF Generation & Email Delivery  →  Live Dashboard Aggregation
```

---

## License

MIT License — see [LICENSE](./LICENSE) for details.

---

<div align="center">
  <strong>Built with ❤️ for the Hackathon · PeoplePay360 v1.0.0</strong>
</div>
