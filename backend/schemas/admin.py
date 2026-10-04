"""
Admin Dashboard Schemas (Pydantic v2).
Strongly typed models for platform overview, families, students, parents,
sessions, and human escalations.
"""

from typing import Optional, List, Dict
from pydantic import BaseModel, Field


class AdminOverviewStats(BaseModel):
    total_families: int = Field(default=0, description="Total registered family units")
    total_students: int = Field(default=0, description="Total student profiles")
    total_parents: int = Field(default=0, description="Total parent profiles")
    total_sessions: int = Field(default=0, description="Total counselling sessions")
    total_escalations: int = Field(default=0, description="Total human escalations")
    active_sessions: int = Field(default=0, description="Currently active sessions")
    pending_escalations: int = Field(default=0, description="Escalations awaiting counsellor review")



class AdminFamilyStudent(BaseModel):
    id: int
    name: str
    education_level: Optional[str] = None
    career_interest: Optional[str] = None
    location: Optional[str] = None


class AdminFamilyParent(BaseModel):
    id: int
    name: str
    relationship: Optional[str] = None
    occupation: Optional[str] = None


class AdminFamilyItem(BaseModel):
    id: str = Field(..., description="Family identifier, e.g. FAM-9042")
    name: str = Field(..., description="Family surname / display name")
    students_count: int = Field(default=0)
    parents_count: int = Field(default=0)
    students: List[AdminFamilyStudent] = Field(default_factory=list)
    parents: List[AdminFamilyParent] = Field(default_factory=list)
    last_activity: str = Field(default="Active")
    status: str = Field(default="Active")


class AdminStudentItem(BaseModel):
    id: int
    name: str
    family_id: str
    family_name: str
    education_level: str
    location: str
    career_interest: str
    sessions_count: int
    last_activity: str
    status: str


class AdminParentItem(BaseModel):
    id: int
    name: str
    family_id: str
    relationship_to_student: str
    linked_student_name: str
    linked_student_id: Optional[int] = None
    contact_identifier: str
    occupation: Optional[str] = None
    concerns_count: int
    last_activity: str
    status: str


class AdminSessionItem(BaseModel):
    id: int
    student_id: int
    student_name: str
    family_name: str
    session_type: str
    counsellor: str
    messages_count: int
    status: str
    has_escalation: bool
    escalation_priority: Optional[str] = None
    started_at: str
    ended_at: Optional[str] = None


class AdminEscalationItem(BaseModel):
    id: int
    counselling_session_id: Optional[int] = None
    student_id: Optional[int] = None
    student_name: str
    parent_name: Optional[str] = None
    family_name: str
    career_title: Optional[str] = None
    concern: Optional[str] = None
    reason: Optional[str] = None
    priority: str
    status: str
    assigned_counsellor: Optional[str] = None
    conversation_summary: Optional[str] = None
    created_at: str
    resolved_at: Optional[str] = None


class AdminEscalationUpdateRequest(BaseModel):
    status: str = Field(..., description="New status: pending, in_progress, resolved")
    assigned_to_user_id: Optional[int] = None
    resolution_notes: Optional[str] = None


class AdminOverviewResponse(BaseModel):
    stats: AdminOverviewStats
    recent_sessions: List[AdminSessionItem] = Field(default_factory=list)
    recent_escalations: List[AdminEscalationItem] = Field(default_factory=list)


# =========================================================================
# A2: Admin Analytics Schemas
# =========================================================================

class AdminAnalyticsSummary(BaseModel):
    total_sessions: int = Field(default=0, description="Total counselling sessions in filtered period")
    total_messages: int = Field(default=0, description="Total counselling messages in filtered period")
    total_concerns: int = Field(default=0, description="Total parent concerns recorded in filtered period")
    total_escalations: int = Field(default=0, description="Total human escalations flagged in filtered period")
    resolved_escalations: int = Field(default=0, description="Resolved human escalations in filtered period")
    observed_sentiment_shift: Optional[str] = Field(
        default=None,
        description="Observed positive shift rate or summary text, None if insufficient data"
    )
    has_sentiment_data: bool = Field(default=False)


