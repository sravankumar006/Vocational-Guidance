"""
Test suite for Parent Dashboard and Child Context API (Phase 5 Brick 27).
Validates RBAC, authorized family context, neutral empty states, and career derivation.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from main import app
from database.session import get_db
from models import (
    User,
    StudentProfile,
    ParentProfile,
    ParentStudentAssociation,
    Occupation,
)
from models.enums import UserRole
from core.security import create_access_token, hash_password


from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from database.base import Base


@pytest.fixture
def parent_db_session():
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
def parent_client(parent_db_session: Session) -> tuple[TestClient, User, User, StudentProfile]:
    """Sets up a linked parent, student, and TestClient."""
    db_session = parent_db_session

    # 1. Create Student
    student_user = User(
        name="Aarav Sharma",
        email="parent_test_student@sih.gov.in",
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
        interests=["Electronics", "Automotive"],
        skills=["Basic Electricals"],
        career_preferences=["Automotive Service Technician"],
    )
    db_session.add(student_profile)
    db_session.flush()

    # 2. Create Occupation
    occ = Occupation(
        name="Automotive Service Technician",
        sector="Automotive",
        description="Repairs and services automotive vehicles.",
    )

    db_session.add(occ)
    db_session.flush()

    # 3. Create Parent
    parent_user = User(
        name="Sunita Sharma",
        email="parent_test_user@sih.gov.in",
        role=UserRole.PARENT,
        password_hash=hash_password("ParentPass123!"),
        is_active=True,
    )
    db_session.add(parent_user)
    db_session.flush()

    parent_profile = ParentProfile(
        user_id=parent_user.id,
        relationship_to_student="Mother",
        location="Medak, Telangana",
    )
    db_session.add(parent_profile)
    db_session.flush()

    # 4. Link via ParentStudentAssociation
    assoc = ParentStudentAssociation(
        parent_profile_id=parent_profile.id,
        student_profile_id=student_profile.id,
        relationship_type="Mother",
    )
    db_session.add(assoc)
    db_session.commit()

    # Override get_db
    app.dependency_overrides[get_db] = lambda: db_session
    client = TestClient(app)

    return client, parent_user, student_user, student_profile


def test_parent_child_context_success(parent_client):
    client, parent_user, student_user, student_profile = parent_client
    token = create_access_token({"sub": str(parent_user.id), "role": "parent"})

    resp = client.get(
        "/api/parent/child",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    data = resp.json()

    assert data["has_linked_student"] is True
    assert data["student_id"] == student_profile.id
    assert data["child_name"] == "Aarav Sharma"
    assert data["relationship_type"] == "Mother"
    assert data["education_level"] == "Class 10 Passed"
    assert data["location"] == "Medak, Telangana"
    assert data["career"] is not None
    assert data["career"]["title"] == "Automotive Service Technician"
    assert data["career_status_text"] == "Automotive Service Technician"


def test_parent_without_linked_student(parent_db_session: Session):
    db_session = parent_db_session

    # Create parent with no linked student
    parent_user = User(
        name="Solo Parent",
        email="solo_parent@sih.gov.in",
        role=UserRole.PARENT,
        password_hash=hash_password("ParentPass123!"),
        is_active=True,
    )
    db_session.add(parent_user)
    db_session.flush()

    parent_profile = ParentProfile(
        user_id=parent_user.id,
        relationship_to_student="Father",
    )
    db_session.add(parent_profile)
    db_session.commit()

    app.dependency_overrides[get_db] = lambda: db_session
    client = TestClient(app)
    token = create_access_token({"sub": str(parent_user.id), "role": "parent"})

    resp = client.get(
        "/api/parent/child",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    data = resp.json()

    assert data["has_linked_student"] is False
    assert data["student_id"] is None
    assert data["child_name"] is None
    assert "No student profile is linked" in data["message"]
    assert data["career_status_text"] == "Career not selected yet"


def test_parent_student_without_career_selected(parent_db_session: Session):
    db_session = parent_db_session

    # Student with no career preference and no occupations
    student_user = User(
        name="Rohan Verma",
        email="rohan@sih.gov.in",
        role=UserRole.STUDENT,
        password_hash=hash_password("Pass123!"),
        is_active=True,
    )
    db_session.add(student_user)
    db_session.flush()

    student_profile = StudentProfile(
        user_id=student_user.id,
        education_level="Class 8 Passed",
        location="Warangal",
        career_preferences=[],
    )
    db_session.add(student_profile)
    db_session.flush()

    parent_user = User(
        name="Kavita Verma",
        email="kavita@sih.gov.in",
        role=UserRole.PARENT,
        password_hash=hash_password("Pass123!"),
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

    assoc = ParentStudentAssociation(
        parent_profile_id=parent_profile.id,
        student_profile_id=student_profile.id,
        relationship_type="Mother",
    )
    db_session.add(assoc)
    db_session.commit()

    app.dependency_overrides[get_db] = lambda: db_session
    client = TestClient(app)
    token = create_access_token({"sub": str(parent_user.id), "role": "parent"})

    resp = client.get(
        "/api/parent/child",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["has_linked_student"] is True
    assert data["child_name"] == "Rohan Verma"
    assert data["career"] is None
    assert data["career_status_text"] == "Career not selected yet"


def test_parent_endpoint_unauthenticated():
    client = TestClient(app)
    resp = client.get("/api/parent/child")
    assert resp.status_code == 401


def test_parent_endpoint_student_forbidden(parent_client):
    client, _, student_user, _ = parent_client
    token = create_access_token({"sub": str(student_user.id), "role": "student"})

    resp = client.get(
        "/api/parent/child",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 403
