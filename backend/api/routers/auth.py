from fastapi import APIRouter, HTTPException, status, Depends
from schemas.auth import LoginRequest, LoginResponse, LogoutResponse, UserSummary
from services.auth_service import authenticate_user, create_token
from api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.get("/")
def auth_placeholder() -> dict[str, str]:
    """Architectural placeholder / health status for authentication router."""
    return {"module": "auth", "status": "mounted"}


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest) -> LoginResponse:
    """
    Authenticate user by identifier/password or role.
    Issues a signed JWT access token and user identity.
    """
    user_data = authenticate_user(
        identifier=payload.identifier or "",
        password=payload.password or "",
        role=payload.role,
    )
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials or unknown account",
        )

    # Encode user payload into access token
    token = create_token(user_data)

    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user=UserSummary(**user_data),
    )


@router.get("/me", response_model=UserSummary)
def get_me(current_user: dict = Depends(get_current_user)) -> UserSummary:
    """Returns the authenticated identity of the currently active session."""
    return UserSummary(**current_user)


@router.post("/logout", response_model=LogoutResponse)
def logout() -> LogoutResponse:
    """Client clears token; endpoint confirms session termination."""
    return LogoutResponse(status="ok", message="Session ended successfully")
