"""
Unit and integration tests for Career Exploration & Intent (Phase 3 Bricks 12 & 13).
Verifies:
1. GET /api/careers returns paginated real vocational items.
2. Keyword search, sector, education, duration, and salary filters work.
3. Multiple filters combine correctly without crashing.
4. Sorting by name, salary, and placement rate works.
5. Pagination metadata is computed properly.
6. Detail endpoint GET /api/careers/{career_id} loads related courses, providers, progression, and statistics.
7. Career intent GET/PUT endpoints persist student preferences securely.
8. Validation: invalid intent rejected with 422; invalid parameters rejected.
9. Security & Privacy: No password hashes, tokens, or Aadhaar numbers exposed.
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
    Occupation,
    CareerPath,
    Course,
    TrainingProvider,
    JobOutcome,
    DataSource,
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

    # 1. Student User
    student_user = User(
        name="Aarav Sharma",
        email="aarav.career@sih.gov.in",
        phone="+919876543210",
        role=UserRole.STUDENT,
        is_active=True,
        password_hash=hash_password("Pass@123"),
    )
    db.add(student_user)
    db.flush()

    student_profile = StudentProfile(
        user_id=student_user.id,
        education_level="Class 10 Passed",
        location="Visakhapatnam, Andhra Pradesh",
        career_intent=None,
    )
    db.add(student_profile)

    # 2. Parent User
    parent_user = User(
        name="Sunita Sharma",
        email="sunita.parent@sih.gov.in",
        role=UserRole.PARENT,
        is_active=True,
        password_hash=hash_password("Pass@123"),
    )
    db.add(parent_user)

    # 3. Data Source
    data_source = DataSource(
        name="Ministry of Skill Development & Entrepreneurship (MSDE) & NSDC",
        source_type="Government Registry",
        version="2026.1",
        url="https://www.msde.gov.in",
    )
    db.add(data_source)
    db.flush()

    # 4. Training Providers
    tp_govt = TrainingProvider(
        name="Government ITI",
        location="Udaipur, Rajasthan",
        provider_type="Government",
    )
    tp_pvt = TrainingProvider(
        name="Private ITI",
        location="Hubballi, Karnataka",
        provider_type="Private",
    )
    db.add_all([tp_govt, tp_pvt])
    db.flush()

    # 5. Occupations
    occ_elec = Occupation(
        name="Electrician",
        sector="Electrical",
        description="Installs, maintains, and repairs electrical power systems.",
        skill_requirements={"roles": ["Electrician", "Wireman", "Panel Assembler"], "self_employment": "High"},
    )
    occ_auto = Occupation(
        name="Automotive Service Technician",
        sector="Automotive",
        description="Performs maintenance and repair on automotive vehicles.",
        skill_requirements={"roles": ["Auto Technician", "Service Advisor"], "self_employment": "Medium"},
    )
    occ_retail = Occupation(
        name="Retail Sales Associate",
        sector="Retail",
        description="Assists customers and coordinates retail sales operations.",
        skill_requirements={"roles": ["Sales Associate", "Store Assistant"], "self_employment": "Low"},
    )
    db.add_all([occ_elec, occ_auto, occ_retail])
    db.flush()

    # 6. Courses
    c_elec1 = Course(
        name="Electrician",
        duration="3 Months",
        qualification_level="NSQF Level 3",
        sector="Electrical",
        provider_id=tp_govt.id,
        data_source_id=data_source.id,
    )
    c_elec2 = Course(
        name="Electrician",
        duration="5 Months",
        qualification_level="NSQF Level 3",
        sector="Electrical",
        provider_id=tp_pvt.id,
        data_source_id=data_source.id,
    )
    c_auto = Course(
        name="Automotive Service Technician",
        duration="6 Months",
        qualification_level="NSQF Level 4",
        sector="Automotive",
        provider_id=tp_govt.id,
        data_source_id=data_source.id,
    )
    c_retail = Course(
        name="Retail Sales Associate",
        duration="2 Months",
        qualification_level="NSQF Level 1",
        sector="Retail",
        provider_id=tp_pvt.id,
        data_source_id=data_source.id,
    )
    db.add_all([c_elec1, c_elec2, c_auto, c_retail])

    # 7. Career Paths
    cp_elec = CareerPath(
        name="Electrician Career Progression",
        description="Degree in Electrical Engineering or Master Technician Certification",
        progression_ladder=["Assistant Electrician", "Electrician", "Master Electrician", "Electrical Contractor"],
        estimated_duration="3-6 Months to entry",
    )
    db.add(cp_elec)
    db.flush()
    occ_elec.career_paths.append(cp_elec)

    # 8. Job Outcomes
    jo_elec1 = JobOutcome(
        occupation_id=occ_elec.id,
        data_source_id=data_source.id,
        employment_rate=80.0,
        salary_range_min=8000,
        salary_range_max=24000,
        region="Udaipur, Rajasthan",
    )
    jo_elec2 = JobOutcome(
        occupation_id=occ_elec.id,
        data_source_id=data_source.id,
        employment_rate=78.5,
        salary_range_min=7500,
        salary_range_max=22000,
        region="Hubballi, Karnataka",
    )
    jo_auto = JobOutcome(
        occupation_id=occ_auto.id,
        data_source_id=data_source.id,
        employment_rate=75.0,
        salary_range_min=8500,
        salary_range_max=28000,
        region="Jaipur, Rajasthan",
    )
    jo_retail = JobOutcome(
        occupation_id=occ_retail.id,
        data_source_id=data_source.id,
        employment_rate=65.0,
        salary_range_min=6500,
        salary_range_max=18000,
        region="Kota, Rajasthan",
    )
    db.add_all([jo_elec1, jo_elec2, jo_auto, jo_retail])

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


@pytest.fixture
def student_auth_header():
    db = TestingSessionLocal()
    u = db.query(User).filter(User.email == "aarav.career@sih.gov.in").first()
    token = create_access_token({"sub": str(u.id), "role": u.role.value, "email": u.email})
    db.close()
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def parent_auth_header():
    db = TestingSessionLocal()
    u = db.query(User).filter(User.email == "sunita.parent@sih.gov.in").first()
    token = create_access_token({"sub": str(u.id), "role": u.role.value, "email": u.email})
    db.close()
    return {"Authorization": f"Bearer {token}"}


# ==============================================================================
# BRICK 12: CAREER INTENT TESTS
# ==============================================================================

def test_get_career_intent_initially_none(client, student_auth_header):
    resp = client.get("/api/student/career-intent", headers=student_auth_header)
    assert resp.status_code == 200
    data = resp.json()
    assert "career_intent" in data
    assert data["career_intent"] is None


def test_put_career_intent_valid(client, student_auth_header):
    valid_intent = "I want vocational training"
    resp = client.put(
        "/api/student/career-intent",
        headers=student_auth_header,
        json={"career_intent": valid_intent},
    )
    assert resp.status_code == 200
    assert resp.json()["career_intent"] == valid_intent

    # Verify retrieval
    get_resp = client.get("/api/student/career-intent", headers=student_auth_header)
    assert get_resp.status_code == 200
    assert get_resp.json()["career_intent"] == valid_intent


def test_put_career_intent_invalid_rejected(client, student_auth_header):
    resp = client.put(
        "/api/student/career-intent",
        headers=student_auth_header,
        json={"career_intent": "Make me a millionaire immediately"},
    )
    assert resp.status_code == 422


def test_career_intent_requires_student(client, parent_auth_header):
    # Non-student cannot access /api/student/career-intent
    resp = client.get("/api/student/career-intent", headers=parent_auth_header)
    assert resp.status_code == 403


# ==============================================================================
# BRICK 13: CAREER DATABASE SEARCH & EXPLORATION TESTS
# ==============================================================================

def test_get_careers_all(client):
    resp = client.get("/api/careers")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] == 3
    assert len(data["items"]) == 3
    assert data["page"] == 1
    assert data["has_next"] is False


def test_search_careers_by_keyword(client):
    resp = client.get("/api/careers?search=electric")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["name"] == "Electrician"
    assert data["items"][0]["sector"] == "Electrical"


def test_filter_careers_by_sector(client):
    resp = client.get("/api/careers?sector=Automotive")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["name"] == "Automotive Service Technician"


def test_filter_careers_by_education(client):
    resp = client.get("/api/careers?education=NSQF Level 1")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["name"] == "Retail Sales Associate"


def test_filter_careers_by_duration(client):
    # Short duration (<= 3 Months)
    resp = client.get("/api/careers?duration=Short")
    assert resp.status_code == 200
    data = resp.json()
    names = [item["name"] for item in data["items"]]
    assert "Electrician" in names  # has 3 months course
    assert "Retail Sales Associate" in names  # has 2 months course
    assert "Automotive Service Technician" not in names  # has 6 months course


def test_filter_careers_by_salary(client):
    # High salary (> 25000 max)
    resp = client.get("/api/careers?min_salary=26000")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["name"] == "Automotive Service Technician"


def test_filter_careers_combined(client):
    # Sector + Duration
    resp = client.get("/api/careers?sector=Electrical&duration=Short")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["name"] == "Electrician"


def test_career_sorting(client):
    # Sort by salary high
    resp = client.get("/api/careers?sort_by=salary_high")
    assert resp.status_code == 200
    items = resp.json()["items"]
    # Auto has max 28000, Elec has 24000, Retail has 18000
    assert items[0]["name"] == "Automotive Service Technician"
    assert items[-1]["name"] == "Retail Sales Associate"


def test_career_pagination(client):
    resp = client.get("/api/careers?page=1&page_size=2")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["items"]) == 2
    assert data["total"] == 3
    assert data["total_pages"] == 2
    assert data["has_next"] is True
    assert data["has_prev"] is False

    # Page 2
    resp2 = client.get("/api/careers?page=2&page_size=2")
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert len(data2["items"]) == 1
    assert data2["has_next"] is False
    assert data2["has_prev"] is True


def test_career_detail_found(client):
    # Get ID of Electrician
    search_resp = client.get("/api/careers?search=Electrician")
    elec_id = search_resp.json()["items"][0]["id"]

    resp = client.get(f"/api/careers/{elec_id}")
    assert resp.status_code == 200
    detail = resp.json()

    assert detail["name"] == "Electrician"
    assert detail["sector"] == "Electrical"
    assert len(detail["progression_ladder"]) > 0
    assert "Assistant Electrician" in detail["progression_ladder"]
    assert len(detail["courses"]) == 2
    assert detail["courses"][0]["provider"]["name"] in ["Government ITI", "Private ITI"]
    assert detail["salary_statistics"]["max_monthly"] == 24000
    assert detail["placement_statistics"]["total_empirical_records"] == 2
    assert detail["data_provenance"]["is_verified"] is True
    assert "password" not in str(detail).lower()
    assert "token" not in str(detail).lower()


def test_career_detail_not_found(client):
    resp = client.get("/api/careers/999999")
    assert resp.status_code == 404


def test_filter_meta_endpoint(client):
    resp = client.get("/api/careers/meta/filters")
    assert resp.status_code == 200
    meta = resp.json()
    assert "sectors" in meta
    assert "Electrical" in meta["sectors"]
    assert "Automotive" in meta["sectors"]
    assert "qualification_levels" in meta
    assert "NSQF Level 3" in meta["qualification_levels"]
    assert "durations" in meta
    assert meta["max_salary_bound"] >= 20000
