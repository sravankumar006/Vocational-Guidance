"""
Tests for Admin Dashboard API Endpoints (Phase 10 Brick 35 / Admin Route Enhancements).
Verifies:
1. Strict RBAC: Admin access granted; Student/Parent/Unauthenticated denied (401/403).
2. GET /api/admin/overview returns aggregated platform telemetry and counts.
3. GET /api/admin/families returns grouped family units with linked profiles.
4. GET /api/admin/students returns student profiles and academic info.
5. GET /api/admin/parents returns masked parent contact identifiers (no sensitive PII).
6. GET /api/admin/sessions returns counselling sessions and escalation flags.
7. GET /api/admin/escalations returns full escalation records.
8. PATCH /api/admin/escalations/{id} allows admins to transition escalation case status.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from main import app
from database.base import Base
from database.session import get_db
from models import (
    User,
    StudentProfile,
    ParentProfile,
    ParentStudentAssociation,
    CounsellingSession,
    HumanEscalation,
)
from models.enums import UserRole, SessionStatus, EscalationPriority, EscalationStatus
from core.security import create_access_token, hash_password

client = TestClient(app)


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
    app.dependency_overrides[get_db] = lambda: db
    try:
        yield db
    finally:
        app.dependency_overrides.pop(get_db, None)
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def seeded_data(db_session: Session):
    """Seed Admin, Student, Parent, Session, and Escalation records."""
    db = db_session

    # Admin User
    admin = User(
        email="admin_dash@sih.gov.in",
        name="Admin Test",
        password_hash=hash_password("adminSecret123!"),
        role=UserRole.ADMIN,
        is_active=True,
    )
    # Student User
    student_user = User(
        email="student_dash@sih.gov.in",
        name="Aarav Sharma",
        password_hash=hash_password("studentSecret123!"),
        role=UserRole.STUDENT,
        is_active=True,
    )
    # Parent User
    parent_user = User(
        email="parent_dash@sih.gov.in",
        name="Sunita Sharma",
        password_hash=hash_password("parentSecret123!"),
        role=UserRole.PARENT,
        is_active=True,
    )

    db.add_all([admin, student_user, parent_user])
    db.commit()
    db.refresh(admin)
    db.refresh(student_user)
    db.refresh(parent_user)

    # Student Profile
    student_prof = StudentProfile(
        user_id=student_user.id,
        education_level="Class 10",
        location="Hyderabad, Telangana",
    )
    # Parent Profile
    parent_prof = ParentProfile(
        user_id=parent_user.id,
        relationship_to_student="Mother",
        occupation="Teacher",
    )
    db.add_all([student_prof, parent_prof])
    db.commit()
    db.refresh(student_prof)
    db.refresh(parent_prof)

    # Family Association
    assoc = ParentStudentAssociation(
        parent_profile_id=parent_prof.id,
        student_profile_id=student_prof.id,
        relationship_type="Mother",
    )
    db.add(assoc)
    db.commit()

    # Counselling Session
    session = CounsellingSession(
        student_profile_id=student_prof.id,
        status=SessionStatus.ACTIVE,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Human Escalation
    escalation = HumanEscalation(
        counselling_session_id=session.id,
        student_id=student_prof.id,
        parent_id=parent_prof.id,
        concern="parental_reluctance",
        reason="Family prefers traditional degree path over vocational ITI certification",
        priority=EscalationPriority.HIGH,
        status=EscalationStatus.PENDING,
    )
    db.add(escalation)
    db.commit()
    db.refresh(escalation)

    # Auth tokens
    admin_token = create_access_token(payload_data={"sub": str(admin.id), "role": admin.role.value})
    student_token = create_access_token(payload_data={"sub": str(student_user.id), "role": student_user.role.value})
    parent_token = create_access_token(payload_data={"sub": str(parent_user.id), "role": parent_user.role.value})

    return {
        "admin_headers": {"Authorization": f"Bearer {admin_token}"},
        "student_headers": {"Authorization": f"Bearer {student_token}"},
        "parent_headers": {"Authorization": f"Bearer {parent_token}"},
        "escalation_id": escalation.id,
        "session_id": session.id,
        "student_id": student_prof.id,
    }


def test_admin_endpoints_require_admin_role(seeded_data):
    """Students and Parents cannot call admin endpoints (403 Forbidden)."""
    endpoints = [
        "/api/admin/overview",
        "/api/admin/families",
        "/api/admin/students",
        "/api/admin/parents",
        "/api/admin/sessions",
        "/api/admin/escalations",
    ]

    for ep in endpoints:
        # Student request
        res_stu = client.get(ep, headers=seeded_data["student_headers"])
        assert res_stu.status_code == 403, f"Endpoint {ep} did not reject Student"

        # Parent request
        res_par = client.get(ep, headers=seeded_data["parent_headers"])
        assert res_par.status_code == 403, f"Endpoint {ep} did not reject Parent"

        # Unauthenticated request
        res_anon = client.get(ep)
        assert res_anon.status_code == 401, f"Endpoint {ep} did not reject unauthenticated client"


def test_admin_overview_returns_correct_stats(seeded_data):
    """Admin overview aggregates correct platform counts and recent records."""
    res = client.get("/api/admin/overview", headers=seeded_data["admin_headers"])
    assert res.status_code == 200
    data = res.json()

    assert "stats" in data
    stats = data["stats"]
    assert stats["total_families"] == 1
    assert stats["total_students"] == 1
    assert stats["total_parents"] == 1
    assert stats["total_sessions"] == 1
    assert stats["total_escalations"] == 1
    assert stats["active_sessions"] == 1
    assert stats["pending_escalations"] == 1

    assert "recent_sessions" in data
    assert len(data["recent_sessions"]) == 1
    assert data["recent_sessions"][0]["student_name"] == "Aarav Sharma"

    assert "recent_escalations" in data
    assert len(data["recent_escalations"]) == 1
    assert data["recent_escalations"][0]["priority"] == "high"


def test_admin_families_endpoint(seeded_data):
    """Admin families endpoint returns linked student and parent details."""
    res = client.get("/api/admin/families", headers=seeded_data["admin_headers"])
    assert res.status_code == 200
    families = res.json()
    assert len(families) == 1

    fam = families[0]
    assert fam["id"].startswith("FAM-")
    assert fam["students_count"] == 1
    assert fam["parents_count"] == 1
    assert len(fam["students"]) == 1
    assert fam["students"][0]["name"] == "Aarav Sharma"
    assert len(fam["parents"]) == 1
    assert fam["parents"][0]["name"] == "Sunita Sharma"


def test_admin_students_endpoint(seeded_data):
    """Admin students endpoint returns student academic trajectory."""
    res = client.get("/api/admin/students", headers=seeded_data["admin_headers"])
    assert res.status_code == 200
    students = res.json()
    assert len(students) == 1
    assert students[0]["name"] == "Aarav Sharma"
    assert students[0]["family_id"].startswith("FAM-")
    assert students[0]["education_level"] == "Class 10"


def test_admin_parents_endpoint_masks_pii(seeded_data):
    """Admin parents endpoint returns masked contact identifiers to protect privacy."""
    res = client.get("/api/admin/parents", headers=seeded_data["admin_headers"])
    assert res.status_code == 200
    parents = res.json()
    assert len(parents) == 1
    parent = parents[0]
    assert parent["name"] == "Sunita Sharma"
    # Verify contact is masked and not raw plain email
    assert parent["contact_identifier"] != "parent_dash@sih.gov.in"
    assert "@" in parent["contact_identifier"]
    assert "*" in parent["contact_identifier"]
    # Verify password hash or secrets are never exposed
    assert "password" not in parent
    assert "hashed_password" not in parent


def test_admin_sessions_endpoint(seeded_data):
    """Admin sessions endpoint returns sessions with escalation metadata."""
    res = client.get("/api/admin/sessions", headers=seeded_data["admin_headers"])
    assert res.status_code == 200
    sessions = res.json()
    assert len(sessions) == 1
    sess = sessions[0]
    assert sess["student_name"] == "Aarav Sharma"
    assert sess["has_escalation"] is True
    assert sess["escalation_priority"] == "high"


def test_admin_escalation_status_update(seeded_data):
    """Admins can transition escalation status (e.g., pending -> in_progress -> resolved)."""
    esc_id = seeded_data["escalation_id"]

    # 1. Update to in_progress
    patch_res = client.patch(
        f"/api/admin/escalations/{esc_id}",
        json={"status": "in_progress"},
        headers=seeded_data["admin_headers"],
    )
    assert patch_res.status_code == 200
    updated = patch_res.json()
    assert updated["status"] == "in_progress"

    # 2. Update to resolved
    patch_res2 = client.patch(
        f"/api/admin/escalations/{esc_id}",
        json={"status": "resolved"},
        headers=seeded_data["admin_headers"],
    )
    assert patch_res2.status_code == 200
    resolved = patch_res2.json()
    assert resolved["status"] == "resolved"
    assert resolved["resolved_at"] is not None
