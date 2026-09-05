from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from routers import employees, contracts, attendance, leaves, payruns, dashboard


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="PeoplePay360 API",
    description="Intelligent Workforce-to-Payroll Validation and Execution Engine",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(employees.router, prefix="/api/v1/employees", tags=["Employees"])
app.include_router(contracts.router, prefix="/api/v1/contracts", tags=["Contracts"])
app.include_router(attendance.router, prefix="/api/v1/attendance", tags=["Attendance"])
app.include_router(leaves.router, prefix="/api/v1/leaves", tags=["Leaves"])
app.include_router(payruns.router, prefix="/api/v1/payruns", tags=["Payruns"])
app.include_router(dashboard.router, prefix="/api/v1/reports", tags=["Dashboard"])


@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "PeoplePay360 API"}
