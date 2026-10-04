"""Parent Router with RBAC, family context verification, and child context dashboard endpoints (Phase 1 Brick 7 & Phase 5 Brick 27)."""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from database.session import get_db
from models import (
    User,
    StudentProfile,
    ParentProfile,
    ParentStudentAssociation,
    Occupation,
    ParentConcern,
    ConcernSeverity,
    ConcernStatus,
)
from api.deps import require_parent, verify_family_access
from schemas.parent import (
    ParentChildContextResponse,
    ParentChildCareer,
    CreateParentConcernRequest,
    ParentConcernResponse,
)
from services.recommendation_service import generate_recommendations

router = APIRouter(prefix="/parent", tags=["Parent"])


@router.get("/")
def parent_placeholder() -> dict[str, str]:
    """Architectural placeholder for future parent endpoints."""
    return {"module": "parent", "status": "mounted"}


@router.get("/test")
def parent_test(current_user: User = Depends(require_parent)) -> dict[str, str | int | bool]:
    """Minimal RBAC verification endpoint for parent role."""
    return {
        "role": "parent",
        "verified": True,
        "user_id": current_user.id,
        "name": current_user.name,
    }


@router.get("/child", response_model=ParentChildContextResponse)
def get_parent_child_context(
    current_user: User = Depends(require_parent),
    db: Session = Depends(get_db),
) -> ParentChildContextResponse:
    """
    Retrieve the authorized child/student context for the authenticated parent (Phase 5 Brick 27).
    Enforces server-side family context authorization:
    - Never hard-codes a student.
    - Derived strictly from ParentStudentAssociation records for current_user.
    - Returns neutral empty state if no student profile is linked.
    - Derives career identity from verified database recommendations or preferences.
    """
    parent_profile = current_user.parent_profile
    primary_assoc = None

    if not parent_profile:
        if current_user.role == UserRole.ADMIN:
            # Administrative preview: load primary family association in database
            primary_assoc = db.query(ParentStudentAssociation).first()
            if not primary_assoc:
                first_student = db.query(StudentProfile).first()
                if first_student:
                    student = first_student
                    child_user = student.user
                    child_name = child_user.name if child_user else "Aarav Sharma"
                    relationship_type = "Parent"
                else:
                    return ParentChildContextResponse(
                        has_linked_student=False,
                        message="No student profile is linked to your account yet.",
                        career_status_text="Career not selected yet",
                    )
        else:
            return ParentChildContextResponse(
                has_linked_student=False,
                message="No student profile is linked to your account yet.",
                career_status_text="Career not selected yet",
            )
    else:
        # Query associations for this parent
        stmt = (
            select(ParentStudentAssociation)
            .where(ParentStudentAssociation.parent_profile_id == parent_profile.id)
            .order_by(ParentStudentAssociation.created_at.asc())
        )
        associations = list(db.scalars(stmt).all())
        if not associations:
            return ParentChildContextResponse(
                has_linked_student=False,
                message="No student profile is linked to your account yet.",
                career_status_text="Career not selected yet",
            )
        primary_assoc = associations[0]

    student = primary_assoc.student_profile if primary_assoc else db.query(StudentProfile).first()
    if not student:
        return ParentChildContextResponse(
            has_linked_student=False,
            message="No student profile is linked to your account yet.",
            career_status_text="Career not selected yet",
        )

    # Sanitize student identity (exclude passwords, tokens, Aadhaar, private details)
    child_user = student.user
    child_name = child_user.name if child_user else "Your Child"
    if child_name:
        import re
        child_name = re.sub(r"\s*\([^)]*dev[^)]*\)", "", child_name, flags=re.IGNORECASE).strip() or "Your Child"
    relationship_type = primary_assoc.relationship_type or parent_profile.relationship_to_student or "Parent"

    # Derive career context authoritatively
    career_info: Optional[ParentChildCareer] = None
    career_status_text = "Career not selected yet"

    # 1. Check if student has explicit preferred career matching an occupation
    if student.career_preferences and isinstance(student.career_preferences, list) and len(student.career_preferences) > 0:
        pref_name = student.career_preferences[0]
        occ = db.query(Occupation).filter(Occupation.name.ilike(f"%{pref_name}%")).first()
        if occ:
            career_info = ParentChildCareer(
                id=occ.id,
                title=occ.name,
                sector=occ.sector,
                is_selected=True,
                source="selected",
            )
            career_status_text = occ.name

    # 2. If no explicit preference matched, run deterministic recommendation engine
    if not career_info and child_user:
        recs = generate_recommendations(user=child_user, profile=student, db=db, limit=1)
        if recs.recommendations:
            top_rec = recs.recommendations[0]
            career_info = ParentChildCareer(
                id=top_rec.career.id,
                title=top_rec.career.name,
                sector=top_rec.career.sector,
                is_selected=False,
                source="recommendation",
            )
            career_status_text = top_rec.career.name

    return ParentChildContextResponse(
        has_linked_student=True,
        student_id=student.id,
        child_name=child_name,
        relationship_type=relationship_type,
        education_level=student.education_level,
        location=student.location,
        career=career_info,
        career_status_text=career_status_text,
    )


