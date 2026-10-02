from fastapi import APIRouter

router = APIRouter(prefix="/counselling", tags=["Counselling"])


@router.get("/")
def counselling_placeholder() -> dict[str, str]:
    """Architectural placeholder for future counselling endpoints."""
    return {"module": "counselling", "status": "mounted"}
