# PeoplePay360 — HR & Payroll Operations Platform

> **Enterprise-grade, Odoo-styled Human Resource & Payroll Management platform with 5-Tier RBAC, Intelligent Payroll Guardian, 2-Step Payrun Wizard, Streamed PDF Payslips, and Real-Time Analytics.**

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Version](https://img.shields.io/badge/version-v2.0.0-blue)
![Backend](https://img.shields.io/badge/FastAPI-0.111.0-009688)
![Frontend](https://img.shields.io/badge/React-18.x%20%7C%20Vite-61DAFB)
![Database](https://img.shields.io/badge/PostgreSQL%20%2F%20SQLite-4169E1)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 📑 Table of Contents
1. [System Architecture](#system-architecture)
2. [Key Capabilities & Features](#key-capabilities--features)
3. [5-Tier Role-Based Access Control (RBAC)](#5-tier-role-based-access-control-rbac)
4. [Monorepo Directory Structure](#monorepo-directory-structure)
5. [Quick Start (Local Development)](#quick-start-local-development)
6. [Testing & Verification](#testing--verification)
7. [Production Deployment Guide](#production-deployment-guide)
8. [Documentation Index](#documentation-index)

---

## 1. System Architecture

PeoplePay360 is built as a decoupled full-stack architecture with production support for **Render (FastAPI Backend & PostgreSQL)** and **Netlify (React 18 SPA)**.

```
+-----------------------------------------------------------------------------------+
|                                 REACT 18 FRONTEND SPA                             |
|       Vite · Tailwind CSS · TanStack Query · Lucide Icons · Recharts              |
|       Routes: /dashboard, /employees, /contracts, /attendance, /leaves, /payruns  |
+------------------------------------+----------------------------------------------+
                                     |
                                     | REST API (Bearer JWT Auth)
                                     v
+-----------------------------------------------------------------------------------+
|                                 FASTAPI BACKEND                                   |
|       Python 3.10+ · SQLAlchemy 2.0 ORM · Pydantic v2 · Uvicorn                   |
|       Routers: /auth, /users, /employees, /contracts, /attendance, /leaves, /payruns|
+------------------------------------+----------------------------------------------+
                                     |
         +---------------------------+---------------------------+
         |                           |                           |
         v                           v                           v
+------------------+       +-------------------+       +--------------------+
|  PAYROLL ENGINE  |       | GUARDIAN ENGINE   |       | PDF/EMAIL ENGINE   |
|  Itemized Rules  |       | Anomaly Detection |       | Jinja2 Templates   |
|  Idempotent Batch|       | Pre-Validation    |       | ReportLab Stream   |
+------------------+       +-------------------+       +--------------------+
```

---

## 2. Key Capabilities & Features

- **Unified Employee Master**: Searchable Kanban and Data Table views with **SmartButtons** linking directly to pre-filtered Contracts, Attendance, and Leave logs.
- **Period-Aware Contract Matching**: Payrun engine dynamically identifies active contracts overlapping the specific period bounds (`date_start <= period_end AND (date_end >= period_start OR date_end IS NULL)`).
- **2-Step Payrun Creation Wizard**:
  - *Step 1*: Define batch scope, period start/end, salary structure, and payment date.
  - *Step 2*: Filter eligible employees and launch batch creation in `DRAFT` status.
- **Payrun Compute Idempotency**: Running `POST /payruns/{id}/compute` multiple times safely recalculates without duplicating payslip records.
- **Payroll Guardian Anomaly Engine**: Pre-validation warnings for missing employee bank details, overlapping contracts, attendance gaps, or negative net calculations.
- **Streamed PDF Payslips**: Direct **"Print PDF"** binary download powered by Jinja2 HTML templates and ReportLab native rendering.
- **Real-Time Analytics Dashboard**: Real-time KPI summary cards and dynamic Recharts (Department Salary Distribution, Monthly Trends Area Chart, Net Salary Share).
- **Zero-404 Navigation**: Client-side alias routing (`/reports`, `/payroll`, `/timeoff`) with Netlify SPA redirect rules.

---

## 3. 5-Tier Role-Based Access Control (RBAC)

The system enforces permissions strictly on the backend across 5 distinct user roles:

| Role | Description | Permissions |
|---|---|---|
| **ADMIN** | Super Administrator | Full CRUD on all modules, users, contracts, salary rules, and payruns. |
| **HR_PAYROLL_MANAGER** | Payroll Lead / Manager | Full payroll execution, salary structure editing, leave approvals, contract creation. |
| **HR_PAYROLL_USER** | Payroll Specialist / Officer | Read/Write access to payruns, contracts, and attendance; cannot delete payruns or edit structures. |
| **HR_MANAGER** | People & Talent Lead | Full employee and contract management, attendance/leave approvals; restricted from payroll compute. |
| **EMPLOYEE** | Individual Staff Member | Self-service portal: view personal profile, check-in/out attendance, submit leaves, download personal payslips. |

---

## 4. Monorepo Directory Structure

```
peoplepay360/
├── README.md                   # Primary project overview & documentation hub
├── DEPLOYMENT.md               # Netlify, Render, and PostgreSQL deployment guide
├── SECURITY.md                 # Security policies, RBAC matrix, and JWT lifecycle
├── TESTING.md                  # Test suites, regression checklists, and QA guides
├── render.yaml                 # Render Blueprint configuration for automated deployment
├── .env.example                # Full-stack environment template
│
├── backend/                    # FastAPI 2.0 Backend Service
│   ├── main.py                 # Application factory, lifespan, CORS, and health check
│   ├── config.py               # Pydantic BaseSettings environment manager
│   ├── database.py             # SQLAlchemy 2.0 engine & connection pooler
│   ├── auth.py                 # JWT generation, bcrypt verification & RBAC dependencies
│   ├── seed.py                 # Demo database seeder
│   ├── models/                 # SQLAlchemy ORM models
│   ├── schemas/                # Pydantic request/response validation schemas
│   ├── routers/                # Modular API endpoints
│   ├── services/               # Core business logic (Salary Engine, Guardian, PDF)
│   ├── templates/              # Jinja2 HTML templates for payslips
│   ├── tests/                  # Pytest unit and integration test suites
│   └── requirements.txt        # Backend dependencies (FastAPI, SQLAlchemy, ReportLab, etc.)
│
└── frontend/                   # React 18 + Vite SPA
    ├── netlify.toml            # Netlify build and SPA redirect configuration
    ├── vite.config.js          # Vite configuration & dev proxy
    ├── public/
    │   └── _redirects          # Netlify SPA fallback rule (/* -> /index.html 200)
    └── src/
        ├── api/                # Centralized Axios API service layer
        ├── context/            # AuthContext & Persona role switcher
        ├── components/         # Reusable UI components & modals
        └── pages/              # Top-level page views
```

---

## 5. Quick Start (Local Development)

### Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate     # Windows
source venv/bin/activate  # Linux / macOS

# Install dependencies
pip install -r requirements.txt

# Populate demo data
python seed.py

# Start FastAPI dev server
uvicorn main:app --reload --port 8000
```
Backend runs at `http://127.0.0.1:8000` (Interactive API Docs: `http://127.0.0.1:8000/docs`).

### Frontend Setup
```bash
cd frontend

# Install packages
npm install

# Start Vite development server
npm run dev
```
Frontend runs at `http://localhost:5173`.

---

## 6. Testing & Verification

Execute the complete test suites to verify backend integrity and frontend bundle compilation:

```bash
# Backend Pytest Suite (18 tests)
cd backend
python -m pytest -v

# Frontend Production Build (Zero errors)
cd frontend
npm run build
```

---

## 7. Production Deployment Guide

For detailed step-by-step instructions on deploying the full stack to production, refer to [`DEPLOYMENT.md`](file:///d:/Hackathon/OdooHacFinal/Peoplepay360/DEPLOYMENT.md).

- **Frontend Target**: [Netlify](https://app.netlify.com/) (React SPA + `dist/` build output)
- **Backend Target**: [Render](https://dashboard.render.com/) (FastAPI service via `render.yaml`)
- **Database Target**: Managed PostgreSQL on Render / Supabase / Neon

---

## 8. Documentation Index

- 📘 [Backend Architecture & API Reference](file:///d:/Hackathon/OdooHacFinal/Peoplepay360/backend/README.md)
- ⚛️ [Frontend Architecture & Component Guide](file:///d:/Hackathon/OdooHacFinal/Peoplepay360/frontend/README.md)
- 🚀 [Production Deployment Guide (Netlify / Render / PostgreSQL)](file:///d:/Hackathon/OdooHacFinal/Peoplepay360/DEPLOYMENT.md)
- 🔒 [Security Policy & RBAC Matrix](file:///d:/Hackathon/OdooHacFinal/Peoplepay360/SECURITY.md)
- 🧪 [Testing Guide & QA Verification Checklist](file:///d:/Hackathon/OdooHacFinal/Peoplepay360/TESTING.md)

---

<div align="center">
  <strong>PeoplePay360 HR & Payroll Platform · Production Ready v2.0.0</strong>
</div>
