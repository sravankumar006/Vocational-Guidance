"""
Test suite for Human Counsellor Escalation Case-Record System (Phase 9 Brick 31).
Validates:
1. Parent and student escalation request workflows
2. Authorized student context and career context resolution
3. Escalation record persistence with default Pending status
4. Prevention of duplicate active escalations (Pending / In Progress)
5. Structured conversation summary generation without hallucination
6. Strict privacy and RBAC authorization boundaries (no cross-family/cross-student leak)
7. Status tracking (Pending, In Progress, Resolved) and resolution lifecycle
8. Voice escalation trigger detection (English and Telugu)
9. Admin-readiness endpoint
"""

import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from database.session import get_db
from database.base import Base
from models import (
    User,
    StudentProfile,
    ParentProfile,
    ParentStudentAssociation,
    Occupation,
    CounsellingSession,
    CounsellingMessage,
    HumanEscalation,
)
from models.enums import (
    UserRole,
    SessionStatus,
    MessageSenderType,
    EscalationStatus,
    EscalationPriority,
)
from core.security import create_access_token, hash_password
from services.counselling_service import detect_human_escalation, normalize_concern


@pytest.fixture
def db_session():
    """In-memory SQLite database session isolated per test."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def escalation_setup(db_session: Session):
    """Sets up an occupation, student, parent, and linked association."""
    # 1. Career / Occupation
    occupation = Occupation(
        name="Automobile Technician",
        description="Diagnoses, repairs, and maintains modern automobiles and light vehicles.",
        sector="Automotive",
    )
    db_session.add(occupation)
    db_session.flush()

    # 2. Student 1
    student_user = User(
        name="Raju Reddy",
        email="raju_student@sih.gov.in",
        role=UserRole.STUDENT,
        password_hash=hash_password("StudentPass123!"),
        is_active=True,
    )
    db_session.add(student_user)
    db_session.flush()

    student_profile = StudentProfile(
        user_id=student_user.id,
        education_level="Class 10 Passed",
        location="Visakhapatnam, Andhra Pradesh",
        career_preferences=["Automobile Technician"],
    )
    db_session.add(student_profile)
    db_session.flush()

    # 3. Parent 1 (Raju's mother)
    parent_user = User(
        name="Lakshmi Reddy",
        email="lakshmi_parent@sih.gov.in",
        role=UserRole.PARENT,
        password_hash=hash_password("ParentPass123!"),
        is_active=True,
    )
    db_session.add(parent_user)
    db_session.flush()

    parent_profile = ParentProfile(
        user_id=parent_user.id,
        relationship_to_student="Mother",
        location="Visakhapatnam, Andhra Pradesh",
    )
    db_session.add(parent_profile)
    db_session.flush()

    assoc = ParentStudentAssociation(
        parent_profile_id=parent_profile.id,
        student_profile_id=student_profile.id,
        relationship_type="Mother",
    )
    db_session.add(assoc)
    db_session.flush()

    # 4. Counselling session for Student 1
    session = CounsellingSession(
        student_profile_id=student_profile.id,
        status=SessionStatus.ACTIVE,
    )
    db_session.add(session)
    db_session.flush()

    msg1 = CounsellingMessage(
        session_id=session.id,
        sender_type=MessageSenderType.PARENT,
        content="What is the earning potential for Automobile Technician training?",
    )
    msg2 = CounsellingMessage(
        session_id=session.id,
        sender_type=MessageSenderType.AI,
        content="Verified records indicate starting wages of ₹12,000 to ₹18,000 per month.",
    )
    db_session.add_all([msg1, msg2])
    db_session.flush()

    # 5. Unrelated Student & Parent (for privacy testing)
    other_student_user = User(
        name="Pooja Verma",
        email="pooja_other@sih.gov.in",
        role=UserRole.STUDENT,
        password_hash=hash_password("OtherPass123!"),
        is_active=True,
    )
    db_session.add(other_student_user)
    db_session.flush()

    other_student_profile = StudentProfile(
        user_id=other_student_user.id,
        education_level="Class 12 Passed",
        location="Hyderabad, Telangana",
    )
    db_session.add(other_student_profile)
    db_session.flush()

    other_parent_user = User(
        name="Suresh Verma",
        email="suresh_other@sih.gov.in",
        role=UserRole.PARENT,
        password_hash=hash_password("OtherParentPass123!"),
        is_active=True,
    )
    db_session.add(other_parent_user)
    db_session.flush()

    other_parent_profile = ParentProfile(
        user_id=other_parent_user.id,
        relationship_to_student="Father",
    )
    db_session.add(other_parent_profile)
    db_session.flush()

    # 6. Admin user
    admin_user = User(
        name="System Admin",
        email="admin_test@sih.gov.in",
        role=UserRole.ADMIN,
        password_hash=hash_password("AdminPass123!"),
        is_active=True,
    )
    db_session.add(admin_user)
    db_session.commit()

    return {
        "occupation": occupation,
        "student_user": student_user,
        "student_profile": student_profile,
        "parent_user": parent_user,
        "parent_profile": parent_profile,
        "session": session,
        "other_student_user": other_student_user,
        "other_student_profile": other_student_profile,
        "other_parent_user": other_parent_user,
        "other_parent_profile": other_parent_profile,
        "admin_user": admin_user,
    }


def test_parent_create_escalation_success(db_session: Session, escalation_setup: dict):
    """Parent can request human counselling for their authorized child."""
    app.dependency_overrides[get_db] = lambda: db_session
    client = TestClient(app)

    token = create_access_token({
        "sub": str(escalation_setup["parent_user"].id),
        "role": escalation_setup["parent_user"].role.value,
    })
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "concern": "Income",
        "language": "te",
        "notes": "Concerned about starting salary and progression in Visakhapatnam",
    }
    response = client.post("/api/counselling/escalations", json=payload, headers=headers)
    assert response.status_code == 201

    data = response.json()
    assert data["status"] == "pending"
    assert data["student_id"] == escalation_setup["student_profile"].id
    assert data["parent_id"] == escalation_setup["parent_profile"].id
    assert data["concern"] == "Income"
    assert data["language"] == "te"
    assert data["career_id"] == escalation_setup["occupation"].id
    assert data["career_title"] == "Automobile Technician"
    assert data["counselling_session_id"] == escalation_setup["session"].id
    assert "Visakhapatnam" in data["conversation_summary"]

    # Verify session transitioned to escalated
    db_session.refresh(escalation_setup["session"])
    assert escalation_setup["session"].status == SessionStatus.ESCALATED
    app.dependency_overrides.clear()


def test_student_create_escalation_success(db_session: Session, escalation_setup: dict):
    """Student can request human counselling directly."""
    app.dependency_overrides[get_db] = lambda: db_session
    client = TestClient(app)

    token = create_access_token({
        "sub": str(escalation_setup["student_user"].id),
        "role": escalation_setup["student_user"].role.value,
    })
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "concern": "Job Security",
        "language": "en",
    }
    response = client.post("/api/counselling/escalations", json=payload, headers=headers)
    assert response.status_code == 201

    data = response.json()
    assert data["status"] == "pending"
    assert data["student_id"] == escalation_setup["student_profile"].id
    assert data["parent_id"] is None
    assert data["concern"] == "Job Security"
    assert data["language"] == "en"
    app.dependency_overrides.clear()


def test_duplicate_escalation_prevented(db_session: Session, escalation_setup: dict):
    """Multiple escalation taps within a short period return the existing active case."""
    app.dependency_overrides[get_db] = lambda: db_session
    client = TestClient(app)

    token = create_access_token({
        "sub": str(escalation_setup["parent_user"].id),
        "role": escalation_setup["parent_user"].role.value,
    })
    headers = {"Authorization": f"Bearer {token}"}

    payload = {"concern": "Income", "language": "te"}
    r1 = client.post("/api/counselling/escalations", json=payload, headers=headers)
    assert r1.status_code == 201
    first_id = r1.json()["id"]

    # Immediate second request
    r2 = client.post("/api/counselling/escalations", json=payload, headers=headers)
    assert r2.status_code == 201
    second_id = r2.json()["id"]

    # Must return identical case ID rather than creating two database rows
    assert first_id == second_id

    total_count = db_session.query(HumanEscalation).filter_by(
        student_id=escalation_setup["student_profile"].id
    ).count()
    assert total_count == 1
    app.dependency_overrides.clear()


def test_escalation_resolution_allows_new_case(db_session: Session, escalation_setup: dict):
    """When a case is resolved, a subsequent request creates a new case."""
    app.dependency_overrides[get_db] = lambda: db_session
    client = TestClient(app)

    token = create_access_token({
        "sub": str(escalation_setup["parent_user"].id),
        "role": escalation_setup["parent_user"].role.value,
    })
    headers = {"Authorization": f"Bearer {token}"}

    r1 = client.post("/api/counselling/escalations", json={"concern": "Income"}, headers=headers)
    case_1_id = r1.json()["id"]

    # Mark first case resolved
    esc1 = db_session.get(HumanEscalation, case_1_id)
    esc1.status = EscalationStatus.RESOLVED
    esc1.resolved_at = datetime.utcnow()
    db_session.commit()

    # Now create a new escalation with different concern
    r2 = client.post("/api/counselling/escalations", json={"concern": "Career Growth"}, headers=headers)
    assert r2.status_code == 201
    case_2_id = r2.json()["id"]
    assert case_2_id != case_1_id
    assert r2.json()["concern"] == "Career Growth"
    app.dependency_overrides.clear()


def test_parent_without_linked_student_rejected(db_session: Session, escalation_setup: dict):
    """A parent with no linked child profile cannot create an escalation."""
    app.dependency_overrides[get_db] = lambda: db_session
    client = TestClient(app)

    token = create_access_token({
        "sub": str(escalation_setup["other_parent_user"].id),
        "role": escalation_setup["other_parent_user"].role.value,
    })
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post("/api/counselling/escalations", json={"concern": "Income"}, headers=headers)
    assert response.status_code == 400
    assert "No student profile is linked" in response.json()["detail"]
    app.dependency_overrides.clear()


def test_unauthorized_user_cannot_view_escalation(db_session: Session, escalation_setup: dict):
    """Parent cannot view another family's escalation case by manipulating ID."""
    app.dependency_overrides[get_db] = lambda: db_session
    client = TestClient(app)

    # 1. Create escalation for Raju (Mother Lakshmi)
    parent_token = create_access_token({
        "sub": str(escalation_setup["parent_user"].id),
        "role": escalation_setup["parent_user"].role.value,
    })
    r1 = client.post(
        "/api/counselling/escalations",
        json={"concern": "Income"},
        headers={"Authorization": f"Bearer {parent_token}"},
    )
    escalation_id = r1.json()["id"]

    # 2. Other parent (Suresh) tries to view Raju's case
    other_token = create_access_token({
        "sub": str(escalation_setup["other_parent_user"].id),
        "role": escalation_setup["other_parent_user"].role.value,
    })
    r2 = client.get(
        f"/api/counselling/escalations/{escalation_id}",
        headers={"Authorization": f"Bearer {other_token}"},
    )
    assert r2.status_code == 403
    assert "not authorized" in r2.json()["detail"].lower()

    # 3. Other student (Pooja) tries to view Raju's case
    pooja_token = create_access_token({
        "sub": str(escalation_setup["other_student_user"].id),
        "role": escalation_setup["other_student_user"].role.value,
    })
    r3 = client.get(
        f"/api/counselling/escalations/{escalation_id}",
        headers={"Authorization": f"Bearer {pooja_token}"},
    )
    assert r3.status_code == 403
    app.dependency_overrides.clear()


