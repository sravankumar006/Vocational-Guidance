"""
Pydantic schemas for Admin Data Management (A7 — Data Management).
Covers Courses, Occupations, Providers, Outcomes, Career Paths, and Data Sources.
"""

from datetime import datetime
from typing import Optional, List, Any, Generic, TypeVar
from pydantic import BaseModel, Field, field_validator, ConfigDict

T = TypeVar("T")


# -----------------------------------------------------------------------------
# Generic Paginated Response
# -----------------------------------------------------------------------------
class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int


# -----------------------------------------------------------------------------
# Options for Form Selects
# -----------------------------------------------------------------------------
class OptionItem(BaseModel):
    id: int
    name: str
    extra: Optional[str] = None


class DataOptionsResponse(BaseModel):
    sources: List[OptionItem] = Field(default_factory=list)
    occupations: List[OptionItem] = Field(default_factory=list)
    providers: List[OptionItem] = Field(default_factory=list)
    career_paths: List[OptionItem] = Field(default_factory=list)
    sectors: List[str] = Field(default_factory=list)


# -----------------------------------------------------------------------------
# Tab Status Counts
# -----------------------------------------------------------------------------
class EntityStatusCount(BaseModel):
    total: int = 0
    demo: int = 0
    unverified: int = 0
    verified: int = 0
    inactive: int = 0


class DataStatsResponse(BaseModel):
    courses: EntityStatusCount = Field(default_factory=EntityStatusCount)
    occupations: EntityStatusCount = Field(default_factory=EntityStatusCount)
    providers: EntityStatusCount = Field(default_factory=EntityStatusCount)
    outcomes: EntityStatusCount = Field(default_factory=EntityStatusCount)
    career_paths: EntityStatusCount = Field(default_factory=EntityStatusCount)
    sources: EntityStatusCount = Field(default_factory=EntityStatusCount)


# -----------------------------------------------------------------------------
# 1. Course Schemas
# -----------------------------------------------------------------------------
class CourseBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    duration: Optional[str] = None
    qualification_level: Optional[str] = None
    sector: Optional[str] = None
    delivery_mode: Optional[str] = None
    provider_id: Optional[int] = None
    data_source_id: Optional[int] = None


class CourseCreate(CourseBase):
    status: Optional[str] = "unverified"


class CourseUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    duration: Optional[str] = None
    qualification_level: Optional[str] = None
    sector: Optional[str] = None
    delivery_mode: Optional[str] = None
    provider_id: Optional[int] = None
    data_source_id: Optional[int] = None
    status: Optional[str] = None


class CourseResponse(CourseBase):
    id: int
    status: str
    verified_at: Optional[datetime] = None
    verified_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    provider_name: Optional[str] = None
    data_source_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# -----------------------------------------------------------------------------
# 2. Occupation Schemas
# -----------------------------------------------------------------------------
class OccupationBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    sector: Optional[str] = None
    skill_requirements: Optional[Any] = None
    data_source_id: Optional[int] = None


class OccupationCreate(OccupationBase):
    status: Optional[str] = "unverified"


class OccupationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    sector: Optional[str] = None
    skill_requirements: Optional[Any] = None
    data_source_id: Optional[int] = None
    status: Optional[str] = None


class OccupationResponse(OccupationBase):
    id: int
    status: str
    verified_at: Optional[datetime] = None
    verified_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    data_source_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# -----------------------------------------------------------------------------
# 3. Training Provider Schemas
# -----------------------------------------------------------------------------
class TrainingProviderBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    location: Optional[str] = None
    provider_type: Optional[str] = None
    contact_info: Optional[Any] = None
    data_source_id: Optional[int] = None


class TrainingProviderCreate(TrainingProviderBase):
    status: Optional[str] = "unverified"


class TrainingProviderUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    location: Optional[str] = None
    provider_type: Optional[str] = None
    contact_info: Optional[Any] = None
    data_source_id: Optional[int] = None
    status: Optional[str] = None


class TrainingProviderResponse(TrainingProviderBase):
    id: int
    status: str
    verified_at: Optional[datetime] = None
    verified_by: Optional[int] = None
    course_count: int = 0
    created_at: datetime
    updated_at: datetime
    data_source_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# -----------------------------------------------------------------------------
# 4. Job Outcome Schemas
# -----------------------------------------------------------------------------
class JobOutcomeBase(BaseModel):
    occupation_id: Optional[int] = None
    career_path_id: Optional[int] = None
    data_source_id: Optional[int] = None
    employment_rate: Optional[float] = Field(None, ge=0.0, le=100.0, description="Placement rate percentage 0-100")
    salary_range_min: Optional[int] = Field(None, ge=0)
    salary_range_max: Optional[int] = Field(None, ge=0)
    salary_currency: str = Field(default="INR", max_length=10)
    experience_level: Optional[str] = None
    region: Optional[str] = None

    @field_validator("salary_range_max")
    @classmethod
    def validate_salary_max(cls, v, info):
        min_val = info.data.get("salary_range_min")
        if v is not None and min_val is not None and v < min_val:
            raise ValueError("salary_range_max cannot be less than salary_range_min")
        return v


class JobOutcomeCreate(JobOutcomeBase):
    status: Optional[str] = "unverified"


class JobOutcomeUpdate(BaseModel):
    occupation_id: Optional[int] = None
    career_path_id: Optional[int] = None
    data_source_id: Optional[int] = None
    employment_rate: Optional[float] = Field(None, ge=0.0, le=100.0)
    salary_range_min: Optional[int] = Field(None, ge=0)
    salary_range_max: Optional[int] = Field(None, ge=0)
    salary_currency: Optional[str] = None
    experience_level: Optional[str] = None
    region: Optional[str] = None
    status: Optional[str] = None


class JobOutcomeResponse(JobOutcomeBase):
    id: int
    status: str
    verified_at: Optional[datetime] = None
    verified_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    occupation_name: Optional[str] = None
    career_path_name: Optional[str] = None
    data_source_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# -----------------------------------------------------------------------------
# 5. Career Path Schemas
# -----------------------------------------------------------------------------
class CareerPathBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    progression_ladder: Optional[Any] = None
    estimated_duration: Optional[str] = None
    data_source_id: Optional[int] = None


class CareerPathCreate(CareerPathBase):
    status: Optional[str] = "unverified"


class CareerPathUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    progression_ladder: Optional[Any] = None
    estimated_duration: Optional[str] = None
    data_source_id: Optional[int] = None
    status: Optional[str] = None


class CareerPathResponse(CareerPathBase):
    id: int
    status: str
    verified_at: Optional[datetime] = None
    verified_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    data_source_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# -----------------------------------------------------------------------------
# 6. Data Source Schemas
# -----------------------------------------------------------------------------
class DataSourceBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    source_type: Optional[str] = None
    url: Optional[str] = None
    description: Optional[str] = None
    version: Optional[str] = None
    retrieved_at: Optional[datetime] = None


class DataSourceCreate(DataSourceBase):
    status: Optional[str] = "unverified"


class DataSourceUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    source_type: Optional[str] = None
    url: Optional[str] = None
    description: Optional[str] = None
    version: Optional[str] = None
    retrieved_at: Optional[datetime] = None
    status: Optional[str] = None


class DataSourceResponse(DataSourceBase):
    id: int
    status: str
    verified_at: Optional[datetime] = None
    verified_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
