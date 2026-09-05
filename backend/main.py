from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import Base, engine
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


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="PeoplePay360 API",
    description="Intelligent Workforce-to-Payroll Validation & 5-Tier RBAC Engine",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS configuration supporting credentials and dev server ports
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins if settings.cors_origins else ["http://localhost:5173"],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "PeoplePay360 RBAC API"}
