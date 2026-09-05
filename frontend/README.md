# PeoplePay360 — Frontend

**React 18 + Vite + Tailwind CSS + TanStack Query**

---

## Quickstart

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev
```

App runs at `http://localhost:5173`
All `/api/*` requests are proxied to `http://localhost:8000` via Vite's dev proxy.

```bash
# Production build
npm run build
npm run preview
```

---

## Project Layout

```
src/
├── main.jsx              # ReactDOM root, QueryClient, BrowserRouter
├── App.jsx               # Route definitions
├── index.css             # Tailwind directives
│
├── api/                  # Axios client + per-domain API calls
│   ├── client.js         # Base axios instance (baseURL, interceptors)
│   ├── employees.js
│   ├── payruns.js
│   └── dashboard.js
│
├── components/           # Reusable, stateless UI building blocks
│   ├── Layout.jsx        # Sidebar + Navbar shell with <Outlet />
│   ├── Sidebar.jsx       # Nav links with Lucide icons
│   ├── Navbar.jsx        # Top bar
│   ├── SmartButtons.jsx  # Employee → Contracts / Attendance / Leave links
│   ├── GuardianWarningBanner.jsx  # Renders Guardian anomaly warnings
│   └── PayrunWizardModal.jsx      # 2-step payrun creation modal
│
└── pages/                # Full route views (one file per route)
    ├── Dashboard.jsx       # Live analytics with Recharts bar chart
    ├── Employees.jsx       # Employee list table
    ├── EmployeeDetail.jsx  # Single employee with SmartButtons
    ├── Contracts.jsx
    ├── Attendance.jsx
    ├── TimeOff.jsx
    ├── Payruns.jsx         # Payrun list + wizard trigger
    └── PayrunProcessing.jsx  # Compute → Validate → Confirm flow
```

---

## Architecture Decisions

- **Pages vs Components** — Pages own data fetching via `useQuery`/`useMutation`. Components are pure presentational and receive props only.
- **API layer** — All HTTP calls live in `src/api/`. Pages never call `axios` directly, keeping fetch logic swappable.
- **TanStack Query** — Cache keys are domain-scoped (`['employees']`, `['payruns']`). Mutations call `invalidateQueries` to keep lists fresh without manual state.
- **Vite proxy** — `/api` is proxied to the backend in dev, so no CORS issues and no hardcoded ports in component code.
