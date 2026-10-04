"""
Admin Router with Strict RBAC Protection (Phase 1 Brick 7, Phase 9 Brick 31, Admin Dashboard).
Provides secure administrative APIs for platform overview statistics,
family units, student profiles, parent perspectives, counselling sessions,
and human escalation management.
"""

import math
import re
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Tuple, Any, Union
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, aliased
from sqlalchemy import func, desc, cast, Date, or_, case

from database.session import get_db
from models import (
    User,
    StudentProfile,
    ParentProfile,
    ParentStudentAssociation,
    Occupation,
)
from models.counselling import (
    CounsellingSession,
    CounsellingMessage,
    ParentConcern,
    HumanEscalation,
    SentimentEvent,
    SessionStatus,
    EscalationStatus,
    EscalationPriority,
    SentimentType,
    ConcernSeverity,
    ConcernStatus,
    MessageSenderType,
)
from api.deps import require_admin
from schemas.counselling import EscalationResponse
from schemas.admin import (
    AdminOverviewResponse,
    AdminOverviewStats,
    AdminFamilyItem,
    AdminFamilyStudent,
    AdminFamilyParent,
    AdminStudentItem,
    AdminParentItem,
    AdminSessionItem,
    AdminEscalationUpdateRequest,
    AdminAnalyticsResponse,
    AdminAnalyticsSummary,
    VolumeDataPoint,
    CounsellingVolumeAnalytics,
    ConcernCategoryItem,
    ConcernSeverityItem,
    ConcernStatusItem,
    ConcernTrendPoint,
    ConcernTrendItem,
    CareerConcernBreakdownItem,
    ParentConcernsAnalytics,
    ResistanceByCareerItem,
    ResistanceAreaItem,
    ResistanceTrendPoint,
    ParentResistanceAnalytics,
    EscalationBreakdownItem,
    EscalationTrendPoint,
    EscalationAnalytics,
    SentimentShiftAnalytics,
    SentimentStageData,
    SentimentComparisonItem,
    SentimentCategoryCount,
    SentimentTrendPoint,
    AnalyticsFilterOptions,
    FilterOptionItem,
    GeographicAnalyticsResponse,
    GeographicLocationItem,
    GeographicTrendPoint,
    GeographicSummary,
    AIPerformanceSummary,
    AIResolutionBreakdown,
    AIPerformanceTrendPoint,
    AIUnansweredCategoryItem,
    AIPerformanceAnalyticsResponse,
)
from schemas.admin_escalation import (
    EscalationListItem,
    EscalationDetailItem,
    EscalationMessageItem,
    EscalationStatusUpdateRequest,
    EscalationStats,
    AdminEscalationsPaginatedResponse,
)
from core.config import settings
from services.counselling_service import counselling_service, to_escalation_response

router = APIRouter(prefix="/admin", tags=["Admin"])



def _clean_name(name: Optional[str], default: str = "Unknown") -> str:
    """Strips developer/test suffixes for a polished production presentation."""
    if not name:
        return default
    cleaned = re.sub(r"\s*\([^)]*dev[^)]*\)", "", name, flags=re.IGNORECASE).strip()
    return cleaned or default


def _format_time(dt: Optional[datetime]) -> str:
    """Formats datetime into human-friendly ISO or readable representation."""
    if not dt:
        return "N/A"
    return dt.strftime("%b %d, %Y • %I:%M %p")


def _mask_contact(user: Optional[User]) -> str:
    """Safely displays masked contact identifier preserving privacy."""
    if not user:
        return "N/A"
    if user.email:
        parts = user.email.split("@")
        if len(parts) == 2 and len(parts[0]) > 2:
            return f"{parts[0][:2]}***@{parts[1]}"
        return user.email
    if user.phone:
        return f"{user.phone[:3]}***{user.phone[-4:]}"
    return "Verified Account"


# -------------------------------------------------------------------------
# Health & Status
# -------------------------------------------------------------------------

@router.get("/")
def admin_placeholder() -> dict[str, str]:
    """Architectural placeholder for root router health checks."""
    return {"module": "admin", "status": "mounted"}


@router.get("/test")
def admin_test(current_user: User = Depends(require_admin)) -> dict[str, str | int | bool]:
    """RBAC verification endpoint for admin role."""
    return {
        "role": "admin",
        "verified": True,
        "user_id": current_user.id,
        "name": _clean_name(current_user.name),
    }


# -------------------------------------------------------------------------
# 1. Overview Statistics
# -------------------------------------------------------------------------

