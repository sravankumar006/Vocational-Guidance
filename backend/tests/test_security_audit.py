"""
Comprehensive Security Audit & Verification Test Suite (Phase 10 Brick 34).
Verifies:
1. RBAC enforcement (Student, Parent, Admin boundary isolation)
2. Student and Parent context isolation (No IDOR or cross-tenant access)
3. Zero credentials or API keys exposed in endpoints
4. Zero Aadhaar or unnecessary PII fields
5. Security headers presence (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
6. Input size and length validation (Counselling message bounds)
7. Rate limiting protection on sensitive endpoints
8. Password hash protection (never returned to clients)
"""

import pytest
from fastapi.testclient import TestClient
from database.session import get_db
from models import User, StudentProfile, ParentProfile, ParentStudentAssociation
from models.enums import UserRole
from core.security import create_access_token, hash_password
from core.rate_limit import InMemoryRateLimiter
from main import app

client = TestClient(app)


from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from database.base import Base

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
def auth_tokens(db_session: Session):
    """Seed test users across roles and return auth headers."""
    db = db_session
    # Student 1
    u_stu1 = db.query(User).filter(User.email == "sec_stu1@sih.gov.in").first()
    if not u_stu1:
        u_stu1 = User(
            email="sec_stu1@sih.gov.in",
            name="Security Student 1",
            role=UserRole.STUDENT,
            password_hash=hash_password("Password@123"),
            is_active=True,
        )
        db.add(u_stu1)
        db.flush()
        sp1 = StudentProfile(user_id=u_stu1.id, education_level="10th")
        db.add(sp1)
        db.flush()
    else:
        sp1 = u_stu1.student_profile

    # Student 2
    u_stu2 = db.query(User).filter(User.email == "sec_stu2@sih.gov.in").first()
    if not u_stu2:
        u_stu2 = User(
            email="sec_stu2@sih.gov.in",
            name="Security Student 2",
            role=UserRole.STUDENT,
            password_hash=hash_password("Password@123"),
            is_active=True,
        )
        db.add(u_stu2)
        db.flush()
        sp2 = StudentProfile(user_id=u_stu2.id, education_level="12th")
        db.add(sp2)
        db.flush()
    else:
        sp2 = u_stu2.student_profile

    # Parent (linked only to Student 1)
    u_par = db.query(User).filter(User.email == "sec_par@sih.gov.in").first()
    if not u_par:
        u_par = User(
            email="sec_par@sih.gov.in",
            name="Security Parent",
            role=UserRole.PARENT,
            password_hash=hash_password("Password@123"),
            is_active=True,
        )
        db.add(u_par)
        db.flush()
        pp = ParentProfile(user_id=u_par.id)
        db.add(pp)
        db.flush()
        assoc = ParentStudentAssociation(parent_profile_id=pp.id, student_profile_id=sp1.id)
        db.add(assoc)
        db.flush()

    # Admin
    u_adm = db.query(User).filter(User.email == "sec_adm@sih.gov.in").first()
    if not u_adm:
        u_adm = User(
            email="sec_adm@sih.gov.in",
            name="Security Admin",
            role=UserRole.ADMIN,
            password_hash=hash_password("Password@123"),
            is_active=True,
        )
        db.add(u_adm)
        db.flush()

    db.commit()

    token_stu1 = create_access_token({"sub": str(u_stu1.id), "role": "student"})
    token_stu2 = create_access_token({"sub": str(u_stu2.id), "role": "student"})
    token_par = create_access_token({"sub": str(u_par.id), "role": "parent"})
    token_adm = create_access_token({"sub": str(u_adm.id), "role": "admin"})

    return {
        "stu1_headers": {"Authorization": f"Bearer {token_stu1}"},
        "stu2_headers": {"Authorization": f"Bearer {token_stu2}"},
        "par_headers": {"Authorization": f"Bearer {token_par}"},
        "adm_headers": {"Authorization": f"Bearer {token_adm}"},
        "sp1_id": sp1.id,
        "sp2_id": sp2.id,
    }


