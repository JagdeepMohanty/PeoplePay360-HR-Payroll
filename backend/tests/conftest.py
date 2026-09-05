import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.main import app
from backend.database import Base, get_db
from backend.config import Settings

# ---------------------------------------------------------------------------
# Test configuration
# ---------------------------------------------------------------------------
# Use an isolated SQLite database for tests. This can be in‑memory or a file.
# In‑memory is faster, but each fixture must recreate the schema.
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
    """FastAPI test client that uses the overridden ``get_db`` dependency."""
    # Override the dependency that provides a DB session.
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    # Override authentication for tests
    from backend.auth.dependencies import get_current_user
    def override_get_current_user():
        class DummyUser:
            id = 1
            role = "HR_OFFICER"
            is_active = True
        return DummyUser()
    app.dependency_overrides[get_current_user] = override_get_current_user
    with TestClient(app) as c:
        yield c
    # Clean up the overrides after the test.
    app.dependency_overrides.pop(get_db, None)
    app.dependency_overrides.pop(get_current_user, None)

# ---------------------------------------------------------------------------
# Helper data fixtures – simple objects that can be used in tests.
# ---------------------------------------------------------------------------
@pytest.fixture()
def example_employee(client):
    payload = {
        "name": "Alice Example",
        "employee_code": "EMP001",
        "department": "Engineering",
        "job_title": "Developer",
        "joining_date": "2023-01-15",
        "email": "alice@example.com",
        "bank_account": "1234567890",
    }
    response = client.post("/employees/", json=payload)
    assert response.status_code == 201, response.text
    return response.json()

# Additional fixtures for contracts, attendance, leaves, users, payruns can be added
# later as needed.
