"""
Tests for Admin Data Management API (A7 — Data Management).
Verifies:
1. Strict RBAC: Admin access granted; Student/Parent/Unauthenticated denied (401/403).
2. Global stats and form options endpoints.
3. CRUD for Courses, Occupations, Providers, Outcomes, Career Paths, and Sources.
4. Source traceability enforcement on verification (requires data_source_id).
5. Deactivation and reactivation workflows preserving database integrity.
6. Validation logic (e.g. salary ranges, placement rate 0-100%).
7. Search and status filtering.
8. Server-side pagination.
9. RAG knowledge base respects inactive status.
"""

from datetime import datetime, timedelta
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
    Course,
    Occupation,
    TrainingProvider,
    JobOutcome,
    CareerPath,
    DataSource,
)
from models.enums import UserRole, RecordStatus
from core.security import create_access_token, hash_password
from rag.knowledge_base import KnowledgeBase, KnowledgeType

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
def seed_data_env(db_session: Session):
    """Seed base users and initial catalog records."""
    db = db_session

    admin = User(
        email="admin_data@sih.gov.in",
        password_hash=hash_password("admin123"),
        role=UserRole.ADMIN,
        name="Admin Data Officer",
        is_active=True,
    )
    student = User(
        email="student_data@sih.gov.in",
        password_hash=hash_password("student123"),
        role=UserRole.STUDENT,
        name="Student User",
        is_active=True,
    )
    parent = User(
        email="parent_data@sih.gov.in",
        password_hash=hash_password("parent123"),
        role=UserRole.PARENT,
        name="Parent User",
        is_active=True,
    )
    db.add_all([admin, student, parent])
    db.commit()

    # Data Source
    source = DataSource(
        name="NCVET Official Qualification Register",
        source_type="Government Portal",
        url="https://nqr.gov.in",
        description="Authoritative national qualifications repository",
        version="2026.1",
        status=RecordStatus.VERIFIED.value,
    )
    db.add(source)
    db.commit()

    # Provider
    provider = TrainingProvider(
        name="Government ITI Hyderabad",
        location="Hyderabad, Telangana",
        provider_type="Government ITI",
        data_source_id=source.id,
        status=RecordStatus.DEMO.value,
    )
    db.add(provider)
    db.commit()

    # Occupation
    occ = Occupation(
        name="Solar PV Installation Technician",
        sector="Renewable Energy",
        description="Installs and maintains solar energy systems.",
        data_source_id=source.id,
        status=RecordStatus.DEMO.value,
    )
    db.add(occ)
    db.commit()

    # Course
    course = Course(
        name="Solar PV Installer Certification",
        duration="6 Months",
        qualification_level="NSQF Level 4",
        sector="Renewable Energy",
        delivery_mode="Classroom / Practical",
        provider_id=provider.id,
        data_source_id=source.id,
        status=RecordStatus.DEMO.value,
    )
    db.add(course)
    db.commit()

    # Career Path
    career_path = CareerPath(
        name="Renewable Energy Technician Ladder",
        description="Helper -> Technician -> Project Supervisor",
        estimated_duration="2-4 Years",
        data_source_id=source.id,
        status=RecordStatus.DEMO.value,
    )
    db.add(career_path)
    db.commit()

    # Job Outcome
    outcome = JobOutcome(
        occupation_id=occ.id,
        career_path_id=career_path.id,
        data_source_id=source.id,
        employment_rate=82.5,
        salary_range_min=18000,
        salary_range_max=35000,
        region="Telangana",
        status=RecordStatus.DEMO.value,
    )
    db.add(outcome)
    db.commit()

    return {
        "admin": admin,
        "student": student,
        "parent": parent,
        "source": source,
        "provider": provider,
        "occupation": occ,
        "course": course,
        "career_path": career_path,
        "outcome": outcome,
    }


def _auth_header(user: User) -> dict:
    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return {"Authorization": f"Bearer {token}"}


