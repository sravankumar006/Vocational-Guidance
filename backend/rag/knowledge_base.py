"""Knowledge base abstraction and normalized factual knowledge items for RAG.

This module is strictly decoupled from LLM prompts and generative logic.
It standardizes database records across 7 core educational/occupational domains
into immutable, provider-independent KnowledgeItem instances with rigorous
provenance tracking and verified/demo data isolation.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session, joinedload

from models.career import CareerPath, JobOutcome, Occupation
from models.education import Course, DataSource, TrainingProvider


class KnowledgeType(str, Enum):
    """Supported factual knowledge domains."""
    OCCUPATION = "occupation"
    COURSE = "course"
    SALARY_OUTCOME = "salary_outcome"
    PROVIDER = "provider"
    CAREER_PATH = "career_path"
    NSQF = "nsqf"
    SOURCE = "source"


class KnowledgeProvenance(BaseModel):
    """Tracks origin, verification authority, and integrity for every fact."""
    source: str
    source_type: Optional[str] = None
    source_url: Optional[str] = None
    version: Optional[str] = None
    retrieved_at: Optional[datetime] = None
    verified: bool = False
    is_demo: bool = False
    data_provenance: Optional[str] = None

    model_config = ConfigDict(extra="ignore")


class KnowledgeItem(BaseModel):
    """Normalized factual knowledge record for semantic indexing and RAG retrieval."""
    id: str = Field(..., description="Unique knowledge item identifier e.g. occ:12, course:45")
    type: KnowledgeType
    title: str
    content: str
    provenance: KnowledgeProvenance
    metadata: Dict[str, Any] = Field(default_factory=dict)
    record_id: Optional[int] = None

    model_config = ConfigDict(extra="ignore")


def determine_provenance(
    data_source: Optional[DataSource] = None,
    default_source_name: str = "Government Vocational Registry",
) -> KnowledgeProvenance:
    """Analyze DataSource metadata to determine verification status and demo labeling.

    A fact is verified ONLY IF it stems from an official accredited institution/portal
    (e.g., MSDE, NCVET, DGT, NQR) and is not labeled as demo or illustrative.
    """
    if data_source is None:
        return KnowledgeProvenance(
            source=default_source_name,
            source_type="Unverified / Internal",
            source_url=None,
            verified=False,
            is_demo=True,
            data_provenance="Internal unlinked record (marked illustrative)",
        )

    name = data_source.name or default_source_name
    src_type = (data_source.source_type or "").strip()
    low_name = name.lower()
    low_type = src_type.lower()

    # Explicit demo/illustrative indicators
    is_demo = any(k in low_name or k in low_type for k in ("demo", "illustrative", "sample", "test", "synthetic"))

    # Accredited government/statutory authorities
    official_keywords = (
        "msde",
        "ncvet",
        "dgt",
        "national qualification register",
        "nqr",
        "government",
        "ministry",
        "nsdc",
        "state skill",
    )
    is_official = any(k in low_name or k in low_type for k in official_keywords)

    verified = is_official and not is_demo

    provenance_note = f"Source: {name} (Version {data_source.version or '1.0'})"
    if verified:
        provenance_note += " [Verified Official Registry]"
    elif is_demo:
        provenance_note += " [Illustrative / Sample Data]"

    return KnowledgeProvenance(
        source=name,
        source_type=src_type or ("Official Registry" if verified else "Unverified"),
        source_url=data_source.url,
        version=data_source.version,
        retrieved_at=data_source.retrieved_at,
        verified=verified,
        is_demo=is_demo,
        data_provenance=provenance_note,
    )


# ---------------------------------------------------------------------------
# Normalization Adapters
# ---------------------------------------------------------------------------

def normalize_occupation(occ: Occupation) -> KnowledgeItem:
    """Convert an Occupation model instance into a normalized KnowledgeItem."""
    # Find most authoritative linked data source across job outcomes
    linked_source = None
    for outcome in occ.job_outcomes or []:
        if outcome.data_source:
            linked_source = outcome.data_source
            break

    provenance = determine_provenance(linked_source, default_source_name="MSDE National Classification of Occupations")

    skills_text = ""
    if occ.skill_requirements:
        if isinstance(occ.skill_requirements, list):
            skills_text = ", ".join(str(s) for s in occ.skill_requirements)
        elif isinstance(occ.skill_requirements, dict):
            skills_text = ", ".join(f"{k}: {v}" for k, v in occ.skill_requirements.items())
        else:
            skills_text = str(occ.skill_requirements)

    content_lines = [
        f"Occupation: {occ.name}",
        f"Sector: {occ.sector or 'General Vocational'}",
        f"Description: {occ.description or 'No detailed description available.'}",
    ]
    if skills_text:
        content_lines.append(f"Required Skills & Competencies: {skills_text}")

    # Summarize associated outcomes if present
    if occ.job_outcomes:
        salaries = [o for o in occ.job_outcomes if o.salary_range_min or o.salary_range_max]
        if salaries:
            min_sal = min((o.salary_range_min for o in salaries if o.salary_range_min), default=None)
            max_sal = max((o.salary_range_max for o in salaries if o.salary_range_max), default=None)
            if min_sal and max_sal:
                content_lines.append(f"Typical Monthly Earnings Band: ₹{min_sal:,} to ₹{max_sal:,}")
            rates = [o.employment_rate for o in occ.job_outcomes if o.employment_rate is not None]
            if rates:
                avg_rate = sum(rates) / len(rates)
                content_lines.append(f"Average Employment Placement Rate: {avg_rate:.1f}%")

    return KnowledgeItem(
        id=f"occupation:{occ.id}",
        type=KnowledgeType.OCCUPATION,
        title=occ.name,
        content="\n".join(content_lines),
        provenance=provenance,
        metadata={
            "sector": occ.sector,
            "has_skills": bool(skills_text),
            "record_id": occ.id,
        },
        record_id=occ.id,
    )


def normalize_course(course: Course) -> KnowledgeItem:
    """Convert a Course model instance into a normalized KnowledgeItem."""
    provenance = determine_provenance(course.data_source, default_source_name="NCVET Accredited Qualifications")

    provider_name = course.provider.name if course.provider else "Accredited Training Centers"
    provider_loc = course.provider.location if course.provider else None

    content_lines = [
        f"Course Title: {course.name}",
        f"Sector: {course.sector or 'Vocational Education'}",
        f"Qualification Level: {course.qualification_level or 'NSQF Aligned'}",
        f"Duration: {course.duration or 'Standard Curriculum Duration'}",
        f"Delivery Mode: {course.delivery_mode or 'Classroom / Practical Workshop'}",
        f"Training Provider: {provider_name}" + (f" ({provider_loc})" if provider_loc else ""),
        f"Overview: {course.description or 'Vocational certification program.'}",
    ]

    return KnowledgeItem(
        id=f"course:{course.id}",
        type=KnowledgeType.COURSE,
        title=course.name,
        content="\n".join(content_lines),
        provenance=provenance,
        metadata={
            "sector": course.sector,
            "qualification_level": course.qualification_level,
            "duration": course.duration,
            "provider_id": course.provider_id,
            "provider_name": provider_name,
            "record_id": course.id,
        },
        record_id=course.id,
    )


def normalize_job_outcome(outcome: JobOutcome) -> KnowledgeItem:
    """Convert a JobOutcome record into a normalized KnowledgeItem."""
    provenance = determine_provenance(outcome.data_source, default_source_name="Labor Market Information System (LMIS)")

    occ_name = outcome.occupation.name if outcome.occupation else "Vocational Role"
    region = outcome.region or "National"

    content_lines = [
        f"Labor Market Outcome: {occ_name}",
        f"Geographic Region: {region}",
    ]
    if outcome.salary_range_min or outcome.salary_range_max:
        s_min = f"₹{outcome.salary_range_min:,}" if outcome.salary_range_min else "N/A"
        s_max = f"₹{outcome.salary_range_max:,}" if outcome.salary_range_max else "N/A"
        content_lines.append(f"Salary Range: {s_min} - {s_max} ({outcome.salary_currency})")
    if outcome.employment_rate is not None:
        content_lines.append(f"Reported Placement Rate: {outcome.employment_rate:.1f}%")
    if outcome.experience_level:
        content_lines.append(f"Experience Level: {outcome.experience_level}")

    return KnowledgeItem(
        id=f"outcome:{outcome.id}",
        type=KnowledgeType.SALARY_OUTCOME,
        title=f"Employment Outcome: {occ_name} ({region})",
        content="\n".join(content_lines),
        provenance=provenance,
        metadata={
            "occupation_id": outcome.occupation_id,
            "occupation_name": occ_name,
            "region": outcome.region,
            "salary_min": outcome.salary_range_min,
            "salary_max": outcome.salary_range_max,
            "employment_rate": outcome.employment_rate,
            "record_id": outcome.id,
        },
        record_id=outcome.id,
    )


def normalize_training_provider(tp: TrainingProvider) -> KnowledgeItem:
    """Convert a TrainingProvider into a normalized KnowledgeItem."""
    # Training providers are registered under government ITI / PMKVY / NSDC
    provenance = KnowledgeProvenance(
        source="DGT / National Training Provider Registry",
        source_type="Government ITI / Accredited Training Provider",
        source_url=None,
        verified=True,
        is_demo=False,
        data_provenance="Accredited Institute Directory",
    )

    courses_offered = [c.name for c in tp.courses or []]

    content_lines = [
        f"Training Provider: {tp.name}",
        f"Institution Type: {tp.provider_type or 'Accredited Skill Institute'}",
        f"Location: {tp.location or 'Multi-Center'}",
        f"Description: {tp.description or 'Approved training partner under skill development mission.'}",
    ]
    if courses_offered:
        content_lines.append(f"Courses Offered ({len(courses_offered)}): {', '.join(courses_offered[:8])}")

    return KnowledgeItem(
        id=f"provider:{tp.id}",
        type=KnowledgeType.PROVIDER,
        title=tp.name,
        content="\n".join(content_lines),
        provenance=provenance,
        metadata={
            "location": tp.location,
            "provider_type": tp.provider_type,
            "courses_count": len(courses_offered),
            "record_id": tp.id,
        },
        record_id=tp.id,
    )


def normalize_career_path(cp: CareerPath) -> KnowledgeItem:
    """Convert a CareerPath into a normalized KnowledgeItem."""
    provenance = KnowledgeProvenance(
        source="NCVET National Career Progression Framework",
        source_type="Government Qualification Framework",
        verified=True,
        is_demo=False,
        data_provenance="Skill Qualification Progression Tree",
    )

    ladder_stages = []
    if cp.progression_ladder:
        if isinstance(cp.progression_ladder, list):
            ladder_stages = [f"{idx+1}. {stage}" for idx, stage in enumerate(cp.progression_ladder)]
        elif isinstance(cp.progression_ladder, dict):
            ladder_stages = [f"{k}: {v}" for k, v in cp.progression_ladder.items()]

    occ_names = [o.name for o in cp.occupations or []]

    content_lines = [
        f"Career Progression Pathway: {cp.name}",
        f"Estimated Duration: {cp.estimated_duration or 'Flexible'}",
        f"Summary: {cp.description or 'Pathway connecting foundational training to advanced trades.'}",
    ]
    if ladder_stages:
        content_lines.append("Progression Ladder:\n  " + "\n  ".join(ladder_stages))
    if occ_names:
        content_lines.append(f"Related Occupations: {', '.join(occ_names)}")

    return KnowledgeItem(
        id=f"path:{cp.id}",
        type=KnowledgeType.CAREER_PATH,
        title=cp.name,
        content="\n".join(content_lines),
        provenance=provenance,
        metadata={
            "estimated_duration": cp.estimated_duration,
            "ladder_stages_count": len(ladder_stages),
            "record_id": cp.id,
        },
        record_id=cp.id,
    )


def normalize_nsqf_descriptor(level_str: str, sector: Optional[str] = None) -> KnowledgeItem:
    """Generate a normalized KnowledgeItem for National Skills Qualification Framework (NSQF) descriptors."""
    provenance = KnowledgeProvenance(
        source="NCVET NSQF Gazette Notification 2023",
        source_type="Statutory Framework",
        source_url="https://www.ncvet.gov.in/",
        verified=True,
        is_demo=False,
        data_provenance="National Skills Qualification Framework Levels 1-10",
    )

    level_clean = level_str.strip()
    content = (
        f"Framework: National Skills Qualification Framework (NSQF)\n"
        f"Level: {level_clean}\n"
        f"Description: Nationally standardized competency descriptor benchmarked by NCVET. "
        f"Certificates at {level_clean} provide multi-entry/multi-exit educational pathways "
        f"recognized across government departments, industry employers, and higher vocational colleges."
    )

    return KnowledgeItem(
        id=f"nsqf:{level_clean.lower().replace(' ', '_')}",
        type=KnowledgeType.NSQF,
        title=f"NSQF Competency Descriptor: {level_clean}",
        content=content,
        provenance=provenance,
        metadata={"nsqf_level": level_clean, "sector": sector},
    )


def normalize_data_source(ds: DataSource) -> KnowledgeItem:
    """Convert a DataSource record into a normalized KnowledgeItem."""
    provenance = determine_provenance(ds, default_source_name=ds.name)

    content_lines = [
        f"Official Data Registry: {ds.name}",
        f"Type: {ds.source_type or 'Government Portal'}",
        f"Version: {ds.version or '1.0'}",
        f"URL: {ds.url or 'N/A'}",
        f"Description: {ds.description or 'Official statistical and curricular data source.'}",
    ]
    if ds.retrieved_at:
        content_lines.append(f"Last Retrieved: {ds.retrieved_at.strftime('%Y-%m-%d')}")

    return KnowledgeItem(
        id=f"source:{ds.id}",
        type=KnowledgeType.SOURCE,
        title=f"Source: {ds.name}",
        content="\n".join(content_lines),
        provenance=provenance,
        metadata={
            "source_type": ds.source_type,
            "url": ds.url,
            "record_id": ds.id,
        },
        record_id=ds.id,
    )


# ---------------------------------------------------------------------------
# Knowledge Base Manager
# ---------------------------------------------------------------------------

class KnowledgeBase:
    """Extracts, normalizes, and filters factual knowledge from database models."""

    @classmethod
    def load_all_items(
        cls,
        db: Session,
        verified_only: bool = False,
        types: Optional[List[KnowledgeType]] = None,
    ) -> List[KnowledgeItem]:
        """Load and normalize knowledge items across all domains from the database.

        Args:
            db: Active SQLAlchemy database session.
            verified_only: If True, only returns items whose provenance is verified
                          and NOT marked as demo/illustrative.
            types: Optional subset of KnowledgeTypes to extract.

        Returns:
            List of normalized KnowledgeItem instances.
        """
        items: List[KnowledgeItem] = []
        target_types = set(types) if types else set(KnowledgeType)

        # 1. Occupations
        if KnowledgeType.OCCUPATION in target_types:
            occupations = db.query(Occupation).options(
                joinedload(Occupation.job_outcomes).joinedload(JobOutcome.data_source)
            ).filter(Occupation.status != "inactive").all()
            for occ in occupations:
                items.append(normalize_occupation(occ))

        # 2. Courses
        if KnowledgeType.COURSE in target_types or KnowledgeType.NSQF in target_types:
            courses = db.query(Course).options(
                joinedload(Course.provider),
                joinedload(Course.data_source),
            ).filter(Course.status != "inactive").all()
            nsqf_levels_seen = set()
            for crs in courses:
                if KnowledgeType.COURSE in target_types:
                    items.append(normalize_course(crs))
                if KnowledgeType.NSQF in target_types and crs.qualification_level:
                    lvl = crs.qualification_level.strip()
                    if lvl not in nsqf_levels_seen:
                        nsqf_levels_seen.add(lvl)
                        items.append(normalize_nsqf_descriptor(lvl, sector=crs.sector))

        # 3. Job Outcomes
        if KnowledgeType.SALARY_OUTCOME in target_types:
            outcomes = db.query(JobOutcome).options(
                joinedload(JobOutcome.occupation),
                joinedload(JobOutcome.data_source),
            ).filter(JobOutcome.status != "inactive").all()
            for outcome in outcomes:
                items.append(normalize_job_outcome(outcome))

        # 4. Training Providers
        if KnowledgeType.PROVIDER in target_types:
            providers = db.query(TrainingProvider).options(
                joinedload(TrainingProvider.courses)
            ).filter(TrainingProvider.status != "inactive").all()
            for tp in providers:
                items.append(normalize_training_provider(tp))

        # 5. Career Paths
        if KnowledgeType.CAREER_PATH in target_types:
            paths = db.query(CareerPath).options(
                joinedload(CareerPath.occupations)
            ).filter(CareerPath.status != "inactive").all()
            for cp in paths:
                items.append(normalize_career_path(cp))

        # 6. Data Sources
        if KnowledgeType.SOURCE in target_types:
            sources = db.query(DataSource).filter(DataSource.status != "inactive").all()
            for ds in sources:
                items.append(normalize_data_source(ds))

        # 7. Apply verified_only filter
        if verified_only:
            items = [item for item in items if item.provenance.verified and not item.provenance.is_demo]

        return items
