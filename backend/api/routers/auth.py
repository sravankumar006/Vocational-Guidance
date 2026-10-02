from fastapi import APIRouter

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.get("/")
def auth_placeholder() -> dict[str, str]:
    """Architectural placeholder for future authentication endpoints."""
    return {"module": "auth", "status": "mounted"}
