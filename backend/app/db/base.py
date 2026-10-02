"""Backwards compatibility adapter for app.db.base."""
from database.base import Base, prepare_pgvector

__all__ = ["Base", "prepare_pgvector"]
