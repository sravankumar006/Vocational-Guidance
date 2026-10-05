"""
Career Exploration, Search, and Intent Schemas (Phase 3 Bricks 12 & 13).
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator


VALID_CAREER_INTENTS = [
    "I already have a career in mind",
    "Help me choose a career",
    "I want a job soon",
    "I want vocational training",
    "I want to continue studying",
]


class CareerIntentUpdateRequest(BaseModel):
    career_intent: str = Field(..., description="Selected career exploration intent")

    @field_validator("career_intent")
    @classmethod
    def validate_intent(cls, v: str) -> str:
        clean = v.strip()
        if clean not in VALID_CAREER_INTENTS:
            raise ValueError(f"Invalid career intent. Must be one of: {', '.join(VALID_CAREER_INTENTS)}")
        return clean


class CareerIntentResponse(BaseModel):
    career_intent: Optional[str] = None
    message: Optional[str] = None


class TrainingProviderBasic(BaseModel):
    id: int
    name: str
    location: Optional[str] = None
    provider_type: Optional[str] = None
    contact_info: Optional[Any] = None


class CourseSummary(BaseModel):
    id: int
    name: str
    duration: Optional[str] = None
    qualification_level: Optional[str] = None
    sector: Optional[str] = None
    delivery_mode: Optional[str] = None
    provider: Optional[TrainingProviderBasic] = None
    data_source_name: Optional[str] = None


class CareerSummary(BaseModel):
    id: int
    name: str
    sector: Optional[str] = None
    description: Optional[str] = None
    common_roles: List[str] = Field(default_factory=list)
    self_employment: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_currency: str = "INR"
    average_placement_rate: Optional[float] = None
    qualification_levels: List[str] = Field(default_factory=list)
    training_durations: List[str] = Field(default_factory=list)
    courses_count: int = 0
    providers_count: int = 0
    top_regions: List[str] = Field(default_factory=list)
    source: str = "Ministry of Skill Development & Entrepreneurship (MSDE) / NSDC"


class SalaryStatistics(BaseModel):
    min_monthly: Optional[int] = None
    max_monthly: Optional[int] = None
    avg_min_monthly: Optional[int] = None
    avg_max_monthly: Optional[int] = None
    currency: str = "INR"


class PlacementStatistics(BaseModel):
    average_placement_rate: Optional[float] = None
    total_empirical_records: int = 0


class DataProvenance(BaseModel):
    source_name: str
    source_type: Optional[str] = None
    version: Optional[str] = None
    url: Optional[str] = None
    is_verified: bool = True
    total_records: int = 0
    notice: str = "Empirical vocational reference dataset (SIH26241). Verified historical placement metrics."


class CareerDetailResponse(BaseModel):
    id: int
    name: str
    sector: Optional[str] = None
    description: Optional[str] = None
    common_roles: List[str] = Field(default_factory=list)
    self_employment: Optional[str] = None
    progression_ladder: List[str] = Field(default_factory=list)
    further_education_options: Optional[str] = None
    courses: List[CourseSummary] = Field(default_factory=list)
    salary_statistics: SalaryStatistics
    placement_statistics: PlacementStatistics
    regional_distribution: List[Dict[str, Any]] = Field(default_factory=list)
    data_provenance: DataProvenance


class CareerFilterOptions(BaseModel):
    sectors: List[str] = Field(default_factory=list)
    qualification_levels: List[str] = Field(default_factory=list)
    durations: List[str] = Field(default_factory=list)
    states: List[str] = Field(default_factory=list)
    min_salary_bound: int = 0
    max_salary_bound: int = 50000


class CareerSearchResponse(BaseModel):
    items: List[CareerSummary]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool
    filter_options: CareerFilterOptions


class FactorEvaluation(BaseModel):
    factor: str
    result: str
    summary: str
    score: Optional[float] = None


class CareerRecommendationItem(BaseModel):
    career: CareerSummary
    compatibility_score: int = Field(..., ge=0, le=100)
    matched_factors: List[FactorEvaluation] = Field(default_factory=list)
    mismatched_factors: List[FactorEvaluation] = Field(default_factory=list)
    unknown_factors: List[FactorEvaluation] = Field(default_factory=list)


class CareerRecommendationsResponse(BaseModel):
    recommendations: List[CareerRecommendationItem] = Field(
        ..., max_length=3, description="Deterministic Top 3 vocational recommendations"
    )
    weights_used: Dict[str, float]
    algorithm: str = "deterministic_compatibility_v1"


class CourseListResponse(BaseModel):
    items: List[CourseSummary]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool

