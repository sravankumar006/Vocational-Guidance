"""
Comprehensive Test Suite for Phase 1 Brick 7: Authentication & RBAC.
Tests all 16 mandatory security requirements:
1. Valid login.
2. Invalid password.
3. Unknown user.
4. Inactive user.
5. Authenticated /me.
6. Student authorization.
7. Parent authorization.
8. Admin authorization.
9. Student cannot access another student.
10. Parent cannot access unrelated student.
11. Parent can access associated student.
12. Student cannot access parent endpoint.
13. Parent cannot access admin endpoint.
14. Student cannot access admin endpoint.
15. Logout invalidates refresh/session state.
16. Expired authentication is rejected.
"""

from datetime import datetime, timedelta, timezone
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from database.base import Base
from database.session import get_db
from models import (
    User,
    StudentProfile,
    ParentProfile,
    ParentStudentAssociation,
    UserSession,
)
from models.enums import UserRole
from core.security import hash_password, create_access_token, generate_refresh_token, hash_refresh_token
from main import app

# Create isolated in-memory SQLite database for test suite
TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    """Create all tables in memory once for the test module."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    """Provides a fresh isolated database session per test, rolling back on completion."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session: Session):
    """Provides a TestClient with get_db overridden to use the test session."""
    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    test_client = TestClient(app)
    yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def seed_test_data(db_session: Session):
    """
    Seeds test personas:
    - Student 1 (Aarav, Profile 1)
    - Parent 1 (Sunita, Profile 1) -> Linked to Student 1
    - Student 2 (Priya, Profile 2)
    - Parent 2 (Ramesh, Profile 2) -> Linked to Student 2 only
    - Admin (Dr. Rajesh)
    - Inactive User (Deactivated)
    """
    pw_hash = hash_password("ValidPass123!")

    # 1. Student 1
    s1 = User(
        name="Aarav Sharma",
        email="student1@sih.gov.in",
        phone="+919876543210",
        role=UserRole.STUDENT,
        is_active=True,
        password_hash=pw_hash,
    )
    db_session.add(s1)
    db_session.flush()
    sp1 = StudentProfile(user_id=s1.id, education_level="Class 10")
    db_session.add(sp1)
    db_session.flush()

    # 2. Parent 1 (Linked to Student 1)
    p1 = User(
        name="Sunita Sharma",
        email="parent1@sih.gov.in",
        phone="+919876543211",
        role=UserRole.PARENT,
        is_active=True,
        password_hash=pw_hash,
    )
    db_session.add(p1)
    db_session.flush()
    pp1 = ParentProfile(user_id=p1.id, relationship_to_student="Mother")
    db_session.add(pp1)
    db_session.flush()

    assoc1 = ParentStudentAssociation(
        parent_profile_id=pp1.id,
        student_profile_id=sp1.id,
        relationship_type="Mother",
    )
    db_session.add(assoc1)

    # 3. Student 2 (Unrelated to Parent 1)
    s2 = User(
        name="Priya Patel",
        email="student2@sih.gov.in",
        phone="+919876543220",
        role=UserRole.STUDENT,
        is_active=True,
        password_hash=pw_hash,
    )
    db_session.add(s2)
    db_session.flush()
    sp2 = StudentProfile(user_id=s2.id, education_level="Class 12")
    db_session.add(sp2)
    db_session.flush()

    # 4. Parent 2 (Linked to Student 2)
    p2 = User(
        name="Ramesh Patel",
        email="parent2@sih.gov.in",
        phone="+919876543221",
        role=UserRole.PARENT,
        is_active=True,
        password_hash=pw_hash,
    )
    db_session.add(p2)
    db_session.flush()
    pp2 = ParentProfile(user_id=p2.id, relationship_to_student="Father")
    db_session.add(pp2)
    db_session.flush()

    assoc2 = ParentStudentAssociation(
        parent_profile_id=pp2.id,
        student_profile_id=sp2.id,
        relationship_type="Father",
    )
    db_session.add(assoc2)

    # 5. Admin
    admin = User(
        name="Dr. Rajesh Verma",
        email="admin@sih.gov.in",
        phone="+919876543212",
        role=UserRole.ADMIN,
        is_active=True,
        password_hash=pw_hash,
    )
    db_session.add(admin)

    # 6. Inactive User
    inactive = User(
        name="Inactive Account",
        email="inactive@sih.gov.in",
        phone="+919876543299",
        role=UserRole.STUDENT,
        is_active=False,
        password_hash=pw_hash,
    )
    db_session.add(inactive)

    db_session.commit()

    return {
        "student1": s1,
        "student1_profile": sp1,
        "parent1": p1,
        "parent1_profile": pp1,
        "student2": s2,
        "student2_profile": sp2,
        "parent2": p2,
        "parent2_profile": pp2,
        "admin": admin,
        "inactive": inactive,
    }


# ==============================================================================
# 1. Valid Login
# ==============================================================================
def test_01_valid_login(client: TestClient, seed_test_data):
    response = client.post("/api/auth/login", json={
        "identifier": "student1@sih.gov.in",
        "password": "ValidPass123!",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "student1@sih.gov.in"
    assert data["user"]["role"] == "student"
    assert "password" not in data["user"]
    assert "password_hash" not in data["user"]
    # Check HttpOnly cookie set
    assert "refresh_token" in response.cookies


# ==============================================================================
# 2. Invalid Password
# ==============================================================================
def test_02_invalid_password(client: TestClient, seed_test_data):
    response = client.post("/api/auth/login", json={
        "identifier": "student1@sih.gov.in",
        "password": "WrongPassword!",
    })
    assert response.status_code == 401
    assert "Invalid credentials" in response.json()["detail"]


# ==============================================================================
# 3. Unknown User
# ==============================================================================
def test_03_unknown_user(client: TestClient, seed_test_data):
    response = client.post("/api/auth/login", json={
        "identifier": "nonexistent@sih.gov.in",
        "password": "ValidPass123!",
    })
    assert response.status_code == 401
    assert "Invalid credentials" in response.json()["detail"]


# ==============================================================================
# 4. Inactive User
# ==============================================================================
def test_04_inactive_user(client: TestClient, seed_test_data):
    response = client.post("/api/auth/login", json={
        "identifier": "inactive@sih.gov.in",
        "password": "ValidPass123!",
    })
    assert response.status_code == 403
    assert "inactive" in response.json()["detail"].lower()


# ==============================================================================
# 5. Authenticated /me
# ==============================================================================
def test_05_authenticated_me(client: TestClient, seed_test_data):
    login_res = client.post("/api/auth/login", json={
        "identifier": "parent1@sih.gov.in",
        "password": "ValidPass123!",
    })
    token = login_res.json()["access_token"]

    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    user_info = response.json()
    assert user_info["email"] == "parent1@sih.gov.in"
    assert user_info["role"] == "parent"
    assert user_info["parent_profile_id"] is not None
    assert seed_test_data["student1_profile"].id in user_info["associated_student_ids"]
    assert "password_hash" not in user_info


# ==============================================================================
# 6. Student Authorization
# ==============================================================================
def test_06_student_authorization(client: TestClient, seed_test_data):
    login_res = client.post("/api/auth/login", json={
        "identifier": "student1@sih.gov.in",
        "password": "ValidPass123!",
    })
    token = login_res.json()["access_token"]

    response = client.get("/api/student/test", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["role"] == "student"
    assert response.json()["verified"] is True


# ==============================================================================
# 7. Parent Authorization
# ==============================================================================
def test_07_parent_authorization(client: TestClient, seed_test_data):
    login_res = client.post("/api/auth/login", json={
        "identifier": "parent1@sih.gov.in",
        "password": "ValidPass123!",
    })
    token = login_res.json()["access_token"]

    response = client.get("/api/parent/test", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["role"] == "parent"
    assert response.json()["verified"] is True


# ==============================================================================
# 8. Admin Authorization
# ==============================================================================
def test_08_admin_authorization(client: TestClient, seed_test_data):
    login_res = client.post("/api/auth/login", json={
        "identifier": "admin@sih.gov.in",
        "password": "ValidPass123!",
    })
    token = login_res.json()["access_token"]

    response = client.get("/api/admin/test", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["role"] == "admin"
    assert response.json()["verified"] is True


# ==============================================================================
# 9. Student Cannot Access Another Student
# ==============================================================================
def test_09_student_cannot_access_another_student(client: TestClient, seed_test_data):
    # Student 1 logs in
    login_res = client.post("/api/auth/login", json={
        "identifier": "student1@sih.gov.in",
        "password": "ValidPass123!",
    })
    token = login_res.json()["access_token"]

    # Student 1 tries to access Student 2's profile
    sp2_id = seed_test_data["student2_profile"].id
    response = client.get(
        f"/api/student/profile/{sp2_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403
    assert "restricted to accessing their own profile" in response.json()["detail"]


# ==============================================================================
# 10. Parent Cannot Access Unrelated Student
# ==============================================================================
def test_10_parent_cannot_access_unrelated_student(client: TestClient, seed_test_data):
    # Parent 1 (mother of Student 1) logs in
    login_res = client.post("/api/auth/login", json={
        "identifier": "parent1@sih.gov.in",
        "password": "ValidPass123!",
    })
    token = login_res.json()["access_token"]

    # Parent 1 tries to access Student 2 (unrelated student)
    sp2_id = seed_test_data["student2_profile"].id
    response = client.get(
        f"/api/parent/student/{sp2_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403
    assert "not linked to this student context" in response.json()["detail"]


# ==============================================================================
# 11. Parent Can Access Associated Student
# ==============================================================================
def test_11_parent_can_access_associated_student(client: TestClient, seed_test_data):
    # Parent 1 logs in
    login_res = client.post("/api/auth/login", json={
        "identifier": "parent1@sih.gov.in",
        "password": "ValidPass123!",
    })
    token = login_res.json()["access_token"]

    # Parent 1 accesses Student 1 (linked child)
    sp1_id = seed_test_data["student1_profile"].id
    response = client.get(
        f"/api/parent/student/{sp1_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["student_id"] == sp1_id
    assert data["authorized_for_parent"] is True


# ==============================================================================
# 12. Student Cannot Access Parent Endpoint
# ==============================================================================
def test_12_student_cannot_access_parent_endpoint(client: TestClient, seed_test_data):
    login_res = client.post("/api/auth/login", json={
        "identifier": "student1@sih.gov.in",
        "password": "ValidPass123!",
    })
    token = login_res.json()["access_token"]

    response = client.get("/api/parent/test", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403
    assert "does not have required permissions" in response.json()["detail"]


# ==============================================================================
# 13. Parent Cannot Access Admin Endpoint
# ==============================================================================
def test_13_parent_cannot_access_admin_endpoint(client: TestClient, seed_test_data):
    login_res = client.post("/api/auth/login", json={
        "identifier": "parent1@sih.gov.in",
        "password": "ValidPass123!",
    })
    token = login_res.json()["access_token"]

    response = client.get("/api/admin/test", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403
    assert "does not have required permissions" in response.json()["detail"]


# ==============================================================================
# 14. Student Cannot Access Admin Endpoint
# ==============================================================================
def test_14_student_cannot_access_admin_endpoint(client: TestClient, seed_test_data):
    login_res = client.post("/api/auth/login", json={
        "identifier": "student1@sih.gov.in",
        "password": "ValidPass123!",
    })
    token = login_res.json()["access_token"]

    response = client.get("/api/admin/test", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403
    assert "does not have required permissions" in response.json()["detail"]


# ==============================================================================
# 15. Logout Invalidates Refresh / Session State
# ==============================================================================
def test_15_logout_invalidates_session(client: TestClient, seed_test_data):
    login_res = client.post("/api/auth/login", json={
        "identifier": "student1@sih.gov.in",
        "password": "ValidPass123!",
    })
    assert login_res.status_code == 200
    refresh_token = login_res.cookies.get("refresh_token")
    assert refresh_token is not None

    # Call logout
    logout_res = client.post(
        "/api/auth/logout",
        cookies={"refresh_token": refresh_token},
    )
    assert logout_res.status_code == 200
    assert "revoked" in logout_res.json()["detail"]

    # Attempting to refresh with the revoked token must be rejected
    refresh_res = client.post(
        "/api/auth/refresh",
        cookies={"refresh_token": refresh_token},
    )
    assert refresh_res.status_code == 401
    assert "revoked" in refresh_res.json()["detail"].lower()


# ==============================================================================
# 16. Expired Authentication is Rejected
# ==============================================================================
def test_16_expired_authentication_rejected(client: TestClient, seed_test_data):
    # Create an expired token manually
    expired_token = create_access_token(
        payload_data={
            "sub": str(seed_test_data["student1"].id),
            "role": "student",
            "email": "student1@sih.gov.in",
        },
        expires_delta=timedelta(seconds=-60),  # expired 60 seconds ago
    )

    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert response.status_code == 401
    assert "expired" in response.json()["detail"].lower()