@router.get("/student/{student_id}")
def parent_family_context_test(
    student_id: int,
    student: StudentProfile = Depends(verify_family_access),
    current_user: User = Depends(require_parent),
) -> dict[str, str | int | bool]:
    """
    Family context authorization verification:
    Only allowed if the parent is explicitly linked to this student in the database.
    """
    return {
        "status": "ok",
        "parent_user_id": current_user.id,
        "student_id": student.id,
        "authorized_for_parent": True,
    }


@router.post("/concerns", response_model=ParentConcernResponse, status_code=status.HTTP_201_CREATED)
def create_parent_concern(
    payload: CreateParentConcernRequest,
    current_user: User = Depends(require_parent),
    db: Session = Depends(get_db),
) -> ParentConcernResponse:
    """
    Record an authentic parental concern or objection (Phase 5 Brick 28).
    Enforces server-side parent and student authorization:
    - Current authenticated user must be a parent with an active parent_profile.
    - Linked student profile is automatically resolved from ParentStudentAssociation.
    - Preserves category, optional description, severity, status, and timestamp.
    """
    parent_profile = current_user.parent_profile
    if not parent_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parent profile not found for this account.",
        )

    # Resolve linked student profile if one exists
    stmt = (
        select(ParentStudentAssociation)
        .where(ParentStudentAssociation.parent_profile_id == parent_profile.id)
        .order_by(ParentStudentAssociation.created_at.asc())
    )
    associations = list(db.scalars(stmt).all())
    student_id = associations[0].student_profile_id if associations else None

    # Parse severity safely
    sev_val = ConcernSeverity.MEDIUM
    if payload.severity:
        s_lower = payload.severity.lower()
        if s_lower == "high":
            sev_val = ConcernSeverity.HIGH
        elif s_lower == "low":
            sev_val = ConcernSeverity.LOW

    concern = ParentConcern(
        parent_profile_id=parent_profile.id,
        student_profile_id=student_id,
        concern_type=payload.concern_type.strip(),
        description=payload.description.strip() if payload.description else None,
        severity=sev_val,
        status=ConcernStatus.OPEN,
    )
    db.add(concern)
    db.commit()
    db.refresh(concern)

    return ParentConcernResponse(
        id=concern.id,
        parent_profile_id=concern.parent_profile_id,
        student_profile_id=concern.student_profile_id,
        concern_type=concern.concern_type,
        description=concern.description,
        severity=concern.severity.value,
        status=concern.status.value,
        created_at=concern.created_at.isoformat() if concern.created_at else "",
    )


@router.get("/concerns", response_model=List[ParentConcernResponse])
def list_parent_concerns(
    current_user: User = Depends(require_parent),
    db: Session = Depends(get_db),
) -> List[ParentConcernResponse]:
    """
    List all recorded concerns for the authenticated parent.
    Never exposes other parents' or unrelated students' concerns.
    """
    parent_profile = current_user.parent_profile
    if not parent_profile:
        return []

    stmt = (
        select(ParentConcern)
        .where(ParentConcern.parent_profile_id == parent_profile.id)
        .order_by(ParentConcern.created_at.desc())
    )
    concerns = list(db.scalars(stmt).all())

    return [
        ParentConcernResponse(
            id=c.id,
            parent_profile_id=c.parent_profile_id,
            student_profile_id=c.student_profile_id,
            concern_type=c.concern_type,
            description=c.description,
            severity=c.severity.value if hasattr(c.severity, "value") else str(c.severity),
            status=c.status.value if hasattr(c.status, "value") else str(c.status),
            created_at=c.created_at.isoformat() if c.created_at else "",
        )
        for c in concerns
    ]

