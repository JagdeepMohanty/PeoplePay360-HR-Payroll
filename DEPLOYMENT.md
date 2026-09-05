# PeoplePay360 — Production Deployment Guide

This guide details the step-by-step procedure for deploying **PeoplePay360** to production using **Render** (FastAPI Backend + PostgreSQL) and **Netlify** (React SPA Frontend).

---

## 1. System Architecture Overview

```
+-------------------------------------------------------------+
|                     NETLIFY (FRONTEND SPA)                  |
|     React 18 + Vite + Tailwind CSS + TanStack Query         |
|     Custom Domain: https://peoplepay360.netlify.app         |
+------------------------------+------------------------------+
                               |
                               | HTTPS / REST API / Bearer JWT
                               v
+-------------------------------------------------------------+
|                     RENDER (BACKEND SERVICE)                |
|     FastAPI + Uvicorn + SQLAlchemy + ReportLab Engine       |
|     URL: https://peoplepay360-backend.onrender.com          |
+------------------------------+------------------------------+
                               |
                               | Connection Pool (SSL)
                               v
+-------------------------------------------------------------+
|               RENDER MANAGED POSTGRESQL DATABASE            |
|     Database: peoplepay360 | User: peoplepay360_user        |
+-------------------------------------------------------------+
```

---

## 2. Backend & Database Deployment (Render)

### Option A: Automated Blueprint Deployment via `render.yaml`
1. Connect your GitHub repository to [Render](https://dashboard.render.com/).
2. In the Render Dashboard, click **New +** $\rightarrow$ **Blueprint**.
3. Select this repository. Render will automatically detect [`render.yaml`](file:///d:/Hackathon/OdooHacFinal/Peoplepay360/render.yaml) and configure:
   - A managed PostgreSQL database (`peoplepay360-db`)
   - A Python web service (`peoplepay360-backend`) with automated environment variable linking.

### Option B: Manual Service Creation
1. **Create PostgreSQL Database**:
   - Name: `peoplepay360-db`
   - Database: `peoplepay360`
   - User: `peoplepay360_user`
   - Region: Choose closest to your users.
   - Copy the **Internal Database URL**.

2. **Create Web Service**:
   - **Environment**: Python 3.10+
   - **Root Directory**: `Peoplepay360`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path**: `/api/health`

3. **Set Environment Variables**:
   | Variable | Value | Description |
   |---|---|---|
   | `ENVIRONMENT` | `production` | Enables production mode |
   | `DATABASE_URL` | `postgresql://...` | Render PostgreSQL internal connection URL |
   | `SECRET_KEY` | *(Generate 32-byte hex)* | JWT signing secret (`openssl rand -hex 32`) |
   | `CORS_ORIGINS` | `https://peoplepay360.netlify.app` | Production frontend domain(s) |
   | `PDF_STORAGE_PATH` | `./storage/payslips` | Payslip binary storage path |

---

## 3. Frontend Deployment (Netlify)

1. Connect your repository to [Netlify](https://app.netlify.com/).
2. Configure build settings:
   - **Base directory**: `Peoplepay360/frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `Peoplepay360/frontend/dist`
3. Configure Environment Variables in Netlify:
   | Variable | Value |
   |---|---|
   | `VITE_API_URL` | `https://peoplepay360-backend.onrender.com/api/v1` |
4. **SPA Redirects**:
   - Netlify automatically uses `frontend/public/_redirects` and `frontend/netlify.toml` to route all page requests (`/*`) to `/index.html` with status code `200`.

---

## 4. Post-Deployment Verification Checklist

1. **Backend Health Check**:
   ```bash
   curl -i https://peoplepay360-backend.onrender.com/api/health
   # Response should return: {"status":"healthy","database":"healthy","version":"2.0.0"}
   ```
2. **Database Schema Initialization**:
   - FastAPI lifespan automatically creates all tables on initial startup (`Base.metadata.create_all`).
   - Run seed script (optional for initial demo data):
     ```bash
     python backend/seed.py
     ```
3. **Frontend Direct Route Navigation**:
   - Open `https://peoplepay360.netlify.app/payruns` directly in a browser and refresh to ensure 200 OK rendering.
4. **CORS & Auth Verification**:
   - Perform persona login and verify successful JWT exchange in the browser network inspector.
