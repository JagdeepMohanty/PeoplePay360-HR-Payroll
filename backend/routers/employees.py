from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.employee import Employee
from ..schemas.employee import EmployeeCreate, EmployeeRead
from ..models.user import User
from ..auth.dependencies import get_current_user, require_officer, require_manager

router = APIRouter()


@router.get("/", response_model=list[EmployeeRead])
def list_employees(
    department: str | None = Query(None),
    job_title: str | None = Query(None),
    name: str | None = Query(None),
    employee_code: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    _: User = Depends(require_officer)
):
    query = db.query(Employee)
    if department:
        query = query.filter(Employee.department == department)
    if job_title:
        query = query.filter(Employee.job_title == job_title)
    if name:
        query = query.filter(Employee.name.contains(name))
    if employee_code:
        query = query.filter(Employee.employee_code == employee_code)
    return query.offset(skip).limit(limit).all()


@router.get("/{employee_id}", response_model=EmployeeRead)
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    # Ownership / role check
    if current_user.role == "HR_EMPLOYEE" and current_user.id != employee_id:
        raise HTTPException(status_code=403, detail="Access denied")
    if current_user.role == "HR_OFFICER" or current_user.role == "HR_MANAGER":
        return emp
    # Fallback deny
    raise HTTPException(status_code=403, detail="Access denied")


@router.post("/", response_model=EmployeeRead, status_code=201)
def create_employee(
    payload: EmployeeCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_officer)
):
    emp = Employee(**payload.model_dump())
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return emp


@router.put("/{employee_id}", response_model=EmployeeRead)
def update_employee(
    employee_id: int,
    payload: EmployeeCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_officer)
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    for key, value in payload.model_dump().items():
        setattr(emp, key, value)
    db.commit()
    db.refresh(emp)
    return emp

@router.delete("/{employee_id}", status_code=204)
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_manager)
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    if emp.contracts or emp.attendances or emp.leaves or emp.payslips:
        raise HTTPException(status_code=400, detail="Cannot delete employee with related records")
    db.delete(emp)
    db.commit()
    return
