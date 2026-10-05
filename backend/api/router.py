from fastapi import APIRouter
from schemas.health import HealthStatus
from api.routers.auth import router as auth_router
from api.routers.student import router as student_router
from api.routers.parent import router as parent_router
from api.routers.counselling import router as counselling_router
from api.routers.admin import router as admin_router
from api.routers.admin_data import router as admin_data_router
from api.routers.careers import router as careers_router
from api.routers.courses import router as courses_router
from api.routers.voice import router as voice_router

api_router = APIRouter()

# Health endpoint: GET /api/health
@api_router.get("/health", response_model=HealthStatus, tags=["Health"])
def api_health() -> HealthStatus:
    """Minimal health check confirming the API router is functional."""
    return HealthStatus(status="ok")

# Register all architectural placeholder routers
api_router.include_router(auth_router)
api_router.include_router(student_router)
api_router.include_router(careers_router)
api_router.include_router(courses_router)
api_router.include_router(parent_router)
api_router.include_router(counselling_router)
api_router.include_router(admin_router)
api_router.include_router(admin_data_router)
api_router.include_router(voice_router)
