from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user, require_hr_manager, check_employee_self_or_hr
from models.user import User, UserRole
from models.employee import Employee
from schemas.employee import EmployeeCreate, EmployeeRead

router = APIRouter()


@router.get("/me", response_model=EmployeeRead)
def get_my_employee_profile(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    if not current_user.employee_id:
        raise HTTPException(
            status_code=404, detail="No employee profile associated with this user"
        )
    emp = db.query(Employee).filter(Employee.id == current_user.employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee profile not found")
    return emp


@router.get("", response_model=list[EmployeeRead])
@router.get("/", response_model=list[EmployeeRead])
def list_employees(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    if current_user.role == UserRole.EMPLOYEE:
        if not current_user.employee_id:
            return []
        emp = db.query(Employee).filter(Employee.id == current_user.employee_id).first()
        return [emp] if emp else []
    return db.query(Employee).all()


@router.get("/{employee_id}", response_model=EmployeeRead)
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not check_employee_self_or_hr(employee_id, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted for your role",
        )
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp


@router.post("", response_model=EmployeeRead, status_code=201)
@router.post("/", response_model=EmployeeRead, status_code=201)
def create_employee(
    payload: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_manager),
):
    existing = db.query(Employee).filter(Employee.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Employee with this email already exists")

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
    current_user: User = Depends(require_hr_manager),
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
    current_user: User = Depends(require_hr_manager),
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    db.delete(emp)
    db.commit()
    return None
