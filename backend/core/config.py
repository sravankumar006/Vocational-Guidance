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
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, list):
            return v
        return []

    # Database Configuration (PostgreSQL with pgvector)
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/sih_db"

    # AI Configuration (No AI logic in this brick; configuration readiness only)
    AI_PROVIDER: str = "gemini"
    GEMINI_API_KEY: str = ""

    # Custom / Self-Hosted Model Configuration
    OWN_MODEL_URL: str = ""

    # Authentication & Session Security (Phase 1 Brick 7)
    AUTH_SECRET_KEY: str = "insecure-dev-secret-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    FRONTEND_URL: str = "http://localhost:5173"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
