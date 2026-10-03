"""Parent Router with RBAC and family context verification endpoints (Phase 1 Brick 7)."""

from fastapi import APIRouter, Depends
from models import User, StudentProfile
from api.deps import require_parent, verify_family_access

router = APIRouter(prefix="/parent", tags=["Parent"])


@router.get("/")
def parent_placeholder() -> dict[str, str]:
    """Architectural placeholder for future parent endpoints."""
    return {"module": "parent", "status": "mounted"}


@router.get("/test")
def parent_test(current_user: User = Depends(require_parent)) -> dict[str, str | int | bool]:
    """Minimal RBAC verification endpoint for parent role."""
    return {
        "role": "parent",
        "verified": True,
        "user_id": current_user.id,
        "name": current_user.name,
    }


@router.get("/student/{student_id}")
def parent_family_context_test(
    student_id: int,
    student: StudentProfile = Depends(verify_family_access),
    current_user: User = Depends(require_parent),
) -> dict[str, str | int | bool]:
    """
    Family context authorization verification:
    Only allowed if the parent is explicitly linked to this student in the database.
    """
    return {
        "status": "ok",
        "parent_user_id": current_user.id,
        "student_id": student.id,
        "authorized_for_parent": True,
    }