class VolumeDataPoint(BaseModel):
    date: str = Field(..., description="Date identifier YYYY-MM-DD")
    sessions: int = Field(default=0)
    messages: int = Field(default=0)


class CounsellingVolumeAnalytics(BaseModel):
    total_sessions: int
    total_messages: int
    activity_trends: List[VolumeDataPoint] = Field(default_factory=list)


class ConcernCategoryItem(BaseModel):
    category: str
    count: int
    percentage: float


class ConcernSeverityItem(BaseModel):
    severity: str
    count: int
    percentage: float


class ConcernStatusItem(BaseModel):
    status: str
    count: int
    percentage: float


class ConcernTrendPoint(BaseModel):
    date: str
    count: int
    categories: Dict[str, int] = Field(default_factory=dict)


class ConcernTrendItem(BaseModel):
    period: str
    count: int
    categories: Dict[str, int] = Field(default_factory=dict)


class CareerConcernBreakdownItem(BaseModel):
    career_title: str
    count: int
    top_concern: Optional[str] = None
    percentage: float = 0.0


class ParentConcernsAnalytics(BaseModel):
    total: int = 0
    total_concerns: int = 0
    categories: List[ConcernCategoryItem] = Field(default_factory=list)
    trend: List[ConcernTrendItem] = Field(default_factory=list)
    trends: List[ConcernTrendPoint] = Field(default_factory=list)
    by_severity: List[ConcernSeverityItem] = Field(default_factory=list)
    by_status: List[ConcernStatusItem] = Field(default_factory=list)
    highest_concern: Optional[str] = None
    high_severity_count: int = 0
    resolved_count: int = 0
    resolution_rate: float = 0.0
    career_breakdown: List[CareerConcernBreakdownItem] = Field(default_factory=list)



class ResistanceByCareerItem(BaseModel):
    career_title: str
    count: int
    top_concern: Optional[str] = None


class ResistanceAreaItem(BaseModel):
    area: str
    count: int
    percentage: float


class ResistanceTrendPoint(BaseModel):
    date: str
    count: int


class ParentResistanceAnalytics(BaseModel):
    parents_expressing_concerns: int
    total_resistance_events: int
    top_resistance_areas: List[ResistanceAreaItem] = Field(default_factory=list)
    resistance_by_career: List[ResistanceByCareerItem] = Field(default_factory=list)
    resistance_trends: List[ResistanceTrendPoint] = Field(default_factory=list)


class EscalationBreakdownItem(BaseModel):
    key: str
    count: int
    percentage: float = 0.0


class EscalationTrendPoint(BaseModel):
    date: str
    count: int


class EscalationAnalytics(BaseModel):
    total: int
    pending: int
    in_progress: int
    resolved: int
    dismissed: int = 0
    trends: List[EscalationTrendPoint] = Field(default_factory=list)
    by_status: List[EscalationBreakdownItem] = Field(default_factory=list)
    by_priority: List[EscalationBreakdownItem] = Field(default_factory=list)
    by_concern: List[EscalationBreakdownItem] = Field(default_factory=list)
    by_career: List[EscalationBreakdownItem] = Field(default_factory=list)
    by_language: List[EscalationBreakdownItem] = Field(default_factory=list)


class SentimentCategoryCount(BaseModel):
    sentiment: str
    count: int = 0
    percentage: float = 0.0


class SentimentStageData(BaseModel):
    stage_name: str
    is_available: bool = False
    total: int = 0
    distribution: Dict[str, int] = Field(default_factory=dict)
    categories: List[SentimentCategoryCount] = Field(default_factory=list)


class SentimentComparisonItem(BaseModel):
    sentiment: str
    before_count: int = 0
    before_percentage: float = 0.0
    during_count: Optional[int] = None
    during_percentage: Optional[float] = None
    after_count: int = 0
    after_percentage: float = 0.0
    change_percentage: Optional[float] = None


