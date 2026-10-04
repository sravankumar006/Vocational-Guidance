"""Admin Router with RBAC protection (Phase 1 Brick 7 & Phase 9 Brick 31)."""

from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.session import get_db
from models import User
from api.deps import require_admin
from schemas.counselling import EscalationResponse
from services.counselling_service import counselling_service, to_escalation_response

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


@router.get(
    "/escalations",
    response_model=List[EscalationResponse],
    summary="List all escalation records for admin review (Brick 31 Preparation)",
)
def admin_list_escalations(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> List[EscalationResponse]:
    """Retrieves all human counsellor escalation records across the system for authorized admin review."""
    escalations = counselling_service.list_escalations(db=db, current_user=current_user)
    return [to_escalation_response(e) for e in escalations]
