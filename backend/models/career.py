from datetime import datetime
from typing import Optional, List, Any
from sqlalchemy import (
    Table,
    Column,
    Integer,
    String,
    Text,
    Float,
    DateTime,
    ForeignKey,
    JSON,
    func,
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from database.base import Base

# Association Table: CareerPath <-> Course (Many-to-Many)
career_path_courses = Table(
    "career_path_courses",
    Base.metadata,
    Column("career_path_id", Integer, ForeignKey("career_paths.id", ondelete="CASCADE"), primary_key=True),
    Column("course_id", Integer, ForeignKey("courses.id", ondelete="CASCADE"), primary_key=True),
    Column("sequence_order", Integer, default=1, nullable=False),
)

# Association Table: CareerPath <-> Occupation (Many-to-Many)
career_path_occupations = Table(
    "career_path_occupations",
    Base.metadata,
    Column("career_path_id", Integer, ForeignKey("career_paths.id", ondelete="CASCADE"), primary_key=True),
    Column("occupation_id", Integer, ForeignKey("occupations.id", ondelete="CASCADE"), primary_key=True),
    Column("role_level", String(50), nullable=True),  # e.g., "entry", "advanced", "specialist"
)


class Occupation(Base):
    """Represents a defined trade or profession in the employment market."""
    __tablename__ = "occupations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sector: Mapped[Optional[str]] = mapped_column(String(150), nullable=True, index=True)
    skill_requirements: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    career_paths: Mapped[List["CareerPath"]] = relationship(
        "CareerPath",
        secondary=career_path_occupations,
        back_populates="occupations",
    )
    job_outcomes: Mapped[List["JobOutcome"]] = relationship(
        "JobOutcome",
        back_populates="occupation",
        cascade="all, delete-orphan",
    )


class CareerPath(Base):
    """Represents a verified progression sequence connecting educational training to career milestones."""
    __tablename__ = "career_paths"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    progression_ladder: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    estimated_duration: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    courses: Mapped[List["Course"]] = relationship(
        "Course",
        secondary=career_path_courses,
        back_populates="career_paths",
    )
    occupations: Mapped[List["Occupation"]] = relationship(
        "Occupation",
        secondary=career_path_occupations,
        back_populates="career_paths",
    )
    job_outcomes: Mapped[List["JobOutcome"]] = relationship(
        "JobOutcome",
        back_populates="career_path",
        cascade="all, delete-orphan",
    )


class JobOutcome(Base):
    """Stores sourced employment rates, earnings ranges, and progression metrics."""
    __tablename__ = "job_outcomes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    occupation_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("occupations.id", ondelete="CASCADE"), nullable=True, index=True
    )
    career_path_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("career_paths.id", ondelete="CASCADE"), nullable=True, index=True
    )
    data_source_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("data_sources.id", ondelete="SET NULL"), nullable=True, index=True
    )

    employment_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    salary_range_min: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    salary_range_max: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    salary_currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    experience_level: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    region: Mapped[Optional[str]] = mapped_column(String(150), nullable=True, index=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    occupation: Mapped[Optional["Occupation"]] = relationship("Occupation", back_populates="job_outcomes")
    career_path: Mapped[Optional["CareerPath"]] = relationship("CareerPath", back_populates="job_outcomes")
    data_source: Mapped[Optional["DataSource"]] = relationship("DataSource", back_populates="job_outcomes")
