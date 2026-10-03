"""Admin Router with RBAC protection (Phase 1 Brick 7)."""

from fastapi import APIRouter, Depends
from models import User
from api.deps import require_admin

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/")
def admin_placeholder() -> dict[str, str]:
    """Architectural placeholder for future admin endpoints."""
    return {"module": "admin", "status": "mounted"}


@router.get("/test")
def admin_test(current_user: User = Depends(require_admin)) -> dict[str, str | int | bool]:
    """Minimal RBAC verification endpoint for admin role."""
    return {
        "role": "admin",
        "verified": True,
        "user_id": current_user.id,
        "name": current_user.name,
    }
