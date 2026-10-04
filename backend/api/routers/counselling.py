"""Counselling API Router (Phase 5 Brick 20).

Provides secure endpoints for AI vocational counselling sessions, message
history, grounded evidence-backed responses, and human counsellor escalation.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from database.session import get_db
from models import (
    User,
    StudentProfile,
    ParentProfile,
    ParentStudentAssociation,
    CounsellingSession,
    CounsellingMessage,
)
from models.enums import UserRole
from api.deps import (
    get_current_user,
    require_authenticated_user,
    verify_family_access,
)
from ai.exceptions import AIProviderConfigurationError, AIProviderError, AIProviderUnavailableError
from services.counselling_service import counselling_service, to_escalation_response
from schemas.counselling import (
    CounsellingMessageItem,
    CounsellingSessionSummary,
    CounsellingSessionDetail,
    CreateCounsellingSessionRequest,
    SendCounsellingMessageRequest,
    CounsellingResponse,
    CreateEscalationRequest,
    EscalationResponse,
)

router = APIRouter(prefix="/counselling", tags=["Counselling"])


# ==============================================================================
# ARCHITECTURAL COMPATIBILITY ENDPOINTS
# ==============================================================================

@router.get("/")
def counselling_placeholder() -> dict[str, str]:
    """Architectural placeholder for counselling router discovery."""
    return {"module": "counselling", "status": "mounted"}


@router.get("/test")
def counselling_test(
    current_user: User = Depends(require_authenticated_user),
) -> dict[str, Any]:
    """Verification endpoint confirming authenticated access to counselling domain."""
    return {
        "module": "counselling",
        "authenticated": True,
        "user_id": current_user.id,
        "role": current_user.role.value,
    }


# ==============================================================================
# SESSIONS API
# ==============================================================================

@router.post(
    "/sessions",
    response_model=CounsellingSessionDetail,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new counselling session",
)
async def create_counselling_session(
    payload: CreateCounsellingSessionRequest,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
) -> CounsellingSessionDetail:
    """Creates a discrete counselling session for the authenticated student or linked family context."""
    # Resolve target student profile ID
    target_student_id: Optional[int] = payload.student_id

    if current_user.role == UserRole.STUDENT:
        if not current_user.student_profile:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student profile not found for authenticated user",
            )
        if target_student_id and target_student_id != current_user.student_profile.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students can only create counselling sessions for themselves",
            )
        target_student_id = current_user.student_profile.id

    elif current_user.role == UserRole.PARENT:
        if not target_student_id:
            # Check if parent has exactly one linked student
            if current_user.parent_profile:
                associations = list(
                    db.scalars(
                        select(ParentStudentAssociation).where(
                            ParentStudentAssociation.parent_profile_id == current_user.parent_profile.id
                        )
                    ).all()
                )
                if len(associations) >= 1:
                    target_student_id = associations[0].student_profile_id
                else:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="No linked student profile found for this parent account.",
                    )
            else:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Parent profile not found",
                )

        # Enforce server-side authorization
        verify_family_access(target_student_id, current_user, db)

    elif current_user.role == UserRole.ADMIN:
        if not target_student_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="student_id is required for admin session creation",
            )
        student_obj = db.get(StudentProfile, target_student_id)
        if not student_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Student profile {target_student_id} not found",
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Role not authorized to create counselling sessions",
        )

    session = counselling_service.create_session(db, student_profile_id=target_student_id)

    # If initial question or structured explain context provided, process it immediately
    initial_text = payload.initial_question.strip() if payload.initial_question else ""
    if initial_text or payload.context:
        try:
            await counselling_service.process_counselling_message(
                db=db,
                session_id=session.id,
                sender_user=current_user,
                message_text=initial_text,
                career_id=payload.career_id,
                language=payload.language or "en",
                context=payload.context,
            )
        except AIProviderUnavailableError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"AI Counselling Provider is currently unavailable: {str(e)}",
            )
        except AIProviderConfigurationError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"AI Counselling Provider is not configured: {str(e)}",
            )
        except AIProviderError as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"AI Provider error during counselling: {str(e)}",
            )

    # Fetch messages
    messages = list(
        db.scalars(
            select(CounsellingMessage)
            .where(CounsellingMessage.session_id == session.id)
            .order_by(CounsellingMessage.created_at.asc(), CounsellingMessage.id.asc())
        ).all()
    )

    return CounsellingSessionDetail(
        id=session.id,
        student_profile_id=session.student_profile_id,
        status=session.status.value,
        started_at=session.started_at,
        ended_at=session.ended_at,
        messages=[
            CounsellingMessageItem(
                id=m.id,
                session_id=m.session_id,
                sender_type=m.sender_type.value,
                content=m.content,
                created_at=m.created_at,
            )
            for m in messages
        ],
    )


@router.get(
    "/sessions",
    response_model=List[CounsellingSessionSummary],
    summary="List counselling sessions",
)
def list_counselling_sessions(
    student_id: Optional[int] = Query(None, description="Target student profile ID"),
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
) -> List[CounsellingSessionSummary]:
    """Retrieves all counselling sessions belonging to authorized student context."""
    target_student_id: Optional[int] = student_id

    if current_user.role == UserRole.STUDENT:
        if not current_user.student_profile:
            return []
        target_student_id = current_user.student_profile.id

    elif current_user.role == UserRole.PARENT:
        if not target_student_id:
            # If parent has linked students, default to first or error
            if current_user.parent_profile:
                assoc = db.scalar(
                    select(ParentStudentAssociation).where(
                        ParentStudentAssociation.parent_profile_id == current_user.parent_profile.id
                    )
                )
                if assoc:
                    target_student_id = assoc.student_profile_id
                else:
                    return []
            else:
                return []
        verify_family_access(target_student_id, current_user, db)

    elif current_user.role == UserRole.ADMIN:
        pass  # Admin can filter by student_id or view all
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Role not authorized to view counselling sessions",
        )

    # Query sessions
    query = select(CounsellingSession)
    if target_student_id is not None:
        query = query.where(CounsellingSession.student_profile_id == target_student_id)
    query = query.order_by(CounsellingSession.started_at.desc())

    sessions = list(db.scalars(query).all())

    summaries: List[CounsellingSessionSummary] = []
    for s in sessions:
        msg_count = db.scalar(
            select(func.count(CounsellingMessage.id)).where(CounsellingMessage.session_id == s.id)
        ) or 0
        summaries.append(
            CounsellingSessionSummary(
                id=s.id,
                student_profile_id=s.student_profile_id,
                status=s.status.value,
                started_at=s.started_at,
                ended_at=s.ended_at,
                message_count=msg_count,
            )
        )

    return summaries


@router.get(
    "/sessions/{session_id}",
    response_model=CounsellingSessionDetail,
    summary="Get session details and message history",
)
def get_counselling_session(
    session_id: int,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
) -> CounsellingSessionDetail:
    """Fetches details and chronological message history for a specific counselling session."""
    session = counselling_service.get_session(db, session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Counselling session {session_id} not found",
        )

    # Verify authorization
    verify_family_access(session.student_profile_id, current_user, db)

    messages = list(
        db.scalars(
            select(CounsellingMessage)
            .where(CounsellingMessage.session_id == session.id)
            .order_by(CounsellingMessage.created_at.asc(), CounsellingMessage.id.asc())
        ).all()
    )

    return CounsellingSessionDetail(
        id=session.id,
        student_profile_id=session.student_profile_id,
        status=session.status.value,
        started_at=session.started_at,
        ended_at=session.ended_at,
        messages=[
            CounsellingMessageItem(
                id=m.id,
                session_id=m.session_id,
                sender_type=m.sender_type.value,
                content=m.content,
                created_at=m.created_at,
            )
            for m in messages
        ],
    )


# ==============================================================================
# MESSAGES API
# ==============================================================================

from core.rate_limit import rate_limit_counselling

@router.post(
    "/sessions/{session_id}/messages",
    response_model=CounsellingResponse,
    status_code=status.HTTP_200_OK,
    summary="Post a question to a counselling session",
)
async def post_counselling_message(
    session_id: int,
    payload: SendCounsellingMessageRequest,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_counselling),
) -> CounsellingResponse:
    """Posts a user question to an active session, executes RAG retrieval, and generates a grounded AI response."""
    session = counselling_service.get_session(db, session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Counselling session {session_id} not found",
        )

    # Enforce access authorization
    verify_family_access(session.student_profile_id, current_user, db)

    clean_message = payload.message.strip()
    if not clean_message:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Message content cannot be blank",
        )

    try:
        response = await counselling_service.process_counselling_message(
            db=db,
            session_id=session.id,
            sender_user=current_user,
            message_text=clean_message,
            career_id=payload.career_id,
            language=payload.language or "en",
            context=payload.context,
        )
        return response
    except AIProviderUnavailableError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI Counselling Provider is currently unavailable: {str(e)}",
        )
    except AIProviderConfigurationError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI Counselling Provider is not configured: {str(e)}",
        )
    except AIProviderError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI Provider error during counselling: {str(e)}",
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


# ==============================================================================
# HUMAN COUNSELLOR ESCALATIONS API (PHASE 9 BRICK 31)
# ==============================================================================

@router.post(
    "/escalations",
    response_model=EscalationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create or retrieve active human counsellor escalation case record",
)
async def create_counselling_escalation(
    payload: CreateEscalationRequest,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
) -> EscalationResponse:
    """Creates a persistent escalation case record connecting parent/student to a human counsellor.
    
    Enforces server-side authorization boundaries, resolves career and student context,
    generates a structured conversation summary without fabricating facts, and prevents
    accidental duplicate active cases.
    """
    escalation = await counselling_service.create_escalation(
        db=db,
        current_user=current_user,
        request=payload,
    )
    return to_escalation_response(escalation)


@router.get(
    "/escalations",
    response_model=List[EscalationResponse],
    status_code=status.HTTP_200_OK,
    summary="List escalation records for the authenticated user",
)
def list_counselling_escalations(
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
) -> List[EscalationResponse]:
    """Retrieves all human counsellor escalation case records for the authenticated user or linked child."""
    escalations = counselling_service.list_escalations(db=db, current_user=current_user)
    return [to_escalation_response(e) for e in escalations]


@router.get(
    "/escalations/{escalation_id}",
    response_model=EscalationResponse,
    status_code=status.HTTP_200_OK,
    summary="Get human counsellor escalation case record by ID",
)
def get_counselling_escalation(
    escalation_id: int,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
) -> EscalationResponse:
    """Retrieves a specific human counsellor escalation record with strict authorization verification."""
    escalation = counselling_service.get_escalation(
        db=db,
        escalation_id=escalation_id,
        current_user=current_user,
    )
    return to_escalation_response(escalation)
