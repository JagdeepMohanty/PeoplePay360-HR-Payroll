import json
import logging
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from config import settings
from database import Base, engine, get_db
from routers import (
    auth,
    users,
    employees,
    working_schedules,
    contracts,
    attendance,
    leaves,
    salary_structures,
    payruns,
    dashboard,
)
from seed import seed as run_seed

# Structured Audit Logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("peoplepay360.audit")


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    # Auto-seed on every startup — idempotent: skips if data already exists
    run_seed(force=False)
    yield


app = FastAPI(
    title="PeoplePay360 API",
    description="Intelligent Workforce-to-Payroll Validation & 5-Tier RBAC Engine",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS configuration supporting credentials and explicit allowed origins
cors_allowed = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
if isinstance(settings.cors_origins, list):
    for origin in settings.cors_origins:
        if origin not in cors_allowed:
            cors_allowed.append(origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_allowed,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def audit_log_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration_ms = round((time.time() - start_time) * 1000, 2)

    client_ip = request.client.host if request.client else "unknown"
    log_data = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "method": request.method,
        "path": request.url.path,
        "status_code": response.status_code,
        "ip_address": client_ip,
        "duration_ms": duration_ms,
    }

    # Extract authorization header user hint if present
    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.startswith("Bearer "):
        log_data["auth"] = "authenticated"

    logger.info(json.dumps(log_data))
    return response

# Router registration
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users (Admin)"])
app.include_router(employees.router, prefix="/api/v1/employees", tags=["Employees"])
app.include_router(working_schedules.router, prefix="/api/v1/working-schedules", tags=["Working Schedules"])
app.include_router(contracts.router, prefix="/api/v1/contracts", tags=["Contracts"])
app.include_router(attendance.router, prefix="/api/v1/attendance", tags=["Attendance"])
app.include_router(leaves.router, prefix="/api/v1/leaves", tags=["Leaves & Time Off"])
app.include_router(salary_structures.router, prefix="/api/v1/salary-structures", tags=["Salary Structures"])
app.include_router(payruns.router, prefix="/api/v1/payruns", tags=["Payruns & Payslips"])
app.include_router(payruns.router, prefix="/payruns", tags=["Payruns (Direct)"])
app.include_router(dashboard.router, prefix="/api/v1/reports", tags=["Dashboard"])


@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
def health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "ok",
            "service": "PeoplePay360 RBAC API",
            "database": "connected",
        }
    except Exception:
        return {
            "status": "error",
            "service": "PeoplePay360 RBAC API",
            "database": "disconnected",
        }
