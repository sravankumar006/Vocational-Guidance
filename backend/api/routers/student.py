"""
Student Router with RBAC, dashboard, and progressive profile endpoints (Phase 3 Bricks 10 & 11).
"""

from typing import Tuple, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.session import get_db
from models import User, StudentProfile, CounsellingSession
from api.deps import require_student, verify_student_self
from schemas.student import (
    StudentDashboardResponse,
    StudentProfileSummary,
    CounsellingSessionSummary,
    FamilyStatusInfo,
    StudentProfileDetailResponse,
    StudentProfileUpdateRequest,
)
from schemas.career import CareerRecommendationsResponse
from services.recommendation_service import generate_recommendations

router = APIRouter(prefix="/student", tags=["Student"])


def compute_profile_metrics(user: User, profile: StudentProfile) -> Tuple[int, Dict[str, bool]]:
    """
    Computes truthful section completion and overall progress for the student.
    5 distinct sections (20% each):
    1. about_you (name, age, location)
    2. education (education_level and stream/institution/strengths)
    3. family_context (household_income_range)
    4. interests (interests list)
    5. work_preferences (work_location_preferences and career_preferences)
    """
    interests = profile.interests if isinstance(profile.interests, list) else []
    work_prefs = profile.work_location_preferences if isinstance(profile.work_location_preferences, list) else []
    career_prefs = profile.career_preferences if isinstance(profile.career_preferences, list) else []
    strengths = profile.academic_strengths if isinstance(profile.academic_strengths, list) else []

    section_1 = bool(user.name and profile.age and profile.location)
    section_2 = bool(profile.education_level and (profile.education_stream or profile.institution or len(strengths) > 0))
    section_3 = bool(profile.household_income_range)
    section_4 = bool(len(interests) > 0)
    section_5 = bool(len(work_prefs) > 0 or len(career_prefs) > 0)

    sections = {
        "about_you": section_1,
        "education": section_2,
        "family_context": section_3,
        "interests": section_4,
        "work_preferences": section_5,
    }

    completion_pct = int((sum(sections.values()) / len(sections)) * 100)
    return completion_pct, sections


@router.get("/")
def student_placeholder() -> dict[str, str]:
    """Architectural placeholder for future student endpoints."""
    return {"module": "student", "status": "mounted"}


@router.get("/dashboard", response_model=StudentDashboardResponse)
def get_student_dashboard(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db),
) -> StudentDashboardResponse:
    """
    Retrieve real, scoped dashboard context for the authenticated student.
    Derives context strictly from the authenticated JWT session.
    Never accepts arbitrary student_ids.
    """
    profile = current_user.student_profile
    if not profile:
        profile = StudentProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    # 1. Profile Summary & Checklist Completion Calculation
    interests = profile.interests if isinstance(profile.interests, list) else []
    skills = profile.skills if isinstance(profile.skills, list) else []
    completion_pct, _ = compute_profile_metrics(current_user, profile)

    profile_summary = StudentProfileSummary(
        id=profile.id,
        name=current_user.name,
        email=current_user.email,
        phone=current_user.phone,
        education_level=profile.education_level,
        education_stream=profile.education_stream,
        location=profile.location,
        interests=interests,
        skills=skills,
        profile_completion_percentage=completion_pct,
    )

    # 2. Current Career:
    # No selected career has been persisted yet; returns None honestly.
    current_career = None

    # 3. Recommended Careers:
    # Recommendation engine is not yet implemented; returns empty list honestly.
    recommended_careers = []

    # 4. Latest Counselling Session:
    latest_session = (
        db.query(CounsellingSession)
        .filter(CounsellingSession.student_profile_id == profile.id)
        .order_by(CounsellingSession.started_at.desc())
        .first()
    )

    counselling_summary = None
    if latest_session:
        messages = latest_session.messages or []
        last_preview = messages[-1].content[:100] if messages else None
        status_str = (
            latest_session.status.value
            if hasattr(latest_session.status, "value")
            else str(latest_session.status)
        )
        counselling_summary = CounsellingSessionSummary(
            id=latest_session.id,
            status=status_str,
            started_at=latest_session.started_at,
            ended_at=latest_session.ended_at,
            message_count=len(messages),
            last_message_preview=last_preview,
        )

    # 5. Parent / Family Status:
    associations = profile.parent_associations or []
    if associations:
        primary = associations[0]
        parent_user = primary.parent_profile.user if primary.parent_profile else None
        family_status = FamilyStatusInfo(
            has_linked_parent=True,
            parent_name=parent_user.name if parent_user else None,
            relationship_type=primary.relationship_type or (
                primary.parent_profile.relationship_to_student if primary.parent_profile else None
            ),
            linked_at=primary.created_at,
        )
    else:
        family_status = FamilyStatusInfo(
            has_linked_parent=False,
            parent_name=None,
            relationship_type=None,
            linked_at=None,
        )

    return StudentDashboardResponse(
        profile=profile_summary,
        current_career=current_career,
        recommended_careers=recommended_careers,
        latest_counselling_session=counselling_summary,
        family_status=family_status,
    )


