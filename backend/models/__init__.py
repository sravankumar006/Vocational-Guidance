"""Database models registry exporting all 14 core entities and association tables."""
from database.base import Base

from models.enums import (
    UserRole,
    SessionStatus,
    MessageSenderType,
    ConcernSeverity,
    ConcernStatus,
    EscalationPriority,
    EscalationStatus,
    SentimentType,
)

from models.user import (
    User,
    StudentProfile,
    ParentProfile,
    ParentStudentAssociation,
    UserSession,
)

from models.education import (
    DataSource,
    TrainingProvider,
    Course,
)

from models.career import (
    Occupation,
    CareerPath,
    JobOutcome,
    career_path_courses,
    career_path_occupations,
)

from models.counselling import (
    CounsellingSession,
    CounsellingMessage,
    ParentConcern,
    HumanEscalation,
    SentimentEvent,
)

__all__ = [
    # Base
    "Base",
    # Enums
    "UserRole",
    "SessionStatus",
    "MessageSenderType",
    "ConcernSeverity",
    "ConcernStatus",
    "EscalationPriority",
    "EscalationStatus",
    "SentimentType",
    # 1. User
    "User",
    # 2. StudentProfile
    "StudentProfile",
    # 3. ParentProfile
    "ParentProfile",
    # Auth & Family Association (Phase 1 Brick 7)
    "ParentStudentAssociation",
    "UserSession",
    # 4. Occupation
    "Occupation",
    # 5. Course
    "Course",
    # 6. TrainingProvider
    "TrainingProvider",
    # 7. CareerPath
    "CareerPath",
    # 8. JobOutcome
    "JobOutcome",
    # 9. DataSource
    "DataSource",
    # 10. CounsellingSession
    "CounsellingSession",
    # 11. CounsellingMessage
    "CounsellingMessage",
    # 12. ParentConcern
    "ParentConcern",
    # 13. HumanEscalation
    "HumanEscalation",
    # 14. SentimentEvent
    "SentimentEvent",
    # Association Tables
    "career_path_courses",
    "career_path_occupations",
]