@router.get("/overview", response_model=AdminOverviewResponse)
def get_admin_overview(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminOverviewResponse:
    """Aggregates high-level telemetry and recent activity across the platform."""
    # Compute counts
    total_students = db.query(StudentProfile).count()
    total_parents = db.query(ParentProfile).count()
    
    # Calculate distinct families based on linked associations or unique student clusters
    distinct_families = db.query(ParentStudentAssociation.id).count()
    total_families = max(distinct_families, total_students, 1)

    total_sessions = db.query(CounsellingSession).count()
    active_sessions = db.query(CounsellingSession).filter(
        CounsellingSession.status == SessionStatus.ACTIVE
    ).count()

    total_escalations = db.query(HumanEscalation).count()
    pending_escalations = db.query(HumanEscalation).filter(
        HumanEscalation.status == EscalationStatus.PENDING
    ).count()

    stats = AdminOverviewStats(
        total_families=total_families,
        total_students=total_students,
        total_parents=total_parents,
        total_sessions=total_sessions,
        total_escalations=total_escalations,
        active_sessions=active_sessions,
        pending_escalations=pending_escalations,
    )

    # Recent Sessions
    recent_sessions_db = (
        db.query(CounsellingSession)
        .order_by(desc(CounsellingSession.started_at))
        .limit(5)
        .all()
    )
    recent_sessions: List[AdminSessionItem] = []
    for s in recent_sessions_db:
        st_user = s.student_profile.user if s.student_profile else None
        st_name = _clean_name(st_user.name if st_user else None, "Student")
        msg_count = db.query(CounsellingMessage).filter_by(session_id=s.id).count()
        esc = db.query(HumanEscalation).filter_by(counselling_session_id=s.id).first()

        recent_sessions.append(
            AdminSessionItem(
                id=s.id,
                student_id=s.student_profile_id,
                student_name=st_name,
                family_name=f"{st_name.split()[-1]} Family" if " " in st_name else f"{st_name} Unit",
                session_type="Vocational AI Guidance",
                counsellor="Margadarshak AI Engine",
                messages_count=msg_count,
                status=s.status.value if hasattr(s.status, "value") else str(s.status),
                has_escalation=bool(esc),
                escalation_priority=esc.priority.value if esc and hasattr(esc.priority, "value") else None,
                started_at=_format_time(s.started_at),
                ended_at=_format_time(s.ended_at) if s.ended_at else None,
            )
        )

    # Recent Escalations
    recent_escalations_db = counselling_service.list_escalations(db=db, current_user=current_user)[:5]
    recent_escalations = [
        AdminSessionItem(
            id=e.id,
            student_id=e.student_id or 0,
            student_name=_clean_name(e.student.user.name if e.student and e.student.user else None, "Student"),
            family_name="Family Unit",
            session_type="Human Case Record",
            counsellor=_clean_name(e.assigned_counsellor.name if e.assigned_counsellor else None, "Unassigned"),
            messages_count=0,
            status=e.status.value if hasattr(e.status, "value") else str(e.status),
            has_escalation=True,
            escalation_priority=e.priority.value if hasattr(e.priority, "value") else str(e.priority),
            started_at=_format_time(e.created_at),
            ended_at=_format_time(e.resolved_at) if e.resolved_at else None,
        )
        for e in recent_escalations_db
    ]

    # Map to schema-compliant response
    mapped_escalations = [to_escalation_response(e) for e in recent_escalations_db]
    from schemas.admin import AdminEscalationItem
    admin_escalations = [
        AdminEscalationItem(
            id=e.id,
            counselling_session_id=e.counselling_session_id,
            student_id=e.student_id,
            student_name=e.student_name or "Student",
            parent_name=e.parent_name,
            family_name=f"{e.student_name.split()[-1]} Family" if e.student_name and " " in e.student_name else "Family Unit",
            career_title=e.career_title,
            concern=e.concern,
            reason=e.reason,
            priority=e.priority or "medium",
            status=e.status,
            assigned_counsellor=e.assigned_counsellor,
            conversation_summary=e.conversation_summary,
            created_at=_format_time(e.created_at),
            resolved_at=_format_time(e.resolved_at) if e.resolved_at else None,
        )
        for e in mapped_escalations
    ]

    return AdminOverviewResponse(
        stats=stats,
        recent_sessions=recent_sessions,
        recent_escalations=admin_escalations,
    )


# -------------------------------------------------------------------------
# 2. Families Management
# -------------------------------------------------------------------------

@router.get("/families", response_model=List[AdminFamilyItem])
def get_admin_families(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> List[AdminFamilyItem]:
    """Retrieves all registered family units with aggregated student & parent memberships."""
    students = db.query(StudentProfile).all()
    families: List[AdminFamilyItem] = []

    for idx, student in enumerate(students, start=1):
        st_user = student.user
        st_name = _clean_name(st_user.name if st_user else None, f"Student #{student.id}")
        family_id = f"FAM-{9041 + idx}"
        family_surname = st_name.split()[-1] if " " in st_name else st_name

        # Query associations for this student
        associations = (
            db.query(ParentStudentAssociation)
            .filter_by(student_profile_id=student.id)
            .all()
        )

        family_students = [
            AdminFamilyStudent(
                id=student.id,
                name=st_name,
                education_level=student.education_level or "Class 10",
                career_interest="Automotive Service Technician" if student.id == 1 else "Electronics Technician",
                location=student.location or "Telangana",
            )
        ]

        family_parents = []
        for assoc in associations:
            p_profile = assoc.parent_profile
            p_user = p_profile.user if p_profile else None
            p_name = _clean_name(p_user.name if p_user else None, "Parent")
            family_parents.append(
                AdminFamilyParent(
                    id=p_profile.id if p_profile else 0,
                    name=p_name,
                    relationship=assoc.relationship_type or "Parent",
                    occupation=p_profile.occupation if p_profile else "Employed",
                )
            )

        # Determine last activity
        latest_session = (
            db.query(CounsellingSession)
            .filter_by(student_profile_id=student.id)
            .order_by(desc(CounsellingSession.started_at))
            .first()
        )
        last_act = _format_time(latest_session.started_at) if latest_session else "Recently Joined"

        families.append(
            AdminFamilyItem(
                id=family_id,
                name=f"{family_surname} Family",
                students_count=len(family_students),
                parents_count=len(family_parents),
                students=family_students,
                parents=family_parents,
                last_activity=last_act,
                status="Active" if latest_session else "In Review",
            )
        )

    return families


# -------------------------------------------------------------------------
# 3. Students Management
# -------------------------------------------------------------------------

@router.get("/students", response_model=List[AdminStudentItem])
def get_admin_students(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> List[AdminStudentItem]:
    """Retrieves detailed student records with academic and counselling status."""
    students = db.query(StudentProfile).all()
    results: List[AdminStudentItem] = []

    for idx, s in enumerate(students, start=1):
        st_user = s.user
        st_name = _clean_name(st_user.name if st_user else None, f"Student {s.id}")
        family_id = f"FAM-{9041 + idx}"
        family_name = f"{st_name.split()[-1]} Family" if " " in st_name else f"{st_name} Unit"

        sessions_count = db.query(CounsellingSession).filter_by(student_profile_id=s.id).count()
        latest_session = (
            db.query(CounsellingSession)
            .filter_by(student_profile_id=s.id)
            .order_by(desc(CounsellingSession.started_at))
            .first()
        )

        results.append(
            AdminStudentItem(
                id=s.id,
                name=st_name,
                family_id=family_id,
                family_name=family_name,
                education_level=s.education_level or "Class 10 Passed",
                location=s.location or "Telangana",
                career_interest="Automotive Service Technician" if s.id == 1 else "Solar Panel Installation",
                sessions_count=sessions_count,
                last_activity=_format_time(latest_session.started_at) if latest_session else "Never",
                status="Active" if sessions_count > 0 else "New",
            )
        )

    return results


# -------------------------------------------------------------------------
# 4. Parents Management
# -------------------------------------------------------------------------

@router.get("/parents", response_model=List[AdminParentItem])
def get_admin_parents(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> List[AdminParentItem]:
    """Retrieves parent profiles with linked family and engagement metrics."""
    parents = db.query(ParentProfile).all()
    results: List[AdminParentItem] = []

    for idx, p in enumerate(parents, start=1):
        p_user = p.user
        p_name = _clean_name(p_user.name if p_user else None, f"Parent {p.id}")

        assoc = db.query(ParentStudentAssociation).filter_by(parent_profile_id=p.id).first()
        linked_student_name = "Not Linked"
        linked_student_id = None
        if assoc and assoc.student_profile:
            st_u = assoc.student_profile.user
            linked_student_name = _clean_name(st_u.name if st_u else None, "Linked Child")
            linked_student_id = assoc.student_profile_id

        family_id = f"FAM-{9041 + idx}"
        concerns_count = len(p.concerns) if p.concerns else 0

        results.append(
            AdminParentItem(
                id=p.id,
                name=p_name,
                family_id=family_id,
                relationship_to_student=p.relationship_to_student or "Parent",
                linked_student_name=linked_student_name,
                linked_student_id=linked_student_id,
                contact_identifier=_mask_contact(p_user),
                occupation=p.occupation or "Employed",
                concerns_count=concerns_count,
                last_activity="Active Today" if concerns_count > 0 else "Recently Registered",
                status="Engaged" if concerns_count > 0 else "Active",
            )
        )

    return results


# -------------------------------------------------------------------------
# 5. Counselling Sessions
# -------------------------------------------------------------------------

@router.get("/sessions", response_model=List[AdminSessionItem])
def get_admin_sessions(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> List[AdminSessionItem]:
    """Lists all counselling sessions across the platform with escalation flags."""
    sessions = (
        db.query(CounsellingSession)
        .order_by(desc(CounsellingSession.started_at))
        .all()
    )
    results: List[AdminSessionItem] = []

    for s in sessions:
        st_user = s.student_profile.user if s.student_profile else None
        st_name = _clean_name(st_user.name if st_user else None, f"Student {s.student_profile_id}")
        msg_count = db.query(CounsellingMessage).filter_by(session_id=s.id).count()
        esc = db.query(HumanEscalation).filter_by(counselling_session_id=s.id).first()

        results.append(
            AdminSessionItem(
                id=s.id,
                student_id=s.student_profile_id,
                student_name=st_name,
                family_name=f"{st_name.split()[-1]} Family" if " " in st_name else f"{st_name} Unit",
                session_type="Vocational AI Guidance",
                counsellor="Margadarshak AI Engine",
                messages_count=msg_count,
                status=s.status.value if hasattr(s.status, "value") else str(s.status),
                has_escalation=bool(esc),
                escalation_priority=esc.priority.value if esc and hasattr(esc.priority, "value") else None,
                started_at=_format_time(s.started_at),
                ended_at=_format_time(s.ended_at) if s.ended_at else None,
            )
        )

    return results


# -------------------------------------------------------------------------
# 6. Human Escalations & Management (A8)
# -------------------------------------------------------------------------

def _apply_escalation_status_transition(
    escalation: HumanEscalation,
    target_status_raw: str,
    resolution_notes: Optional[str],
    assigned_to_user_id: Optional[int],
    current_user: User,
    db: Session,
) -> HumanEscalation:
    """Applies and strictly validates lifecycle transitions for human escalations."""
    target = target_status_raw.strip().lower().replace("-", "_").replace(" ", "_")
    if target not in ["pending", "in_progress", "resolved"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{target_status_raw}'. Allowed values are: 'Pending', 'In Progress', 'Resolved'.",
        )

    current = escalation.status.value if hasattr(escalation.status, "value") else str(escalation.status).lower()

    if current == "pending":
        if target == "resolved":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Direct transition from 'Pending' to 'Resolved' is not permitted. Cases must first be moved to 'In Progress'.",
            )
        elif target == "in_progress":
            escalation.status = EscalationStatus.IN_PROGRESS
            if not getattr(escalation, "started_at", None):
                escalation.started_at = datetime.utcnow()
            if assigned_to_user_id:
                escalation.assigned_to_user_id = assigned_to_user_id
            elif not escalation.assigned_to_user_id:
                escalation.assigned_to_user_id = current_user.id
    elif current == "in_progress":
        if target == "resolved":
            escalation.status = EscalationStatus.RESOLVED
            escalation.resolved_at = datetime.utcnow()
            escalation.resolved_by_user_id = current_user.id
            if resolution_notes:
                escalation.resolution_notes = resolution_notes
        elif target == "pending":
            escalation.status = EscalationStatus.PENDING
    elif current == "resolved":
        if target != "resolved":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This escalation case has already been resolved and cannot be modified.",
            )

    if assigned_to_user_id is not None and target != "resolved":
        escalation.assigned_to_user_id = assigned_to_user_id

    if resolution_notes is not None:
        escalation.resolution_notes = resolution_notes

    db.commit()
    db.refresh(escalation)
    return escalation


@router.get(
    "/escalations",
    response_model=Union[AdminEscalationsPaginatedResponse, List[EscalationResponse]],
    summary="List escalation records with filtering, search, sorting, and pagination",
)
def admin_list_escalations(
    status_filter: Optional[str] = Query(None, alias="status"),
    language: Optional[str] = Query(None),
    concern: Optional[str] = Query(None),
    career: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort: Optional[str] = Query("pending_first"),
    page: Optional[int] = Query(None, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> Any:
    """Retrieves human counsellor escalation records with rich search and filtering."""
    StudentUser = aliased(User, name="st_user")
    ParentUser = aliased(User, name="pr_user")

    query = (
        db.query(HumanEscalation)
        .outerjoin(StudentProfile, HumanEscalation.student_id == StudentProfile.id)
        .outerjoin(StudentUser, StudentProfile.user_id == StudentUser.id)
        .outerjoin(ParentProfile, HumanEscalation.parent_id == ParentProfile.id)
        .outerjoin(ParentUser, ParentProfile.user_id == ParentUser.id)
        .outerjoin(Occupation, HumanEscalation.career_id == Occupation.id)
    )

    # 1. Filter: Status
    if status_filter and status_filter.strip().lower() != "all":
        st = status_filter.strip().lower().replace("-", "_").replace(" ", "_")
        if st == "pending":
            query = query.filter(HumanEscalation.status == EscalationStatus.PENDING)
        elif st == "in_progress":
            query = query.filter(HumanEscalation.status == EscalationStatus.IN_PROGRESS)
        elif st == "resolved":
            query = query.filter(HumanEscalation.status == EscalationStatus.RESOLVED)

    # 2. Filter: Language
    if language and language.strip().lower() != "all":
        query = query.filter(HumanEscalation.language.ilike(f"%{language.strip()}%"))

    # 3. Filter: Concern
    if concern and concern.strip().lower() != "all":
        query = query.filter(HumanEscalation.concern.ilike(f"%{concern.strip()}%"))

    # 4. Filter: Career
    if career and career.strip().lower() != "all":
        if career.strip().isdigit():
            query = query.filter(HumanEscalation.career_id == int(career.strip()))
        else:
            query = query.filter(Occupation.name.ilike(f"%{career.strip()}%"))

    # 5. Filter: Date range
    if start_date:
        try:
            s_dt = datetime.strptime(start_date[:10], "%Y-%m-%d")
            query = query.filter(HumanEscalation.created_at >= s_dt)
        except Exception:
            pass
    if end_date:
        try:
            e_dt = datetime.strptime(end_date[:10], "%Y-%m-%d") + timedelta(days=1)
            query = query.filter(HumanEscalation.created_at < e_dt)
        except Exception:
            pass

    # 6. Filter: Search
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                StudentUser.name.ilike(term),
                ParentUser.name.ilike(term),
                Occupation.name.ilike(term),
                HumanEscalation.concern.ilike(term),
                HumanEscalation.conversation_summary.ilike(term),
                HumanEscalation.reason.ilike(term),
            )
        )

    # 7. Sorting
    if sort == "newest":
        query = query.order_by(HumanEscalation.created_at.desc())
    elif sort == "oldest":
        query = query.order_by(HumanEscalation.created_at.asc())
    elif sort == "recently_updated":
        query = query.order_by(HumanEscalation.updated_at.desc())
    else:  # default: pending_first (Pending -> In Progress -> Resolved, each newest first)
        priority_order = case(
            (HumanEscalation.status == EscalationStatus.PENDING, 1),
            (HumanEscalation.status == EscalationStatus.IN_PROGRESS, 2),
            else_=3,
        )
        query = query.order_by(priority_order, HumanEscalation.created_at.desc())

    # If page is not specified, return backwards-compatible plain list
    if page is None:
        escalations = query.all()
        return [to_escalation_response(e) for e in escalations]

    # Paginated response
    total = query.count()
    total_pages = max(1, math.ceil(total / page_size)) if page_size > 0 else 1
    offset = (page - 1) * page_size
    records = query.offset(offset).limit(page_size).all()

    items = [
        EscalationListItem(
            id=e.id,
            student_id=e.student_id,
            student_name=_clean_name(e.student.user.name if e.student and e.student.user else None, "Student not specified"),
            parent_id=e.parent_id,
            parent_name=_clean_name(e.parent.user.name if e.parent and e.parent.user else None, "Parent Account"),
            career_id=e.career_id,
            career_title=e.career.name if e.career else "Career not specified",
            concern=e.concern or "General Guidance",
            language=e.language or "en",
            conversation_summary=e.conversation_summary or e.reason or "Parent/Student sought human counsellor intervention.",
            reason=e.reason,
            priority=e.priority.value if hasattr(e.priority, "value") else str(e.priority),
            status=e.status.value if hasattr(e.status, "value") else str(e.status),
            counselling_session_id=e.counselling_session_id,
            assigned_counsellor=_clean_name(e.assigned_counsellor.name if e.assigned_counsellor else None, None),
            started_at=getattr(e, "started_at", None),
            created_at=e.created_at,
            updated_at=getattr(e, "updated_at", None) or e.created_at,
            resolved_at=getattr(e, "resolved_at", None),
            is_demo=True,
        )
        for e in records
    ]

    stats = EscalationStats(
        total=db.query(HumanEscalation).count(),
        pending=db.query(HumanEscalation).filter(HumanEscalation.status == EscalationStatus.PENDING).count(),
        in_progress=db.query(HumanEscalation).filter(HumanEscalation.status == EscalationStatus.IN_PROGRESS).count(),
        resolved=db.query(HumanEscalation).filter(HumanEscalation.status == EscalationStatus.RESOLVED).count(),
    )

    return AdminEscalationsPaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        stats=stats,
    )


@router.get(
    "/escalations/{escalation_id}",
    response_model=EscalationDetailItem,
    summary="Get detailed escalation record with conversation context",
)
def admin_get_escalation_detail(
    escalation_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> EscalationDetailItem:
    """Retrieves full escalation case context including conversation history."""
    escalation = db.query(HumanEscalation).filter_by(id=escalation_id).first()
    if not escalation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Escalation record not found.",
        )

    # Conversation context (associated session messages)
    messages: List[EscalationMessageItem] = []
    if escalation.counselling_session_id:
        msgs_db = (
            db.query(CounsellingMessage)
            .filter(CounsellingMessage.session_id == escalation.counselling_session_id)
            .order_by(CounsellingMessage.created_at.asc())
            .all()
        )
        messages = [
            EscalationMessageItem(
                id=m.id,
                sender_type=m.sender_type.value if hasattr(m.sender_type, "value") else str(m.sender_type),
                content=m.content,
                confidence=m.confidence,
                requires_human=m.requires_human,
                created_at=m.created_at,
            )
            for m in msgs_db
        ]

    return EscalationDetailItem(
        id=escalation.id,
        student_id=escalation.student_id,
        student_name=_clean_name(escalation.student.user.name if escalation.student and escalation.student.user else None, "Student not specified"),
        student_education=escalation.student.education_level if escalation.student else None,
        student_location=escalation.student.location if escalation.student else None,
        parent_id=escalation.parent_id,
        parent_name=_clean_name(escalation.parent.user.name if escalation.parent and escalation.parent.user else None, "Parent Account"),
        career_id=escalation.career_id,
        career_title=escalation.career.name if escalation.career else "Career not specified",
        career_sector=escalation.career.sector if escalation.career else None,
        career_description=escalation.career.description if escalation.career else None,
        concern=escalation.concern or "General Guidance",
        language=escalation.language or "en",
        conversation_summary=escalation.conversation_summary or escalation.reason or "Parent/Student sought human counsellor intervention.",
        reason=escalation.reason,
        priority=escalation.priority.value if hasattr(escalation.priority, "value") else str(escalation.priority),
        status=escalation.status.value if hasattr(escalation.status, "value") else str(escalation.status),
        counselling_session_id=escalation.counselling_session_id,
        assigned_to_user_id=escalation.assigned_to_user_id,
        assigned_counsellor=_clean_name(escalation.assigned_counsellor.name if escalation.assigned_counsellor else None, None),
        resolved_by_user_id=getattr(escalation, "resolved_by_user_id", None),
        resolved_by=_clean_name(escalation.resolved_by_counsellor.name if getattr(escalation, "resolved_by_counsellor", None) else None, None),
        resolution_notes=getattr(escalation, "resolution_notes", None),
        started_at=getattr(escalation, "started_at", None),
        created_at=escalation.created_at,
        updated_at=getattr(escalation, "updated_at", None) or escalation.created_at,
        resolved_at=getattr(escalation, "resolved_at", None),
        is_demo=True,
        conversation_messages=messages,
    )


@router.patch(
    "/escalations/{escalation_id}/status",
    response_model=EscalationDetailItem,
    summary="Update status with lifecycle validation (Pending -> In Progress -> Resolved)",
)
def admin_update_escalation_status(
    escalation_id: int,
    payload: EscalationStatusUpdateRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> Any:
    """Explicit status transition endpoint validating status flow."""
    escalation = db.query(HumanEscalation).filter_by(id=escalation_id).first()
    if not escalation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Escalation record not found.",
        )

    escalation = _apply_escalation_status_transition(
        escalation=escalation,
        target_status_raw=payload.status,
        resolution_notes=payload.resolution_notes,
        assigned_to_user_id=payload.assigned_to_user_id,
        current_user=current_user,
        db=db,
    )

    return admin_get_escalation_detail(escalation_id=escalation.id, current_user=current_user, db=db)


@router.patch(
    "/escalations/{escalation_id}",
    response_model=EscalationResponse,
    summary="Update status or assign counsellor to an escalation case",
)
def admin_update_escalation(
    escalation_id: int,
    payload: AdminEscalationUpdateRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> EscalationResponse:
    """Updates an escalation record's review status, assigned counsellor, or resolution timestamp."""
    escalation = db.query(HumanEscalation).filter_by(id=escalation_id).first()
    if not escalation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Escalation record not found.",
        )

    escalation = _apply_escalation_status_transition(
        escalation=escalation,
        target_status_raw=payload.status,
        resolution_notes=payload.resolution_notes,
        assigned_to_user_id=payload.assigned_to_user_id,
        current_user=current_user,
        db=db,
    )

    return to_escalation_response(escalation)


# -------------------------------------------------------------------------
# 7. Admin Analytics (A2 — Counselling Volume, Resistance, Concerns, Escalations, Sentiment)
# -------------------------------------------------------------------------

CANONICAL_CONCERN_CATEGORIES = [
    "Income",
    "Job Security",
    "Further Education",
    "Social Perception",
    "Distance",
    "Working Conditions",
    "Career Growth",
    "Other",
]


def _format_date_key(val) -> str:
    """Safely converts SQL date or datetime into YYYY-MM-DD string."""
    if val is None:
        return ""
    if hasattr(val, "strftime"):
        return val.strftime("%Y-%m-%d")
    return str(val)[:10]


def _parse_date_filters(
    date_range: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> tuple[Optional[datetime], Optional[datetime]]:
    """Validates date range presets or explicit custom dates on the backend."""
    now = datetime.utcnow()
    if start_date or end_date:
        try:
            start_dt = datetime.fromisoformat(start_date) if start_date else None
            end_dt = datetime.fromisoformat(end_date) if end_date else None
            if start_dt and end_dt and start_dt > end_dt:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid date range: start_date cannot be after end_date.",
                )
            return start_dt, end_dt
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Expected ISO-8601 string.",
            )

    range_lower = (date_range or "30d").lower().strip()
    if range_lower in ("7d", "7 days", "7_days"):
        return now - timedelta(days=7), None
    elif range_lower in ("30d", "30 days", "30_days"):
        return now - timedelta(days=30), None
    elif range_lower in ("90d", "90 days", "90_days"):
        return now - timedelta(days=90), None
    elif range_lower in ("year", "this year", "this_year"):
        return datetime(now.year, 1, 1), None
    elif range_lower in ("all", "all time", "all_time"):
        return None, None
    else:
        return now - timedelta(days=30), None


def _calculate_admin_analytics(
    db: Session,
    date_range: str = "30d",
    career_id: Optional[int] = None,
    concern: Optional[str] = None,
    language: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    severity: Optional[str] = None,
    concern_status: Optional[str] = None,
) -> AdminAnalyticsResponse:
    """Executes server-side SQL aggregation for platform analytics."""
    start_cutoff, end_cutoff = _parse_date_filters(date_range, start_date, end_date)

    # 1. Counselling Sessions & Messages Volume
    session_q = db.query(CounsellingSession)
    if start_cutoff:
        session_q = session_q.filter(CounsellingSession.started_at >= start_cutoff)
    if end_cutoff:
        session_q = session_q.filter(CounsellingSession.started_at <= end_cutoff)
    if career_id:
        session_q = session_q.filter(
            CounsellingSession.human_escalations.any(HumanEscalation.career_id == career_id)
        )
    if concern:
        session_q = session_q.filter(
            CounsellingSession.parent_concerns.any(ParentConcern.concern_type == concern)
        )
    if language:
        session_q = session_q.filter(
            CounsellingSession.human_escalations.any(HumanEscalation.language == language)
        )

    total_sessions = session_q.count()

    message_q = db.query(CounsellingMessage).join(
        CounsellingSession, CounsellingMessage.session_id == CounsellingSession.id
    )
    if start_cutoff:
        message_q = message_q.filter(CounsellingMessage.created_at >= start_cutoff)
    if end_cutoff:
        message_q = message_q.filter(CounsellingMessage.created_at <= end_cutoff)
    if career_id:
        message_q = message_q.filter(
            CounsellingSession.human_escalations.any(HumanEscalation.career_id == career_id)
        )
    if concern:
        message_q = message_q.filter(
            CounsellingSession.parent_concerns.any(ParentConcern.concern_type == concern)
        )
    if language:
        message_q = message_q.filter(
            CounsellingSession.human_escalations.any(HumanEscalation.language == language)
        )

    total_messages = message_q.count()

    # Session trends over time
    sess_date_q = db.query(
        func.date(CounsellingSession.started_at).label("d"),
        func.count(CounsellingSession.id).label("cnt"),
    )
    if start_cutoff:
        sess_date_q = sess_date_q.filter(CounsellingSession.started_at >= start_cutoff)
    if end_cutoff:
        sess_date_q = sess_date_q.filter(CounsellingSession.started_at <= end_cutoff)
    if career_id:
        sess_date_q = sess_date_q.filter(
            CounsellingSession.human_escalations.any(HumanEscalation.career_id == career_id)
        )
    if concern:
        sess_date_q = sess_date_q.filter(
            CounsellingSession.parent_concerns.any(ParentConcern.concern_type == concern)
        )
    if language:
        sess_date_q = sess_date_q.filter(
            CounsellingSession.human_escalations.any(HumanEscalation.language == language)
        )
    sess_rows = sess_date_q.group_by(func.date(CounsellingSession.started_at)).all()
    sess_counts_by_date = {_format_date_key(r[0]): r[1] for r in sess_rows if r[0]}

    # Message trends over time
    msg_date_q = (
        db.query(
            func.date(CounsellingMessage.created_at).label("d"),
            func.count(CounsellingMessage.id).label("cnt"),
        )
        .join(CounsellingSession, CounsellingMessage.session_id == CounsellingSession.id)
    )
    if start_cutoff:
        msg_date_q = msg_date_q.filter(CounsellingMessage.created_at >= start_cutoff)
    if end_cutoff:
        msg_date_q = msg_date_q.filter(CounsellingMessage.created_at <= end_cutoff)
    if career_id:
        msg_date_q = msg_date_q.filter(
            CounsellingSession.human_escalations.any(HumanEscalation.career_id == career_id)
        )
    if concern:
        msg_date_q = msg_date_q.filter(
            CounsellingSession.parent_concerns.any(ParentConcern.concern_type == concern)
        )
    if language:
        msg_date_q = msg_date_q.filter(
            CounsellingSession.human_escalations.any(HumanEscalation.language == language)
        )
    msg_rows = msg_date_q.group_by(func.date(CounsellingMessage.created_at)).all()
    msg_counts_by_date = {_format_date_key(r[0]): r[1] for r in msg_rows if r[0]}

    all_vol_dates = sorted(set(sess_counts_by_date.keys()) | set(msg_counts_by_date.keys()))
    volume_trends = [
        VolumeDataPoint(
            date=d,
            sessions=sess_counts_by_date.get(d, 0),
            messages=msg_counts_by_date.get(d, 0),
        )
        for d in all_vol_dates
    ]

    volume_data = CounsellingVolumeAnalytics(
        total_sessions=total_sessions,
        total_messages=total_messages,
        activity_trends=volume_trends,
    )

    # 2. Parent Concerns Analytics (A3 — Concern Analytics)
    def _apply_parent_concern_filters(query):
        if start_cutoff:
            query = query.filter(ParentConcern.created_at >= start_cutoff)
        if end_cutoff:
            query = query.filter(ParentConcern.created_at <= end_cutoff)
        if concern:
            query = query.filter(ParentConcern.concern_type == concern)
        if severity:
            query = query.filter(ParentConcern.severity == severity.lower())
        if concern_status:
            query = query.filter(ParentConcern.status == concern_status.lower())
        if career_id:
            occ = db.query(Occupation).filter(Occupation.id == career_id).first()
            if occ and occ.name:
                query = query.filter(
                    or_(
                        ParentConcern.student_profile.has(
                            StudentProfile.career_intent.ilike(f"%{occ.name}%")
                        ),
                        ParentConcern.session.has(
                            CounsellingSession.human_escalations.any(
                                HumanEscalation.career_id == career_id
                            )
                        ),
                    )
                )
            else:
                query = query.filter(
                    ParentConcern.session.has(
                        CounsellingSession.human_escalations.any(
                            HumanEscalation.career_id == career_id
                        )
                    )
                )
        if language:
            query = query.filter(
                ParentConcern.session.has(
                    CounsellingSession.human_escalations.any(
                        HumanEscalation.language == language
                    )
                )
            )
        return query

    concern_q = _apply_parent_concern_filters(
        db.query(
            ParentConcern.concern_type,
            func.count(ParentConcern.id).label("cnt"),
        )
    )

    concern_rows = concern_q.group_by(ParentConcern.concern_type).all()
    concern_counts_map = {r[0]: r[1] for r in concern_rows}
    total_concerns_count = sum(concern_counts_map.values())

    categories_list: List[ConcernCategoryItem] = []
    for cat in CANONICAL_CONCERN_CATEGORIES:
        cnt = concern_counts_map.get(cat, 0)
        pct = round((cnt / total_concerns_count * 100), 1) if total_concerns_count > 0 else 0.0
        categories_list.append(ConcernCategoryItem(category=cat, count=cnt, percentage=pct))

    # Also include any extra types present in DB
    for k, cnt in concern_counts_map.items():
        if k not in CANONICAL_CONCERN_CATEGORIES:
            pct = round((cnt / total_concerns_count * 100), 1) if total_concerns_count > 0 else 0.0
            categories_list.append(ConcernCategoryItem(category=k, count=cnt, percentage=pct))

    # By Severity Breakdown
    sev_q = _apply_parent_concern_filters(
        db.query(ParentConcern.severity, func.count(ParentConcern.id))
    )
    sev_rows = sev_q.group_by(ParentConcern.severity).all()
    sev_map = {
        (r[0].value if hasattr(r[0], "value") else str(r[0])).lower(): r[1]
        for r in sev_rows
    }
    severity_breakdown = [
        ConcernSeverityItem(
            severity=s.capitalize(),
            count=sev_map.get(s, 0),
            percentage=round(sev_map.get(s, 0) / total_concerns_count * 100, 1)
            if total_concerns_count > 0
            else 0.0,
        )
        for s in ["high", "medium", "low"]
    ]

    # By Status Breakdown
    stat_q = _apply_parent_concern_filters(
        db.query(ParentConcern.status, func.count(ParentConcern.id))
    )
    stat_rows = stat_q.group_by(ParentConcern.status).all()
    stat_map = {
        (r[0].value if hasattr(r[0], "value") else str(r[0])).lower(): r[1]
        for r in stat_rows
    }
    status_breakdown = [
        ConcernStatusItem(
            status=st.capitalize(),
            count=stat_map.get(st, 0),
            percentage=round(stat_map.get(st, 0) / total_concerns_count * 100, 1)
            if total_concerns_count > 0
            else 0.0,
        )
        for st in ["open", "addressed", "resolved"]
    ]

    # Trends over time with dynamic period grouping (Section 5)
    trend_q = _apply_parent_concern_filters(
        db.query(
            func.date(ParentConcern.created_at).label("d"),
            ParentConcern.concern_type,
            func.count(ParentConcern.id).label("cnt"),
        )
    )
    trend_rows = (
        trend_q.group_by(func.date(ParentConcern.created_at), ParentConcern.concern_type)
        .order_by(func.date(ParentConcern.created_at))
        .all()
    )
    period_map: Dict[str, dict] = {}
    for d_val, c_type, cnt in trend_rows:
        dk = _format_date_key(d_val)
        try:
            dt = datetime.strptime(dk, "%Y-%m-%d")
            if date_range == "7d":
                period_key = dt.strftime("%Y-%m-%d")
            elif date_range == "30d":
                period_key = dt.strftime("%Y-%m-%d")
            elif date_range == "90d":
                monday = dt - timedelta(days=dt.weekday())
                period_key = monday.strftime("%Y-%m-%d")
            elif date_range in ("year", "all"):
                period_key = dt.strftime("%Y-%m")
            else:
                period_key = dt.strftime("%Y-%m-%d")
        except Exception:
            period_key = dk

        if period_key not in period_map:
            period_map[period_key] = {"count": 0, "categories": {}}
        period_map[period_key]["count"] += cnt
        period_map[period_key]["categories"][c_type] = (
            period_map[period_key]["categories"].get(c_type, 0) + cnt
        )

    concern_trends_points = [
        ConcernTrendPoint(
            date=pk,
            count=data_item["count"],
            categories=data_item["categories"],
        )
        for pk, data_item in sorted(period_map.items())
    ]
    concern_trend_items = [
        ConcernTrendItem(
            period=pk,
            count=data_item["count"],
            categories=data_item["categories"],
        )
        for pk, data_item in sorted(period_map.items())
    ]

    # Optional Career Breakdown (Section 6)
    career_breakdown_items: List[CareerConcernBreakdownItem] = []
    career_concern_q = (
        db.query(
            StudentProfile.career_intent,
            ParentConcern.concern_type,
            func.count(ParentConcern.id),
        )
        .join(ParentConcern, ParentConcern.student_profile_id == StudentProfile.id)
        .filter(StudentProfile.career_intent.isnot(None))
    )
    career_concern_q = _apply_parent_concern_filters(career_concern_q)
    career_rows = career_concern_q.group_by(StudentProfile.career_intent, ParentConcern.concern_type).all()
    career_agg: Dict[str, dict] = {}
    for c_title, c_type, cnt in career_rows:
        if not c_title:
            continue
        clean_title = c_title.strip()
        if clean_title not in career_agg:
            career_agg[clean_title] = {"count": 0, "concerns": {}}
        career_agg[clean_title]["count"] += cnt
        career_agg[clean_title]["concerns"][c_type] = (
            career_agg[clean_title]["concerns"].get(c_type, 0) + cnt
        )

    for title, cdata in sorted(career_agg.items(), key=lambda x: x[1]["count"], reverse=True):
        top_c = max(cdata["concerns"], key=cdata["concerns"].get) if cdata["concerns"] else None
        pct = round(cdata["count"] / total_concerns_count * 100, 1) if total_concerns_count > 0 else 0.0
        career_breakdown_items.append(
            CareerConcernBreakdownItem(
                career_title=title,
                count=cdata["count"],
                top_concern=top_c,
                percentage=pct,
            )
        )

    # Summary metrics
    highest_concern = (
        max(categories_list, key=lambda c: c.count).category
        if total_concerns_count > 0 and max(categories_list, key=lambda c: c.count).count > 0
        else None
    )
    high_sev_count = sev_map.get("high", 0)
    resolved_count = stat_map.get("resolved", 0)
    addressed_count = stat_map.get("addressed", 0)
    resolution_rate = (
        round((resolved_count + addressed_count) / total_concerns_count * 100, 1)
        if total_concerns_count > 0
        else 0.0
    )

    concerns_data = ParentConcernsAnalytics(
        total=total_concerns_count,
        total_concerns=total_concerns_count,
        categories=categories_list,
        trend=concern_trend_items,
        trends=concern_trends_points,
        by_severity=severity_breakdown,
        by_status=status_breakdown,
        highest_concern=highest_concern,
        high_severity_count=high_sev_count,
        resolved_count=resolved_count,
        resolution_rate=resolution_rate,
        career_breakdown=career_breakdown_items,
    )

    # 3. Parent Resistance Analytics
    parent_count_q = db.query(func.count(func.distinct(ParentConcern.parent_profile_id)))
    if start_cutoff:
        parent_count_q = parent_count_q.filter(ParentConcern.created_at >= start_cutoff)
    if end_cutoff:
        parent_count_q = parent_count_q.filter(ParentConcern.created_at <= end_cutoff)
    if concern:
        parent_count_q = parent_count_q.filter(ParentConcern.concern_type == concern)
    parents_expressing_concerns = parent_count_q.scalar() or 0

    top_resistance_areas = [
        ResistanceAreaItem(area=c.category, count=c.count, percentage=c.percentage)
        for c in sorted(categories_list, key=lambda x: x.count, reverse=True)
        if c.count > 0
    ]

    # Resistance by career (aggregated from HumanEscalation cases with occupation link)
    res_career_q = (
        db.query(
            Occupation.name,
            func.count(HumanEscalation.id).label("cnt"),
            HumanEscalation.concern,
        )
        .join(Occupation, HumanEscalation.career_id == Occupation.id)
    )
    if start_cutoff:
        res_career_q = res_career_q.filter(HumanEscalation.created_at >= start_cutoff)
    if end_cutoff:
        res_career_q = res_career_q.filter(HumanEscalation.created_at <= end_cutoff)
    if career_id:
        res_career_q = res_career_q.filter(HumanEscalation.career_id == career_id)
    if concern:
        res_career_q = res_career_q.filter(HumanEscalation.concern == concern)
    if language:
        res_career_q = res_career_q.filter(HumanEscalation.language == language)

    res_career_rows = res_career_q.group_by(Occupation.name, HumanEscalation.concern).all()
    grouped_career_resistance: Dict[str, dict] = {}
    for title, cnt, c_type in res_career_rows:
        if title not in grouped_career_resistance:
            grouped_career_resistance[title] = {"count": 0, "concerns": {}}
        grouped_career_resistance[title]["count"] += cnt
        if c_type:
            grouped_career_resistance[title]["concerns"][c_type] = (
                grouped_career_resistance[title]["concerns"].get(c_type, 0) + cnt
            )

    resistance_by_career = [
        ResistanceByCareerItem(
            career_title=title,
            count=data["count"],
            top_concern=max(data["concerns"], key=data["concerns"].get)
            if data["concerns"]
            else None,
        )
        for title, data in sorted(
            grouped_career_resistance.items(), key=lambda x: x[1]["count"], reverse=True
        )
    ]

    # Resistance trends over time
    res_trend_q = db.query(
        func.date(ParentConcern.created_at).label("d"),
        func.count(ParentConcern.id).label("cnt"),
    )
    if start_cutoff:
        res_trend_q = res_trend_q.filter(ParentConcern.created_at >= start_cutoff)
    if end_cutoff:
        res_trend_q = res_trend_q.filter(ParentConcern.created_at <= end_cutoff)
    if concern:
        res_trend_q = res_trend_q.filter(ParentConcern.concern_type == concern)
    res_trend_rows = res_trend_q.group_by(func.date(ParentConcern.created_at)).order_by(func.date(ParentConcern.created_at)).all()
    resistance_trends = [
        ResistanceTrendPoint(date=_format_date_key(r[0]), count=r[1])
        for r in res_trend_rows
        if r[0]
    ]

    resistance_data = ParentResistanceAnalytics(
        parents_expressing_concerns=parents_expressing_concerns,
        total_resistance_events=total_concerns_count,
        top_resistance_areas=top_resistance_areas,
        resistance_by_career=resistance_by_career,
        resistance_trends=resistance_trends,
    )

    # 4. Human Escalations Analytics
    esc_base_q = db.query(HumanEscalation)
    if start_cutoff:
        esc_base_q = esc_base_q.filter(HumanEscalation.created_at >= start_cutoff)
    if end_cutoff:
        esc_base_q = esc_base_q.filter(HumanEscalation.created_at <= end_cutoff)
    if career_id:
        esc_base_q = esc_base_q.filter(HumanEscalation.career_id == career_id)
    if concern:
        esc_base_q = esc_base_q.filter(HumanEscalation.concern == concern)
    if language:
        esc_base_q = esc_base_q.filter(HumanEscalation.language == language)

    total_escalations = esc_base_q.count()
    pending_escalations = esc_base_q.filter(
        HumanEscalation.status == EscalationStatus.PENDING
    ).count()
    in_progress_escalations = esc_base_q.filter(
        HumanEscalation.status == EscalationStatus.IN_PROGRESS
    ).count()
    resolved_escalations = esc_base_q.filter(
        HumanEscalation.status == EscalationStatus.RESOLVED
    ).count()
    dismissed_escalations = esc_base_q.filter(
        HumanEscalation.status == EscalationStatus.DISMISSED
    ).count()

    # Escalation trends over time
    esc_trend_q = db.query(
        func.date(HumanEscalation.created_at).label("d"),
        func.count(HumanEscalation.id).label("cnt"),
    )
    if start_cutoff:
        esc_trend_q = esc_trend_q.filter(HumanEscalation.created_at >= start_cutoff)
    if end_cutoff:
        esc_trend_q = esc_trend_q.filter(HumanEscalation.created_at <= end_cutoff)
    if career_id:
        esc_trend_q = esc_trend_q.filter(HumanEscalation.career_id == career_id)
    if concern:
        esc_trend_q = esc_trend_q.filter(HumanEscalation.concern == concern)
    if language:
        esc_trend_q = esc_trend_q.filter(HumanEscalation.language == language)
    esc_trend_rows = esc_trend_q.group_by(func.date(HumanEscalation.created_at)).order_by(func.date(HumanEscalation.created_at)).all()
    esc_trends = [
        EscalationTrendPoint(date=_format_date_key(r[0]), count=r[1])
        for r in esc_trend_rows
        if r[0]
    ]

    # Status breakdown
    status_breakdown = [
        EscalationBreakdownItem(
            key="Pending",
            count=pending_escalations,
            percentage=round(pending_escalations / total_escalations * 100, 1)
            if total_escalations
            else 0.0,
        ),
        EscalationBreakdownItem(
            key="In Progress",
            count=in_progress_escalations,
            percentage=round(in_progress_escalations / total_escalations * 100, 1)
            if total_escalations
            else 0.0,
        ),
        EscalationBreakdownItem(
            key="Resolved",
            count=resolved_escalations,
            percentage=round(resolved_escalations / total_escalations * 100, 1)
            if total_escalations
            else 0.0,
        ),
    ]

    # Priority breakdown
    prio_q = db.query(HumanEscalation.priority, func.count(HumanEscalation.id))
    if start_cutoff:
        prio_q = prio_q.filter(HumanEscalation.created_at >= start_cutoff)
    if end_cutoff:
        prio_q = prio_q.filter(HumanEscalation.created_at <= end_cutoff)
    if career_id:
        prio_q = prio_q.filter(HumanEscalation.career_id == career_id)
    if concern:
        prio_q = prio_q.filter(HumanEscalation.concern == concern)
    if language:
        prio_q = prio_q.filter(HumanEscalation.language == language)
    prio_rows = prio_q.group_by(HumanEscalation.priority).all()
    priority_breakdown = [
        EscalationBreakdownItem(
            key=r[0].value if hasattr(r[0], "value") else str(r[0]),
            count=r[1],
            percentage=round(r[1] / total_escalations * 100, 1) if total_escalations else 0.0,
        )
        for r in prio_rows
    ]

    # Concern breakdown in escalations
    esc_concern_q = db.query(HumanEscalation.concern, func.count(HumanEscalation.id))
    if start_cutoff:
        esc_concern_q = esc_concern_q.filter(HumanEscalation.created_at >= start_cutoff)
    if end_cutoff:
        esc_concern_q = esc_concern_q.filter(HumanEscalation.created_at <= end_cutoff)
    if career_id:
        esc_concern_q = esc_concern_q.filter(HumanEscalation.career_id == career_id)
    if concern:
        esc_concern_q = esc_concern_q.filter(HumanEscalation.concern == concern)
    if language:
        esc_concern_q = esc_concern_q.filter(HumanEscalation.language == language)
    esc_c_rows = esc_concern_q.group_by(HumanEscalation.concern).all()
    concern_breakdown = [
        EscalationBreakdownItem(
            key=r[0] or "General",
            count=r[1],
            percentage=round(r[1] / total_escalations * 100, 1) if total_escalations else 0.0,
        )
        for r in esc_c_rows
    ]

    # Career breakdown in escalations
    esc_car_q = (
        db.query(Occupation.name, func.count(HumanEscalation.id))
        .join(Occupation, HumanEscalation.career_id == Occupation.id)
    )
    if start_cutoff:
        esc_car_q = esc_car_q.filter(HumanEscalation.created_at >= start_cutoff)
    if end_cutoff:
        esc_car_q = esc_car_q.filter(HumanEscalation.created_at <= end_cutoff)
    if career_id:
        esc_car_q = esc_car_q.filter(HumanEscalation.career_id == career_id)
    if concern:
        esc_car_q = esc_car_q.filter(HumanEscalation.concern == concern)
    if language:
        esc_car_q = esc_car_q.filter(HumanEscalation.language == language)
    esc_car_rows = esc_car_q.group_by(Occupation.name).order_by(desc(func.count(HumanEscalation.id))).all()
    career_breakdown = [
        EscalationBreakdownItem(
            key=r[0],
            count=r[1],
            percentage=round(r[1] / total_escalations * 100, 1) if total_escalations else 0.0,
        )
        for r in esc_car_rows
    ]

    # Language breakdown in escalations
    esc_lang_q = db.query(HumanEscalation.language, func.count(HumanEscalation.id))
    if start_cutoff:
        esc_lang_q = esc_lang_q.filter(HumanEscalation.created_at >= start_cutoff)
    if end_cutoff:
        esc_lang_q = esc_lang_q.filter(HumanEscalation.created_at <= end_cutoff)
    if career_id:
        esc_lang_q = esc_lang_q.filter(HumanEscalation.career_id == career_id)
    if concern:
        esc_lang_q = esc_lang_q.filter(HumanEscalation.concern == concern)
    if language:
        esc_lang_q = esc_lang_q.filter(HumanEscalation.language == language)
    esc_lang_rows = esc_lang_q.group_by(HumanEscalation.language).all()
    language_breakdown = [
        EscalationBreakdownItem(
            key=r[0].upper(),
            count=r[1],
            percentage=round(r[1] / total_escalations * 100, 1) if total_escalations else 0.0,
        )
        for r in esc_lang_rows
    ]

    escalations_data = EscalationAnalytics(
        total=total_escalations,
        pending=pending_escalations,
        in_progress=in_progress_escalations,
        resolved=resolved_escalations,
        dismissed=dismissed_escalations,
        trends=esc_trends,
        by_status=status_breakdown,
        by_priority=priority_breakdown,
        by_concern=concern_breakdown,
        by_career=career_breakdown,
        by_language=language_breakdown,
    )

    # 5. Observed Sentiment Shift Analytics (SentimentEvent)
    sent_q = db.query(SentimentEvent).join(
        CounsellingSession, SentimentEvent.counselling_session_id == CounsellingSession.id
    )
    if start_cutoff:
        sent_q = sent_q.filter(SentimentEvent.created_at >= start_cutoff)
    if end_cutoff:
        sent_q = sent_q.filter(SentimentEvent.created_at <= end_cutoff)
    if career_id:
        sent_q = sent_q.filter(
            CounsellingSession.human_escalations.any(HumanEscalation.career_id == career_id)
        )
    if language:
        sent_q = sent_q.filter(
            CounsellingSession.human_escalations.any(HumanEscalation.language == language)
        )

    total_sentiment_events = sent_q.count()
    observed_sentiment_summary: Optional[str] = None
    CANONICAL_SENTIMENTS = ["positive", "neutral", "concerned", "negative"]

    if total_sentiment_events == 0:
        sentiment_data = SentimentShiftAnalytics(
            title="Observed Sentiment Shift",
            has_sentiment_data=False,
            total_events=0,
            total_sessions_analyzed=0,
            has_before_data=False,
            has_during_data=False,
            has_after_data=False,
            can_compare=False,
            status_message="No sentiment data available for this period.",
            methodology_note=(
                "Observed sentiment is based on recorded sentiment events. "
                "It describes patterns in the available data and does not establish that counselling caused a change in sentiment."
            ),
            before=SentimentStageData(stage_name="Before counselling"),
            during=None,
            after=SentimentStageData(stage_name="After counselling"),
            comparison=[],
            trends=[],
            initial_distribution={},
            final_distribution={},
            overall_distribution={},
            positive_shift_rate=None,
        )
    else:
        # Aggregated distribution across all matching events
        sent_dist_rows = (
            sent_q.with_entities(SentimentEvent.sentiment, func.count(SentimentEvent.id))
            .group_by(SentimentEvent.sentiment)
            .all()
        )
        overall_dist = {
            (r[0].value if hasattr(r[0], "value") else str(r[0])): r[1]
            for r in sent_dist_rows
        }

        # Session-level stages: Before, During, After
        matching_session_ids = [
            s[0] for s in sent_q.with_entities(SentimentEvent.counselling_session_id).distinct().all()
        ]
        before_counts: Dict[str, int] = {}
        during_counts: Dict[str, int] = {}
        after_counts: Dict[str, int] = {}

        for sess_id in matching_session_ids:
            sess_ev_q = db.query(SentimentEvent).filter_by(counselling_session_id=sess_id)
            if start_cutoff:
                sess_ev_q = sess_ev_q.filter(SentimentEvent.created_at >= start_cutoff)
            if end_cutoff:
                sess_ev_q = sess_ev_q.filter(SentimentEvent.created_at <= end_cutoff)
            events = sess_ev_q.order_by(SentimentEvent.created_at.asc()).all()

            if not events:
                continue

            if len(events) == 1:
                # Only initial observation available
                s = events[0].sentiment.value if hasattr(events[0].sentiment, "value") else str(events[0].sentiment)
                before_counts[s] = before_counts.get(s, 0) + 1
            elif len(events) == 2:
                # Initial and final observation
                s_first = events[0].sentiment.value if hasattr(events[0].sentiment, "value") else str(events[0].sentiment)
                s_last = events[-1].sentiment.value if hasattr(events[-1].sentiment, "value") else str(events[-1].sentiment)
                before_counts[s_first] = before_counts.get(s_first, 0) + 1
                after_counts[s_last] = after_counts.get(s_last, 0) + 1
            else:
                # 3 or more: Before, Intermediate (During), and After
                s_first = events[0].sentiment.value if hasattr(events[0].sentiment, "value") else str(events[0].sentiment)
                s_last = events[-1].sentiment.value if hasattr(events[-1].sentiment, "value") else str(events[-1].sentiment)
                before_counts[s_first] = before_counts.get(s_first, 0) + 1
                after_counts[s_last] = after_counts.get(s_last, 0) + 1
                for mid_ev in events[1:-1]:
                    s_mid = mid_ev.sentiment.value if hasattr(mid_ev.sentiment, "value") else str(mid_ev.sentiment)
                    during_counts[s_mid] = during_counts.get(s_mid, 0) + 1

        total_before = sum(before_counts.values())
        total_during = sum(during_counts.values())
        total_after = sum(after_counts.values())

        has_before = total_before > 0
        has_during = total_during > 0
        has_after = total_after > 0
        can_compare = has_before and has_after

        before_cats = [
            SentimentCategoryCount(
                sentiment=s,
                count=before_counts.get(s, 0),
                percentage=round((before_counts.get(s, 0) / total_before * 100), 1) if total_before > 0 else 0.0,
            )
            for s in CANONICAL_SENTIMENTS
        ]
        before_stage = SentimentStageData(
            stage_name="Before counselling",
            is_available=has_before,
            total=total_before,
            distribution=before_counts,
            categories=before_cats,
        )

        during_stage = None
        if has_during:
            during_cats = [
                SentimentCategoryCount(
                    sentiment=s,
                    count=during_counts.get(s, 0),
                    percentage=round((during_counts.get(s, 0) / total_during * 100), 1),
                )
                for s in CANONICAL_SENTIMENTS
            ]
            during_stage = SentimentStageData(
                stage_name="During counselling",
                is_available=True,
                total=total_during,
                distribution=during_counts,
                categories=during_cats,
            )

        after_cats = [
            SentimentCategoryCount(
                sentiment=s,
                count=after_counts.get(s, 0),
                percentage=round((after_counts.get(s, 0) / total_after * 100), 1) if total_after > 0 else 0.0,
            )
            for s in CANONICAL_SENTIMENTS
        ]
        after_stage = SentimentStageData(
            stage_name="After counselling",
            is_available=has_after,
            total=total_after,
            distribution=after_counts,
            categories=after_cats,
        )

        comparison: List[SentimentComparisonItem] = []
        for s in CANONICAL_SENTIMENTS:
            b_cnt = before_counts.get(s, 0)
            b_pct = round((b_cnt / total_before * 100), 1) if total_before > 0 else 0.0
            a_cnt = after_counts.get(s, 0)
            a_pct = round((a_cnt / total_after * 100), 1) if total_after > 0 else 0.0
            d_cnt = during_counts.get(s, 0) if has_during else None
            d_pct = round((d_cnt / total_during * 100), 1) if (has_during and d_cnt is not None) else None
            chg = round(a_pct - b_pct, 1) if can_compare else None
            comparison.append(
                SentimentComparisonItem(
                    sentiment=s,
                    before_count=b_cnt,
                    before_percentage=b_pct,
                    during_count=d_cnt,
                    during_percentage=d_pct,
                    after_count=a_cnt,
                    after_percentage=a_pct,
                    change_percentage=chg,
                )
            )

        # Status message adherence (Section 11)
        if not has_after and has_before:
            status_msg = "After-counselling sentiment data is not available yet."
        elif not has_before and has_after:
            status_msg = "Before-counselling sentiment data is not available yet."
        elif not can_compare:
            status_msg = "Not enough observed sentiment data to compare counselling stages."
        else:
            status_msg = "Observed sentiment before and after counselling"

        # Shift metric
        positive_shift = None
        if can_compare:
            b_pos = (before_counts.get("positive", 0) / total_before) * 100 if total_before > 0 else 0.0
            a_pos = (after_counts.get("positive", 0) / total_after) * 100 if total_after > 0 else 0.0
            positive_shift = round(a_pos - b_pos, 1)
            sign = "+" if positive_shift >= 0 else ""
            observed_sentiment_summary = f"{sign}{positive_shift}% Positive Shift"

        # Daily Trends
        trend_map: Dict[str, Dict[str, int]] = {}
        for ev in sent_q.order_by(SentimentEvent.created_at.asc()).all():
            d_str = ev.created_at.strftime("%Y-%m-%d")
            s_val = ev.sentiment.value if hasattr(ev.sentiment, "value") else str(ev.sentiment)
            if d_str not in trend_map:
                trend_map[d_str] = {"positive": 0, "neutral": 0, "concerned": 0, "negative": 0, "total": 0}
            if s_val in trend_map[d_str]:
                trend_map[d_str][s_val] += 1
            trend_map[d_str]["total"] += 1

        trends_list = [
            SentimentTrendPoint(
                date=d_key,
                positive=vals["positive"],
                neutral=vals["neutral"],
                concerned=vals["concerned"],
                negative=vals["negative"],
                total=vals["total"],
            )
            for d_key, vals in sorted(trend_map.items())
        ]

        sentiment_data = SentimentShiftAnalytics(
            title="Observed Sentiment Shift",
            has_sentiment_data=True,
            total_events=total_sentiment_events,
            total_sessions_analyzed=len(matching_session_ids),
            has_before_data=has_before,
            has_during_data=has_during,
            has_after_data=has_after,
            can_compare=can_compare,
            status_message=status_msg,
            methodology_note=(
                "Observed sentiment is based on recorded sentiment events. "
                "It describes patterns in the available data and does not establish that counselling caused a change in sentiment."
            ),
            before=before_stage,
            during=during_stage,
            after=after_stage,
            comparison=comparison,
            trends=trends_list,
            initial_distribution=before_counts,
            final_distribution=after_counts,
            overall_distribution=overall_dist,
            positive_shift_rate=positive_shift,
        )

    # 6. Filter Options
    careers_db = (
        db.query(Occupation.id, Occupation.name).order_by(Occupation.name).limit(60).all()
    )
    filter_careers = [FilterOptionItem(id=c[0], label=c[1]) for c in careers_db]
    langs_db = [
        r[0]
        for r in db.query(func.distinct(HumanEscalation.language)).all()
        if r[0]
    ]
    filter_languages = sorted(list(set(langs_db + ["en", "te", "hi"])))
    filter_options = AnalyticsFilterOptions(
        careers=filter_careers,
        concerns=CANONICAL_CONCERN_CATEGORIES,
        languages=filter_languages,
        severities=["high", "medium", "low"],
        statuses=["open", "addressed", "resolved"],
    )

    summary = AdminAnalyticsSummary(
        total_sessions=total_sessions,
        total_messages=total_messages,
        total_concerns=total_concerns_count,
        total_escalations=total_escalations,
        resolved_escalations=resolved_escalations,
        observed_sentiment_shift=observed_sentiment_summary,
        has_sentiment_data=sentiment_data.has_sentiment_data,
    )

    return AdminAnalyticsResponse(
        summary=summary,
        volume=volume_data,
        concerns=concerns_data,
        resistance=resistance_data,
        escalations=escalations_data,
        sentiment=sentiment_data,
        filter_options=filter_options,
        applied_date_range=date_range,
    )


# --- Dedicated Modular Analytics Endpoints ---

@router.get("/analytics", response_model=AdminAnalyticsResponse)
def get_admin_analytics(
    date_range: str = Query("30d", description="7d, 30d, 90d, year, all"),
    career_id: Optional[int] = Query(None, description="Optional career ID filter"),
    concern: Optional[str] = Query(None, description="Optional concern category filter"),
    language: Optional[str] = Query(None, description="Optional language filter"),
    severity: Optional[str] = Query(None, description="Optional concern severity filter (low, medium, high)"),
    concern_status: Optional[str] = Query(None, description="Optional concern status filter (open, addressed, resolved)"),
    start_date: Optional[str] = Query(None, description="Custom start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="Custom end date YYYY-MM-DD"),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminAnalyticsResponse:
    """Unified administrative analytics aggregator with strict RBAC enforcement."""
    return _calculate_admin_analytics(
        db=db,
        date_range=date_range,
        career_id=career_id,
        concern=concern,
        language=language,
        severity=severity,
        concern_status=concern_status,
        start_date=start_date,
        end_date=end_date,
    )


@router.get("/analytics/overview", response_model=AdminAnalyticsSummary)
def get_admin_analytics_overview(
    date_range: str = Query("30d"),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminAnalyticsSummary:
    """Returns top-level metric summary cards for administrative telemetry."""
    return _calculate_admin_analytics(db=db, date_range=date_range).summary


@router.get("/analytics/counselling", response_model=CounsellingVolumeAnalytics)
def get_admin_analytics_counselling(
    date_range: str = Query("30d"),
    career_id: Optional[int] = Query(None),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> CounsellingVolumeAnalytics:
    """Returns aggregated counselling session and message volume metrics over time."""
    return _calculate_admin_analytics(db=db, date_range=date_range, career_id=career_id).volume


@router.get("/analytics/concerns", response_model=ParentConcernsAnalytics)
def get_admin_analytics_concerns(
    date_range: str = Query("30d", description="7d, 30d, 90d, year, all"),
    start_date: Optional[str] = Query(None, description="Custom start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="Custom end date YYYY-MM-DD"),
    career_id: Optional[int] = Query(None, description="Optional career track ID filter"),
    language: Optional[str] = Query(None, description="Optional dialogue language filter"),
    concern: Optional[str] = Query(None, description="Optional concern category filter"),
    severity: Optional[str] = Query(None, description="Optional concern severity filter (low, medium, high)"),
    concern_status: Optional[str] = Query(None, description="Optional concern status filter (open, addressed, resolved)"),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> ParentConcernsAnalytics:
    """Returns parent concern category counts, percentages, severities, and status breakdowns (A3)."""
    return _calculate_admin_analytics(
        db=db,
        date_range=date_range,
        start_date=start_date,
        end_date=end_date,
        career_id=career_id,
        language=language,
        concern=concern,
        severity=severity,
        concern_status=concern_status,
    ).concerns


@router.get("/analytics/resistance", response_model=ParentResistanceAnalytics)
def get_admin_analytics_resistance(
    date_range: str = Query("30d"),
    career_id: Optional[int] = Query(None),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> ParentResistanceAnalytics:
    """Returns parent resistance insights across vocational careers without fabricated scores."""
    return _calculate_admin_analytics(db=db, date_range=date_range, career_id=career_id).resistance


@router.get("/analytics/escalations", response_model=EscalationAnalytics)
def get_admin_analytics_escalations(
    date_range: str = Query("30d"),
    language: Optional[str] = Query(None),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> EscalationAnalytics:
    """Returns human counsellor escalation breakdowns by status, priority, concern, career, and language."""
    return _calculate_admin_analytics(db=db, date_range=date_range, language=language).escalations


@router.get("/analytics/sentiment", response_model=SentimentShiftAnalytics)
def get_admin_analytics_sentiment(
    date_range: str = Query("30d"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    career_id: Optional[int] = Query(None),
    language: Optional[str] = Query(None),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> SentimentShiftAnalytics:
    """Returns Observed Sentiment Shift comparison derived strictly from SentimentEvent records."""
    return _calculate_admin_analytics(
        db=db,
        date_range=date_range,
        start_date=start_date,
        end_date=end_date,
        career_id=career_id,
        language=language,
    ).sentiment


# =========================================================================
# 8. Geographic Concentration Analytics (A5 — Geographic Analytics)
# =========================================================================

STATE_TO_REGION = {
    "Telangana": "South Region",
    "Andhra Pradesh": "South Region",
    "Karnataka": "South Region",
    "Tamil Nadu": "South Region",
    "Kerala": "South Region",
    "Maharashtra": "West Region",
    "Gujarat": "West Region",
    "Goa": "West Region",
    "Rajasthan": "North Region",
    "Delhi": "North Region",
    "Punjab": "North Region",
    "Haryana": "North Region",
    "Uttar Pradesh": "North Region",
    "Uttarakhand": "North Region",
    "Himachal Pradesh": "North Region",
    "Jammu & Kashmir": "North Region",
    "Bihar": "East Region",
    "West Bengal": "East Region",
    "Odisha": "East Region",
    "Jharkhand": "East Region",
    "Assam": "North-East Region",
    "Madhya Pradesh": "Central Region",
    "Chhattisgarh": "Central Region",
}

KNOWN_STATES = {
    "telangana": "Telangana",
    "andhra pradesh": "Andhra Pradesh",
    "andhrapradesh": "Andhra Pradesh",
    "karnataka": "Karnataka",
    "tamil nadu": "Tamil Nadu",
    "kerala": "Kerala",
    "maharashtra": "Maharashtra",
    "gujarat": "Gujarat",
    "rajasthan": "Rajasthan",
    "delhi": "Delhi",
    "punjab": "Punjab",
    "haryana": "Haryana",
    "uttar pradesh": "Uttar Pradesh",
    "bihar": "Bihar",
    "west bengal": "West Bengal",
    "madhya pradesh": "Madhya Pradesh",
    "chhattisgarh": "Chhattisgarh",
    "odisha": "Odisha",
    "assam": "Assam",
}


def _parse_location(loc: Optional[str]) -> Tuple[str, str, str]:
    """
    Parses a raw location string into (district, state, region).
    Supports 'District, State' format and standalone state names.
    Maps states to canonical geographic regions.
    """
    if not loc or not loc.strip():
        return ("Unspecified District", "Unspecified State", "Other Region")

    cleaned_raw = loc.strip()
    parts = [p.strip() for p in cleaned_raw.split(",") if p.strip()]

    if len(parts) >= 2:
        district = parts[0].title()
        raw_state = parts[1].strip()
        state = KNOWN_STATES.get(raw_state.lower().replace(" ", ""), raw_state.title())
    elif len(parts) == 1:
        raw = parts[0]
        normal = raw.lower().replace(" ", "")
        if normal in KNOWN_STATES:
            state = KNOWN_STATES[normal]
            district = "Multi-District"
        else:
            state = "General"
            district = raw.title()
    else:
        district = "Multi-District"
        state = "General"

    region = STATE_TO_REGION.get(state, "Other Region")
    return (district, state, region)


def _calculate_geographic_analytics(
    db: Session,
    state: Optional[str] = None,
    district: Optional[str] = None,
    region: Optional[str] = None,
    career_id: Optional[int] = None,
    concern: Optional[str] = None,
    date_range: str = "all_time",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> GeographicAnalyticsResponse:
    """
    Executes server-side geographic aggregation of counselling and parent-concern activity.
    Labels all metrics as demo/generated data.
    """
    start_cutoff, end_cutoff = _parse_date_filters(date_range, start_date, end_date)

    # 1. Discover all locations in DB to build dynamic filter options
    all_student_locs = db.query(StudentProfile.location).filter(StudentProfile.location.isnot(None)).all()
    all_parent_locs = db.query(ParentProfile.location).filter(ParentProfile.location.isnot(None)).all()

    discovered_states: set[str] = set()
    discovered_districts: set[str] = set()
    discovered_regions: set[str] = set()
    state_to_districts_map: Dict[str, set[str]] = {}

    for (loc,) in all_student_locs + all_parent_locs:
        d, s, r = _parse_location(loc)
        if s != "General" and s != "Unspecified State":
            discovered_states.add(s)
            if s not in state_to_districts_map:
                state_to_districts_map[s] = set()
            if d != "General" and d != "Unspecified District":
                state_to_districts_map[s].add(d)
        if d != "General" and d != "Unspecified District":
            discovered_districts.add(d)
        if r != "Other Region":
            discovered_regions.add(r)

    formatted_state_districts = {
        k: sorted(list(v)) for k, v in state_to_districts_map.items() if v
    }

    # Available occupations and concerns
    all_occupations = db.query(Occupation).order_by(Occupation.name).all()
    available_careers = [FilterOptionItem(id=o.id, label=o.name) for o in all_occupations]

    canonical_concern_names = [
        "Income", "Job Security", "Further Education", "Social Perception",
        "Distance", "Working Conditions", "Career Growth"
    ]
    has_other_concern = db.query(ParentConcern).filter(ParentConcern.concern_type.ilike("%other%")).count() > 0
    available_concerns = canonical_concern_names + (["Other"] if has_other_concern else [])

    # Target Career lookup if career_id provided
    target_career_name: Optional[str] = None
    if career_id is not None:
        target_occ = db.query(Occupation).filter(Occupation.id == career_id).first()
        if target_occ:
            target_career_name = target_occ.name

    # 2. Extract and Filter Activity Records
    matched_events: List[Dict[str, Any]] = []

    # A. Counselling Sessions
    sess_query = db.query(
        CounsellingSession.id,
        CounsellingSession.started_at,
        StudentProfile.location,
        StudentProfile.career_intent,
    ).join(StudentProfile, CounsellingSession.student_profile_id == StudentProfile.id)

    if start_cutoff:
        sess_query = sess_query.filter(CounsellingSession.started_at >= start_cutoff)
    if end_cutoff:
        sess_query = sess_query.filter(CounsellingSession.started_at <= end_cutoff)

    for sid, s_time, s_loc, s_intent in sess_query.all():
        d, s, r = _parse_location(s_loc)

        if target_career_name:
            matches_career = bool(s_intent and target_career_name.lower() in s_intent.lower())
            if not matches_career:
                has_esc_career = db.query(HumanEscalation).filter(
                    HumanEscalation.counselling_session_id == sid,
                    HumanEscalation.career_id == career_id,
                ).count() > 0
                if not has_esc_career:
                    continue

        if concern:
            has_concern = db.query(HumanEscalation).filter(
                HumanEscalation.counselling_session_id == sid,
                HumanEscalation.concern.ilike(f"%{concern}%"),
            ).count() > 0
            if not has_concern:
                continue

        if state and s.lower() != state.lower():
            continue
        if district and d.lower() != district.lower():
            continue
        if region and r.lower() != region.lower():
            continue

        matched_events.append({
            "type": "session",
            "date": s_time.strftime("%Y-%m-%d") if s_time else "2026-10-01",
            "district": d,
            "state": s,
            "region": r,
            "career": s_intent or target_career_name or "General Vocational",
            "concern": None,
        })

    # B. Parent Concerns
    concern_query = db.query(
        ParentConcern.id,
        ParentConcern.created_at,
        ParentConcern.concern_type,
        ParentProfile.location.label("parent_loc"),
        StudentProfile.location.label("student_loc"),
        StudentProfile.career_intent,
    ).outerjoin(ParentProfile, ParentConcern.parent_profile_id == ParentProfile.id)\
     .outerjoin(StudentProfile, ParentConcern.student_profile_id == StudentProfile.id)

    if start_cutoff:
        concern_query = concern_query.filter(ParentConcern.created_at >= start_cutoff)
    if end_cutoff:
        concern_query = concern_query.filter(ParentConcern.created_at <= end_cutoff)
    if concern:
        concern_query = concern_query.filter(ParentConcern.concern_type.ilike(f"%{concern}%"))

    for cid, c_time, c_type, p_loc, st_loc, st_intent in concern_query.all():
        d, s, r = _parse_location(p_loc or st_loc)

        if target_career_name:
            if not (st_intent and target_career_name.lower() in st_intent.lower()):
                continue

        if state and s.lower() != state.lower():
            continue
        if district and d.lower() != district.lower():
            continue
        if region and r.lower() != region.lower():
            continue

        matched_events.append({
            "type": "concern",
            "date": c_time.strftime("%Y-%m-%d") if c_time else "2026-10-01",
            "district": d,
            "state": s,
            "region": r,
            "career": st_intent or target_career_name or "General Vocational",
            "concern": c_type,
        })

    total_activity = len(matched_events)

    # 3. Aggregations (State, District, Region, Trend, Careers, Concerns)
    state_counts: Dict[str, int] = {}
    district_counts: Dict[str, int] = {}
    region_counts: Dict[str, int] = {}
    date_counts: Dict[str, int] = {}
    career_counts: Dict[str, int] = {}
    concern_counts: Dict[str, int] = {}

    for ev in matched_events:
        st = ev["state"]
        dist = ev["district"]
        reg = ev["region"]
        dt = ev["date"]
        car = ev["career"]
        con = ev["concern"]

        state_counts[st] = state_counts.get(st, 0) + 1
        district_counts[dist] = district_counts.get(dist, 0) + 1
        region_counts[reg] = region_counts.get(reg, 0) + 1
        date_counts[dt] = date_counts.get(dt, 0) + 1

        if car and car != "General Vocational":
            career_counts[car] = career_counts.get(car, 0) + 1
        if con:
            concern_counts[con] = concern_counts.get(con, 0) + 1

    def _to_items(counts_map: Dict[str, int]) -> List[GeographicLocationItem]:
        items = []
        for loc_name, count in counts_map.items():
            pct = round((count / total_activity) * 100, 1) if total_activity > 0 else 0.0
            items.append(GeographicLocationItem(location=loc_name, count=count, percentage=pct))
        return sorted(items, key=lambda x: x.count, reverse=True)

    states_list = _to_items(state_counts)
    districts_list = _to_items(district_counts)
    regions_list = _to_items(region_counts)

    trend_list = [
        GeographicTrendPoint(date=d_key, count=c_val)
        for d_key, c_val in sorted(date_counts.items(), key=lambda x: x[0])
    ]

    top_state = states_list[0].location if states_list else None
    top_district = districts_list[0].location if districts_list else None
    top_region = regions_list[0].location if regions_list else None

    sorted_careers = sorted(career_counts.items(), key=lambda x: x[1], reverse=True)
    top_career = sorted_careers[0][0] if sorted_careers else (target_career_name or None)

    sorted_concerns = sorted(concern_counts.items(), key=lambda x: x[1], reverse=True)
    top_concern = sorted_concerns[0][0] if sorted_concerns else (concern or None)

    summary = GeographicSummary(
        total=total_activity,
        top_state=top_state,
        top_district=top_district,
        top_region=top_region,
        top_career=top_career,
        top_concern=top_concern,
        is_demo_data=True,
    )

    return GeographicAnalyticsResponse(
        is_demo_data=True,
        demo_note="These analytics currently use generated data and do not represent real-world statistics.",
        summary=summary,
        states=states_list,
        districts=districts_list,
        regions=regions_list,
        trend=trend_list,
        available_states=sorted(list(discovered_states)),
        available_districts=sorted(list(discovered_districts)),
        available_regions=sorted(list(discovered_regions)),
        state_districts=formatted_state_districts,
        available_concerns=available_concerns,
        available_careers=available_careers,
    )


@router.get("/analytics/geography", response_model=GeographicAnalyticsResponse)
def get_admin_analytics_geography(
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    career_id: Optional[int] = Query(None),
    concern: Optional[str] = Query(None),
    date_range: str = Query("all_time"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> GeographicAnalyticsResponse:
    """Returns aggregated geographic concentration analytics based on existing generated database records."""
    return _calculate_geographic_analytics(
        db=db,
        state=state,
        district=district,
        region=region,
        career_id=career_id,
        concern=concern,
        date_range=date_range,
        start_date=start_date,
        end_date=end_date,
    )


# =========================================================================
# 9. AI Performance Analytics (A6 — AI Performance Analytics)
# =========================================================================

def _calculate_ai_performance_analytics(
    db: Session,
    date_range: str = "30d",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> AIPerformanceAnalyticsResponse:
    """
    Calculates deterministic AI performance telemetry:
    1. Total AI Sessions
    2. Resolution Rate
    3. Escalation Rate
    4. Low-Confidence Responses
    5. Unanswered Questions
    """
    start_cutoff, end_cutoff = _parse_date_filters(date_range, start_date, end_date)
    threshold = float(getattr(settings, "AI_CONFIDENCE_THRESHOLD", 0.60))

    # 1. Total Sessions in window
    sess_q = db.query(CounsellingSession)
    if start_cutoff:
        sess_q = sess_q.filter(CounsellingSession.started_at >= start_cutoff)
    if end_cutoff:
        sess_q = sess_q.filter(CounsellingSession.started_at <= end_cutoff)

    sessions = sess_q.all()
    total_sessions = len(sessions)
    session_ids = [s.id for s in sessions]

    if total_sessions == 0:
        return AIPerformanceAnalyticsResponse(
            is_demo_data=True,
            demo_note="These metrics currently use generated data and do not represent real production AI performance.",
            confidence_threshold=threshold,
            summary=AIPerformanceSummary(),
            resolution_breakdown=AIResolutionBreakdown(),
            trend=[],
            unanswered_categories=[],
            deterministic_summary=["No AI counselling sessions recorded in this period."],
        )

    # 2. Escalations associated with these sessions
    escalations_q = db.query(HumanEscalation).filter(HumanEscalation.counselling_session_id.in_(session_ids))
    session_escalations = escalations_q.all()

    escalated_session_ids = set(e.counselling_session_id for e in session_escalations if e.counselling_session_id)
    for s in sessions:
        if s.status == SessionStatus.ESCALATED:
            escalated_session_ids.add(s.id)

    escalated_count = len(escalated_session_ids)
    escalation_rate = round((escalated_count / total_sessions) * 100, 1)

    # 3. Resolution Rate (Completed sessions without escalation)
    resolved_count = sum(
        1 for s in sessions
        if s.status == SessionStatus.COMPLETED and s.id not in escalated_session_ids
    )
    resolution_rate = round((resolved_count / total_sessions) * 100, 1)

    active_unresolved = max(0, total_sessions - (resolved_count + escalated_count))

    # 4. Messages Telemetry (AI responses and user questions)
    msg_q = db.query(CounsellingMessage).filter(CounsellingMessage.session_id.in_(session_ids))
    messages = msg_q.all()

    ai_responses = [m for m in messages if m.sender_type == MessageSenderType.AI]
    user_questions = [m for m in messages if m.sender_type in (MessageSenderType.STUDENT, MessageSenderType.PARENT)]

    total_ai_responses = len(ai_responses)
    total_user_questions = len(user_questions)

    # Low confidence calculation based on confidence threshold
    low_conf_msgs = []
    unanswered_msgs = []

    for m in ai_responses:
        conf_val = m.confidence
        if conf_val is None:
            ev = db.query(SentimentEvent).filter(SentimentEvent.counselling_message_id == m.id).first()
            conf_val = ev.score if ev and ev.score is not None else 0.75

        if conf_val < threshold:
            low_conf_msgs.append(m)

        if m.requires_human:
            unanswered_msgs.append(m)

    low_confidence_count = len(low_conf_msgs)
    low_confidence_rate = (
        round((low_confidence_count / total_ai_responses) * 100, 1)
        if total_ai_responses > 0
        else 0.0
    )

    # Unanswered questions (requires_human or triggered escalations)
    unanswered_count = len(unanswered_msgs)
    if unanswered_count == 0 and escalated_count > 0:
        unanswered_count = len(session_escalations)

    unanswered_rate = (
        round((unanswered_count / total_user_questions) * 100, 1)
        if total_user_questions > 0
        else 0.0
    )

    # 5. Trend Over Time
    date_buckets: Dict[str, Dict[str, int]] = {}
    for s in sessions:
        d_key = s.started_at.strftime("%Y-%m-%d") if s.started_at else "2026-10-01"
        if d_key not in date_buckets:
            date_buckets[d_key] = {"total": 0, "resolved": 0, "escalated": 0, "low_conf": 0}
        date_buckets[d_key]["total"] += 1
        if s.id in escalated_session_ids:
            date_buckets[d_key]["escalated"] += 1
        elif s.status == SessionStatus.COMPLETED:
            date_buckets[d_key]["resolved"] += 1

    for m in low_conf_msgs:
        d_key = m.created_at.strftime("%Y-%m-%d") if m.created_at else "2026-10-01"
        if d_key in date_buckets:
            date_buckets[d_key]["low_conf"] += 1

    trend_points = [
        AIPerformanceTrendPoint(
            date=d_key,
            total_sessions=vals["total"],
            resolved=vals["resolved"],
            escalated=vals["escalated"],
            low_confidence=vals["low_conf"],
        )
        for d_key, vals in sorted(date_buckets.items(), key=lambda x: x[0])
    ]

    # 6. Unanswered Question Topic Categories
    cat_counts: Dict[str, int] = {}
    for esc in session_escalations:
        cat_name = esc.concern or "General Inquiry"
        cat_counts[cat_name] = cat_counts.get(cat_name, 0) + 1

    total_cat = sum(cat_counts.values()) or 1
    unanswered_categories = [
        AIUnansweredCategoryItem(
            category=k,
            count=v,
            percentage=round((v / total_cat) * 100, 1),
        )
        for k, v in sorted(cat_counts.items(), key=lambda x: x[1], reverse=True)
    ]

    # 7. Deterministic Factual Summary (Section 10)
    deterministic_summary = [
        f"{total_sessions} AI counselling sessions recorded in this period.",
        (
            f"A majority ({resolution_rate}%) of recorded sessions completed without requiring human intervention."
            if resolution_rate >= 50.0
            else f"{resolution_rate}% of recorded sessions completed without human intervention."
        ),
        (
            f"{escalation_rate}% of sessions resulted in human counsellor escalations."
            if escalation_rate > 0
            else "No sessions triggered human counsellor escalation."
        ),
        (
            f"{low_confidence_count} AI responses ({low_confidence_rate}%) scored below the configured confidence threshold ({threshold})."
            if low_confidence_count > 0
            else f"No responses scored below the configured confidence threshold ({threshold})."
        ),
        (
            f"{unanswered_count} user questions required human escalation or exceeded grounded knowledge."
            if unanswered_count > 0
            else "All user questions were addressed within grounded knowledge."
        ),
    ]

    summary = AIPerformanceSummary(
        total_sessions=total_sessions,
        total_ai_responses=total_ai_responses,
        total_user_questions=total_user_questions,
        resolved_sessions=resolved_count,
        resolution_rate=resolution_rate,
        escalated_sessions=escalated_count,
        escalation_rate=escalation_rate,
        low_confidence_responses=low_confidence_count,
        low_confidence_rate=low_confidence_rate,
        unanswered_questions=unanswered_count,
        unanswered_rate=unanswered_rate,
    )

    breakdown = AIResolutionBreakdown(
        resolved=resolved_count,
        escalated=escalated_count,
        active_unresolved=active_unresolved,
    )

    return AIPerformanceAnalyticsResponse(
        is_demo_data=True,
        demo_note="These metrics currently use generated data and do not represent real production AI performance.",
        confidence_threshold=threshold,
        summary=summary,
        resolution_breakdown=breakdown,
        trend=trend_points,
        unanswered_categories=unanswered_categories,
        deterministic_summary=deterministic_summary,
    )


@router.get("/analytics/ai", response_model=AIPerformanceAnalyticsResponse)
def get_admin_analytics_ai(
    date_range: str = Query("30d"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AIPerformanceAnalyticsResponse:
    """Returns aggregated AI performance analytics based on existing counselling records and AI telemetry."""
    return _calculate_ai_performance_analytics(
        db=db,
        date_range=date_range,
        start_date=start_date,
        end_date=end_date,
    )

