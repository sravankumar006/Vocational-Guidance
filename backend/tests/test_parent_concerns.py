"""
Test suite for Parent Concerns API & Persistence (Phase 5 Brick 28).
Validates RBAC, authorized family context, category recording, and listing isolation.
"""

import pytest
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
    ParentConcern,
    ConcernStatus,
    ConcernSeverity,
)
from models.enums import UserRole
from core.security import create_access_token, hash_password


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
def parent_setup(db_session: Session):
    """Sets up a parent, linked student, and client."""
    # 1. Create Student
    student_user = User(
        name="Aarav Sharma",
        email="aarav_test@sih.gov.in",
        role=UserRole.STUDENT,
        password_hash=hash_password("StudentPass123!"),
        is_active=True,
    )
    db_session.add(student_user)
    db_session.flush()

    student_profile = StudentProfile(
        user_id=student_user.id,
        education_level="Class 10 Passed",
        location="Medak, Telangana",
    )
    db_session.add(student_profile)
    db_session.flush()

    # 2. Create Parent
    parent_user = User(
        name="Sunita Sharma",
        email="sunita_test@sih.gov.in",
        role=UserRole.PARENT,
        password_hash=hash_password("ParentPass123!"),
        is_active=True,
    )
    db_session.add(parent_user)
    db_session.flush()

    parent_profile = ParentProfile(
        user_id=parent_user.id,
        relationship_to_student="Mother",
    )
    db_session.add(parent_profile)
    db_session.flush()

    # 3. Associate Parent and Student
    assoc = ParentStudentAssociation(
        parent_profile_id=parent_profile.id,
        student_profile_id=student_profile.id,
        relationship_type="Mother",
    )
    db_session.add(assoc)
    db_session.commit()

    # 4. Create another parent for isolation testing
    other_parent = User(
        name="Ramesh Patel",
        email="ramesh_other@sih.gov.in",
        role=UserRole.PARENT,
        password_hash=hash_password("ParentPass123!"),
        is_active=True,
    )
    db_session.add(other_parent)
    db_session.flush()
    other_profile = ParentProfile(
        user_id=other_parent.id,
        relationship_to_student="Father",
    )
    db_session.add(other_profile)
    db_session.commit()

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)

    parent_token = create_access_token({"sub": str(parent_user.id), "role": "parent"})
    student_token = create_access_token({"sub": str(student_user.id), "role": "student"})
    other_token = create_access_token({"sub": str(other_parent.id), "role": "parent"})

    yield {
        "client": client,
        "parent_token": parent_token,
        "student_token": student_token,
        "other_token": other_token,
        "parent_profile": parent_profile,
        "student_profile": student_profile,
        "other_profile": other_profile,
        "db": db_session,
    }

    app.dependency_overrides.clear()


def test_create_parent_concern_success(parent_setup):
    """Test authorized parent successfully logs a concern with linked student context."""
    client = parent_setup["client"]
    token = parent_setup["parent_token"]
    student_profile = parent_setup["student_profile"]

    payload = {
        "concern_type": "Income",
        "description": "Can my child earn enough starting out in this trade?",
        "severity": "medium",
    }
    response = client.post(
        "/api/parent/concerns",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["concern_type"] == "Income"
    assert data["description"] == "Can my child earn enough starting out in this trade?"
    assert data["severity"] == "medium"
    assert data["status"] == "open"
    assert data["student_profile_id"] == student_profile.id
    assert "id" in data
    assert "created_at" in data


def test_create_parent_concern_unauthenticated(parent_setup):
    """Test anonymous request to create concern is rejected with 401."""
    client = parent_setup["client"]
    payload = {"concern_type": "Job Security"}
    response = client.post("/api/parent/concerns", json=payload)
    assert response.status_code == 401


def test_create_parent_concern_student_forbidden(parent_setup):
    """Test student role token is rejected with 403 Forbidden."""
    client = parent_setup["client"]
    token = parent_setup["student_token"]
    payload = {"concern_type": "Job Security"}
    response = client.post(
        "/api/parent/concerns",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


def test_list_parent_concerns_isolation(parent_setup):
    """Test parents only see their own concerns and cannot see other parents' concerns."""
    client = parent_setup["client"]
    parent_token = parent_setup["parent_token"]
    other_token = parent_setup["other_token"]

    # Parent 1 creates 2 concerns
    client.post(
        "/api/parent/concerns",
        json={"concern_type": "Income", "description": "Income worry"},
        headers={"Authorization": f"Bearer {parent_token}"},
    )
    client.post(
        "/api/parent/concerns",
        json={"concern_type": "Job Security", "description": "Job security worry"},
        headers={"Authorization": f"Bearer {parent_token}"},
    )

    # Parent 2 creates 1 concern
    client.post(
        "/api/parent/concerns",
        json={"concern_type": "Distance", "description": "Distance worry"},
        headers={"Authorization": f"Bearer {other_token}"},
    )

    # List as Parent 1
    resp1 = client.get("/api/parent/concerns", headers={"Authorization": f"Bearer {parent_token}"})
    assert resp1.status_code == 200
    items1 = resp1.json()
    assert len(items1) == 2
    types1 = [item["concern_type"] for item in items1]
    assert "Income" in types1
    assert "Job Security" in types1
    assert "Distance" not in types1

    # List as Parent 2
    resp2 = client.get("/api/parent/concerns", headers={"Authorization": f"Bearer {other_token}"})
    assert resp2.status_code == 200
    items2 = resp2.json()
    assert len(items2) == 1
    assert items2[0]["concern_type"] == "Distance"


def test_all_eight_canonical_concern_categories(parent_setup):
    """Test all 8 required categories can be recorded."""
    client = parent_setup["client"]
    token = parent_setup["parent_token"]

    categories = [
        "Income",
        "Job Security",
        "Further Education",
        "Social Perception",
        "Distance",
        "Working Conditions",
        "Career Growth",
        "Other",
    ]

    for cat in categories:
        resp = client.post(
            "/api/parent/concerns",
            json={"concern_type": cat, "description": f"Concern about {cat}"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 201
        assert resp.json()["concern_type"] == cat