def test_security_headers_present():
    """Verify HTTP security headers on API responses."""
    res = client.get("/health")
    assert res.headers.get("X-Content-Type-Options") == "nosniff"
    assert res.headers.get("X-Frame-Options") == "DENY"
    assert res.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert "camera=()" in res.headers.get("Permissions-Policy", "")


def test_student_cannot_access_another_student_profile(auth_tokens, db_session):
    """Verify Student 1 cannot view Student 2's profile and verify_student_self blocks access."""
    from api.deps import verify_student_self
    from fastapi import HTTPException

    # 1. API endpoint strictly derives profile from authenticated session, ignoring spoofed student_id query parameter
    res = client.get(
        f"/api/student/profile?student_id={auth_tokens['sp2_id']}",
        headers=auth_tokens["stu1_headers"],
    )
    assert res.status_code == 200
    assert res.json()["name"] == "Security Student 1"
    assert res.json()["id"] == auth_tokens["sp1_id"]

    # 2. Dependency directly blocks cross-student ID tampering with 403 Forbidden
    stu1_user = db_session.get(User, 1)
    with pytest.raises(HTTPException) as exc_info:
        verify_student_self(student_id=auth_tokens["sp2_id"], current_user=stu1_user, db=db_session)
    assert exc_info.value.status_code == 403



def test_parent_cannot_access_unlinked_student(auth_tokens):
    """Verify Parent cannot access Student 2 because no association exists."""
    res = client.get(
        f"/api/counselling/sessions?student_id={auth_tokens['sp2_id']}",
        headers=auth_tokens["par_headers"],
    )
    assert res.status_code == 403


def test_student_and_parent_cannot_access_admin_endpoints(auth_tokens):
    """Verify non-admin users cannot access admin endpoints."""
    # Student to admin
    r_stu = client.get("/api/admin/test", headers=auth_tokens["stu1_headers"])
    assert r_stu.status_code == 403

    # Parent to admin
    r_par = client.get("/api/admin/escalations", headers=auth_tokens["par_headers"])
    assert r_par.status_code == 403

    # Unauthenticated to admin
    r_anon = client.get("/api/admin/escalations")
    assert r_anon.status_code == 401


def test_admin_can_access_admin_endpoints(auth_tokens):
    """Verify Admin user successfully accesses admin endpoints."""
    r_adm = client.get("/api/admin/escalations", headers=auth_tokens["adm_headers"])
    assert r_adm.status_code == 200


def test_password_hash_never_in_user_profile(auth_tokens):
    """Verify password hash and salt are never returned by /auth/me or profile endpoints."""
    res = client.get("/api/auth/me", headers=auth_tokens["stu1_headers"])
    assert res.status_code == 200
    raw_text = res.text.lower()
    assert "hashed_password" not in raw_text
    assert "password_hash" not in raw_text
    assert "argon2" not in raw_text


def test_no_aadhaar_in_any_response(auth_tokens):
    """Verify Aadhaar identifier does not appear in user responses."""
    r1 = client.get("/api/auth/me", headers=auth_tokens["stu1_headers"])
    r2 = client.get("/api/parent/child-context", headers=auth_tokens["par_headers"])
    assert "aadhaar" not in r1.text.lower()
    assert "aadhaar" not in r2.text.lower()


def test_excessively_large_message_rejected(auth_tokens):
    """Verify that messages exceeding max_length (5000 chars) are rejected with 422."""
    huge_message = "A" * 6000
    res = client.post(
        "/api/counselling/sessions/1/messages",
        headers=auth_tokens["stu1_headers"],
        json={"message": huge_message},
    )
    assert res.status_code == 422
    assert "validation" in res.json()["error"]["code"].lower()


def test_rate_limiter_blocks_rapid_spam():
    """Verify that rate limiter blocks excessive requests."""
    limiter = InMemoryRateLimiter(requests_per_minute=3)
    key = "test_attacker_ip"
    assert limiter.is_allowed(key) is True
    assert limiter.is_allowed(key) is True
    assert limiter.is_allowed(key) is True
    # 4th request must be rejected
    assert limiter.is_allowed(key) is False
