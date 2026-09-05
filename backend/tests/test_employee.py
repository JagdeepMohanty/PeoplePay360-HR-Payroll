import pytest

# Tests for Employee CRUD operations and validation


def test_create_employee_success(example_employee):
    """Employee creation should succeed with valid payload."""
    assert example_employee["name"] == "Alice Example"
    assert example_employee["employee_code"] == "EMP001"
    assert example_employee["email"] == "alice@example.com"


def test_duplicate_employee_code_fails(client, example_employee):
    """Creating an employee with a duplicate employee_code should return 400."""
    payload = {
        "name": "Bob Duplicate",
        "employee_code": "EMP001",  # same as existing
        "department": "Engineering",
        "job_title": "Developer",
        "joining_date": "2023-02-01",
        "email": "bob@example.com",
        "bank_account": "0987654321",
    }
    response = client.post("/employees/", json=payload)
    assert response.status_code == 400
    assert "employee_code" in response.text.lower()


def test_missing_required_fields(client):
    """Omitting required fields should result in validation error (422)."""
    payload = {
        "name": "Missing Fields",
        # employee_code omitted
        "department": "HR",
        "job_title": "Assistant",
        "joining_date": "2023-03-01",
        "email": "missing@example.com",
        "bank_account": "111222333",
    }
    response = client.post("/employees/", json=payload)
    assert response.status_code == 422

# Further tests (update, filter, unauthorized) can be added here.