@router.get("/profile", response_model=StudentProfileDetailResponse)
def get_student_profile(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db),
) -> StudentProfileDetailResponse:
    """
    Retrieve the comprehensive progressive profile for the authenticated student.
    Identity is strictly derived from session token.
    """
    profile = current_user.student_profile
    if not profile:
        profile = StudentProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    completion_pct, sections = compute_profile_metrics(current_user, profile)

    return StudentProfileDetailResponse(
        id=profile.id,
        user_id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        phone=current_user.phone,
        age=profile.age,
        location=profile.location,
        education_level=profile.education_level,
        education_stream=profile.education_stream,
        institution=profile.institution,
        academic_strengths=profile.academic_strengths or [],
        household_income_range=profile.household_income_range,
        interests=profile.interests or [],
        skills=profile.skills or [],
        work_location_preferences=profile.work_location_preferences or [],
        career_preferences=profile.career_preferences or [],
        career_intent=profile.career_intent,
        profile_completion_percentage=completion_pct,
        section_completion=sections,
    )


@router.patch("/profile", response_model=StudentProfileDetailResponse)
def update_student_profile(
    payload: StudentProfileUpdateRequest,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db),
) -> StudentProfileDetailResponse:
    """
    Progressively update student profile sections.
    Supports partial updates without requiring all fields to be submitted.
    """
    profile = current_user.student_profile
    if not profile:
        profile = StudentProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    update_data = payload.model_dump(exclude_unset=True)

    # 1. Handle user-level updates (e.g. name)
    if "name" in update_data:
        current_user.name = update_data.pop("name")
        db.add(current_user)

    # 2. Handle profile-level updates
    for field, value in update_data.items():
        if hasattr(profile, field):
            setattr(profile, field, value)

    db.add(profile)
    db.commit()
    db.refresh(profile)
    db.refresh(current_user)

    completion_pct, sections = compute_profile_metrics(current_user, profile)

    return StudentProfileDetailResponse(
        id=profile.id,
        user_id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        phone=current_user.phone,
        age=profile.age,
        location=profile.location,
        education_level=profile.education_level,
        education_stream=profile.education_stream,
        institution=profile.institution,
        academic_strengths=profile.academic_strengths or [],
        household_income_range=profile.household_income_range,
        interests=profile.interests or [],
        skills=profile.skills or [],
        work_location_preferences=profile.work_location_preferences or [],
        career_preferences=profile.career_preferences or [],
        career_intent=profile.career_intent,
        profile_completion_percentage=completion_pct,
        section_completion=sections,
    )


@router.get("/career-intent")
def get_career_intent(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db),
) -> dict[str, str | None]:
    """Retrieve the authenticated student's current saved career exploration intent."""
    profile = current_user.student_profile
    return {
        "career_intent": profile.career_intent if profile else None,
    }


@router.put("/career-intent")
@router.post("/career-intent")
def update_career_intent(
    payload: dict,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db),
) -> dict[str, str | None]:
    """
    Persistently store the student's career exploration intent (Phase 3 Brick 12).
    Validates against the 5 primary intents.
    """
    intent = payload.get("career_intent")
    if intent is not None:
        from schemas.career import VALID_CAREER_INTENTS
        if intent not in VALID_CAREER_INTENTS:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid career intent. Must be one of: {', '.join(VALID_CAREER_INTENTS)}",
            )

    profile = current_user.student_profile
    if not profile:
        profile = StudentProfile(user_id=current_user.id)
        db.add(profile)

    profile.career_intent = intent
    db.commit()
    db.refresh(profile)

    return {
        "career_intent": profile.career_intent,
        "message": "Career intent saved successfully",
    }


@router.get("/recommendations", response_model=CareerRecommendationsResponse)
def get_student_career_recommendations(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db),
) -> CareerRecommendationsResponse:
    """
    Returns deterministic Top 3 career recommendations for the authenticated student.
    Derived strictly from verified student profile attributes and empirical database records.
    """
    profile = current_user.student_profile
    if not profile:
        profile = StudentProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    return generate_recommendations(user=current_user, profile=profile, db=db, limit=3)


@router.get("/test")
def student_test(current_user: User = Depends(require_student)) -> dict[str, str | int | bool]:
    """Minimal RBAC verification endpoint for student role."""
    return {
        "role": "student",
        "verified": True,
        "user_id": current_user.id,
        "name": current_user.name,
    }


@router.get("/profile/{student_id}")
def student_self_profile_test(
    student_id: int,
    profile: StudentProfile = Depends(verify_student_self),
) -> dict[str, str | int]:
    """
    Self-access isolation verification:
    Only the student owning this profile is allowed.
    """
    return {
        "status": "ok",
        "student_id": profile.id,
        "user_id": profile.user_id,
        "education_level": profile.education_level or "",
    }
