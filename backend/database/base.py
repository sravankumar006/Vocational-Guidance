from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text
from sqlalchemy.engine import Engine


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy declarative models."""
    pass


def prepare_pgvector(engine: Engine) -> None:
    """
    Hook to ensure pgvector extension is created in the connected PostgreSQL database.
    Can be invoked in migrations or database initialization scripts.
    """
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        conn.commit()
