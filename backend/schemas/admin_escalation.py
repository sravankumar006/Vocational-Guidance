from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


class EscalationMessageItem(BaseModel):
    id: int
    sender_type: str
    content: str
    confidence: Optional[float] = None
    requires_human: Optional[bool] = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EscalationListItem(BaseModel):
    id: int
    student_id: Optional[int] = None
    student_name: str
    parent_id: Optional[int] = None
    parent_name: Optional[str] = None
    career_id: Optional[int] = None
    career_title: str = "Career not specified"
    concern: str = "General Guidance"
    language: str = "en"
    conversation_summary: Optional[str] = None
    reason: Optional[str] = None
    priority: str = "medium"
    status: str = "pending"
    counselling_session_id: Optional[int] = None
    assigned_counsellor: Optional[str] = None
    started_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    is_demo: bool = True

    model_config = ConfigDict(from_attributes=True)


class EscalationDetailItem(BaseModel):
    id: int
    student_id: Optional[int] = None
    student_name: str
    student_education: Optional[str] = None
    student_location: Optional[str] = None
    parent_id: Optional[int] = None
    parent_name: Optional[str] = None
    career_id: Optional[int] = None
    career_title: str = "Career not specified"
    career_sector: Optional[str] = None
    career_description: Optional[str] = None
    concern: str = "General Guidance"
    language: str = "en"
    conversation_summary: Optional[str] = None
    reason: Optional[str] = None
    priority: str = "medium"
    status: str = "pending"
    counselling_session_id: Optional[int] = None
    assigned_to_user_id: Optional[int] = None
    assigned_counsellor: Optional[str] = None
    resolved_by_user_id: Optional[int] = None
    resolved_by: Optional[str] = None
    resolution_notes: Optional[str] = None
    started_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    is_demo: bool = True
    conversation_messages: List[EscalationMessageItem] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class EscalationStatusUpdateRequest(BaseModel):
    status: str = Field(..., description="Target status: Pending, In Progress, Resolved")
    resolution_notes: Optional[str] = Field(None, max_length=2000, description="Notes on resolution or handling")
    assigned_to_user_id: Optional[int] = Field(None, description="Optional counsellor user ID to assign")


class EscalationStats(BaseModel):
    total: int = 0
    pending: int = 0
    in_progress: int = 0
    resolved: int = 0


class AdminEscalationsPaginatedResponse(BaseModel):
    items: List[EscalationListItem]
    total: int
    page: int
    page_size: int
    total_pages: int
    stats: EscalationStats

    model_config = ConfigDict(from_attributes=True)
