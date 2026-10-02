from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    Integer,
    String,
    Text,
    Float,
    DateTime,
    ForeignKey,
    Enum as SQLEnum,
    func,
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from database.base import Base
from models.enums import (
    SessionStatus,
    MessageSenderType,
    ConcernSeverity,
    ConcernStatus,
    EscalationPriority,
    EscalationStatus,
    SentimentType,
)


class CounsellingSession(Base):
    """Represents a discrete counselling engagement with a student/family."""
    __tablename__ = "counselling_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    student_profile_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status: Mapped[SessionStatus] = mapped_column(
        SQLEnum(SessionStatus, name="session_status_enum", create_type=False),
        default=SessionStatus.ACTIVE,
        nullable=False,
        index=True,
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    student_profile: Mapped["StudentProfile"] = relationship(
        "StudentProfile", back_populates="counselling_sessions"
    )
    messages: Mapped[List["CounsellingMessage"]] = relationship(
        "CounsellingMessage",
        back_populates="session",
        cascade="all, delete-orphan",
    )
    parent_concerns: Mapped[List["ParentConcern"]] = relationship(
        "ParentConcern",
        back_populates="session",
        cascade="all, delete-orphan",
    )
    human_escalations: Mapped[List["HumanEscalation"]] = relationship(
        "HumanEscalation",
        back_populates="session",
        cascade="all, delete-orphan",
    )
    sentiment_events: Mapped[List["SentimentEvent"]] = relationship(
        "SentimentEvent",
        back_populates="session",
        cascade="all, delete-orphan",
    )


class CounsellingMessage(Base):
    """Individual conversational interaction inside a counselling session."""
    __tablename__ = "counselling_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("counselling_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    sender_type: Mapped[MessageSenderType] = mapped_column(
        SQLEnum(MessageSenderType, name="message_sender_enum", create_type=False),
        nullable=False,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    # Relationships
    session: Mapped["CounsellingSession"] = relationship("CounsellingSession", back_populates="messages")
    sentiment_events: Mapped[List["SentimentEvent"]] = relationship(
        "SentimentEvent",
        back_populates="message",
        cascade="all, delete-orphan",
    )


class ParentConcern(Base):
    """Specific anxiety or objection raised by parents during the decision journey."""
    __tablename__ = "parent_concerns"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    parent_profile_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("parent_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    student_profile_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("student_profiles.id", ondelete="SET NULL"), nullable=True, index=True
    )
    counselling_session_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("counselling_sessions.id", ondelete="SET NULL"), nullable=True, index=True
    )

    concern_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    severity: Mapped[ConcernSeverity] = mapped_column(
        SQLEnum(ConcernSeverity, name="concern_severity_enum", create_type=False),
        default=ConcernSeverity.MEDIUM,
        nullable=False,
    )
    status: Mapped[ConcernStatus] = mapped_column(
        SQLEnum(ConcernStatus, name="concern_status_enum", create_type=False),
        default=ConcernStatus.OPEN,
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    parent_profile: Mapped["ParentProfile"] = relationship("ParentProfile", back_populates="concerns")
    student_profile: Mapped[Optional["StudentProfile"]] = relationship(
        "StudentProfile", back_populates="parent_concerns"
    )
    session: Mapped[Optional["CounsellingSession"]] = relationship(
        "CounsellingSession", back_populates="parent_concerns"
    )


class HumanEscalation(Base):
    """Case flagged for intervention by a professional counsellor."""
    __tablename__ = "human_escalations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    counselling_session_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("counselling_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[EscalationPriority] = mapped_column(
        SQLEnum(EscalationPriority, name="escalation_priority_enum", create_type=False),
        default=EscalationPriority.MEDIUM,
        nullable=False,
    )
    status: Mapped[EscalationStatus] = mapped_column(
        SQLEnum(EscalationStatus, name="escalation_status_enum", create_type=False),
        default=EscalationStatus.PENDING,
        nullable=False,
        index=True,
    )
    assigned_to_user_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    session: Mapped["CounsellingSession"] = relationship("CounsellingSession", back_populates="human_escalations")
    assigned_counsellor: Mapped[Optional["User"]] = relationship("User", foreign_keys=[assigned_to_user_id])


class SentimentEvent(Base):
    """Quantified sentiment observation captured throughout a counselling dialogue."""
    __tablename__ = "sentiment_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    counselling_session_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("counselling_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    counselling_message_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("counselling_messages.id", ondelete="SET NULL"), nullable=True, index=True
    )
    sentiment: Mapped[SentimentType] = mapped_column(
        SQLEnum(SentimentType, name="sentiment_type_enum", create_type=False),
        nullable=False,
    )
    score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    session: Mapped["CounsellingSession"] = relationship("CounsellingSession", back_populates="sentiment_events")
    message: Mapped[Optional["CounsellingMessage"]] = relationship(
        "CounsellingMessage", back_populates="sentiment_events"
    )
