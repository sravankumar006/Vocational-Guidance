"""Vocational Guidance Platform API Application Entrypoint - Live Server Ready."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError

from core.config import settings
from core.errors import AppException
from core.middleware import CorrelationIdMiddleware
from core.handlers import (
    app_exception_handler,
    http_exception_handler,
    validation_exception_handler,
    sqlalchemy_exception_handler,
    generic_exception_handler,
)
from api.router import api_router
from schemas.health import HealthStatus

import logging
from contextlib import asynccontextmanager

logger = logging.getLogger("sih.startup")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Schema changes are managed explicitly with Alembic before the app starts.
    try:
        from database.session import engine
        with engine.connect():
            logger.info("Database connection available.")
    except Exception as e:
        logger.error(f"Startup database connection error: {e}", exc_info=True)
    
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_PREFIX}/openapi.json",
    docs_url=f"{settings.API_PREFIX}/docs",
    redoc_url=f"{settings.API_PREFIX}/redoc",
    lifespan=lifespan,
)

# Security & Correlation Middleware (Brick 34)
from core.middleware import SecurityHeadersMiddleware

app.add_middleware(CorrelationIdMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

# CORS Middleware (Strict origin whitelist + Vercel subdomain regex)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS or ["https://vocational-guidance-ten.vercel.app"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
    allow_headers=["*"],
)

# Register Global Exception Handlers
from ai.exceptions import AIProviderError
from core.handlers import ai_provider_exception_handler

app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(AIProviderError, ai_provider_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# Root-level health check preserved from Brick 1
@app.get("/health", response_model=HealthStatus, tags=["Health"])
def root_health() -> HealthStatus:
    return HealthStatus(status="ok")

# Register centralized API router under /api
app.include_router(api_router, prefix=settings.API_PREFIX)
