"""
Pydantic schemas for the Student domain, Dashboard, and Progressive Profile (Phase 3 Brick 11).
Guaranteed to sanitize responses: no Aadhaar, no passwords, no internal secrets.
"""

from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel, Field, field_validator


VALID_EDUCATION_LEVELS = [
    "School",
    "Intermediate / Higher Secondary",
    "ITI",
    "Diploma",
    "Undergraduate",
    "Postgraduate",
    "Other",
]

VALID_INCOME_RANGES = [
    "Below ₹1 lakh",
    "₹1–3 lakh",
    "₹3–5 lakh",
    "₹5–10 lakh",
    "₹10 lakh+",
    "Prefer not to say",
]


class StudentProfileSummary(BaseModel):
    """Sanitized student profile information for dashboard display."""
    id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    education_level: Optional[str] = None
    education_stream: Optional[str] = None
    location: Optional[str] = None
    interests: List[str] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    profile_completion_percentage: int = Field(
        ..., ge=0, le=100, description="Real checklist-based profile completion percentage"
    )


class CurrentCareerInfo(BaseModel):
    """Active vocational trade or career path selected by the student."""
    id: int
    name: str
    sector: Optional[str] = None
    description: Optional[str] = None


class RecommendedCareerInfo(BaseModel):
    """Recommended career trade when computed by recommendation engine."""
    id: int
    name: str
    sector: Optional[str] = None
    match_reason: Optional[str] = None


class CounsellingSessionSummary(BaseModel):
    """Overview of latest counselling engagement for the student."""
    id: int
    status: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    message_count: int = 0
    last_message_preview: Optional[str] = None


class FamilyStatusInfo(BaseModel):
    """High-level linked family status derived from parent-student associations."""
    has_linked_parent: bool = False
    parent_name: Optional[str] = None
    relationship_type: Optional[str] = None
    linked_at: Optional[datetime] = None


class StudentDashboardResponse(BaseModel):
    """Aggregated response for the Student Dashboard at /student."""
    profile: StudentProfileSummary
    current_career: Optional[CurrentCareerInfo] = None
    recommended_careers: List[RecommendedCareerInfo] = Field(default_factory=list)
    latest_counselling_session: Optional[CounsellingSessionSummary] = None
    family_status: FamilyStatusInfo


class StudentProfileDetailResponse(BaseModel):
    """Comprehensive progressive profile response for /student/profile."""
    id: int
    user_id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    age: Optional[int] = None
    location: Optional[str] = None
    education_level: Optional[str] = None
    education_stream: Optional[str] = None
    institution: Optional[str] = None
    academic_strengths: List[str] = Field(default_factory=list)
    household_income_range: Optional[str] = None
    interests: List[str] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    work_location_preferences: List[str] = Field(default_factory=list)
    career_preferences: List[str] = Field(default_factory=list)
    career_intent: Optional[str] = None
    profile_completion_percentage: int = Field(..., ge=0, le=100)
    section_completion: Dict[str, bool] = Field(default_factory=dict)


class StudentProfileUpdateRequest(BaseModel):
    """
    Partial update payload for /student/profile.
    All fields are optional to support progressive, section-by-section persistence.
    """
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    age: Optional[int] = Field(None, ge=10, le=80)
    location: Optional[str] = Field(None, max_length=255)
    education_level: Optional[str] = Field(None, max_length=100)
    education_stream: Optional[str] = Field(None, max_length=100)
    institution: Optional[str] = Field(None, max_length=255)
    academic_strengths: Optional[List[str]] = None
    household_income_range: Optional[str] = Field(None, max_length=50)
    interests: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    work_location_preferences: Optional[List[str]] = None
    career_preferences: Optional[List[str]] = None
    career_intent: Optional[str] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            cleaned = v.strip()
            if not cleaned:
                raise ValueError("Name cannot be an empty string")
            return cleaned
        return v

    @field_validator("household_income_range")
    @classmethod
    def validate_income(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v != "":
            if v not in VALID_INCOME_RANGES:
                raise ValueError(f"Invalid household income range. Must be one of: {', '.join(VALID_INCOME_RANGES)}")
        return v

    @field_validator("career_intent")
    @classmethod
    def validate_intent(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v != "":
            from schemas.career import VALID_CAREER_INTENTS
            if v not in VALID_CAREER_INTENTS:
                raise ValueError(f"Invalid career intent. Must be one of: {', '.join(VALID_CAREER_INTENTS)}")
        return v
