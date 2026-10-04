"""
Admin Data Management API Router (A7 — Data Management).
Provides CRUD, verification, deactivation, and reactivation workflows for:
- Courses
- Occupations
- Training Providers
- Job Outcomes
- Career Paths
- Data Sources
"""

import math
from datetime import datetime
from typing import Optional, List, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func

from database.session import get_db
from models import (
    User,
    Course,
    Occupation,
    TrainingProvider,
    JobOutcome,
    CareerPath,
    DataSource,
)
from models.enums import RecordStatus
from api.deps import require_admin
from schemas.admin_data import (
    PaginatedResponse,
    DataOptionsResponse,
    DataStatsResponse,
    EntityStatusCount,
    OptionItem,
    CourseCreate,
    CourseUpdate,
    CourseResponse,
    OccupationCreate,
    OccupationUpdate,
    OccupationResponse,
    TrainingProviderCreate,
    TrainingProviderUpdate,
    TrainingProviderResponse,
    JobOutcomeCreate,
    JobOutcomeUpdate,
    JobOutcomeResponse,
    CareerPathCreate,
    CareerPathUpdate,
    CareerPathResponse,
    DataSourceCreate,
    DataSourceUpdate,
    DataSourceResponse,
)

router = APIRouter(prefix="/admin/data", tags=["Admin Data"])


# =============================================================================
# Helper: Metadata Options & Global Stats
# =============================================================================

