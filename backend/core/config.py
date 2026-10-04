from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Application Info
    PROJECT_NAME: str = "Vocational Guidance Platform API"
    APP_ENV: str = "development"
    API_PREFIX: str = "/api"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://vocational-guidance-ten.vercel.app",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        origins = []
        if isinstance(v, str):
            v_clean = v.strip()
            if v_clean.startswith("[") and v_clean.endswith("]"):
                import json
                try:
                    origins = json.loads(v_clean)
                except Exception:
                    origins = [i.strip() for i in v_clean.strip("[]").split(",") if i.strip()]
            else:
                origins = [i.strip() for i in v_clean.split(",") if i.strip()]
        elif isinstance(v, list):
            origins = v

        cleaned: List[str] = []
        for origin in origins:
            cleaned_origin = str(origin).strip().strip("'\"").rstrip("/")
            if cleaned_origin and cleaned_origin not in cleaned:
                cleaned.append(cleaned_origin)

        # Always guarantee Vercel production deployment and local origins are whitelisted
        guaranteed = [
            "https://vocational-guidance-ten.vercel.app",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]
        for g in guaranteed:
            if g not in cleaned:
                cleaned.append(g)

        return cleaned

    # Database Configuration (PostgreSQL with pgvector)
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/sih_db"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_database_url(cls, v: str) -> str:
        if not v:
            return "sqlite:///./sih.db"
        # Render and Heroku inject postgres:// or postgresql:// without the +psycopg dialect specification
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+psycopg://", 1)
        if v.startswith("postgresql://") and not v.startswith("postgresql+"):
            return v.replace("postgresql://", "postgresql+psycopg://", 1)
        return v

    # AI Configuration (No AI logic in this brick; configuration readiness only)
    AI_PROVIDER: str = "gemini"
    GEMINI_API_KEY: str = ""
    AI_CONFIDENCE_THRESHOLD: float = 0.60

    # Custom / Self-Hosted Model Configuration
    OWN_MODEL_URL: str = ""

    # Authentication & Session Security (Phase 1 Brick 7)
    AUTH_SECRET_KEY: str = "insecure-dev-secret-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    FRONTEND_URL: str = "https://vocational-guidance-ten.vercel.app"

    # RAG & Vector Retrieval Configuration (Phase 5 Brick 19)
    EMBEDDING_PROVIDER: str = "local"
    EMBEDDING_MODEL: str = "text-embedding-004"
    EMBEDDING_DIMENSION: int = 768
    RAG_VERIFIED_ONLY_DEFAULT: bool = True
    RAG_TOP_K_DEFAULT: int = 5

    # AI Counselling Orchestration (Phase 5 Bricks 20, 21 & 25)
    COUNSELLING_HISTORY_LIMIT: int = 40
    COUNSELLING_LOW_CONFIDENCE_THRESHOLD: float = 0.50
    COUNSELLING_MAX_OUTPUT_TOKENS: int = 4096
    # Human Counsellor Telephony & Emergency Dispatch
    COUNSELLOR_PHONE_NUMBER: str = "7842547928"
    COUNSELLOR_EMERGENCY_SMS_TEMPLATE: str = "emergency this parent/student have concerns about this"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
