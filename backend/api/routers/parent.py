from fastapi import APIRouter

router = APIRouter(prefix="/parent", tags=["Parent"])


@router.get("/")
def parent_placeholder() -> dict[str, str]:
    """Architectural placeholder for future parent endpoints."""
    return {"module": "parent", "status": "mounted"}
