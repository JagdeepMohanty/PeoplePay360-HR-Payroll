from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from auth import verify_password, create_access_token, get_current_user, get_password_hash
from database import get_db
from models.user import User, UserRole
from models.employee import Employee
from schemas.user import LoginRequest, Token, UserRead

router = APIRouter()


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()

    # If employee exists in directory but user account is not yet created, auto-provision
    if not user:
        emp = db.query(Employee).filter(Employee.email == payload.email).first()
        if emp and payload.password == "password123":
            user = User(
                email=emp.email,
                hashed_password=get_password_hash("password123"),
                role=UserRole.EMPLOYEE,
                employee_id=emp.id,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role.value, "user_id": user.id}
    )
    return Token(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        employee_id=user.employee_id,
        email=user.email,
    )


@router.post("/token", response_model=Token)
def login_form(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user:
        emp = db.query(Employee).filter(Employee.email == form_data.username).first()
        if emp and form_data.password == "password123":
            user = User(
                email=emp.email,
                hashed_password=get_password_hash("password123"),
                role=UserRole.EMPLOYEE,
                employee_id=emp.id,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role.value, "user_id": user.id}
    )
    return Token(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        employee_id=user.employee_id,
        email=user.email,
    )


@router.post("/switch-employee/{employee_id}", response_model=Token)
def switch_employee(employee_id: int, db: Session = Depends(get_db)):
    """Allows instant switching to any employee persona in the workforce."""
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    user = db.query(User).filter(User.employee_id == employee_id).first()
    if not user:
        user = User(
            email=emp.email,
            hashed_password=get_password_hash("password123"),
            role=UserRole.EMPLOYEE,
            employee_id=emp.id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = create_access_token(
        data={"sub": user.email, "role": user.role.value, "user_id": user.id}
    )
    return Token(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        employee_id=user.employee_id,
        email=user.email,
    )


@router.get("/me", response_model=UserRead)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
