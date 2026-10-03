from datetime import datetime
from typing import Optional, List, Any
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Enum as SQLEnum,
    JSON,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from database.base import Base
from models.enums import UserRole


class User(Base):
    """Central identity entity representing authenticated persons or platform accounts."""
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), unique=True, index=True, nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(32), unique=True, index=True, nullable=True)
    password_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true", nullable=False)
    role: Mapped[UserRole] = mapped_column(
        SQLEnum(UserRole, name="user_role_enum", create_type=False),
        default=UserRole.STUDENT,
        nullable=False,
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships (at most one profile of each type per user)
    student_profile: Mapped[Optional["StudentProfile"]] = relationship(
        "StudentProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    parent_profile: Mapped[Optional["ParentProfile"]] = relationship(
        "ParentProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    sessions: Mapped[List["UserSession"]] = relationship(
        "UserSession",
        back_populates="user",
        cascade="all, delete-orphan",
    )


class ParentStudentAssociation(Base):
    """
    Explicit relational association linking a ParentProfile with a StudentProfile.
    Enforces server-side family context authorization (Parent <-> Student).
    """
    __tablename__ = "parent_student_associations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    parent_profile_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("parent_profiles.id", ondelete="CASCADE"), index=True, nullable=False
    )
    student_profile_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), index=True, nullable=False
    )
    relationship_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # e.g., "Mother", "Father", "Guardian"
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    parent_profile: Mapped["ParentProfile"] = relationship("ParentProfile", back_populates="student_associations")
    student_profile: Mapped["StudentProfile"] = relationship("StudentProfile", back_populates="parent_associations")

    __table_args__ = (
        UniqueConstraint("parent_profile_id", "student_profile_id", name="uq_parent_student"),
    )


class UserSession(Base):
    """
    Persistent session and hashed refresh token tracking.
    Enforces token rotation, expiration, and server-side revocation on logout.
    """
    __tablename__ = "user_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)
    revoked_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="sessions")


class StudentProfile(Base):
    """Profile entity capturing academic background and preferences of a student."""
    __tablename__ = "student_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True, nullable=False
    )
    age: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    education_level: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    education_stream: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    institution: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    academic_strengths: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    household_income_range: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    interests: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    skills: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    work_location_preferences: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    career_preferences: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    career_intent: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="student_profile")
    counselling_sessions: Mapped[List["CounsellingSession"]] = relationship(
        "CounsellingSession",
        back_populates="student_profile",
        cascade="all, delete-orphan",
    )
    parent_concerns: Mapped[List["ParentConcern"]] = relationship(
        "ParentConcern",
        back_populates="student_profile",
    )
    parent_associations: Mapped[List["ParentStudentAssociation"]] = relationship(
        "ParentStudentAssociation",
        back_populates="student_profile",
        cascade="all, delete-orphan",
    )


class ParentProfile(Base):
    """Profile entity capturing background and perspective of a parent/guardian."""
    __tablename__ = "parent_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True, nullable=False
    )
    relationship_to_student: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    occupation: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="parent_profile")
    concerns: Mapped[List["ParentConcern"]] = relationship(
        "ParentConcern",
        back_populates="parent_profile",
        cascade="all, delete-orphan",
    )
    student_associations: Mapped[List["ParentStudentAssociation"]] = relationship(
        "ParentStudentAssociation",
        back_populates="parent_profile",
        cascade="all, delete-orphan",
    )
