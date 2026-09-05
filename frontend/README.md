# PeoplePay360 — Frontend

**React 18 + Vite + Tailwind CSS + TanStack React Query + Lucide Icons + Recharts**

---

## Overview

**PeoplePay360 Frontend** is an enterprise-grade, Odoo-styled Human Resource & Payroll Management single-page application (SPA). Designed with modern aesthetics, zero-404 navigation, dynamic 5-tier Role-Based Access Control (RBAC), real-time Analytics Dashboards, and smart inline workflows (SmartButtons, Guardian Warnings, 2-Step Payrun Setup, Payslip PDF Viewer/Email Engine).

---

## Quickstart

### Prerequisites
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher

### Installation & Run

```bash
# 1. Navigate to frontend directory
cd Peoplepay360/frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

App runs at `http://localhost:5173`.  
All API calls targeting `/api/v1/*` are transparently proxied to `http://localhost:8000` via Vite's dev server proxy (`vite.config.js`), avoiding CORS issues during development.

### Production Build & Preview

```bash
# Build bundle for production
npm run build

# Preview production build locally
npm run preview
```

---

## Directory Structure

```
frontend/
├── index.html                  # HTML entry point & font loading
├── vite.config.js              # Vite config, alias definitions, API dev proxy
├── postcss.config.js           # PostCSS configuration with Tailwind CSS & Autoprefixer
├── tailwind.config.js          # Custom theme colors, animation utilities, glassmorphism
├── package.json                # React 18, TanStack Query, Recharts, Lucide dependencies
│
└── src/
    ├── main.jsx                # React root, QueryClient, BrowserRouter initialization
    ├── App.jsx                 # Central route tree, fallback 404 handler & route aliases
    ├── index.css               # Tailwind CSS directives, font imports, scrollbar styling
    │
    ├── api/                    # Centralized API service layer
    │   ├── client.js           # Axios instance with auth headers & error interceptors
    │   ├── auth.js             # Login, current user fetch, persona switching
    │   ├── employees.js        # Employee CRUD, SmartButton metrics API
    │   ├── contracts.js        # Salary structure & employment contracts API
    │   ├── attendance.js       # Check-in/out, logs, correction approvals
    │   ├── leaves.js           # Leave allocations, requests, manager approvals
    │   ├── payruns.js          # Payrun wizard, compute batch, validation warnings, payslips
    │   └── dashboard.js        # Analytics KPI metrics & visual trends data
    │
    ├── context/
    │   └── AuthContext.jsx     # Persona switcher (Super Admin, HR Manager, Officer, Auditor, Employee)
    │
    ├── components/             # Reusable UI components & modals
    │   ├── Layout.jsx          # App shell header navbar & dynamic content container
    │   ├── Navbar.jsx          # Modern top bar with nav tabs, persona switcher, badge
    │   ├── SmartButtons.jsx    # Dynamic counts & direct links (Contracts, Attendance, Leaves)
    │   ├── GuardianWarningBanner.jsx # Real-time Payroll Guardian anomaly alert cards
    │   ├── PayrunWizardModal.jsx     # 2-step payrun setup modal (Config → Employee Scope)
    │   └── PayslipDetailModal.jsx    # Payslip breakdown modal with direct Print PDF action
    │
    └── pages/                  # Top-level route views
        ├── Dashboard.jsx       # Real-time analytics (KPIs, Salary Distribution, Net Trends)
        ├── Employees.jsx       # Employee Master (Kanban cards & Data Table toggle)
        ├── EmployeeDetail.jsx  # Employee profile form, salary history, & SmartButtons
        ├── Contracts.jsx       # Employment contracts list & modal editor
        ├── Attendance.jsx      # Check-in/Out tracker, worked hours, manager approvals
        ├── TimeOff.jsx         # Leave allocations, request submission, approve/refuse
        ├── Payruns.jsx         # Payruns overview list + batch wizard launcher
        └── PayrunProcessing.jsx # Payrun lifecycle bar (Compute → Validate → Mark Paid)
```

---

## Core Features & Workflow Integrations