@router.get("/options", response_model=DataOptionsResponse)
def get_data_options(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> DataOptionsResponse:
    """Fetch dropdown options for building create/edit forms."""
    sources = db.query(DataSource).order_by(DataSource.name.asc()).all()
    occupations = db.query(Occupation).order_by(Occupation.name.asc()).all()
    providers = db.query(TrainingProvider).order_by(TrainingProvider.name.asc()).all()
    career_paths = db.query(CareerPath).order_by(CareerPath.name.asc()).all()

    # Collect distinct sectors from occupations and courses
    occ_sectors = db.query(Occupation.sector).filter(Occupation.sector.isnot(None)).distinct().all()
    course_sectors = db.query(Course.sector).filter(Course.sector.isnot(None)).distinct().all()
    sectors = sorted(list(set(
        [s[0] for s in occ_sectors if s[0]] + [s[0] for s in course_sectors if s[0]]
    )))

    return DataOptionsResponse(
        sources=[OptionItem(id=s.id, name=s.name, extra=s.source_type) for s in sources],
        occupations=[OptionItem(id=o.id, name=o.name, extra=o.sector) for o in occupations],
        providers=[OptionItem(id=p.id, name=p.name, extra=p.location) for p in providers],
        career_paths=[OptionItem(id=c.id, name=c.name) for c in career_paths],
        sectors=sectors,
    )


@router.get("/stats", response_model=DataStatsResponse)
def get_data_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> DataStatsResponse:
    """Aggregate total, demo, unverified, verified, and inactive counts for each table."""
    def _count_model(model):
        rows = db.query(model.status, func.count(model.id)).group_by(model.status).all()
        counts = {r[0]: r[1] for r in rows}
        total = sum(counts.values())
        return EntityStatusCount(
            total=total,
            demo=counts.get("demo", 0),
            unverified=counts.get("unverified", 0),
            verified=counts.get("verified", 0),
            inactive=counts.get("inactive", 0),
        )

    return DataStatsResponse(
        courses=_count_model(Course),
        occupations=_count_model(Occupation),
        providers=_count_model(TrainingProvider),
        outcomes=_count_model(JobOutcome),
        career_paths=_count_model(CareerPath),
        sources=_count_model(DataSource),
    )


# =============================================================================
# 1. Courses CRUD & Workflow
# =============================================================================

@router.get("/courses", response_model=PaginatedResponse[CourseResponse])
def list_courses(
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    q: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    sector: Optional[str] = Query(None),
    provider_id: Optional[int] = Query(None),
    data_source_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> PaginatedResponse[CourseResponse]:
    query = db.query(Course).options(
        joinedload(Course.provider),
        joinedload(Course.data_source),
    )

    if q:
        query = query.filter(
            or_(
                Course.name.ilike(f"%{q}%"),
                Course.description.ilike(f"%{q}%"),
                Course.qualification_level.ilike(f"%{q}%"),
            )
        )
    if status and status != "all":
        query = query.filter(Course.status == status)
    if sector:
        query = query.filter(Course.sector == sector)
    if provider_id:
        query = query.filter(Course.provider_id == provider_id)
    if data_source_id:
        query = query.filter(Course.data_source_id == data_source_id)

    total = query.count()
    items = query.order_by(Course.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    resp_items = []
    for c in items:
        data = CourseResponse.model_validate(c)
        data.provider_name = c.provider.name if c.provider else None
        data.data_source_name = c.data_source.name if c.data_source else None
        resp_items.append(data)

    return PaginatedResponse(
        items=resp_items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("/courses", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(
    payload: CourseCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> CourseResponse:
    if payload.provider_id:
        if not db.get(TrainingProvider, payload.provider_id):
            raise HTTPException(status_code=400, detail="Invalid provider_id: provider does not exist")
    if payload.data_source_id:
        if not db.get(DataSource, payload.data_source_id):
            raise HTTPException(status_code=400, detail="Invalid data_source_id: source does not exist")

    course = Course(
        name=payload.name,
        description=payload.description,
        duration=payload.duration,
        qualification_level=payload.qualification_level,
        sector=payload.sector,
        delivery_mode=payload.delivery_mode,
        provider_id=payload.provider_id,
        data_source_id=payload.data_source_id,
        status=payload.status or "unverified",
    )
    db.add(course)
    db.commit()
    db.refresh(course)

    resp = CourseResponse.model_validate(course)
    resp.provider_name = course.provider.name if course.provider else None
    resp.data_source_name = course.data_source.name if course.data_source else None
    return resp


@router.get("/courses/{course_id}", response_model=CourseResponse)
def get_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> CourseResponse:
    course = db.query(Course).options(
        joinedload(Course.provider),
        joinedload(Course.data_source),
    ).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    resp = CourseResponse.model_validate(course)
    resp.provider_name = course.provider.name if course.provider else None
    resp.data_source_name = course.data_source.name if course.data_source else None
    return resp


@router.put("/courses/{course_id}", response_model=CourseResponse)
def update_course(
    course_id: int,
    payload: CourseUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> CourseResponse:
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    data_dict = payload.model_dump(exclude_unset=True)
    if "provider_id" in data_dict and data_dict["provider_id"] is not None:
        if not db.get(TrainingProvider, data_dict["provider_id"]):
            raise HTTPException(status_code=400, detail="Invalid provider_id")
    if "data_source_id" in data_dict and data_dict["data_source_id"] is not None:
        if not db.get(DataSource, data_dict["data_source_id"]):
            raise HTTPException(status_code=400, detail="Invalid data_source_id")

    for k, v in data_dict.items():
        setattr(course, k, v)

    db.commit()
    db.refresh(course)

    resp = CourseResponse.model_validate(course)
    resp.provider_name = course.provider.name if course.provider else None
    resp.data_source_name = course.data_source.name if course.data_source else None
    return resp


@router.patch("/courses/{course_id}/verify", response_model=CourseResponse)
def verify_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> CourseResponse:
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Section 21: Source traceability enforcement
    if not course.data_source_id:
        raise HTTPException(
            status_code=400,
            detail="A source is required before this record can be verified.",
        )

    course.status = RecordStatus.VERIFIED.value
    course.verified_at = datetime.utcnow()
    course.verified_by = current_admin.id
    db.commit()
    db.refresh(course)

    resp = CourseResponse.model_validate(course)
    resp.provider_name = course.provider.name if course.provider else None
    resp.data_source_name = course.data_source.name if course.data_source else None
    return resp


@router.patch("/courses/{course_id}/deactivate", response_model=CourseResponse)
def deactivate_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> CourseResponse:
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    course.status = RecordStatus.INACTIVE.value
    db.commit()
    db.refresh(course)

    resp = CourseResponse.model_validate(course)
    resp.provider_name = course.provider.name if course.provider else None
    resp.data_source_name = course.data_source.name if course.data_source else None
    return resp


@router.patch("/courses/{course_id}/reactivate", response_model=CourseResponse)
def reactivate_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> CourseResponse:
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    course.status = RecordStatus.UNVERIFIED.value
    db.commit()
    db.refresh(course)

    resp = CourseResponse.model_validate(course)
    resp.provider_name = course.provider.name if course.provider else None
    resp.data_source_name = course.data_source.name if course.data_source else None
    return resp


# =============================================================================
# 2. Occupations CRUD & Workflow
# =============================================================================

@router.get("/occupations", response_model=PaginatedResponse[OccupationResponse])
def list_occupations(
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    q: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    sector: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> PaginatedResponse[OccupationResponse]:
    query = db.query(Occupation).options(joinedload(Occupation.data_source))

    if q:
        query = query.filter(
            or_(
                Occupation.name.ilike(f"%{q}%"),
                Occupation.description.ilike(f"%{q}%"),
                Occupation.sector.ilike(f"%{q}%"),
            )
        )
    if status and status != "all":
        query = query.filter(Occupation.status == status)
    if sector:
        query = query.filter(Occupation.sector == sector)

    total = query.count()
    items = query.order_by(Occupation.id.asc()).offset((page - 1) * page_size).limit(page_size).all()
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    resp_items = []
    for o in items:
        data = OccupationResponse.model_validate(o)
        data.data_source_name = o.data_source.name if o.data_source else None
        resp_items.append(data)

    return PaginatedResponse(
        items=resp_items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("/occupations", response_model=OccupationResponse, status_code=status.HTTP_201_CREATED)
def create_occupation(
    payload: OccupationCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> OccupationResponse:
    if payload.data_source_id and not db.get(DataSource, payload.data_source_id):
        raise HTTPException(status_code=400, detail="Invalid data_source_id: source does not exist")

    occ = Occupation(
        name=payload.name,
        description=payload.description,
        sector=payload.sector,
        skill_requirements=payload.skill_requirements,
        data_source_id=payload.data_source_id,
        status=payload.status or "unverified",
    )
    db.add(occ)
    db.commit()
    db.refresh(occ)

    resp = OccupationResponse.model_validate(occ)
    resp.data_source_name = occ.data_source.name if occ.data_source else None
    return resp


@router.get("/occupations/{occupation_id}", response_model=OccupationResponse)
def get_occupation(
    occupation_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> OccupationResponse:
    occ = db.query(Occupation).options(joinedload(Occupation.data_source)).filter(Occupation.id == occupation_id).first()
    if not occ:
        raise HTTPException(status_code=404, detail="Occupation not found")

    resp = OccupationResponse.model_validate(occ)
    resp.data_source_name = occ.data_source.name if occ.data_source else None
    return resp


@router.put("/occupations/{occupation_id}", response_model=OccupationResponse)
def update_occupation(
    occupation_id: int,
    payload: OccupationUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> OccupationResponse:
    occ = db.get(Occupation, occupation_id)
    if not occ:
        raise HTTPException(status_code=404, detail="Occupation not found")

    data_dict = payload.model_dump(exclude_unset=True)
    if "data_source_id" in data_dict and data_dict["data_source_id"] is not None:
        if not db.get(DataSource, data_dict["data_source_id"]):
            raise HTTPException(status_code=400, detail="Invalid data_source_id")

    for k, v in data_dict.items():
        setattr(occ, k, v)

    db.commit()
    db.refresh(occ)

    resp = OccupationResponse.model_validate(occ)
    resp.data_source_name = occ.data_source.name if occ.data_source else None
    return resp


@router.patch("/occupations/{occupation_id}/verify", response_model=OccupationResponse)
def verify_occupation(
    occupation_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> OccupationResponse:
    occ = db.get(Occupation, occupation_id)
    if not occ:
        raise HTTPException(status_code=404, detail="Occupation not found")

    # Section 21: Source traceability enforcement
    if not occ.data_source_id:
        raise HTTPException(
            status_code=400,
            detail="A source is required before this record can be verified.",
        )

    occ.status = RecordStatus.VERIFIED.value
    occ.verified_at = datetime.utcnow()
    occ.verified_by = current_admin.id
    db.commit()
    db.refresh(occ)

    resp = OccupationResponse.model_validate(occ)
    resp.data_source_name = occ.data_source.name if occ.data_source else None
    return resp


@router.patch("/occupations/{occupation_id}/deactivate", response_model=OccupationResponse)
def deactivate_occupation(
    occupation_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> OccupationResponse:
    occ = db.get(Occupation, occupation_id)
    if not occ:
        raise HTTPException(status_code=404, detail="Occupation not found")

    occ.status = RecordStatus.INACTIVE.value
    db.commit()
    db.refresh(occ)

    resp = OccupationResponse.model_validate(occ)
    resp.data_source_name = occ.data_source.name if occ.data_source else None
    return resp


@router.patch("/occupations/{occupation_id}/reactivate", response_model=OccupationResponse)
def reactivate_occupation(
    occupation_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> OccupationResponse:
    occ = db.get(Occupation, occupation_id)
    if not occ:
        raise HTTPException(status_code=404, detail="Occupation not found")

    occ.status = RecordStatus.UNVERIFIED.value
    db.commit()
    db.refresh(occ)

    resp = OccupationResponse.model_validate(occ)
    resp.data_source_name = occ.data_source.name if occ.data_source else None
    return resp


# =============================================================================
# 3. Training Providers CRUD & Workflow
# =============================================================================

@router.get("/providers", response_model=PaginatedResponse[TrainingProviderResponse])
def list_training_providers(
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    q: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> PaginatedResponse[TrainingProviderResponse]:
    query = db.query(TrainingProvider).options(
        joinedload(TrainingProvider.courses),
        joinedload(TrainingProvider.data_source),
    )

    if q:
        query = query.filter(
            or_(
                TrainingProvider.name.ilike(f"%{q}%"),
                TrainingProvider.description.ilike(f"%{q}%"),
                TrainingProvider.location.ilike(f"%{q}%"),
            )
        )
    if status and status != "all":
        query = query.filter(TrainingProvider.status == status)

    total = query.count()
    items = query.order_by(TrainingProvider.id.asc()).offset((page - 1) * page_size).limit(page_size).all()
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    resp_items = []
    for p in items:
        data = TrainingProviderResponse.model_validate(p)
        data.course_count = len(p.courses) if p.courses else 0
        data.data_source_name = p.data_source.name if p.data_source else None
        resp_items.append(data)

    return PaginatedResponse(
        items=resp_items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("/providers", response_model=TrainingProviderResponse, status_code=status.HTTP_201_CREATED)
def create_training_provider(
    payload: TrainingProviderCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> TrainingProviderResponse:
    if payload.data_source_id and not db.get(DataSource, payload.data_source_id):
        raise HTTPException(status_code=400, detail="Invalid data_source_id")

    provider = TrainingProvider(
        name=payload.name,
        description=payload.description,
        location=payload.location,
        provider_type=payload.provider_type,
        contact_info=payload.contact_info,
        data_source_id=payload.data_source_id,
        status=payload.status or "unverified",
    )
    db.add(provider)
    db.commit()
    db.refresh(provider)

    resp = TrainingProviderResponse.model_validate(provider)
    resp.course_count = 0
    resp.data_source_name = provider.data_source.name if provider.data_source else None
    return resp


@router.get("/providers/{provider_id}", response_model=TrainingProviderResponse)
def get_training_provider(
    provider_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> TrainingProviderResponse:
    provider = db.query(TrainingProvider).options(
        joinedload(TrainingProvider.courses),
        joinedload(TrainingProvider.data_source),
    ).filter(TrainingProvider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Training provider not found")

    resp = TrainingProviderResponse.model_validate(provider)
    resp.course_count = len(provider.courses) if provider.courses else 0
    resp.data_source_name = provider.data_source.name if provider.data_source else None
    return resp


@router.put("/providers/{provider_id}", response_model=TrainingProviderResponse)
def update_training_provider(
    provider_id: int,
    payload: TrainingProviderUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> TrainingProviderResponse:
    provider = db.get(TrainingProvider, provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Training provider not found")

    data_dict = payload.model_dump(exclude_unset=True)
    if "data_source_id" in data_dict and data_dict["data_source_id"] is not None:
        if not db.get(DataSource, data_dict["data_source_id"]):
            raise HTTPException(status_code=400, detail="Invalid data_source_id")

    for k, v in data_dict.items():
        setattr(provider, k, v)

    db.commit()
    db.refresh(provider)

    resp = TrainingProviderResponse.model_validate(provider)
    resp.course_count = len(provider.courses) if provider.courses else 0
    resp.data_source_name = provider.data_source.name if provider.data_source else None
    return resp


@router.patch("/providers/{provider_id}/verify", response_model=TrainingProviderResponse)
def verify_training_provider(
    provider_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> TrainingProviderResponse:
    provider = db.get(TrainingProvider, provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Training provider not found")

    if not provider.data_source_id:
        raise HTTPException(
            status_code=400,
            detail="A source is required before this record can be verified.",
        )

    provider.status = RecordStatus.VERIFIED.value
    provider.verified_at = datetime.utcnow()
    provider.verified_by = current_admin.id
    db.commit()
    db.refresh(provider)

    resp = TrainingProviderResponse.model_validate(provider)
    resp.course_count = len(provider.courses) if provider.courses else 0
    resp.data_source_name = provider.data_source.name if provider.data_source else None
    return resp


@router.patch("/providers/{provider_id}/deactivate", response_model=TrainingProviderResponse)
def deactivate_training_provider(
    provider_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> TrainingProviderResponse:
    provider = db.get(TrainingProvider, provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Training provider not found")

    provider.status = RecordStatus.INACTIVE.value
    db.commit()
    db.refresh(provider)

    resp = TrainingProviderResponse.model_validate(provider)
    resp.course_count = len(provider.courses) if provider.courses else 0
    resp.data_source_name = provider.data_source.name if provider.data_source else None
    return resp


@router.patch("/providers/{provider_id}/reactivate", response_model=TrainingProviderResponse)
def reactivate_training_provider(
    provider_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> TrainingProviderResponse:
    provider = db.get(TrainingProvider, provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Training provider not found")

    provider.status = RecordStatus.UNVERIFIED.value
    db.commit()
    db.refresh(provider)

    resp = TrainingProviderResponse.model_validate(provider)
    resp.course_count = len(provider.courses) if provider.courses else 0
    resp.data_source_name = provider.data_source.name if provider.data_source else None
    return resp


# =============================================================================
# 4. Job Outcomes CRUD & Workflow (Supports 10,000+ Bulk Records)
# =============================================================================

@router.get("/outcomes", response_model=PaginatedResponse[JobOutcomeResponse])
def list_job_outcomes(
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    q: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    occupation_id: Optional[int] = Query(None),
    career_path_id: Optional[int] = Query(None),
    region: Optional[str] = Query(None),
    data_source_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> PaginatedResponse[JobOutcomeResponse]:
    query = db.query(JobOutcome).options(
        joinedload(JobOutcome.occupation),
        joinedload(JobOutcome.career_path),
        joinedload(JobOutcome.data_source),
    )

    if q:
        query = query.filter(
            or_(
                JobOutcome.region.ilike(f"%{q}%"),
                JobOutcome.experience_level.ilike(f"%{q}%"),
            )
        )
    if status and status != "all":
        query = query.filter(JobOutcome.status == status)
    if occupation_id:
        query = query.filter(JobOutcome.occupation_id == occupation_id)
    if career_path_id:
        query = query.filter(JobOutcome.career_path_id == career_path_id)
    if region:
        query = query.filter(JobOutcome.region.ilike(f"%{region}%"))
    if data_source_id:
        query = query.filter(JobOutcome.data_source_id == data_source_id)

    total = query.count()
    items = query.order_by(JobOutcome.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    resp_items = []
    for jo in items:
        data = JobOutcomeResponse.model_validate(jo)
        data.occupation_name = jo.occupation.name if jo.occupation else None
        data.career_path_name = jo.career_path.name if jo.career_path else None
        data.data_source_name = jo.data_source.name if jo.data_source else None
        resp_items.append(data)

    return PaginatedResponse(
        items=resp_items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("/outcomes", response_model=JobOutcomeResponse, status_code=status.HTTP_201_CREATED)
def create_job_outcome(
    payload: JobOutcomeCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> JobOutcomeResponse:
    if payload.occupation_id and not db.get(Occupation, payload.occupation_id):
        raise HTTPException(status_code=400, detail="Invalid occupation_id")
    if payload.career_path_id and not db.get(CareerPath, payload.career_path_id):
        raise HTTPException(status_code=400, detail="Invalid career_path_id")
    if payload.data_source_id and not db.get(DataSource, payload.data_source_id):
        raise HTTPException(status_code=400, detail="Invalid data_source_id")

    outcome = JobOutcome(
        occupation_id=payload.occupation_id,
        career_path_id=payload.career_path_id,
        data_source_id=payload.data_source_id,
        employment_rate=payload.employment_rate,
        salary_range_min=payload.salary_range_min,
        salary_range_max=payload.salary_range_max,
        salary_currency=payload.salary_currency or "INR",
        experience_level=payload.experience_level,
        region=payload.region,
        status=payload.status or "unverified",
    )
    db.add(outcome)
    db.commit()
    db.refresh(outcome)

    resp = JobOutcomeResponse.model_validate(outcome)
    resp.occupation_name = outcome.occupation.name if outcome.occupation else None
    resp.career_path_name = outcome.career_path.name if outcome.career_path else None
    resp.data_source_name = outcome.data_source.name if outcome.data_source else None
    return resp


@router.get("/outcomes/{outcome_id}", response_model=JobOutcomeResponse)
def get_job_outcome(
    outcome_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> JobOutcomeResponse:
    outcome = db.query(JobOutcome).options(
        joinedload(JobOutcome.occupation),
        joinedload(JobOutcome.career_path),
        joinedload(JobOutcome.data_source),
    ).filter(JobOutcome.id == outcome_id).first()
    if not outcome:
        raise HTTPException(status_code=404, detail="Job outcome not found")

    resp = JobOutcomeResponse.model_validate(outcome)
    resp.occupation_name = outcome.occupation.name if outcome.occupation else None
    resp.career_path_name = outcome.career_path.name if outcome.career_path else None
    resp.data_source_name = outcome.data_source.name if outcome.data_source else None
    return resp


@router.put("/outcomes/{outcome_id}", response_model=JobOutcomeResponse)
def update_job_outcome(
    outcome_id: int,
    payload: JobOutcomeUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> JobOutcomeResponse:
    outcome = db.get(JobOutcome, outcome_id)
    if not outcome:
        raise HTTPException(status_code=404, detail="Job outcome not found")

    data_dict = payload.model_dump(exclude_unset=True)
    if "occupation_id" in data_dict and data_dict["occupation_id"] is not None:
        if not db.get(Occupation, data_dict["occupation_id"]):
            raise HTTPException(status_code=400, detail="Invalid occupation_id")
    if "career_path_id" in data_dict and data_dict["career_path_id"] is not None:
        if not db.get(CareerPath, data_dict["career_path_id"]):
            raise HTTPException(status_code=400, detail="Invalid career_path_id")
    if "data_source_id" in data_dict and data_dict["data_source_id"] is not None:
        if not db.get(DataSource, data_dict["data_source_id"]):
            raise HTTPException(status_code=400, detail="Invalid data_source_id")

    # Validate salary range logic if updating salaries
    min_sal = data_dict.get("salary_range_min", outcome.salary_range_min)
    max_sal = data_dict.get("salary_range_max", outcome.salary_range_max)
    if min_sal is not None and max_sal is not None and max_sal < min_sal:
        raise HTTPException(status_code=400, detail="salary_range_max cannot be less than salary_range_min")

    for k, v in data_dict.items():
        setattr(outcome, k, v)

    db.commit()
    db.refresh(outcome)

    resp = JobOutcomeResponse.model_validate(outcome)
    resp.occupation_name = outcome.occupation.name if outcome.occupation else None
    resp.career_path_name = outcome.career_path.name if outcome.career_path else None
    resp.data_source_name = outcome.data_source.name if outcome.data_source else None
    return resp


@router.patch("/outcomes/{outcome_id}/verify", response_model=JobOutcomeResponse)
def verify_job_outcome(
    outcome_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> JobOutcomeResponse:
    outcome = db.get(JobOutcome, outcome_id)
    if not outcome:
        raise HTTPException(status_code=404, detail="Job outcome not found")

    # Section 21: Source traceability enforcement
    if not outcome.data_source_id:
        raise HTTPException(
            status_code=400,
            detail="A source is required before this record can be verified.",
        )

    outcome.status = RecordStatus.VERIFIED.value
    outcome.verified_at = datetime.utcnow()
    outcome.verified_by = current_admin.id
    db.commit()
    db.refresh(outcome)

    resp = JobOutcomeResponse.model_validate(outcome)
    resp.occupation_name = outcome.occupation.name if outcome.occupation else None
    resp.career_path_name = outcome.career_path.name if outcome.career_path else None
    resp.data_source_name = outcome.data_source.name if outcome.data_source else None
    return resp


@router.patch("/outcomes/{outcome_id}/deactivate", response_model=JobOutcomeResponse)
def deactivate_job_outcome(
    outcome_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> JobOutcomeResponse:
    outcome = db.get(JobOutcome, outcome_id)
    if not outcome:
        raise HTTPException(status_code=404, detail="Job outcome not found")

    outcome.status = RecordStatus.INACTIVE.value
    db.commit()
    db.refresh(outcome)

    resp = JobOutcomeResponse.model_validate(outcome)
    resp.occupation_name = outcome.occupation.name if outcome.occupation else None
    resp.career_path_name = outcome.career_path.name if outcome.career_path else None
    resp.data_source_name = outcome.data_source.name if outcome.data_source else None
    return resp


@router.patch("/outcomes/{outcome_id}/reactivate", response_model=JobOutcomeResponse)
def reactivate_job_outcome(
    outcome_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> JobOutcomeResponse:
    outcome = db.get(JobOutcome, outcome_id)
    if not outcome:
        raise HTTPException(status_code=404, detail="Job outcome not found")

    outcome.status = RecordStatus.UNVERIFIED.value
    db.commit()
    db.refresh(outcome)

    resp = JobOutcomeResponse.model_validate(outcome)
    resp.occupation_name = outcome.occupation.name if outcome.occupation else None
    resp.career_path_name = outcome.career_path.name if outcome.career_path else None
    resp.data_source_name = outcome.data_source.name if outcome.data_source else None
    return resp


# =============================================================================
# 5. Career Paths CRUD & Workflow
# =============================================================================

@router.get("/career-paths", response_model=PaginatedResponse[CareerPathResponse])
def list_career_paths(
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    q: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> PaginatedResponse[CareerPathResponse]:
    query = db.query(CareerPath).options(joinedload(CareerPath.data_source))

    if q:
        query = query.filter(
            or_(
                CareerPath.name.ilike(f"%{q}%"),
                CareerPath.description.ilike(f"%{q}%"),
            )
        )
    if status and status != "all":
        query = query.filter(CareerPath.status == status)

    total = query.count()
    items = query.order_by(CareerPath.id.asc()).offset((page - 1) * page_size).limit(page_size).all()
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    resp_items = []
    for cp in items:
        data = CareerPathResponse.model_validate(cp)
        data.data_source_name = cp.data_source.name if cp.data_source else None
        resp_items.append(data)

    return PaginatedResponse(
        items=resp_items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("/career-paths", response_model=CareerPathResponse, status_code=status.HTTP_201_CREATED)
def create_career_path(
    payload: CareerPathCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> CareerPathResponse:
    if payload.data_source_id and not db.get(DataSource, payload.data_source_id):
        raise HTTPException(status_code=400, detail="Invalid data_source_id")

    cp = CareerPath(
        name=payload.name,
        description=payload.description,
        progression_ladder=payload.progression_ladder,
        estimated_duration=payload.estimated_duration,
        data_source_id=payload.data_source_id,
        status=payload.status or "unverified",
    )
    db.add(cp)
    db.commit()
    db.refresh(cp)

    resp = CareerPathResponse.model_validate(cp)
    resp.data_source_name = cp.data_source.name if cp.data_source else None
    return resp


@router.get("/career-paths/{career_path_id}", response_model=CareerPathResponse)
def get_career_path(
    career_path_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> CareerPathResponse:
    cp = db.query(CareerPath).options(joinedload(CareerPath.data_source)).filter(CareerPath.id == career_path_id).first()
    if not cp:
        raise HTTPException(status_code=404, detail="Career path not found")

    resp = CareerPathResponse.model_validate(cp)
    resp.data_source_name = cp.data_source.name if cp.data_source else None
    return resp


@router.put("/career-paths/{career_path_id}", response_model=CareerPathResponse)
def update_career_path(
    career_path_id: int,
    payload: CareerPathUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> CareerPathResponse:
    cp = db.get(CareerPath, career_path_id)
    if not cp:
        raise HTTPException(status_code=404, detail="Career path not found")

    data_dict = payload.model_dump(exclude_unset=True)
    if "data_source_id" in data_dict and data_dict["data_source_id"] is not None:
        if not db.get(DataSource, data_dict["data_source_id"]):
            raise HTTPException(status_code=400, detail="Invalid data_source_id")

    for k, v in data_dict.items():
        setattr(cp, k, v)

    db.commit()
    db.refresh(cp)

    resp = CareerPathResponse.model_validate(cp)
    resp.data_source_name = cp.data_source.name if cp.data_source else None
    return resp


@router.patch("/career-paths/{career_path_id}/verify", response_model=CareerPathResponse)
def verify_career_path(
    career_path_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> CareerPathResponse:
    cp = db.get(CareerPath, career_path_id)
    if not cp:
        raise HTTPException(status_code=404, detail="Career path not found")

    if not cp.data_source_id:
        raise HTTPException(
            status_code=400,
            detail="A source is required before this record can be verified.",
        )

    cp.status = RecordStatus.VERIFIED.value
    cp.verified_at = datetime.utcnow()
    cp.verified_by = current_admin.id
    db.commit()
    db.refresh(cp)

    resp = CareerPathResponse.model_validate(cp)
    resp.data_source_name = cp.data_source.name if cp.data_source else None
    return resp


@router.patch("/career-paths/{career_path_id}/deactivate", response_model=CareerPathResponse)
def deactivate_career_path(
    career_path_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> CareerPathResponse:
    cp = db.get(CareerPath, career_path_id)
    if not cp:
        raise HTTPException(status_code=404, detail="Career path not found")

    cp.status = RecordStatus.INACTIVE.value
    db.commit()
    db.refresh(cp)

    resp = CareerPathResponse.model_validate(cp)
    resp.data_source_name = cp.data_source.name if cp.data_source else None
    return resp


@router.patch("/career-paths/{career_path_id}/reactivate", response_model=CareerPathResponse)
def reactivate_career_path(
    career_path_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> CareerPathResponse:
    cp = db.get(CareerPath, career_path_id)
    if not cp:
        raise HTTPException(status_code=404, detail="Career path not found")

    cp.status = RecordStatus.UNVERIFIED.value
    db.commit()
    db.refresh(cp)

    resp = CareerPathResponse.model_validate(cp)
    resp.data_source_name = cp.data_source.name if cp.data_source else None
    return resp


# =============================================================================
# 6. Data Sources CRUD & Workflow
# =============================================================================

@router.get("/sources", response_model=PaginatedResponse[DataSourceResponse])
def list_data_sources(
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    q: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    source_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> PaginatedResponse[DataSourceResponse]:
    query = db.query(DataSource)

    if q:
        query = query.filter(
            or_(
                DataSource.name.ilike(f"%{q}%"),
                DataSource.description.ilike(f"%{q}%"),
                DataSource.url.ilike(f"%{q}%"),
                DataSource.source_type.ilike(f"%{q}%"),
            )
        )
    if status and status != "all":
        query = query.filter(DataSource.status == status)
    if source_type:
        query = query.filter(DataSource.source_type.ilike(f"%{source_type}%"))

    total = query.count()
    items = query.order_by(DataSource.id.asc()).offset((page - 1) * page_size).limit(page_size).all()
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return PaginatedResponse(
        items=[DataSourceResponse.model_validate(s) for s in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("/sources", response_model=DataSourceResponse, status_code=status.HTTP_201_CREATED)
def create_data_source(
    payload: DataSourceCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> DataSourceResponse:
    source = DataSource(
        name=payload.name,
        source_type=payload.source_type,
        url=payload.url,
        description=payload.description,
        version=payload.version,
        retrieved_at=payload.retrieved_at,
        status=payload.status or "unverified",
    )
    db.add(source)
    db.commit()
    db.refresh(source)
    return DataSourceResponse.model_validate(source)


@router.get("/sources/{source_id}", response_model=DataSourceResponse)
def get_data_source(
    source_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> DataSourceResponse:
    source = db.get(DataSource, source_id)
    if not source:
        raise HTTPException(status_code=404, detail="Data source not found")
    return DataSourceResponse.model_validate(source)


@router.put("/sources/{source_id}", response_model=DataSourceResponse)
def update_data_source(
    source_id: int,
    payload: DataSourceUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> DataSourceResponse:
    source = db.get(DataSource, source_id)
    if not source:
        raise HTTPException(status_code=404, detail="Data source not found")

    data_dict = payload.model_dump(exclude_unset=True)
    for k, v in data_dict.items():
        setattr(source, k, v)

    db.commit()
    db.refresh(source)
    return DataSourceResponse.model_validate(source)


@router.patch("/sources/{source_id}/verify", response_model=DataSourceResponse)
def verify_data_source(
    source_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> DataSourceResponse:
    source = db.get(DataSource, source_id)
    if not source:
        raise HTTPException(status_code=404, detail="Data source not found")

    source.status = RecordStatus.VERIFIED.value
    source.verified_at = datetime.utcnow()
    source.verified_by = current_admin.id
    db.commit()
    db.refresh(source)
    return DataSourceResponse.model_validate(source)


@router.patch("/sources/{source_id}/deactivate", response_model=DataSourceResponse)
def deactivate_data_source(
    source_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> DataSourceResponse:
    source = db.get(DataSource, source_id)
    if not source:
        raise HTTPException(status_code=404, detail="Data source not found")

    source.status = RecordStatus.INACTIVE.value
    db.commit()
    db.refresh(source)
    return DataSourceResponse.model_validate(source)


@router.patch("/sources/{source_id}/reactivate", response_model=DataSourceResponse)
def reactivate_data_source(
    source_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> DataSourceResponse:
    source = db.get(DataSource, source_id)
    if not source:
        raise HTTPException(status_code=404, detail="Data source not found")

    source.status = RecordStatus.UNVERIFIED.value
    db.commit()
    db.refresh(source)
    return DataSourceResponse.model_validate(source)
