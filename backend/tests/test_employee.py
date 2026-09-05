import pytest

# Tests for Employee CRUD operations and validation


def test_create_employee_success(example_employee):
    """Employee creation should succeed with valid payload."""
    assert example_employee["first_name"] == "Alice"
    assert example_employee["last_name"] == "Example"
    assert example_employee["email"] == "alice.test@example.com"


def test_duplicate_employee_email_fails(client, example_employee):
    """Creating an employee with a duplicate email should return 400."""
    payload = {
        "first_name": "Bob",
        "last_name": "Duplicate",
        "email": "alice.test@example.com",  # same email as existing example_employee
        "department": "Engineering",
        "job_position": "Developer",
        "bank_account": "GB0987654321",
    }
    response = client.post("/api/v1/employees/", json=payload)
    assert response.status_code == 400
    assert "already exists" in response.text.lower()


def test_missing_required_fields(client):
    """Omitting required fields like first_name should result in validation error (422)."""
    payload = {
        "last_name": "Missing First Name",
        "email": "missing@example.com",
        "department": "HR",
    }
    response = client.post("/api/v1/employees/", json=payload)
    assert response.status_code == 422

