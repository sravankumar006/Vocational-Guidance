from enum import Enum


class UserRole(str, Enum):
    STUDENT = "student"
    PARENT = "parent"
    ADMIN = "admin"
    COUNSELLOR = "counsellor"


class SessionStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    PAUSED = "paused"
    ESCALATED = "escalated"


class MessageSenderType(str, Enum):
    STUDENT = "student"
    PARENT = "parent"
    AI = "ai"
    COUNSELLOR = "counsellor"
    SYSTEM = "system"


class ConcernSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class ConcernStatus(str, Enum):
    OPEN = "open"
    ADDRESSED = "addressed"
    RESOLVED = "resolved"


class EscalationPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class EscalationStatus(str, Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"


class SentimentType(str, Enum):
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    CONCERNED = "concerned"
    NEGATIVE = "negative"


class RecordStatus(str, Enum):
    DEMO = "demo"
    UNVERIFIED = "unverified"
    VERIFIED = "verified"
    INACTIVE = "inactive"

