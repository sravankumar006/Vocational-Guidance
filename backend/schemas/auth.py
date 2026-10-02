from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    identifier: Optional[str] = Field(None, description="Email, phone, or username")
    password: Optional[str] = Field(None, description="Password")
    role: Optional[str] = Field(None, description="Direct role select (student, parent, admin)")


class UserSummary(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: str
    family_id: Optional[str] = None
    student_id: Optional[int] = None
    linked_student_name: Optional[str] = None
    relationship_to_student: Optional[str] = None
    education_level: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    title: Optional[str] = None
    department: Optional[str] = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserSummary


class LogoutResponse(BaseModel):
    status: str = "ok"
    message: str = "Logged out successfully"