class SentimentTrendPoint(BaseModel):
    date: str
    positive: int = 0
    neutral: int = 0
    concerned: int = 0
    negative: int = 0
    total: int = 0


class SentimentShiftAnalytics(BaseModel):
    title: str = "Observed Sentiment Shift"
    has_sentiment_data: bool = False
    total_events: int = 0
    total_sessions_analyzed: int = 0
    has_before_data: bool = False
    has_during_data: bool = False
    has_after_data: bool = False
    can_compare: bool = False
    status_message: str = Field(default="No sentiment data available yet.")
    methodology_note: str = Field(
        default="Observed sentiment is based on recorded sentiment events. "
        "It describes patterns in the available data and does not establish that counselling caused a change in sentiment."
    )
    before: SentimentStageData = Field(default_factory=lambda: SentimentStageData(stage_name="Before counselling"))
    during: Optional[SentimentStageData] = None
    after: SentimentStageData = Field(default_factory=lambda: SentimentStageData(stage_name="After counselling"))
    comparison: List[SentimentComparisonItem] = Field(default_factory=list)
    trends: List[SentimentTrendPoint] = Field(default_factory=list)

    # Legacy fields preserved for backward compatibility
    initial_distribution: Dict[str, int] = Field(default_factory=dict)
    final_distribution: Dict[str, int] = Field(default_factory=dict)
    overall_distribution: Dict[str, int] = Field(default_factory=dict)
    positive_shift_rate: Optional[float] = None


class FilterOptionItem(BaseModel):
    id: str | int
    label: str


class AnalyticsFilterOptions(BaseModel):
    careers: List[FilterOptionItem] = Field(default_factory=list)
    concerns: List[str] = Field(default_factory=list)
    languages: List[str] = Field(default_factory=list)
    severities: List[str] = Field(default_factory=list)
    statuses: List[str] = Field(default_factory=list)



class AdminAnalyticsResponse(BaseModel):
    summary: AdminAnalyticsSummary
    volume: CounsellingVolumeAnalytics
    concerns: ParentConcernsAnalytics
    resistance: ParentResistanceAnalytics
    escalations: EscalationAnalytics
    sentiment: SentimentShiftAnalytics
    filter_options: AnalyticsFilterOptions
    applied_date_range: str


# =========================================================================
# A5: Geographic Analytics Schemas
# =========================================================================

class GeographicLocationItem(BaseModel):
    location: str = Field(..., description="State, District, or Region name")
    count: int = Field(default=0)
    percentage: float = Field(default=0.0)


class GeographicTrendPoint(BaseModel):
    date: str = Field(..., description="Date key YYYY-MM-DD")
    count: int = Field(default=0)


class GeographicSummary(BaseModel):
    total: int = Field(default=0, description="Total activity count across all locations in filter")
    top_state: Optional[str] = None
    top_district: Optional[str] = None
    top_region: Optional[str] = None
    top_career: Optional[str] = None
    top_concern: Optional[str] = None
    is_demo_data: bool = Field(default=True)


class GeographicAnalyticsResponse(BaseModel):
    is_demo_data: bool = Field(default=True)
    demo_note: str = Field(
        default="These analytics currently use generated data and do not represent real-world statistics."
    )
    summary: GeographicSummary = Field(default_factory=GeographicSummary)
    states: List[GeographicLocationItem] = Field(default_factory=list)
    districts: List[GeographicLocationItem] = Field(default_factory=list)
    regions: List[GeographicLocationItem] = Field(default_factory=list)
    trend: List[GeographicTrendPoint] = Field(default_factory=list)
    available_states: List[str] = Field(default_factory=list)
    available_districts: List[str] = Field(default_factory=list)
    available_regions: List[str] = Field(default_factory=list)
    state_districts: Dict[str, List[str]] = Field(default_factory=dict)
    available_concerns: List[str] = Field(
        default_factory=lambda: [
            "Income", "Job Security", "Further Education", "Social Perception",
            "Distance", "Working Conditions", "Career Growth", "Other"
        ]
    )
    available_careers: List[FilterOptionItem] = Field(default_factory=list)