def test_admin_can_view_all_escalations(db_session: Session, escalation_setup: dict):
    """Admin is prepared to list all escalations for future counsellor triage."""
    app.dependency_overrides[get_db] = lambda: db_session
    client = TestClient(app)

    # Create an escalation
    parent_token = create_access_token({
        "sub": str(escalation_setup["parent_user"].id),
        "role": escalation_setup["parent_user"].role.value,
    })
    client.post(
        "/api/counselling/escalations",
        json={"concern": "Distance"},
        headers={"Authorization": f"Bearer {parent_token}"},
    )

    # Admin access
    admin_token = create_access_token({
        "sub": str(escalation_setup["admin_user"].id),
        "role": escalation_setup["admin_user"].role.value,
    })
    r_admin = client.get(
        "/api/admin/escalations",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r_admin.status_code == 200
    cases = r_admin.json()
    assert len(cases) >= 1
    assert cases[0]["concern"] == "Distance"
    app.dependency_overrides.clear()
    app.dependency_overrides.clear()


def test_unauthenticated_request_rejected():
    """Unauthenticated calls to escalations are rejected with 401."""
    client = TestClient(app)
    response = client.post("/api/counselling/escalations", json={"concern": "Income"})
    assert response.status_code == 401


def test_voice_escalation_detection_telugu_and_english():
    """Test voice speech-to-text trigger patterns for human escalation."""
    # English voice/text phrases
    assert detect_human_escalation("I want to speak with a human counsellor") is True
    assert detect_human_escalation("Can I talk to a real person?") is True
    assert detect_human_escalation("Please connect me to an advisor") is True
    assert detect_human_escalation("I need human help") is True

    # Telugu voice/text phrases (Brick 30 & 31)
    assert detect_human_escalation("నాకు ఒక కౌన్సిలర్తో మాట్లాడాలి.") is True
    assert detect_human_escalation("దయచేసి కౌన్సిలర్ సహాయం కావాలి") is True
    assert detect_human_escalation("ఒక మనిషితో మాట్లాడాలి") is True

    # Normal queries should not trigger
    assert detect_human_escalation("What is the duration of ITI course?") is False
    assert detect_human_escalation("జీతం ఎంత ఉంటుంది?") is False


def test_concern_normalization():
    """Validates concern normalization strictly preserves canonical categories."""
    assert normalize_concern("Income") == "Income"
    assert normalize_concern("income") == "Income"
    assert normalize_concern("Job Security") == "Job Security"
    assert normalize_concern("job security") == "Job Security"
    assert normalize_concern("Further Education") == "Further Education"
    assert normalize_concern("Social Perception") == "Social Perception"
    assert normalize_concern("Distance") == "Distance"
    assert normalize_concern("Working Conditions") == "Working Conditions"
    assert normalize_concern("Career Growth") == "Career Growth"
    assert normalize_concern("Random gibberish") == "Other"
    assert normalize_concern(None) == "Other"
    assert normalize_concern("") == "Other"
