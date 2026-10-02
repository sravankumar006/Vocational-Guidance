"""API Routers package."""
from api.routers.auth import router as auth_router
from api.routers.student import router as student_router
from api.routers.parent import router as parent_router
from api.routers.counselling import router as counselling_router
from api.routers.admin import router as admin_router

__all__ = [
    "auth_router",
    "student_router",
    "parent_router",
    "counselling_router",
    "admin_router",
]
