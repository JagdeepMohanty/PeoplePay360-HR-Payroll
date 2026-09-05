from typing import Optional
from pydantic import BaseModel, EmailStr
from models.user import UserRole


class UserBase(BaseModel):
    email: EmailStr
    role: UserRole = UserRole.EMPLOYEE
    employee_id: Optional[int] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    employee_id: Optional[int] = None
    password: Optional[str] = None


class UserRead(UserBase):
    id: int

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    employee_id: Optional[int] = None
    email: str


class TokenData(BaseModel):
    sub: Optional[str] = None
    role: Optional[UserRole] = None


class LoginRequest(BaseModel):
    email: str
    password: str
