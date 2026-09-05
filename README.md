# PeoplePay360
### HR & Payroll Operations Platform

> **Unifying Master HR Data, Time Tracking, and Automated Payroll Calculations into One Connected Flow.**

![Build Status](https://img.shields.io/badge/build-passing-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue) ![Tech Stack](https://img.shields.io/badge/stack-Odoo%20%7C%20Python%20%7C%20PostgreSQL-blueviolet) ![Version](https://img.shields.io/badge/version-v1.0.0-orange) ![Hackathon](https://img.shields.io/badge/hackathon-entry-gold)

---

## The Problem

Traditional HR tools trap employee details, attendance, leave, and salary data in isolated silos. Real operational teams need historical contract validity, automated schedule integration, rule-based payrun engines, and real-time dashboard analytics working **in harmony** — not across five disconnected spreadsheets.

**PeoplePay360** solves this by delivering a single, end-to-end platform where every HR event — from a new hire to a final payslip — flows through one connected, validated pipeline.

---

## System Architecture & Key Capabilities

### 1. Unified HR Hub
- Centralized employee profiles with **smart action buttons** linking directly to active Contracts, Attendance records, and Leave balances.
- Single source of truth for all downstream payroll and reporting operations.

### 2. Period-Aware Contract Engine
- Payroll execution is **locked to the active, period-specific contract** — no stale or overlapping contract data bleeds into a payrun.
- Full contract history is preserved for audit trails without polluting live computations.

### 3. Attendance & Time Off Operations
- Flexible work schedule assignment per employee or department.
- Exception handling for late arrivals and missing check-outs with configurable grace rules.
- Leave allocation tracking with **automatic balance deductions** triggered on manager approval.

### 4. 2-Step Payrun Wizard & Rule Execution
- **Step 1 — Scope Selection:** Define payroll period, company, and department scope.
- **Step 2 — Employee Filtering:** Auto-populate eligible employees based on active contracts within the selected period.
- **Sequential Salary Rule Evaluation:** `Basic Pay → Allowances → Gross → Deductions → Net Pay`

### 5. Automated Validation & Warning Flags
Pre-computation checks surface actionable warnings before a payrun is confirmed:
- Missing bank account information
- Concurrent / overlapping active contracts
- Duplicate payslip detection for the same period

### 6. Delivery & Live Analytics
- Dynamic **PDF payslip generation** with itemized salary rule breakdown.
- **Bulk email distribution** to employees directly from the payrun record.
- Live aggregation dashboards with **Department** and **Period** filters for real-time payroll insights.

---

## Data Flow / Pipeline Architecture

```
┌─────────────────────┐
│  Employee Master     │  ← Profiles, Roles, Departments
│  Data               │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Contracts &         │  ← Period-bound, Schedule-linked
│  Schedules          │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Attendance &        │  ← Check-ins, Exceptions, Leave Allocations
│  Leave              │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Payrun Creation     │  ← 2-Step Wizard: Scope → Employee Filter
│  Wizard             │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Salary Rule         │  ← Basic → Allowances → Gross → Deductions → Net
│  Computation        │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Warnings &          │  ← Bank Info / Duplicate / Concurrent Contract Checks
│  Validation         │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  PDF / Email         │  ← Payslip Generation & Bulk Distribution
│  Delivery           │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Live Dashboard      │  ← Aggregated Analytics by Dept & Period
│  Aggregation        │
└─────────────────────┘
```

---

## Role-Based Access Control (RBAC)

| Capability                        | Admin | HR Payroll Manager | HR Payroll User | HR Manager | Employee |
|-----------------------------------|:-----:|:------------------:|:---------------:|:----------:|:--------:|
| Manage Employee Profiles          | ✅    | ✅                 | ✅              | ✅         | ❌       |
| Create / Edit Contracts           | ✅    | ✅                 | ❌              | ✅         | ❌       |
| View Own Contract                 | ✅    | ✅                 | ✅              | ✅         | ✅       |
| Manage Work Schedules             | ✅    | ✅                 | ❌              | ✅         | ❌       |
| Approve / Reject Leave Requests   | ✅    | ✅                 | ❌              | ✅         | ❌       |
| Submit Leave Requests             | ✅    | ✅                 | ✅              | ✅         | ✅       |
| Run Payrun Wizard                 | ✅    | ✅                 | ❌              | ❌         | ❌       |
| Compute & Confirm Payruns         | ✅    | ✅                 | ❌              | ❌         | ❌       |
| View Payslip Breakdown            | ✅    | ✅                 | ✅              | ❌         | ✅ (own) |
| Generate & Send PDF Payslips      | ✅    | ✅                 | ❌              | ❌         | ❌       |
| View Live Analytics Dashboard     | ✅    | ✅                 | ✅              | ✅         | ❌       |
| Manage Salary Rules               | ✅    | ✅                 | ❌              | ❌         | ❌       |
| Configure RBAC / User Roles       | ✅    | ❌                 | ❌              | ❌         | ❌       |

---

## Local Setup & Installation

### Prerequisites
- Python 3.10+
- PostgreSQL 14+
- Node.js 18+ (for frontend tooling / seed scripts)
- Odoo 16 or 17 Community / Enterprise

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/peoplepay360.git
cd peoplepay360
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your local values:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=peoplepay360
DB_USER=odoo
DB_PASSWORD=your_password

ODOO_ADMIN_PASSWD=admin
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=your_email@domain.com
SMTP_PASSWORD=your_smtp_password

PDF_STORAGE_PATH=./storage/payslips
```

### 3. Backend Setup

```bash
# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt
```

### 4. Frontend Setup

```bash
cd frontend
npm install
npm run build
```

### 5. Database Migrations

```bash
# Initialize the Odoo database with the PeoplePay360 modules
python odoo-bin -d peoplepay360 -i peoplepay360_hr,peoplepay360_payroll --stop-after-init
```

### 6. Seed Demo Data

```bash
npm run seed
```

> This populates the database with demo employees, contracts, schedules, leave allocations, and a sample payrun for immediate evaluation.

### 7. Start the Server

```bash
python odoo-bin -d peoplepay360 --http-port=8069
```

Navigate to `http://localhost:8069` and log in with `admin / admin`.

---

## API Reference

| Method | Endpoint                          | Description                                              |
|--------|-----------------------------------|----------------------------------------------------------|
| `POST` | `/api/v1/payruns/wizard`          | Initialize a new payrun — accepts period, scope, and department filters |
| `POST` | `/api/v1/payruns/:id/compute`     | Trigger sequential salary rule computation for a confirmed payrun |
| `GET`  | `/api/v1/reports/dashboard`       | Fetch aggregated payroll analytics; supports `?dept=` and `?period=` query params |
| `POST` | `/api/v1/time-off/approve`        | Approve a pending leave request and trigger automatic balance deduction |

**Example — Initialize Payrun Wizard:**

```json
POST /api/v1/payruns/wizard
{
  "period_start": "2025-07-01",
  "period_end": "2025-07-31",
  "department_id": 4,
  "company_id": 1
}
```

---

## Hackathon Demo Walkthrough (5-Min Guide)

### Flow 1 — Employee Lifecycle & Leave Management

- **Step 1:** Navigate to **Employees → New** and create a profile with department, job position, and work schedule.
- **Step 2:** Open the employee record → click the **Contracts** smart button → create a new contract with a defined start date, wage, and salary structure. Set status to **Running**.
- **Step 3:** Go to **Time Off → New Request** for the employee. Select leave type, dates, and submit.
- **Step 4:** As HR Manager, navigate to **Time Off → Managers → All Time Off** → approve the request.
- **Step 5:** Verify the employee's leave **allocation balance is automatically decremented** on the Leave Analysis report.

### Flow 2 — Payrun Execution & Payslip Delivery

- **Step 1:** Navigate to **Payroll → Payrun Wizard** → select the July 2025 period and target department.
- **Step 2:** Review the auto-populated employee list (only employees with active contracts in-period are included).
- **Step 3:** Click **Compute** — observe sequential rule evaluation: `Basic → Allowances → Gross → Deductions → Net`.
- **Step 4:** Review the **Warnings panel** — resolve any flagged missing bank accounts or duplicate payslip alerts.
- **Step 5:** Click **Confirm Payrun** → **Generate PDFs** → **Send by Email** to distribute payslips in bulk.
- **Step 6:** Open the **Analytics Dashboard** → filter by Department and Period to view live aggregated payroll totals.

---

## Project Structure

```
peoplepay360/
├── addons/
│   ├── peoplepay360_hr/          # Employee, Contract, Schedule modules
│   └── peoplepay360_payroll/     # Payrun Wizard, Salary Rules, PDF & Email
├── frontend/
│   ├── src/
│   │   ├── views/                # Kanban, Form, List views
│   │   └── components/           # Dashboard, Payslip Breakdown
│   └── package.json
├── scripts/
│   └── seed.js                   # Demo data seeder
├── .env.example
├── requirements.txt
└── README.md
```

---

## Tech Stack

| Layer        | Technology                        |
|--------------|-----------------------------------|
| Backend      | Python 3.10, Odoo 17 ORM          |
| Database     | PostgreSQL 14                     |
| Frontend     | Odoo QWeb, OWL (Odoo Web Library) |
| PDF Engine   | ReportLab / Odoo Report Engine    |
| Email        | SMTP via Odoo Mail Module         |
| Auth & RBAC  | Odoo Groups & Record Rules        |
| Dev Tooling  | Node.js 18, npm                   |

---

## Team

| Name         | Role                                                                 |
|--------------|----------------------------------------------------------------------|
| **Jagdeep** *(Leader)* | Project Lead · Git Management · DB Architecture · Salary Rule Engine |
| **Tanya**    | Backend Engineering · API Development · PDF & Email Services         |
| **Lucky**    | Frontend Engineering · HR Modules · Kanban & Form Views              |
| **Niharika** | Frontend Engineering · Payroll Wizard · Payslip Breakdown & Analytics Dashboard |

---

## License

This project is licensed under the **MIT License**. See [LICENSE](./LICENSE) for details.

---

<div align="center">
  <strong>Built with ❤️ for the Hackathon · PeoplePay360 v1.0.0</strong>
</div>
