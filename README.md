# PeoplePay360 — Team Development & Run Guide
### Odoo Hackathon 2026 · HR & Payroll Operations Platform

> **Internal Team Guide for Local Setup, Database Seeding, Dev Servers & Testing.**

---

## ⚡ Quick Start: Running Dev Servers

Open two terminal tabs from the project root (`PeoplePay360-HR-Payroll`):

### Terminal 1: Backend (FastAPI)
```powershell
cd backend

# (Optional) Activate your virtual environment if configured:
# .\venv\Scripts\activate

# Install dependencies if anything changed:
pip install -r requirements.txt

# Start FastAPI server with live reload:
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
> 💡 **Auto-Seeding**: The backend automatically seeds the database on startup with **200 employees, 600 payslips, contracts, attendance, and leave balances** if fewer than 10 employees exist.

---

### Terminal 2: Frontend (React + Vite)
```powershell
cd frontend

# Install packages if new dependencies were pulled:
npm install

# Start Vite dev server:
npm run dev
```
> App runs at **`http://localhost:5173`** and automatically proxies `/api/*` calls to FastAPI on `http://127.0.0.1:8000`.

---

## 🌐 Local Endpoints & URLs

| Component | URL | Notes |
|---|---|---|
| **Web Application** | [http://localhost:5173](http://localhost:5173) | Main UI with 200-employee persona switcher |
| **Interactive API Docs** | [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) | Swagger UI for testing all REST endpoints |
| **ReDoc Specification** | [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc) | Alternative API documentation format |
| **API Base URL** | `http://127.0.0.1:8000/api/v1` | All domain endpoints use `/api/v1/*` |

```bash
# Backend Pytest Suite (18 tests)
cd backend
python -m pytest -v

## 💾 Database & 200-Record Seeder

The persistent SQLite database is located at `backend/peoplepay360.db` (auto-resolved using absolute paths, so it never resets across server restarts or different working directories).

### Seeder Commands:
```powershell
cd backend

# Normal run (checks if 200 entries exist; if yes, skips to preserve state):
python seed.py

# Force reset (drops all tables, recreates schema, and seeds fresh 200 employees):
python seed.py --force
```

### What is Populated in the Database:
- **200 Employees**: Realistic Indian names across 8 departments (Engineering, HR, Sales, Marketing, Finance, Operations, Legal, Product).
- **200 Contracts**: Salary structures (Basic, HRA, Standard Allowances, PF, Professional Tax).
- **600+ Payslips**: Pre-computed across 3 historical payrun batches (draft, confirmed, paid).
- **Attendance Records**: Realistic check-in/out stamps with normal, late, and half-day status.
- **Leave Balances & Requests**: Paid, Sick, and Casual leave allocations with approval workflows.

---

## 🎯 Key Features & How to Test Them

### 1. 200-Employee Persona Switcher
- In the top navbar or the **Employees** table, click on the **Persona Switcher** dropdown.
- Select any employee out of the 200 records to instantly simulate that person's view, leave balances, attendance logs, and personal payslips.

### 2. Time Off Route (`/time-off`)
- Access via the **Time Off** tab in the navbar or `/time-off`.
- View personal leave balances, submit leave requests with dynamic day count calculations, and approve/reject requests as an HR Admin.

### 3. Dynamic Payslip PDF Generation
- In **Payruns** or **Employee Detail**, click **Download PDF** on any payslip.
- Generates a PDF-1.4 document using ReportLab featuring:
  - Official Odoo header logo
  - Dynamic employee info, bank account, and job position
  - Itemized Earnings & Deductions breakdown table
  - Prominent Net Payable highlight block
  - Dual signature authorization blocks (Employee & Authorized HR)

### 4. 2-Step Payrun Processing Wizard
- Navigate to **Payrun Processing**.
- Step 1: Select pay period and payrun scope.
- Step 2: Auto-pull eligible employees, batch compute gross/deductions/net pay, run Guardian anomaly checks, and generate bulk payslips.

---

## 👥 Team Responsibilities & Key Files

| Teammate | Focus Area | Primary Files |
|---|---|---|
| **Jagdeep** *(Lead)* | FastAPI ORM Models, Routers, Salary Calculation Engine | `backend/models/`, `backend/routers/`, `backend/services/salary_engine.py` |
| **Lucky** | React UI, Pages, Smart Buttons, Persona Switcher, Styling & Layout | `frontend/src/pages/`, `frontend/src/components/`, `frontend/src/context/AuthContext.jsx` |
| **Tanya** | ReportLab PDF Payslip Generation, Guardian Validator, 200-Record Seeder | `backend/services/pdf_generator.py`, `backend/services/guardian_validator.py`, `backend/seed.py` |
| **Niharika** | Analytics Dashboard, Recharts Charts, Payslip Modal Breakdown | `frontend/src/pages/Dashboard.jsx`, `frontend/src/components/PayslipDetailModal.jsx` |

---

## 🌿 Git Workflow for the Team

1. **Before starting work**, pull latest updates:
   ```bash
   git checkout main
   git pull origin main
   ```
2. **Work on your feature branch** (e.g. `lucky`, `dev-jagdeep`):
   ```bash
   git checkout -b your-branch-name
   ```
3. **Commit with clean folder-prefixed messages**:
   ```bash
   git add backend/
   git commit -m "backend(routers): ..."
   git add frontend/
   git commit -m "frontend(components): ..."
   ```
4. **Push your branch & merge into `main`**:
   ```bash
   git push origin your-branch-name
   ```
   Open a Pull Request on GitHub or merge locally into `main` after verifying dev servers build cleanly.

---

## 🛠️ Common Troubleshooting

- **Port 8000 already in use**:
  ```powershell
  Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process -Force
  ```
- **Port 5173 already in use**:
  ```powershell
  Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process -Force
  ```
- **Frontend can't reach backend**:
  Ensure the backend is running on `127.0.0.1:8000`. The Vite proxy redirects `/api` requests to `http://127.0.0.1:8000`.
