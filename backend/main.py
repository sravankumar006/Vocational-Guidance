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
    # Ensure database schema is initialized on any cloud provider (Render/Railway/Fly)
    try:
        from database.session import engine, SessionLocal
        from database.base import Base, prepare_pgvector
        import models  # Ensures all models are registered on Base.metadata
        
        try:
            prepare_pgvector(engine)
        except Exception as pg_err:
            logger.info(f"prepare_pgvector skipped (normal for SQLite / non-superuser): {pg_err}")
            
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully.")
        
        # Self-heal initial occupations and analytics seed data if database is empty
        try:
            from models import Occupation
            db = SessionLocal()
            try:
                occ_count = db.query(Occupation).count()
                if occ_count == 0:
                    logger.info("Empty database detected. Running auto-seed...")
                    from scripts.check_and_seed import seed_analytics_data
                    seed_analytics_data(db)
            finally:
                db.close()
        except Exception as seed_err:
            logger.warning(f"Auto-seed check non-blocking warning: {seed_err}")
    except Exception as e:
        logger.error(f"Startup database initialization error: {e}", exc_info=True)
    
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
