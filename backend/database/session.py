from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from core.config import settings

is_sqlite = settings.DATABASE_URL.startswith("sqlite")
connect_args = {"check_same_thread": False} if is_sqlite else {}
pool_kwargs = {} if is_sqlite else {"pool_pre_ping": True, "pool_recycle": 3600}

# Engine configuration with pooling suitable for production or SQLite for local development
engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False,
    **pool_kwargs,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db() -> Generator[Session, None, None]:
    """Dependency for obtaining database sessions per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
