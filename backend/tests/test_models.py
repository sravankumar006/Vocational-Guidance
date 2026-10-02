import pytest
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import configure_mappers, sessionmaker
from database.base import Base
import models
from models import (
    User,
    StudentProfile,
    ParentProfile,
    Occupation,
    Course,
    TrainingProvider,
    CareerPath,
    JobOutcome,
    DataSource,
    CounsellingSession,
    CounsellingMessage,
    ParentConcern,
    HumanEscalation,
    SentimentEvent,
)


def test_all_14_models_imported():
    """Verify all 14 required models exist and subclass Base."""
    required_models = [
        User,
        StudentProfile,
        ParentProfile,
        Occupation,
        Course,
        TrainingProvider,
        CareerPath,
        JobOutcome,
        DataSource,
        CounsellingSession,
        CounsellingMessage,
        ParentConcern,
        HumanEscalation,
        SentimentEvent,
    ]
    for model in required_models:
        assert issubclass(model, Base), f"{model.__name__} is not a subclass of Base"


def test_mapper_configuration_and_tables():
    """Verify SQLAlchemy configure_mappers succeeds with no relationship errors."""
    configure_mappers()

    expected_tables = {
        "users",
        "student_profiles",
        "parent_profiles",
        "occupations",
        "courses",
        "training_providers",
        "career_paths",
        "job_outcomes",
        "data_sources",
        "counselling_sessions",
        "counselling_messages",
        "parent_concerns",
        "human_escalations",
        "sentiment_events",
        "career_path_courses",
        "career_path_occupations",
    }
    registered_tables = set(Base.metadata.tables.keys())
    assert expected_tables.issubset(registered_tables), (
        f"Missing tables: {expected_tables - registered_tables}"
    )


def test_privacy_no_aadhaar_fields():
    """Verify zero Aadhaar fields or identifiers exist across all model columns."""
    for table_name, table in Base.metadata.tables.items():
        for column in table.columns:
            col_name = column.name.lower()
            assert "aadhaar" not in col_name, (
                f"Privacy violation: Aadhaar field detected in {table_name}.{column.name}"
            )


def test_in_memory_sqlite_schema_creation():
    """Verify table creation works on an in-memory SQLite engine without external db."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    created_tables = set(inspector.get_table_names())

    assert "users" in created_tables
    assert "student_profiles" in created_tables
    assert "parent_profiles" in created_tables
    assert "career_paths" in created_tables
    assert "counselling_sessions" in created_tables
    assert "parent_concerns" in created_tables
    assert "human_escalations" in created_tables
