from fastapi import APIRouter

router = APIRouter(prefix="/student", tags=["Student"])


@router.get("/")
def student_placeholder() -> dict[str, str]:
    """Architectural placeholder for future student endpoints."""
    return {"module": "student", "status": "mounted"}
