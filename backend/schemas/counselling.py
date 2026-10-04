"""Pydantic schemas for the AI Counselling and Decision-Support Service (Phase 5 Bricks 20 & 21).

Provides the canonical, provider-independent structured response contract
shared across frontend, API, counselling service, and AI providers.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


# ==============================================================================
# 1. CANONICAL RESPONSE SCHEMA COMPONENTS
# ==============================================================================

class CounsellingCareer(BaseModel):
    """Authoritative career entity preserved from deterministic engine or verified records."""
    id: Optional[int] = Field(None, description="Primary key identifier of verified occupation")
    title: str = Field(default="", description="Formal vocational trade or occupation title")
    description: str = Field(default="", description="Verified trade overview and scope")
    compatibility_score: Optional[int] = Field(
        None, ge=0, le=100, description="Deterministic match percentage from Brick 14 (null if uncalculated)"
    )
    reasons: List[str] = Field(default_factory=list, description="Explainable deterministic matching rationales")

    model_config = ConfigDict(extra="ignore")


class CounsellingEvidenceItem(BaseModel):
    """Concise verifiable factual evidence citation derived from the RAG retriever."""
    id: str = Field(default="", description="Unique knowledge item ID e.g. occ:12, course:34")
    type: str = Field(default="", description="Domain e.g. occupation, course, salary_outcome, provider, career_path")
    title: str = Field(default="", description="Title of the verified fact record")
    content: str = Field(default="", description="Explanatory content snippet or factual summary")
    relevance: float = Field(default=0.0, ge=0.0, le=1.0, description="Hybrid retriever relevance score (0.0 to 1.0)")
    verified: bool = Field(default=True, description="Strictly true for statutory records")
    source: str = Field(default="", description="Issuing authority or registry name")
    source_url: Optional[str] = Field(default=None, description="Official portal verification URL")

    model_config = ConfigDict(extra="ignore")


class CounsellingCareerPathStep(BaseModel):
    """Structured progression milestone derived from verified career paths."""
    id: Optional[str] = Field(default=None, description="Unique stage identifier")
    step: int = Field(..., ge=1, description="Progression sequence index")
    title: str = Field(..., description="Role title or credential milestone")
    description: str = Field(default="", description="Milestone responsibilities or progression criteria")
    duration: Optional[str] = Field(default=None, description="Verified duration for stage (e.g. '1 year', '6 months')")
    qualification: Optional[str] = Field(default=None, description="Verified qualification (e.g. '10th pass', 'ITI certificate')")
    nsqf_level: Optional[str] = Field(default=None, description="Verified NSQF Level (e.g. 'NSQF Level 4')")
    type: Optional[str] = Field(default=None, description="Stage category e.g. 'education', 'career', 'further_education'")
    is_current: Optional[bool] = Field(default=None, description="Explicit indicator if student is currently at this stage")
    course_id: Optional[int] = Field(default=None, description="Associated qualification course ID if mapped")

    model_config = ConfigDict(extra="ignore")


class CounsellingSourceItem(BaseModel):
    """User-facing provenance citation derived from retrieved factual evidence."""
    title: str = Field(..., description="Name of the cited document, curriculum, or registry")
    source: str = Field(..., description="Official government or statutory authority")
    url: Optional[str] = Field(default=None, description="Canonical reference web address")
    type: str = Field(default="", description="Knowledge domain or document category")

    model_config = ConfigDict(extra="ignore")


class AICounsellingGeneration(BaseModel):
    """Strict schema for AI model output generation.
    
    Ensures AI models focus strictly on explaining evidence, offering follow-up questions,
    and specifying language without fabricating database-owned facts.
    """
    message: str = Field(..., description="Comprehensive, empathetic, evidence-grounded counselling message.")
    suggested_questions: List[str] = Field(default_factory=list, description="3 to 5 relevant follow-up questions for the student.")
    language: str = Field(default="en", description="ISO language identifier of response")

    model_config = ConfigDict(extra="ignore")


class CounsellingCareerMetrics(BaseModel):
    """Authoritative factual evidence metrics for career decision support (Brick 24).
    
    Populated strictly from verified database records (JobOutcome, Course, CareerPath)
    and RAG evidence. Never generated or estimated by the LLM.
    """
    # Salary
    salary_min: Optional[int] = Field(default=None, description="Verified minimum monthly salary in INR")
    salary_max: Optional[int] = Field(default=None, description="Verified maximum monthly salary in INR")
    salary_currency: str = Field(default="INR", description="Currency code")
    salary_period: str = Field(default="month", description="Salary period e.g. month, year")
    experience_level: Optional[str] = Field(default=None, description="Experience tier e.g. Entry level")
    salary_source: Optional[str] = Field(default=None, description="Issuing authority for salary data")
    salary_source_url: Optional[str] = Field(default=None, description="Official portal verification URL")

    # Placement / Employment Outcome
    placement_rate: Optional[float] = Field(default=None, description="Verified percentage placement rate")
    placement_period: Optional[str] = Field(default=None, description="Reporting survey period")
    placement_source: Optional[str] = Field(default=None, description="Issuing authority for placement data")
    placement_source_url: Optional[str] = Field(default=None, description="Official portal verification URL")

    # Training Duration & Qualification
    training_duration: Optional[str] = Field(default=None, description="Official course/training duration")
    qualification: Optional[str] = Field(default=None, description="Conferred or entry qualification")
    nsqf_level: Optional[str] = Field(default=None, description="Verified NSQF qualification level")
    training_type: Optional[str] = Field(default=None, description="Delivery mode or training category")
    training_source: Optional[str] = Field(default=None, description="Issuing authority for training data")
    training_source_url: Optional[str] = Field(default=None, description="Official portal verification URL")

    # Job Availability / Demand
    job_availability: Optional[str] = Field(default=None, description="Verified availability classification")
    job_openings_count: Optional[int] = Field(default=None, description="Verified active registered openings")
    job_region: Optional[str] = Field(default=None, description="Geographic distribution or state")
    job_availability_source: Optional[str] = Field(default=None, description="Issuing authority for demand statistics")
    job_availability_source_url: Optional[str] = Field(default=None, description="Official portal verification URL")

    model_config = ConfigDict(extra="ignore")


class CounsellingResponse(BaseModel):
    """Canonical, provider-independent counselling response contract."""
    message: str = Field(..., description="Detailed or concise grounded counselling message without artificial length limits")
    language: str = Field(default="en", description="Language code of response e.g. 'en'")
    career: CounsellingCareer = Field(default_factory=CounsellingCareer, description="Active career identity and deterministic scores")
    evidence: List[CounsellingEvidenceItem] = Field(default_factory=list, description="Verifiable retrieved factual citations")
    career_path: List[CounsellingCareerPathStep] = Field(default_factory=list, description="Verified progressive roadmap steps")
    further_education: Optional[List[str]] = Field(default=None, description="Optional further education pathways e.g. Diploma, Advanced certification")
    career_metrics: Optional[CounsellingCareerMetrics] = Field(default=None, description="Verified factual career metrics from statutory records")
    suggested_questions: List[str] = Field(default_factory=list, description="Contextually relevant follow-up questions (3-5)")
    confidence: float = Field(..., ge=0.0, le=1.0, description="System counselling confidence indicator (0.0 to 1.0)")
    requires_human: bool = Field(default=False, description="True if human counsellor escalation is recommended or active")
    sources: List[CounsellingSourceItem] = Field(default_factory=list, description="User-facing source attribution provenance")

    # Optional metadata preserved for API transport compatibility with Brick 20
    session_id: Optional[int] = Field(None, description="Optional session identifier")
    created_at: Optional[datetime] = Field(None, description="Optional generation timestamp")

    model_config = ConfigDict(extra="ignore")


# ==============================================================================
# 2. SESSION & MESSAGE REQUEST/RESPONSE SCHEMAS
# ==============================================================================

class CounsellingMessageItem(BaseModel):
    """Individual conversational turn within a session."""
    id: int
    session_id: int
    sender_type: str
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, extra="ignore")


class CounsellingSessionSummary(BaseModel):
    """High-level summary of a counselling session."""
    id: int
    student_profile_id: int
    status: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    message_count: int = 0

    model_config = ConfigDict(from_attributes=True, extra="ignore")


class CounsellingSessionDetail(BaseModel):
    """Detailed view of a counselling session including recent message history."""
    id: int
    student_profile_id: int
    status: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    messages: List[CounsellingMessageItem] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True, extra="ignore")


class CounsellingContextPayload(BaseModel):
    """Structured contextual payload for explain actions (Brick 26).
    
    Identifies the exact factual entity and intent the user wants explained,
    allowing the backend to retrieve authoritative facts rather than relying on
    unstructured or speculative text.
    """
    intent: str = Field(
        ...,
        description="Structured explanation intent (e.g. explain_career, explain_salary, explain_placement, explain_career_growth, explain_job_availability, explain_training, explain_nsqf, explain_further_education)",
    )
    entity_type: str = Field(
        ...,
        description="Domain entity classification (e.g. career, occupation, course, provider, salary, placement, pathway, training, evidence)",
    )
    entity_id: str = Field(
        ...,
        description="Authoritative database or domain primary identifier for the entity",
    )
    entity_title: Optional[str] = Field(
        None,
        description="Optional display title or name for user-facing attribution",
    )

    model_config = ConfigDict(extra="ignore")


class CreateCounsellingSessionRequest(BaseModel):
    """Request payload to initiate a new counselling session."""
    student_id: Optional[int] = Field(None, description="Target student profile ID (optional for students)")
    initial_question: Optional[str] = Field(None, max_length=5000)
    career_id: Optional[int] = None
    language: Optional[str] = Field("en", description="Optional requested language")
    context: Optional[CounsellingContextPayload] = Field(
        None,
        description="Optional structured explain context for automatic initial guidance",
    )

    model_config = ConfigDict(extra="ignore")


class SendCounsellingMessageRequest(BaseModel):
    """Request payload to post a user question to an active session."""
    message: str = Field(..., min_length=1, max_length=5000, description="The user's question or concern")
    career_id: Optional[int] = Field(None, description="Optional target career context ID")
    language: Optional[str] = Field("en", description="Optional requested language")
    context: Optional[CounsellingContextPayload] = Field(
        None,
        description="Optional structured explain context for contextual grounding",
    )

    model_config = ConfigDict(extra="ignore")


# ==============================================================================
# 3. HUMAN COUNSELLOR ESCALATION SCHEMAS (PHASE 9 BRICK 31)
# ==============================================================================

class CreateEscalationRequest(BaseModel):
    """Payload to initiate a human counsellor escalation (Brick 31)."""
    session_id: Optional[int] = Field(None, description="Optional active counselling session ID")
    career_id: Optional[int] = Field(None, description="Optional candidate career ID (validated server-side)")
    concern: Optional[str] = Field(None, description="Primary concern category e.g. Income, Job Security, etc.")
    language: Optional[str] = Field("en", description="Preferred language for counselling e.g. 'te' or 'en'")
    notes: Optional[str] = Field(None, max_length=2000, description="Optional brief notes or question context")

    model_config = ConfigDict(extra="ignore")


class EscalationResponse(BaseModel):
    """Structured case-record response for a human counsellor escalation."""
    id: int
    student_id: Optional[int] = None
    parent_id: Optional[int] = None
    career_id: Optional[int] = None
    career_title: Optional[str] = None
    counselling_session_id: Optional[int] = None
    concern: Optional[str] = None
    reason: Optional[str] = None
    priority: Optional[str] = "medium"
    student_name: Optional[str] = None
    parent_name: Optional[str] = None
    assigned_counsellor: Optional[str] = None
    counsellor_phone: Optional[str] = "7842547928"
    emergency_sms: Optional[str] = "emergency this parent/student have concerns about this"
    call_url: Optional[str] = "tel:7842547928"
    sms_url: Optional[str] = "sms:7842547928?body=emergency%20this%20parent%2Fstudent%20have%20concerns%20about%20this"
    language: str = "en"
    conversation_summary: Optional[str] = None
    status: str = "pending"
    created_at: datetime
    updated_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True, extra="ignore")
