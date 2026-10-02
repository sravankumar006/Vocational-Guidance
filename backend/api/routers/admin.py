from fastapi import APIRouter

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/")
def admin_placeholder() -> dict[str, str]:
    """Architectural placeholder for future admin endpoints."""
    return {"module": "admin", "status": "mounted"}
