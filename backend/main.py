from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, engine
from .routers import employees, contracts, attendance, leaves, payruns, dashboard


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
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(employees.router, prefix="/employees", tags=["Employees"])
app.include_router(contracts.router, prefix="/contracts", tags=["Contracts"])
app.include_router(attendance.router, prefix="/attendance", tags=["Attendance"])
app.include_router(leaves.router, prefix="/leaves", tags=["Leaves"])
app.include_router(payruns.router, prefix="/payruns", tags=["Payruns"])
app.include_router(dashboard.router, prefix="/reports", tags=["Dashboard"])


@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "PeoplePay360 API"}
