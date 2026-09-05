import os
import sys
# Ensure backend directory is first in sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from main import app
from database import Base, get_db
from models.user import UserRole

# ---------------------------------------------------------------------------
# Test configuration
# ---------------------------------------------------------------------------
TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", "sqlite:///./test_db.sqlite")

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ---------------------------------------------------------------------------
# Pytest fixtures
# ---------------------------------------------------------------------------
@pytest.fixture(scope="session", autouse=True)
def create_test_database():
    """Create all tables before the test session and drop them afterwards."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture()
def db_session():
    """Provide a fresh DB session for a single test function."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()

@pytest.fixture()
def client(db_session):
    """FastAPI test client that uses overridden dependencies."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    from auth import get_current_user, require_hr_manager
    def override_get_current_user():
        class DummyUser:
            id = 1
            email = "admin@peoplepay360.dev"
            role = UserRole.ADMIN
            is_active = True
            employee_id = 1
        return DummyUser()

    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[require_hr_manager] = override_get_current_user

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()

# ---------------------------------------------------------------------------
# Helper data fixtures
# ---------------------------------------------------------------------------
@pytest.fixture()
def example_employee(client):
    payload = {
        "first_name": "Alice",
        "last_name": "Example",
        "email": "alice.test@example.com",
        "department": "Engineering",
        "job_position": "Developer",
        "bank_account": "GB1234567890",
        "is_active": True,
    }
    response = client.post("/api/v1/employees/", json=payload)
    assert response.status_code == 201, response.text
    return response.json()