# -----------------------------------------------------------------------------
# 1. Authorization & RBAC
# -----------------------------------------------------------------------------

def test_admin_data_rbac_protection(seed_data_env):
    """Admin allowed; student/parent get 403; anon gets 401."""
    admin = seed_data_env["admin"]
    student = seed_data_env["student"]
    parent = seed_data_env["parent"]

    # Admin 200
    res = client.get("/api/admin/data/stats", headers=_auth_header(admin))
    assert res.status_code == 200

    # Student 403
    res_s = client.get("/api/admin/data/stats", headers=_auth_header(student))
    assert res_s.status_code == 403

    # Parent 403
    res_p = client.get("/api/admin/data/stats", headers=_auth_header(parent))
    assert res_p.status_code == 403

    # Anonymous 401
    res_a = client.get("/api/admin/data/stats")
    assert res_a.status_code == 401


# -----------------------------------------------------------------------------
# 2. Stats & Options
# -----------------------------------------------------------------------------

def test_admin_data_stats_and_options(seed_data_env):
    """Global stats and dropdown options are correctly populated."""
    admin = seed_data_env["admin"]
    headers = _auth_header(admin)

    # Stats
    res_stats = client.get("/api/admin/data/stats", headers=headers)
    assert res_stats.status_code == 200
    data_stats = res_stats.json()
    assert "courses" in data_stats
    assert data_stats["courses"]["total"] >= 1
    assert data_stats["occupations"]["total"] >= 1
    assert data_stats["sources"]["verified"] >= 1

    # Options
    res_opt = client.get("/api/admin/data/options", headers=headers)
    assert res_opt.status_code == 200
    data_opt = res_opt.json()
    assert len(data_opt["sources"]) >= 1
    assert len(data_opt["occupations"]) >= 1
    assert len(data_opt["providers"]) >= 1
    assert "Renewable Energy" in data_opt["sectors"]


# -----------------------------------------------------------------------------
# 3. Courses CRUD, Search, Filter, Verify, Deactivate, Reactivate
# -----------------------------------------------------------------------------

def test_course_crud_and_workflow(seed_data_env):
    admin = seed_data_env["admin"]
    source = seed_data_env["source"]
    provider = seed_data_env["provider"]
    headers = _auth_header(admin)

    # 1. Create Course
    create_payload = {
        "name": "Electric Vehicle Maintenance",
        "description": "Comprehensive EV powertrain diagnostic training.",
        "duration": "1 Year",
        "qualification_level": "NSQF Level 5",
        "sector": "Automotive",
        "delivery_mode": "Practical Workshop",
        "provider_id": provider.id,
        "data_source_id": source.id,
        "status": "unverified",
    }
    res_create = client.post("/api/admin/data/courses", json=create_payload, headers=headers)
    assert res_create.status_code == 201
    new_course = res_create.json()
    course_id = new_course["id"]
    assert new_course["name"] == "Electric Vehicle Maintenance"
    assert new_course["status"] == "unverified"

    # 2. Read Single Course
    res_get = client.get(f"/api/admin/data/courses/{course_id}", headers=headers)
    assert res_get.status_code == 200
    assert res_get.json()["id"] == course_id

    # 3. Update Course
    update_payload = {"duration": "18 Months"}
    res_update = client.put(f"/api/admin/data/courses/{course_id}", json=update_payload, headers=headers)
    assert res_update.status_code == 200
    assert res_update.json()["duration"] == "18 Months"

    # 4. Verify Course (Has source -> Success)
    res_verify = client.patch(f"/api/admin/data/courses/{course_id}/verify", headers=headers)
    assert res_verify.status_code == 200
    verified_data = res_verify.json()
    assert verified_data["status"] == "verified"
    assert verified_data["verified_by"] == admin.id
    assert verified_data["verified_at"] is not None

    # 5. Deactivate Course
    res_deact = client.patch(f"/api/admin/data/courses/{course_id}/deactivate", headers=headers)
    assert res_deact.status_code == 200
    assert res_deact.json()["status"] == "inactive"

    # 6. Reactivate Course
    res_react = client.patch(f"/api/admin/data/courses/{course_id}/reactivate", headers=headers)
    assert res_react.status_code == 200
    assert res_react.json()["status"] == "unverified"

    # 7. Search & Filter
    res_search = client.get("/api/admin/data/courses?q=Electric", headers=headers)
    assert res_search.status_code == 200
    assert res_search.json()["total"] >= 1


