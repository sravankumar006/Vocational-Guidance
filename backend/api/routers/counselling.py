"""Counselling Router with authentication protection (Phase 1 Brick 7)."""

from fastapi import APIRouter, Depends
from models import User
from api.deps import require_authenticated_user

router = APIRouter(prefix="/counselling", tags=["Counselling"])


@router.get("/")
def counselling_placeholder() -> dict[str, str]:
    """Architectural placeholder for future counselling endpoints."""
    return {"module": "counselling", "status": "mounted"}


@router.get("/test")
def counselling_test(current_user: User = Depends(require_authenticated_user)) -> dict[str, str | int | bool]:
    """Minimal verification endpoint confirming authenticated access to counselling domain."""
    return {
        "module": "counselling",
        "authenticated": True,
        "user_id": current_user.id,
        "role": current_user.role.value,
    }
