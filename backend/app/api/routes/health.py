from fastapi import APIRouter
from app.schemas.health import HealthResponse
from app.core.config import settings

router = APIRouter()


@router.get("/health", response_model=HealthResponse, tags=["Health"])
def health_check() -> HealthResponse:
    """Basic health check endpoint confirming the backend service is operational."""
    return HealthResponse(
        status="ok",
        environment=settings.APP_ENV,
        project=settings.PROJECT_NAME
    )