# -----------------------------------------------------------------------------
# 4. Source Traceability Enforcement
# -----------------------------------------------------------------------------

def test_source_traceability_enforced_on_verify(seed_data_env):
    """
    Section 21: A record without an associated data source CANNOT be verified.
    Returns HTTP 400: 'A source is required before this record can be verified.'
    """
    admin = seed_data_env["admin"]
    headers = _auth_header(admin)

    # Create unlinked occupation without source
    create_payload = {
        "name": "Unlinked Drone Operator",
        "description": "Drone mapping operations",
        "data_source_id": None,
        "status": "unverified",
    }
    res = client.post("/api/admin/data/occupations", json=create_payload, headers=headers)
    assert res.status_code == 201
    occ_id = res.json()["id"]

    # Attempt verify -> Must fail with 400
    res_v = client.patch(f"/api/admin/data/occupations/{occ_id}/verify", headers=headers)
    assert res_v.status_code == 400
    assert "source is required" in res_v.json()["detail"].lower()


# -----------------------------------------------------------------------------
# 5. Job Outcomes Validation (Salary Range & Percentage)
# -----------------------------------------------------------------------------

def test_job_outcome_validation_and_crud(seed_data_env):
    admin = seed_data_env["admin"]
    occ = seed_data_env["occupation"]
    source = seed_data_env["source"]
    headers = _auth_header(admin)

    # 1. Invalid placement rate (> 100%)
    res_bad_rate = client.post(
        "/api/admin/data/outcomes",
        json={"occupation_id": occ.id, "employment_rate": 150.0},
        headers=headers,
    )
    assert res_bad_rate.status_code == 422

    # 2. Invalid salary (max < min)
    res_bad_sal = client.post(
        "/api/admin/data/outcomes",
        json={"occupation_id": occ.id, "salary_range_min": 50000, "salary_range_max": 20000},
        headers=headers,
    )
    assert res_bad_sal.status_code == 422

    # 3. Valid creation
    res_valid = client.post(
        "/api/admin/data/outcomes",
        json={
            "occupation_id": occ.id,
            "data_source_id": source.id,
            "employment_rate": 88.0,
            "salary_range_min": 20000,
            "salary_range_max": 40000,
            "region": "Andhra Pradesh",
            "status": "unverified",
        },
        headers=headers,
    )
    assert res_valid.status_code == 201
    outcome_id = res_valid.json()["id"]

    # Verify workflow
    res_v = client.patch(f"/api/admin/data/outcomes/{outcome_id}/verify", headers=headers)
    assert res_v.status_code == 200
    assert res_v.json()["status"] == "verified"


# -----------------------------------------------------------------------------
# 6. Pagination & Bulk Data Integrity
# -----------------------------------------------------------------------------