### 1. Persona Switcher & 5-Tier RBAC UI Controls
The top navigation bar features a **Persona Role Switcher** allowing instant live testing across all 5 user roles without logging out:
- **Super Admin / HR Manager**: Full read/write/delete access across all modules, payrun execution, leave/attendance approvals.
- **Payroll Officer**: Full contract, attendance, payrun compute, and payslip execution rights.
- **Auditor**: Read-only compliance view; all action buttons (Compute, Validate, Approve) are gracefully disabled.
- **Employee**: Scoped access to personal profile, attendance check-in, leave requests, and personal payslips.

### 2. Employee Master & SmartButtons Navigation
- Dual view switcher (Kanban cards with avatars vs. searchable Data Table).
- **SmartButtons integration**: Displays live counts for related records (`Contracts (1)`, `Attendance (4)`, `Leaves (2)`).
- Clicking any SmartButton navigates directly to the filtered view for that specific employee.

### 3. 2-Step Payrun Wizard Modal
- **Step 1**: Set Payrun Name, Period (`YYYY-MM-DD` start/end), Structure, and Payment Date.
- **Step 2**: Search and filter eligible active employees, multi-select targets, and launch batch creation in `DRAFT` state.

### 4. Payroll Guardian Anomaly Alert Banner
- Real-time pre-validation alerts rendered at the top of the Payrun Processing screen:
  - Missing IBAN / Bank Details
  - Overlapping Active Contracts
  - Unapproved Leave / Attendance Discrepancies
  - Zero / Negative Net Salary Calculations

### 5. Live Payslip PDF Preview & Download
- Interactive Payslip Detail modal showing line-by-line itemized salary rules (BASIC, DA, HRA, PF, ESI, TDS, NET).
- Direct **"Print PDF"** button triggering instant stream downloading of backend-rendered Jinja2/ReportLab PDF payslips (`GET /payruns/payslips/{id}/pdf`).

### 6. Analytics Dashboard with Live Filters
- Real-time KPI Cards: **Total Net Salary Paid**, **Payslips Generated**, **Average Salary**, **Approved Time Off Days**, **Attendance Health %**.
- Visual Recharts:
  - Department Salary Distribution (Bar Chart)
  - Monthly Net Salary Trends (Area Chart with Gradient Fill)
  - Department Net Share (Pie Chart with Legend)
- Live Period (`YYYY-MM`) and Department Filter Selectors.

---

## Client Route Mapping & Zero-404 Fallbacks

| Path | Component | Alias Routes (Zero-404) | Description |
|---|---|---|---|
| `/` | `Dashboard` | `/dashboard`, `/reports`, `/analytics` | Live HR & Payroll Analytics |
| `/employees` | `Employees` | `/staff` | Employee Kanban & Data Table |
| `/employees/:id` | `EmployeeDetail` | — | Unified Employee Form & SmartButtons |
| `/contracts` | `Contracts` | `/salary-structures` | Contracts & Wage Configurations |
| `/attendance` | `Attendance` | `/timeoff` | Attendance Check-in/Out & Log Approval |
| `/leaves` | `TimeOff` | `/time-off` | Leave Allocations & Requests |
| `/payruns` | `Payruns` | `/payroll` | Payrun Batch Overview List |
| `/payruns/:id` | `PayrunProcessing` | — | Action Bar (Compute, Validate, Mark Paid, Payslips) |
| `*` | Fallback | Redirects to `/` | Prevents dead 404 pages |

---

## State Management & API Strategy

- **TanStack React Query**: Manages query caching, background re-validation, and optimistic loading states.
- **Cache Invalidation**: Mutations explicitly trigger `queryClient.invalidateQueries(...)` to guarantee fresh UI state without page reloads.
- **Axios Interceptors**: Handles bearer authentication header injection, global API error notifications, and standard JSON response unwrapping.

---

## Verification & Build Commands

```bash
# Verify ESLint & Code Formatting
npm run lint

# Compile production build
npm run build
```

Production build generates optimized assets in `frontend/dist/`.
