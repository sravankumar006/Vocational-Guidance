"""Basic test for authentication router mounting and endpoint sanity."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database.base import Base
from database.session import get_db
from models import User
from models.enums import UserRole
from core.security import hash_password
from main import app

engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    pw = hash_password("ValidPassword123!")

    # Student
    session.add(User(
        name="Aarav Sharma",
        email="student@sih.gov.in",
        phone="+919876543210",
        role=UserRole.STUDENT,
        is_active=True,
        password_hash=pw,
    ))
    # Parent
    session.add(User(
        name="Sunita Sharma",
        email="parent@sih.gov.in",
        phone="+919876543211",
        role=UserRole.PARENT,
        is_active=True,
        password_hash=pw,
    ))
    # Admin
    session.add(User(
        name="Dr. Rajesh Verma",
        email="admin@sih.gov.in",
        phone="+919876543212",
        role=UserRole.ADMIN,
        is_active=True,
        password_hash=pw,
    ))
    session.commit()
    session.close()

    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    def _override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = _override_get_db
    test_client = TestClient(app)
    yield test_client
    app.dependency_overrides.clear()


def test_auth_placeholder(client: TestClient):
    response = client.get("/api/auth/")
    assert response.status_code == 200
    assert response.json() == {"module": "auth", "status": "mounted"}


def test_login_student(client: TestClient):
    response = client.post("/api/auth/login", json={
        "identifier": "student@sih.gov.in",
        "password": "ValidPassword123!",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "student"
    assert data["user"]["name"] == "Aarav Sharma"


def test_login_parent(client: TestClient):
    response = client.post("/api/auth/login", json={
        "identifier": "parent@sih.gov.in",
        "password": "ValidPassword123!",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["role"] == "parent"
    assert data["user"]["name"] == "Sunita Sharma"


def test_login_admin(client: TestClient):
    response = client.post("/api/auth/login", json={
        "identifier": "admin@sih.gov.in",
        "password": "ValidPassword123!",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["role"] == "admin"
    assert data["user"]["name"] == "Dr. Rajesh Verma"


def test_protected_me_endpoint(client: TestClient):
    # Calling /me without token fails
    unauth_res = client.get("/api/auth/me")
    assert unauth_res.status_code == 401

    # Login to get valid token
    login_res = client.post("/api/auth/login", json={
        "identifier": "student@sih.gov.in",
        "password": "ValidPassword123!",
    })
    token = login_res.json()["access_token"]

    # Calling with valid token succeeds
    auth_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert auth_res.status_code == 200
    assert auth_res.json()["role"] == "student"
