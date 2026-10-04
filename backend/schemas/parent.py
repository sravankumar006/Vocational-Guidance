"""
Pydantic schemas for the Parent domain and Child Context Dashboard (Phase 5 Brick 27).
Guaranteed to sanitize responses: strictly no Aadhaar, passwords, or unrelated student data.
"""

from typing import Optional, List
from pydantic import BaseModel, Field


class ParentChildCareer(BaseModel):
    """Authoritative career identity and status derived from database records."""
    id: int
    title: str
    sector: Optional[str] = None
    is_selected: bool = False
    source: str = "recommendation"  # "selected", "recommendation", "intent"


class ParentChildContextResponse(BaseModel):
    """
    Sanitized context for the authenticated parent's linked student.
    Enforces strict access control and neutral empty states.
    """
    has_linked_student: bool
    student_id: Optional[int] = None
    child_name: Optional[str] = None
    relationship_type: Optional[str] = None  # e.g., "Mother", "Father", "Guardian"
    education_level: Optional[str] = None
    location: Optional[str] = None
    career: Optional[ParentChildCareer] = None
    career_status_text: str = "Career not selected yet"
    message: Optional[str] = None


class CreateParentConcernRequest(BaseModel):
    """Payload to record an authentic parental worry or objection (Phase 5 Brick 28)."""
    concern_type: str = Field(..., max_length=100, description="Exact concern category, e.g. Income, Job Security, etc.")
    description: Optional[str] = Field(None, description="Optional parent-provided text or transcript.")
    severity: Optional[str] = Field("medium", description="Severity level: low, medium, high")


class ParentConcernResponse(BaseModel):
    """Sanitized concern record returned to the parent."""
    id: int
    parent_profile_id: int
    student_profile_id: Optional[int] = None
    concern_type: str
    description: Optional[str] = None
    severity: str
    status: str
    created_at: str
