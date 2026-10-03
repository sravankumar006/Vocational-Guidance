"""
Unit and integration tests for Student Dashboard API (Phase 3 Brick 10).
Verifies:
1. Authenticated student receives their real dashboard data.
2. Unauthenticated user rejected with 401.
3. Parent user rejected with 403.
4. Admin user rejected with 403.
5. Response adheres strictly to security rules: 0 Aadhaar, 0 password hashes, 0 tokens.
6. Empty states (current career null, recommendations empty list) represented truthfully.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database.base import Base
from database.session import get_db
from models import (
    User,
    UserRole,
    StudentProfile,
    ParentProfile,
    ParentStudentAssociation,
    CounsellingSession,
    SessionStatus,
    CounsellingMessage,
    MessageSenderType,
)
from core.security import hash_password, create_access_token
from sqlalchemy.pool import StaticPool
from main import app

# In-memory SQLite with StaticPool for isolated test runs
TEST_DB_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    # Seed Student 1
    s1 = User(
        name="Aarav Sharma",
        email="aarav@sih.gov.in",
        phone="+919876543210",
        role=UserRole.STUDENT,
        is_active=True,
        password_hash=hash_password("Pass@123"),
    )
    db.add(s1)
    db.flush()

    sp1 = StudentProfile(
        user_id=s1.id,
        education_level="Class 10 Passed",
        education_stream="General",
        location="Medak, Telangana",
        interests=["Electronics", "Automotive"],
        skills=["Basic Electricals"],
    )
    db.add(sp1)
    db.flush()

    # Seed Parent 1
    p1 = User(
        name="Sunita Sharma",
        email="sunita@sih.gov.in",
        phone="+919876543211",
        role=UserRole.PARENT,
        is_active=True,
        password_hash=hash_password("Pass@123"),
    )
    db.add(p1)
    db.flush()

    pp1 = ParentProfile(
        user_id=p1.id,
        relationship_to_student="Mother",
    )
    db.add(pp1)
    db.flush()

    # Link Parent 1 to Student 1
    assoc = ParentStudentAssociation(
        parent_profile_id=pp1.id,
        student_profile_id=sp1.id,
        relationship_type="Mother",
    )
    db.add(assoc)

    # Seed Admin
    adm = User(
        name="Dr. Rajesh Verma",
        email="admin@sih.gov.in",
        role=UserRole.ADMIN,
        is_active=True,
        password_hash=hash_password("Pass@123"),
    )
    db.add(adm)

    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_student_dashboard_authenticated(client):
    """Authenticated student successfully accesses their dashboard."""
    db = TestingSessionLocal()
    student = db.query(User).filter(User.email == "aarav@sih.gov.in").first()
    db.close()

    token = create_access_token({"sub": str(student.id), "role": "student"})
    res = client.get(
        "/api/student/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.json()

    # Profile checks
    assert data["profile"]["name"] == "Aarav Sharma"
    assert data["profile"]["education_level"] == "Class 10 Passed"
    assert "Electronics" in data["profile"]["interests"]
    assert data["profile"]["profile_completion_percentage"] > 0

    # Privacy / Zero Leakage
    assert "password_hash" not in str(data)
    assert "aadhaar" not in str(data).lower()

    # Truthful empty states
    assert data["current_career"] is None
    assert data["recommended_careers"] == []
    assert data["latest_counselling_session"] is None

    # Family context
    assert data["family_status"]["has_linked_parent"] is True
    assert data["family_status"]["parent_name"] == "Sunita Sharma"
    assert data["family_status"]["relationship_type"] == "Mother"


def test_student_dashboard_unauthenticated(client):
    """Unauthenticated request must be rejected with 401."""
    res = client.get("/api/student/dashboard")
    assert res.status_code == 401


def test_student_dashboard_forbidden_for_parent(client):
    """Parent user attempting to call student dashboard must be rejected with 403."""
    db = TestingSessionLocal()
    parent = db.query(User).filter(User.email == "sunita@sih.gov.in").first()
    db.close()

    token = create_access_token({"sub": str(parent.id), "role": "parent"})
    res = client.get(
        "/api/student/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 403


def test_student_dashboard_forbidden_for_admin(client):
    """Admin user attempting to call student dashboard must be rejected with 403."""
    db = TestingSessionLocal()
    admin = db.query(User).filter(User.email == "admin@sih.gov.in").first()
    db.close()

    token = create_access_token({"sub": str(admin.id), "role": "admin"})
    res = client.get(
        "/api/student/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 403


def test_student_dashboard_with_counselling_session(client):
    """Verifies that if a counselling session exists, it is accurately reflected."""
    db = TestingSessionLocal()
    student = db.query(User).filter(User.email == "aarav@sih.gov.in").first()
    student_id = student.id
    sp = student.student_profile

    # Add a counselling session
    session = CounsellingSession(
        student_profile_id=sp.id,
        status=SessionStatus.ACTIVE,
    )
    db.add(session)
    db.flush()

    msg = CounsellingMessage(
        session_id=session.id,
        sender_type=MessageSenderType.STUDENT,
        content="I am interested in solar electrical systems.",
    )
    db.add(msg)
    db.commit()
    db.close()

    token = create_access_token({"sub": str(student_id), "role": "student"})
    res = client.get(
        "/api/student/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["latest_counselling_session"] is not None
    assert data["latest_counselling_session"]["status"] == "active"
    assert data["latest_counselling_session"]["message_count"] == 1
    assert "solar electrical systems" in data["latest_counselling_session"]["last_message_preview"]
