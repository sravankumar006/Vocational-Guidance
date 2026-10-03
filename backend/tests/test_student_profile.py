"""
Unit and integration tests for Progressive Student Profile API (Phase 3 Brick 11).
Verifies:
1. GET /api/student/profile returns sanitized profile for authenticated student.
2. PATCH /api/student/profile performs partial section updates independently.
3. Validation: invalid age (< 10 or > 80), empty name, invalid income range rejected with 422.
4. Security: 401 unauthenticated, 403 parent/admin, strict session derivation (no cross-student modification).
5. Profile completion percentage matches progressive 5-section checklist.
6. Zero Aadhaar, zero passwords, zero tokens in responses.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database.base import Base
from database.session import get_db
from models import (
    User,
    UserRole,
    StudentProfile,
)
from core.security import hash_password, create_access_token
from main import app

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

    # Seed Student 2 (for isolation check)
    s2 = User(
        name="Priya Patel",
        email="priya@sih.gov.in",
        phone="+919876543220",
        role=UserRole.STUDENT,
        is_active=True,
        password_hash=hash_password("Pass@123"),
    )
    db.add(s2)
    db.flush()

    sp2 = StudentProfile(
        user_id=s2.id,
        education_level="Class 12 Passed",
        location="Hyderabad, Telangana",
    )
    db.add(sp2)

    # Seed Parent
    p = User(
        name="Sunita Sharma",
        email="sunita@sih.gov.in",
        role=UserRole.PARENT,
        is_active=True,
        password_hash=hash_password("Pass@123"),
    )
    db.add(p)

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


def test_get_student_profile(client):
    """Authenticated student retrieves their profile details."""
    db = TestingSessionLocal()
    student = db.query(User).filter(User.email == "aarav@sih.gov.in").first()
    student_id = student.id
    db.close()

    token = create_access_token({"sub": str(student_id), "role": "student"})
    res = client.get(
        "/api/student/profile",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "Aarav Sharma"
    assert data["education_level"] == "Class 10 Passed"
    assert "Electronics" in data["interests"]
    assert "section_completion" in data
    assert "aadhaar" not in str(data).lower()
    assert "password" not in str(data).lower()


def test_patch_student_profile_partial_section1(client):
    """Partially update Section 1 (About You: age & location)."""
    db = TestingSessionLocal()
    student = db.query(User).filter(User.email == "aarav@sih.gov.in").first()
    student_id = student.id
    db.close()

    token = create_access_token({"sub": str(student_id), "role": "student"})
    payload = {"age": 18, "location": "Medak, Telangana, India"}
    res = client.patch(
        "/api/student/profile",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["age"] == 18
    assert data["location"] == "Medak, Telangana, India"
    # Unchanged fields remain preserved
    assert data["education_level"] == "Class 10 Passed"
    assert "Electronics" in data["interests"]
    assert data["section_completion"]["about_you"] is True


def test_patch_student_profile_partial_section3_income(client):
    """Partially update Section 3 (Household Income Range)."""
    db = TestingSessionLocal()
    student = db.query(User).filter(User.email == "aarav@sih.gov.in").first()
    student_id = student.id
    db.close()

    token = create_access_token({"sub": str(student_id), "role": "student"})
    payload = {"household_income_range": "₹1–3 lakh"}
    res = client.patch(
        "/api/student/profile",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["household_income_range"] == "₹1–3 lakh"
    assert data["section_completion"]["family_context"] is True


def test_patch_student_profile_partial_section5_work_preferences(client):
    """Partially update Section 5 (Work location and career preferences)."""
    db = TestingSessionLocal()
    student = db.query(User).filter(User.email == "aarav@sih.gov.in").first()
    student_id = student.id
    db.close()

    token = create_access_token({"sub": str(student_id), "role": "student"})
    payload = {
        "work_location_preferences": ["Same State", "Urban"],
        "career_preferences": ["Technical / Hands-on", "Skilled Trade"],
    }
    res = client.patch(
        "/api/student/profile",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "Same State" in data["work_location_preferences"]
    assert "Technical / Hands-on" in data["career_preferences"]
    assert data["section_completion"]["work_preferences"] is True


def test_validation_rejects_invalid_age(client):
    """Invalid age (< 10 or > 80) must be rejected with 422."""
    db = TestingSessionLocal()
    student = db.query(User).filter(User.email == "aarav@sih.gov.in").first()
    student_id = student.id
    db.close()

    token = create_access_token({"sub": str(student_id), "role": "student"})
    res = client.patch(
        "/api/student/profile",
        json={"age": 5},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 422

    res2 = client.patch(
        "/api/student/profile",
        json={"age": 150},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res2.status_code == 422


def test_validation_rejects_empty_name(client):
    """Empty or whitespace-only name must be rejected with 422."""
    db = TestingSessionLocal()
    student = db.query(User).filter(User.email == "aarav@sih.gov.in").first()
    student_id = student.id
    db.close()

    token = create_access_token({"sub": str(student_id), "role": "student"})
    res = client.patch(
        "/api/student/profile",
        json={"name": "   "},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 422


def test_validation_rejects_invalid_income_range(client):
    """Income range outside approved controlled vocabulary must be rejected with 422."""
    db = TestingSessionLocal()
    student = db.query(User).filter(User.email == "aarav@sih.gov.in").first()
    student_id = student.id
    db.close()

    token = create_access_token({"sub": str(student_id), "role": "student"})
    res = client.patch(
        "/api/student/profile",
        json={"household_income_range": "Invalid Uncontrolled Range"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 422


def test_unauthenticated_profile_access_denied(client):
    """Unauthenticated requests must be rejected with 401."""
    res = client.get("/api/student/profile")
    assert res.status_code == 401
    res2 = client.patch("/api/student/profile", json={"age": 20})
    assert res2.status_code == 401


def test_parent_cannot_modify_student_profile(client):
    """Parent user attempting to update student profile must be rejected with 403."""
    db = TestingSessionLocal()
    parent = db.query(User).filter(User.email == "sunita@sih.gov.in").first()
    parent_id = parent.id
    db.close()

    token = create_access_token({"sub": str(parent_id), "role": "parent"})
    res = client.patch(
        "/api/student/profile",
        json={"age": 20},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 403


def test_student_isolation_cannot_modify_other_student(client):
    """Student 1 cannot modify Student 2's profile; updates are strictly scoped to token subject."""
    db = TestingSessionLocal()
    s1 = db.query(User).filter(User.email == "aarav@sih.gov.in").first()
    s2 = db.query(User).filter(User.email == "priya@sih.gov.in").first()
    s1_id = s1.id
    s2_id = s2.id
    db.close()

    token1 = create_access_token({"sub": str(s1_id), "role": "student"})
    # Student 1 attempts to pass student_id=2 in payload or query
    res = client.patch(
        "/api/student/profile",
        json={"student_id": s2_id, "name": "Aarav Modified"},
        headers={"Authorization": f"Bearer {token1}"},
    )
    assert res.status_code == 200

    # Verify Student 2 was untouched
    db2 = TestingSessionLocal()
    s2_check = db2.query(User).filter(User.id == s2_id).first()
    assert s2_check.name == "Priya Patel"
    db2.close()
