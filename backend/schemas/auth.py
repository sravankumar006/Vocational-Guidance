"""
Pydantic schemas for authentication and authorization (Phase 1 Brick 7).
Ensures passwords, hashes, and internal secrets are NEVER returned in API responses.
"""

from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class LoginRequest(BaseModel):
    """Payload for user login."""
    identifier: str = Field(..., description="Email address or phone number")
    password: str = Field(..., min_length=1, description="Account password")


class RefreshTokenRequest(BaseModel):
    """Payload for token refresh when cookies are not used."""
    refresh_token: Optional[str] = Field(None, description="Optional raw refresh token if not in cookie")


class SafeUserResponse(BaseModel):
    """
    Sanitized user identity representation.
    Guaranteed to exclude password hashes, internal secrets, and sensitive tokens.
    """
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: str
    is_active: bool
    student_profile_id: Optional[int] = None
    parent_profile_id: Optional[int] = None
    associated_student_ids: List[int] = Field(default_factory=list)


class TokenResponse(BaseModel):
    """Authentication response payload containing access token and safe identity metadata."""
    access_token: str
    token_type: str = "bearer"
    user: SafeUserResponse


class MessageResponse(BaseModel):
    """Generic status/message response."""
    detail: str
