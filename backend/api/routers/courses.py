"""
Courses API Router for vocational training course exploration and search.
Serves verified vocational courses from accredited training providers.
"""

import math
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

from database.session import get_db
from models import Course
from schemas.career import (
    CourseSummary,
    CourseListResponse,
    TrainingProviderBasic,
)

router = APIRouter(prefix="/courses", tags=["Courses"])


def map_course_summary(c: Course) -> CourseSummary:
    provider_basic = None
    if c.provider:
        provider_basic = TrainingProviderBasic(
            id=c.provider.id,
            name=c.provider.name,
            location=c.provider.location,
            provider_type=c.provider.provider_type,
            contact_info=c.provider.contact_info,
        )
    data_source_name = c.data_source.name if c.data_source else "MSDE & NSDC Verified"
    return CourseSummary(
        id=c.id,
        name=c.name,
        duration=c.duration,
        qualification_level=c.qualification_level,
        sector=c.sector,
        delivery_mode=c.delivery_mode or "Practical & Classroom",
        provider=provider_basic,
        data_source_name=data_source_name,
    )


@router.get("", response_model=CourseListResponse)
@router.get("/", response_model=CourseListResponse)
def list_courses(
    search: Optional[str] = Query(None, description="Search keyword across course name and sector"),
    sector: Optional[str] = Query(None, description="Filter by sector/trade category"),
    qualification_level: Optional[str] = Query(None, description="Filter by qualification level (e.g., NSQF Level 3)"),
    duration: Optional[str] = Query(None, description="Filter by duration"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(12, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
) -> CourseListResponse:
    """List and filter vocational training courses backed by PostgreSQL / SQLite database."""
    query = db.query(Course).options(
        joinedload(Course.provider),
        joinedload(Course.data_source),
    )

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Course.name.ilike(term),
                Course.sector.ilike(term),
                Course.description.ilike(term),
            )
        )

    if sector and sector.strip():
        query = query.filter(Course.sector == sector.strip())

    if qualification_level and qualification_level.strip():
        query = query.filter(Course.qualification_level.ilike(f"%{qualification_level.strip()}%"))

    if duration and duration.strip():
        query = query.filter(Course.duration.ilike(f"%{duration.strip()}%"))

    total = query.count()
    total_pages = max(1, math.ceil(total / page_size))
    offset = (page - 1) * page_size

    courses = (
        query.order_by(Course.name.asc())
        .offset(offset)
        .limit(page_size)
        .all()
    )

    items = [map_course_summary(c) for c in courses]

    return CourseListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1,
    )


@router.get("/{course_id}", response_model=CourseSummary)
def get_course_detail(course_id: int, db: Session = Depends(get_db)) -> CourseSummary:
    """Get detailed information for a single course by its ID."""
    course = (
        db.query(Course)
        .options(joinedload(Course.provider), joinedload(Course.data_source))
        .filter(Course.id == course_id)
        .first()
    )
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course with ID {course_id} not found",
        )
    return map_course_summary(course)
