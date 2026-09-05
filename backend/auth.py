from datetime import datetime, timedelta, timezone
from typing import Optional, List
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from config import settings
from database import get_db
from models.user import User, UserRole

# OAuth2 scheme looking for token in 'Authorization: Bearer <token>' header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"), hashed_password.encode("utf-8")
        )
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user


def require_roles(*allowed_roles: UserRole):
    """
    Dependency factory to check if the current authenticated user has one of the allowed roles.
    Raises 403 Forbidden if user role is not authorized.
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted for role '{current_user.role.value}'",
            )
        return current_user

    return role_checker


# ---------------------------------------------------------------------------
# Specific RBAC Role Guards
# ---------------------------------------------------------------------------

# 1. Any Authenticated User Guard
def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    return current_user


# 2. HR Manager Rights (HR_MANAGER, HR_PAYROLL_USER, HR_PAYROLL_MANAGER, ADMIN)
require_hr_manager = require_roles(
    UserRole.HR_MANAGER,
    UserRole.HR_PAYROLL_USER,
    UserRole.HR_PAYROLL_MANAGER,
    UserRole.ADMIN,
)


# 3. Payroll Read/Write Rights (HR_PAYROLL_USER, HR_PAYROLL_MANAGER, ADMIN)
# Note: HR_MANAGER is explicitly excluded from Payroll access!
require_payroll_read = require_roles(
    UserRole.HR_PAYROLL_USER,
    UserRole.HR_PAYROLL_MANAGER,
    UserRole.ADMIN,
)

require_payroll_write = require_roles(
    UserRole.HR_PAYROLL_USER,
    UserRole.HR_PAYROLL_MANAGER,
    UserRole.ADMIN,
)


# 4. Salary Structure & Rule Read Rights (All authenticated roles)
require_salary_structure_read = require_roles(
    UserRole.HR_MANAGER,
    UserRole.HR_PAYROLL_USER,
    UserRole.HR_PAYROLL_MANAGER,
    UserRole.ADMIN,
    UserRole.EMPLOYEE,
)

# 5. Salary Structure & Rule Full CRUD Rights (HR_PAYROLL_MANAGER, ADMIN)
# Note: HR_PAYROLL_USER has Read-only access to Salary Structures/Rules!
require_salary_structure_write = require_roles(
    UserRole.HR_PAYROLL_MANAGER,
    UserRole.ADMIN,
)


# 6. Payroll Full CRUD / Delete Guard (HR_PAYROLL_MANAGER, ADMIN)
# HR_PAYROLL_USER is explicitly excluded from destructive DELETE operations.
require_payroll_manager = require_roles(
    UserRole.HR_PAYROLL_MANAGER,
    UserRole.ADMIN,
)


# 7. Admin Only Guard
require_admin = require_roles(UserRole.ADMIN)


# ---------------------------------------------------------------------------
# Self-Access Helpers
# ---------------------------------------------------------------------------

def check_employee_self_or_hr(target_employee_id: int, current_user: User) -> bool:
    """Return True if the user is HR+ or is the target employee themselves."""
    if current_user.role in [
        UserRole.HR_MANAGER,
        UserRole.HR_PAYROLL_USER,
        UserRole.HR_PAYROLL_MANAGER,
        UserRole.ADMIN,
    ]:
        return True
    if current_user.role == UserRole.EMPLOYEE and current_user.employee_id == target_employee_id:
        return True
    return False


def require_employee_self_or_hr(target_employee_id: int):
    """
    Dependency factory: EMPLOYEE role can only access their own data.
    HR_MANAGER and above can access any employee's data.
    Raises 403 if an EMPLOYEE tries to access another employee's data.
    """
    def checker(current_user: User = Depends(get_current_user)) -> User:
        if not check_employee_self_or_hr(target_employee_id, current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access restricted to own data",
            )
        return current_user
    return checker