def test_pagination_and_bulk_handling(seed_data_env):
    admin = seed_data_env["admin"]
    headers = _auth_header(admin)

    res = client.get("/api/admin/data/courses?page=1&page_size=1", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["page"] == 1
    assert body["page_size"] == 1
    assert len(body["items"]) == 1
    assert body["total"] >= 1
    assert body["total_pages"] >= 1


# -----------------------------------------------------------------------------
# 7. RAG Exclusion of Inactive Records
# -----------------------------------------------------------------------------

def test_rag_excludes_inactive_records(db_session: Session, seed_data_env):
    """
    Section 20: Inactive records are excluded from normal search and RAG retrieval.
    """
    db = db_session
    source = seed_data_env["source"]

    # Active course
    active_crs = Course(
        name="Active RAG Wind Turbine Tech",
        sector="Renewable Energy",
        data_source_id=source.id,
        status=RecordStatus.VERIFIED.value,
    )
    # Inactive course
    inactive_crs = Course(
        name="Decommissioned Obsolete Tech",
        sector="Outdated",
        data_source_id=source.id,
        status=RecordStatus.INACTIVE.value,
    )
    db.add_all([active_crs, inactive_crs])
    db.commit()

    # Load knowledge items through RAG service
    items = KnowledgeBase.load_all_items(db, types=[KnowledgeType.COURSE])
    titles = [item.title for item in items]

    assert "Active RAG Wind Turbine Tech" in titles
    assert "Decommissioned Obsolete Tech" not in titles


# -----------------------------------------------------------------------------
# 8. Occupations, Providers, Career Paths, and Sources Operations
# -----------------------------------------------------------------------------

def test_occupation_and_provider_workflows(seed_data_env):
    admin = seed_data_env["admin"]
    source = seed_data_env["source"]
    headers = _auth_header(admin)

    # 1. Provider CRUD
    res_p = client.post(
        "/api/admin/data/providers",
        json={
            "name": "PMKVY Training Center Warangal",
            "location": "Warangal, Telangana",
            "provider_type": "Accredited Private Partner",
            "data_source_id": source.id,
            "status": "unverified",
        },
        headers=headers,
    )
    assert res_p.status_code == 201
    prov_id = res_p.json()["id"]

    res_p_verify = client.patch(f"/api/admin/data/providers/{prov_id}/verify", headers=headers)
    assert res_p_verify.status_code == 200
    assert res_p_verify.json()["status"] == "verified"

    res_p_deact = client.patch(f"/api/admin/data/providers/{prov_id}/deactivate", headers=headers)
    assert res_p_deact.status_code == 200
    assert res_p_deact.json()["status"] == "inactive"

    # 2. Occupation Update & Reactivate
    occ = seed_data_env["occupation"]
    res_occ_up = client.put(
        f"/api/admin/data/occupations/{occ.id}",
        json={"sector": "Clean Tech & Renewable Energy"},
        headers=headers,
    )
    assert res_occ_up.status_code == 200
    assert res_occ_up.json()["sector"] == "Clean Tech & Renewable Energy"


def test_career_path_and_source_workflows(seed_data_env):
    admin = seed_data_env["admin"]
    headers = _auth_header(admin)

    # 1. Create Data Source
    res_s = client.post(
        "/api/admin/data/sources",
        json={
            "name": "State Skill Development Mission (SSDM) Portal",
            "source_type": "State Registry",
            "url": "https://ssdm.telangana.gov.in",
            "version": "2026.1",
            "status": "unverified",
        },
        headers=headers,
    )
    assert res_s.status_code == 201
    source_id = res_s.json()["id"]

    # Verify Source
    res_s_v = client.patch(f"/api/admin/data/sources/{source_id}/verify", headers=headers)
    assert res_s_v.status_code == 200
    assert res_s_v.json()["status"] == "verified"

    # 2. Career Path CRUD
    res_cp = client.post(
        "/api/admin/data/career-paths",
        json={
            "name": "Automotive Mechatronics Specialist Track",
            "description": "Apprentice -> Mechatronics Technician -> Master Technician",
            "estimated_duration": "3-5 Years",
            "data_source_id": source_id,
            "status": "unverified",
        },
        headers=headers,
    )
    assert res_cp.status_code == 201
    cp_id = res_cp.json()["id"]

    # Verify Career Path
    res_cp_v = client.patch(f"/api/admin/data/career-paths/{cp_id}/verify", headers=headers)
    assert res_cp_v.status_code == 200
    assert res_cp_v.json()["status"] == "verified"

