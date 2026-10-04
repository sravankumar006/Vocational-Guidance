"""
Authentication Router (Phase 1 Brick 7).
Provides:
- POST /api/auth/login (Credential validation, JWT access token, HttpOnly refresh token cookie)
- POST /api/auth/refresh (Secure refresh token rotation & reuse detection)
- POST /api/auth/logout (Server-side session revocation & cookie deletion)
- GET /api/auth/me (Sanitized current user identity & linked family context)
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, status, Depends, Response, Request, Cookie
from sqlalchemy.orm import Session

from database.session import get_db
from core.config import settings
from core.security import create_access_token
from models import User
from schemas.auth import (
    LoginRequest,
    RefreshTokenRequest,
    TokenResponse,
    SafeUserResponse,
    MessageResponse,
)
from services.auth_service import (
    authenticate_user_credentials,
    create_user_session,
    rotate_user_session,
    revoke_user_session,
    build_safe_user_response,
)
from api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

REFRESH_COOKIE_NAME = "refresh_token"
COOKIE_PATH = "/api/auth"


@router.get("/")
def auth_placeholder() -> dict[str, str]:
    """Architectural placeholder / health status for authentication router."""
    return {"module": "auth", "status": "mounted"}


def _set_refresh_cookie(response: Response, raw_token: str) -> None:
    """Sets a secure HttpOnly cookie for the refresh token."""
    is_prod = settings.APP_ENV.lower() == "production"
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=raw_token,
        httponly=True,
        secure=is_prod,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path=COOKIE_PATH,
    )


from core.rate_limit import rate_limit_login

@router.post("/login", response_model=TokenResponse)
def login(
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_login),
) -> TokenResponse:
    """
    Authenticate user by email or phone and password.
    Determines role strictly on backend. Never trusts client-supplied roles.
    Issues short-lived JWT access token and sets secure HttpOnly refresh token cookie.
    """
    user, error_code = authenticate_user_credentials(
        db=db,
        identifier=payload.identifier,
        password=payload.password,
    )

    if error_code == "account_inactive":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Please contact system administrator.",
        )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please verify your identifier and password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 1. Generate short-lived access token
    role_str = user.role.value if hasattr(user.role, "value") else str(user.role)
    access_token = create_access_token({
        "sub": str(user.id),
        "role": role_str,
        "email": user.email,
        "name": user.name,
    })

    # 2. Generate and persist refresh token session in database
    raw_refresh_token, _ = create_user_session(db, user)

    # 3. Attach refresh token as HttpOnly cookie
    _set_refresh_cookie(response, raw_refresh_token)

    # 4. Construct sanitized response (no password hashes or internal secrets)
    safe_user = build_safe_user_response(user)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=safe_user,
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(
    response: Response,
    request: Request,
    payload: Optional[RefreshTokenRequest] = None,
    refresh_token: Optional[str] = Cookie(None, alias=REFRESH_COOKIE_NAME),
    db: Session = Depends(get_db),
) -> TokenResponse:
    """
    Refreshes access token and rotates refresh token.
    Extracts refresh token from HttpOnly cookie or request body.
    Invalidates previous refresh token to prevent reuse.
    """
    token_str = refresh_token
    if not token_str and payload and payload.refresh_token:
        token_str = payload.refresh_token

    if not token_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing from cookie or request body",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        new_raw_token, new_access_token, user = rotate_user_session(db, token_str)
    except ValueError as e:
        # Clear cookie on refresh failure
        response.delete_cookie(key=REFRESH_COOKIE_NAME, path=COOKIE_PATH)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )

    _set_refresh_cookie(response, new_raw_token)
    safe_user = build_safe_user_response(user)

    return TokenResponse(
        access_token=new_access_token,
        token_type="bearer",
        user=safe_user,
    )


@router.post("/logout", response_model=MessageResponse)
def logout(
    response: Response,
    payload: Optional[RefreshTokenRequest] = None,
    refresh_token: Optional[str] = Cookie(None, alias=REFRESH_COOKIE_NAME),
    db: Session = Depends(get_db),
) -> MessageResponse:
    """
    Logs out the current session.
    Revokes the refresh token record in the database so it can never be reused.
    Clears the HttpOnly refresh token cookie.
    """
    token_str = refresh_token
    if not token_str and payload and payload.refresh_token:
        token_str = payload.refresh_token

    if token_str:
        revoke_user_session(db, token_str)

    # Invalidate client cookie
    response.delete_cookie(key=REFRESH_COOKIE_NAME, path=COOKIE_PATH)
    return MessageResponse(detail="Successfully logged out and session revoked")


@router.get("/me", response_model=SafeUserResponse)
def get_me(
    current_user: User = Depends(get_current_user),
) -> SafeUserResponse:
    """
    Returns sanitized identity and family context of the authenticated user.
    Password hashes, access tokens, refresh tokens, and internal secrets are NEVER returned.
    """
    return build_safe_user_response(current_user)
