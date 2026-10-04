import pytest
from datetime import datetime, timedelta, timezone
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


@pytest.fixture
def db_session():
    """Isolated in-memory SQLite database session for admin escalation tests."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()
    app.dependency_overrides[get_db] = lambda: db
    try:
        yield db
    finally:
        app.dependency_overrides.pop(get_db, None)
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def escalation_env(db_session: Session):
    db = db_session

    admin = User(
        email="admin_esc@sih.gov.in",
        password_hash=hash_password("adminpass123"),
        role=UserRole.ADMIN,
        name="Senior Admin Officer",
        is_active=True,
    )
    student_user = User(
        email="student_esc@sih.gov.in",
        password_hash=hash_password("studentpass123"),
        role=UserRole.STUDENT,
        name="Sunil Varma",
        is_active=True,
    )
    parent_user = User(
        email="parent_esc@sih.gov.in",
        password_hash=hash_password("parentpass123"),
        role=UserRole.PARENT,
        name="Ramesh Varma",
        is_active=True,
    )
    counsellor_user = User(
        email="counsellor_esc@sih.gov.in",
        password_hash=hash_password("counsellorpass123"),
        role=UserRole.COUNSELLOR,
        name="Dr. Ananya Rao",
        is_active=True,
    )
    db.add_all([admin, student_user, parent_user, counsellor_user])
    db.commit()

    student_profile = StudentProfile(
        user_id=student_user.id,
        education_level="Class 10 Passed",
        location="Guntur, Andhra Pradesh",
        career_preferences=["Solar PV Technician"],
    )
    parent_profile = ParentProfile(
        user_id=parent_user.id,
        relationship_to_student="Father",
        occupation="Agriculture",
        location="Guntur, Andhra Pradesh",
    )
    db.add_all([student_profile, parent_profile])
    db.commit()

    assoc = ParentStudentAssociation(
        parent_profile_id=parent_profile.id,
        student_profile_id=student_profile.id,
        relationship_type="Father",
    )
    db.add(assoc)

    occ1 = Occupation(
        name="Solar PV Technician",
        sector="Renewable Energy",
        description="Installs, tests, and maintains solar photovoltaic systems.",
    )
    occ2 = Occupation(
        name="Automobile Mechanic",
        sector="Automotive",
        description="Repairs and services commercial and light motor vehicles.",
    )
    db.add_all([occ1, occ2])
    db.commit()

    # Session & dialogue
    session = CounsellingSession(
        student_profile_id=student_profile.id,
        status=SessionStatus.ACTIVE,
    )
    db.add(session)
    db.commit()

    m1 = CounsellingMessage(
        session_id=session.id,
        sender_type=MessageSenderType.STUDENT,
        content="I am considering Solar PV Technician course after Class 10.",
    )
    m2 = CounsellingMessage(
        session_id=session.id,
        sender_type=MessageSenderType.PARENT,
        content="We are worried about income and want to talk to an official counsellor.",
        requires_human=True,
    )
    m3 = CounsellingMessage(
        session_id=session.id,
        sender_type=MessageSenderType.AI,
        content="Connecting you with a district vocational guidance officer.",
        confidence=0.42,
    )
    db.add_all([m1, m2, m3])
    db.commit()

    # Escalation 1: Pending
    now = datetime.now(timezone.utc)
    esc1 = HumanEscalation(
        counselling_session_id=session.id,
        student_id=student_profile.id,
        parent_id=parent_profile.id,
        career_id=occ1.id,
        concern="Income",
        language="te",
        conversation_summary="Father expressed deep hesitation regarding wage potential in solar sector.",
        reason="Parent demanded human counsellor review.",
        priority=EscalationPriority.HIGH,
        status=EscalationStatus.PENDING,
        created_at=now - timedelta(days=2),
    )
    # Escalation 2: In Progress
    esc2 = HumanEscalation(
        counselling_session_id=session.id,
        student_id=student_profile.id,
        parent_id=parent_profile.id,
        career_id=occ2.id,
        concern="Job Security",
        language="en",
        conversation_summary="Concerns about long-term stability in automotive workshop roles.",
        reason="Low AI confidence response.",
        priority=EscalationPriority.MEDIUM,
        status=EscalationStatus.IN_PROGRESS,
        assigned_to_user_id=counsellor_user.id,
        started_at=now - timedelta(days=1),
        created_at=now - timedelta(days=3),
    )
    # Escalation 3: Resolved
    esc3 = HumanEscalation(
        counselling_session_id=session.id,
        student_id=student_profile.id,
        parent_id=parent_profile.id,
        career_id=occ1.id,
        concern="Further Education",
        language="en",
        conversation_summary="Question regarding diploma pathway from ITI qualification.",
        reason="Educational trajectory clarity requested.",
        priority=EscalationPriority.LOW,
        status=EscalationStatus.RESOLVED,
        assigned_to_user_id=admin.id,
        resolved_by_user_id=admin.id,
        resolution_notes="Counsellor explained lateral entry into polytechnic diplomas.",
        started_at=now - timedelta(days=4),
        resolved_at=now - timedelta(days=3),
        created_at=now - timedelta(days=5),
    )
    db.add_all([esc1, esc2, esc3])
    db.commit()

    admin_token = create_access_token({"sub": str(admin.id), "role": UserRole.ADMIN.value})
    student_token = create_access_token({"sub": str(student_user.id), "role": UserRole.STUDENT.value})
    parent_token = create_access_token({"sub": str(parent_user.id), "role": UserRole.PARENT.value})

    return {
        "admin_headers": {"Authorization": f"Bearer {admin_token}"},
        "student_headers": {"Authorization": f"Bearer {student_token}"},
        "parent_headers": {"Authorization": f"Bearer {parent_token}"},
        "esc1_id": esc1.id,
        "esc2_id": esc2.id,
        "esc3_id": esc3.id,
        "admin_id": admin.id,
    }


def test_admin_access_allowed(escalation_env):
    """Admin role is authorized to access /api/admin/escalations."""
    client = TestClient(app)
    res = client.get("/api/admin/escalations", headers=escalation_env["admin_headers"])
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_student_and_parent_access_denied(escalation_env):
    """Non-admin roles cannot access admin escalations."""
    client = TestClient(app)
    # Student
    res_st = client.get("/api/admin/escalations", headers=escalation_env["student_headers"])
    assert res_st.status_code == 403

    # Parent
    res_pr = client.get("/api/admin/escalations", headers=escalation_env["parent_headers"])
    assert res_pr.status_code == 403

    # Unauthenticated
    res_anon = client.get("/api/admin/escalations")
    assert res_anon.status_code == 401


def test_paginated_escalations_list(escalation_env):
    """Providing page query returns structured paginated response with counts."""
    client = TestClient(app)
    res = client.get("/api/admin/escalations?page=1&page_size=2", headers=escalation_env["admin_headers"])
    assert res.status_code == 200
    body = res.json()
    assert "items" in body
    assert "stats" in body
    assert body["total"] == 3
    assert len(body["items"]) == 2
    assert body["page"] == 1
    assert body["page_size"] == 2
    assert body["total_pages"] == 2

    stats = body["stats"]
    assert stats["total"] == 3
    assert stats["pending"] == 1
    assert stats["in_progress"] == 1
    assert stats["resolved"] == 1


def test_search_and_filters(escalation_env):
    """Search and filters correctly filter escalation records."""
    client = TestClient(app)

    # 1. Search by career name
    res = client.get("/api/admin/escalations?page=1&search=Solar", headers=escalation_env["admin_headers"])
    assert res.status_code == 200
    items = res.json()["items"]
    assert len(items) == 2
    assert all("Solar" in it["career_title"] for it in items)

    # 2. Filter by status: pending
    res_pending = client.get("/api/admin/escalations?page=1&status=pending", headers=escalation_env["admin_headers"])
    assert res_pending.status_code == 200
    assert len(res_pending.json()["items"]) == 1
    assert res_pending.json()["items"][0]["status"] == "pending"

    # 3. Filter by language: te
    res_lang = client.get("/api/admin/escalations?page=1&language=te", headers=escalation_env["admin_headers"])
    assert res_lang.status_code == 200
    assert len(res_lang.json()["items"]) == 1
    assert res_lang.json()["items"][0]["language"] == "te"

    # 4. Filter by concern: Job Security
    res_con = client.get("/api/admin/escalations?page=1&concern=Job Security", headers=escalation_env["admin_headers"])
    assert res_con.status_code == 200
    assert len(res_con.json()["items"]) == 1
    assert res_con.json()["items"][0]["concern"] == "Job Security"


def test_escalation_detail_with_conversation(escalation_env):
    """GET /api/admin/escalations/{id} provides full context and conversation messages."""
    client = TestClient(app)
    esc1_id = escalation_env["esc1_id"]

    res = client.get(f"/api/admin/escalations/{esc1_id}", headers=escalation_env["admin_headers"])
    assert res.status_code == 200
    detail = res.json()

    assert detail["id"] == esc1_id
    assert detail["student_name"] == "Sunil Varma"
    assert detail["parent_name"] == "Ramesh Varma"
    assert detail["career_title"] == "Solar PV Technician"
    assert detail["concern"] == "Income"
    assert detail["language"] == "te"
    assert detail["status"] == "pending"
    assert detail["is_demo"] is True

    # Conversation messages
    assert "conversation_messages" in detail
    msgs = detail["conversation_messages"]
    assert len(msgs) == 3
    assert msgs[0]["sender_type"] == "student"
    assert msgs[1]["requires_human"] is True
    assert msgs[2]["sender_type"] == "ai"


def test_status_lifecycle_workflow(escalation_env):
    """Validates lifecycle: Pending -> In Progress -> Resolved, and blocks direct jumps."""
    client = TestClient(app)
    esc1_id = escalation_env["esc1_id"]

    # 1. Attempt invalid direct transition: Pending -> Resolved (Must be rejected)
    res_invalid = client.patch(
        f"/api/admin/escalations/{esc1_id}/status",
        json={"status": "Resolved"},
        headers=escalation_env["admin_headers"],
    )
    assert res_invalid.status_code == 400
    assert "Direct transition from 'Pending' to 'Resolved' is not permitted" in res_invalid.json()["detail"]

    # 2. Valid transition: Pending -> In Progress
    res_prog = client.patch(
        f"/api/admin/escalations/{esc1_id}/status",
        json={"status": "In Progress"},
        headers=escalation_env["admin_headers"],
    )
    assert res_prog.status_code == 200
    item_prog = res_prog.json()
    assert item_prog["status"] == "in_progress"
    assert item_prog["started_at"] is not None

    # 3. Valid transition: In Progress -> Resolved
    res_res = client.patch(
        f"/api/admin/escalations/{esc1_id}/status",
        json={
            "status": "Resolved",
            "resolution_notes": "Conducted 15-minute telephonic counselling with parent regarding entry-level solar salaries.",
        },
        headers=escalation_env["admin_headers"],
    )
    assert res_res.status_code == 200
    item_res = res_res.json()
    assert item_res["status"] == "resolved"
    assert item_res["resolved_at"] is not None
    assert "entry-level solar salaries" in item_res["resolution_notes"]

    # 4. Modifying resolved case rejected
    res_modify_resolved = client.patch(
        f"/api/admin/escalations/{esc1_id}/status",
        json={"status": "In Progress"},
        headers=escalation_env["admin_headers"],
    )
    assert res_modify_resolved.status_code == 400
    assert "already been resolved" in res_modify_resolved.json()["detail"]


def test_invalid_status_value_rejected(escalation_env):
    """Arbitrary status values like 'closed' or 'discarded' are rejected with 400."""
    client = TestClient(app)
    esc2_id = escalation_env["esc2_id"]

    res = client.patch(
        f"/api/admin/escalations/{esc2_id}/status",
        json={"status": "archived"},
        headers=escalation_env["admin_headers"],
    )
    assert res.status_code == 400
    assert "Allowed values are: 'Pending', 'In Progress', 'Resolved'" in res.json()["detail"]


def test_no_sensitive_pii_exposed(escalation_env):
    """Ensures password hashes, tokens, or private credentials are never exposed."""
    client = TestClient(app)
    res = client.get("/api/admin/escalations?page=1", headers=escalation_env["admin_headers"])
    assert res.status_code == 200
    raw_text = res.text.lower()
    assert "password" not in raw_text
    assert "hash" not in raw_text
    assert "aadhaar" not in raw_text
    assert "token" not in raw_text
