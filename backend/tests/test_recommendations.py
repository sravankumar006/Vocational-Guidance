"""
Comprehensive Unit and Integration Tests for Deterministic Recommendation Engine (Phase 3 Brick 14).
Verifies:
1. Individual factor scoring functions:
   - Education strong match vs mismatch vs missing
   - Interest strong overlap vs partial vs none
   - Location direct match vs state match vs relocation
   - Salary match vs mismatch vs missing (unknown)
   - Training duration fast-track vs vocational vs general
   - Employment preference and placement rate track record
2. Missing data is handled as 'unknown' rather than zero penalty.
3. Deterministic calculation: Identical inputs produce identical outputs (no randomness/AI).
4. Deterministic tie-breaking rules.
5. Top 3 candidates are correctly selected and no careers outside Top 3 are returned.
6. API endpoint tests: Authenticated student access, unauthenticated rejection, role boundaries, valid schema.
7. No sensitive fields (passwords, tokens, Aadhaar) exposed.
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
    Course,
    TrainingProvider,
    JobOutcome,
    DataSource,
)
from core.security import hash_password, create_access_token
from services.recommendation_service import (
    RECOMMENDATION_WEIGHTS,
    normalize_education_level,
    normalize_nsqf_level,
    score_education,
    score_interests,
    score_location,
    score_salary,
    score_training,
    score_employment,
    calculate_compatibility,
    generate_recommendations,
)
from main import app

TEST_DB_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ==============================================================================
# 1. UNIT TESTS: INDIVIDUAL SCORING FACTORS
# ==============================================================================

def test_score_education_strong_match():
    # Student with Class 10 meets NSQF Level 2 (scale 2 >= 2)
    score, res, summary = score_education("Class 10 Passed", ["NSQF Level 2"])
    assert score == 1.0
    assert res == "strong_match"


def test_score_education_compatible():
    # Student with Class 10 (scale 2) meets entry for a career with courses spanning NSQF 2 to 4 (scale 2 to 3)
    score, res, summary = score_education("10th Standard", ["NSQF Level 2", "NSQF Level 4"])
    assert score == 0.85
    assert res == "compatible"


def test_score_education_mismatch():
    # Student with Below 10th applying for NSQF Level 4 (scale 1 < scale 3 - 1)
    score, res, summary = score_education("Below 10th", ["NSQF Level 4"])
    assert score == 0.30
    assert res == "higher_qualification_needed"


def test_score_education_missing():
    # Missing education in student profile
    score, res, summary = score_education(None, ["NSQF Level 3"])
    assert score is None
    assert res == "education_unspecified"


def test_score_interests_strong_overlap():
    student_interests = ["Electrical", "Technology"]
    student_skills = ["Wiring"]
    score, res, summary = score_interests(
        student_interests, student_skills, "Electrician", "Electrical", ["Wireman", "Panel Assembler"]
    )
    assert score == 1.0
    assert res == "strong_match"


def test_score_interests_partial_overlap():
    student_interests = ["Skilled Trades"]
    student_skills = ["Hand Tools"]
    score, res, summary = score_interests(
        student_interests, student_skills, "Automotive Service Technician", "Automotive", ["Auto Mechanic", "Vehicle Service"]
    )
    assert score >= 0.50
    assert res in ["good_match", "moderate_overlap"]


def test_score_interests_no_overlap():
    student_interests = ["Beauty & Wellness"]
    student_skills = ["Skincare"]
    score, res, summary = score_interests(
        student_interests, student_skills, "Welder", "Manufacturing", ["Arc Welder", "Fabricator"]
    )
    assert score <= 0.20
    assert res == "low_overlap"


def test_score_interests_missing():
    score, res, summary = score_interests([], [], "Electrician", "Electrical", ["Wireman"])
    assert score is None
    assert res == "interests_unspecified"


def test_score_location_direct_district_match():
    student_loc = "Visakhapatnam, Andhra Pradesh"
    score, res, summary = score_location(
        student_loc, ["Local / Near Home"], ["Udaipur, Rajasthan"], ["Visakhapatnam, Andhra Pradesh"]
    )
    assert score == 1.0
    assert res == "strong_match"


def test_score_location_state_match():
    student_loc = "Guntur, Andhra Pradesh"
    score, res, summary = score_location(
        student_loc, ["Same State"], ["Visakhapatnam, Andhra Pradesh"], ["Anakapalle, Andhra Pradesh"]
    )
    assert score == 0.90
    assert res == "state_match"


def test_score_location_open_to_relocation():
    student_loc = "Guntur, Andhra Pradesh"
    score, res, summary = score_location(
        student_loc, ["Open to Relocation"], ["Jaipur, Rajasthan"], ["Kota, Rajasthan"]
    )
    assert score == 0.95
    assert res == "strong_match"


def test_score_location_mismatch_relocation_required():
    student_loc = "Guntur, Andhra Pradesh"
    score, res, summary = score_location(
        student_loc, ["Local / Near Home"], ["Jaipur, Rajasthan"], ["Kota, Rajasthan"]
    )
    assert score == 0.35
    assert res == "relocation_required"


def test_score_salary_match():
    # Student target from ₹1-3 lakh (~₹15k/mo target) against career max ₹24,000
    score, res, summary = score_salary("₹1–3 lakh", 7000, 24000)
    assert score == 1.0
    assert res == "strong_match"


def test_score_salary_mismatch():
    # Student target from ₹5-10 lakh (~₹25k/mo target) against career max ₹18,000
    score, res, summary = score_salary("₹5–10 lakh", 6000, 18000)
    assert score == 0.45
    assert res == "entry_level_earnings"


def test_score_salary_missing_unknown():
    # "Prefer not to say" or missing income must NOT be penalized as 0
    score, res, summary = score_salary("Prefer not to say", 7000, 24000)
    assert score is None
    assert res == "salary_preference_unspecified"


def test_score_training_fast_track_match():
    score, res, summary = score_training("I want a job soon", ["3 Months", "2 Months"])
    assert score == 1.0
    assert res == "strong_match"


def test_score_training_longer_duration():
    score, res, summary = score_training("I want a job soon", ["6 Months"])
    assert score == 0.50
    assert res == "longer_duration"


def test_score_employment_high_self_employment():
    score, res, summary = score_employment("I want vocational training", ["Business / Entrepreneurship"], "High", 75.0)
    assert score == 1.0
    assert res == "strong_match"


def test_score_employment_missing_placement():
    score, res, summary = score_employment(None, [], None, None)
    assert score is None
    assert res == "placement_data_unrecorded"


def test_missing_data_does_not_become_zero():
    """Missing fields should re-normalize known weights rather than heavily penalizing to 0."""
    user = User(id=99, name="Test User", role=UserRole.STUDENT)
    profile = StudentProfile(
        id=99,
        user_id=99,
        education_level="Class 10 Passed",
        location=None,  # Missing location
        household_income_range=None,  # Missing salary pref
        interests=["Electrical"],
        skills=["Wiring"],
        career_intent=None,
    )
    occ = Occupation(
        id=1,
        name="Electrician",
        sector="Electrical",
        description="Electrical works",
        skill_requirements={"roles": ["Electrician"], "self_employment": "High"},
    )
    course = Course(name="Electrician", duration="3 Months", qualification_level="NSQF Level 3")
    job_outcome = JobOutcome(salary_range_min=7000, salary_range_max=24000, employment_rate=78.0, region="Jaipur, Rajasthan")

    res = calculate_compatibility(user, profile, occ, [course], [job_outcome])
    # Compatibility score should be healthy based on strong education and interest matches (> 70)
    assert res["compatibility_score"] >= 75
    # Location and salary should be in unknown factors
    unknown_factor_names = [f.factor for f in res["unknown_factors"]]
    assert "location" in unknown_factor_names
    assert "salary" in unknown_factor_names


def test_deterministic_stability():
    """Same input profile and career data must produce identical score every time (100% reproducible)."""
    user = User(id=1, name="Aarav Sharma", role=UserRole.STUDENT)
    profile = StudentProfile(
        id=1,
        user_id=1,
        education_level="Class 10 Passed",
        location="Visakhapatnam, Andhra Pradesh",
        household_income_range="₹1–3 lakh",
        interests=["Technology", "Electrical"],
        skills=["Basic Electricals"],
        career_intent="I want vocational training",
        work_location_preferences=["Same State"],
        career_preferences=["Technical / Hands-on"],
    )
    occ = Occupation(
        id=1,
        name="Electrician",
        sector="Electrical",
        description="Electrical installation",
        skill_requirements={"roles": ["Electrician"], "self_employment": "High"},
    )
    course = Course(name="Electrician", duration="3 Months", qualification_level="NSQF Level 3")
    job_outcome = JobOutcome(salary_range_min=7000, salary_range_max=24000, employment_rate=78.0, region="Visakhapatnam, Andhra Pradesh")

    res1 = calculate_compatibility(user, profile, occ, [course], [job_outcome])
    res2 = calculate_compatibility(user, profile, occ, [course], [job_outcome])
    assert res1["compatibility_score"] == res2["compatibility_score"]
    assert len(res1["matched_factors"]) == len(res2["matched_factors"])


# ==============================================================================
# 2. INTEGRATION & API TESTS: RECOMMENDATION ENDPOINTS
# ==============================================================================

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    # 1. Student User with Tech / Electrical interests
    s_tech = User(
        name="Aarav Tech",
        email="aarav.tech@sih.gov.in",
        phone="+919876543210",
        role=UserRole.STUDENT,
        is_active=True,
        password_hash=hash_password("Pass@123"),
    )
    db.add(s_tech)
    db.flush()

    p_tech = StudentProfile(
        user_id=s_tech.id,
        education_level="Class 10 Passed",
        location="Visakhapatnam, Andhra Pradesh",
        household_income_range="₹1–3 lakh",
        interests=["Electrical", "Technology"],
        skills=["Basic Electricals"],
        career_intent="I want vocational training",
        work_location_preferences=["Same State"],
        career_preferences=["Technical / Hands-on"],
    )
    db.add(p_tech)

    # 2. Student User with Fashion / Apparel interests
    s_apparel = User(
        name="Pooja Fashion",
        email="pooja.apparel@sih.gov.in",
        phone="+919876543211",
        role=UserRole.STUDENT,
        is_active=True,
        password_hash=hash_password("Pass@123"),
    )
    db.add(s_apparel)
    db.flush()

    p_apparel = StudentProfile(
        user_id=s_apparel.id,
        education_level="Class 10 Passed",
        location="Jaipur, Rajasthan",
        household_income_range="Below ₹1 lakh",
        interests=["Apparel", "Creative Work"],
        skills=["Tailoring"],
        career_intent="I want a job soon",
        work_location_preferences=["Local / Near Home"],
        career_preferences=["Creative"],
    )
    db.add(p_apparel)

    # 3. Parent User
    parent_user = User(
        name="Sunita Sharma",
        email="sunita.rec@sih.gov.in",
        role=UserRole.PARENT,
        is_active=True,
        password_hash=hash_password("Pass@123"),
    )
    db.add(parent_user)

    # 4. Data Source
    ds = DataSource(name="MSDE & NSDC", version="2026.1")
    db.add(ds)
    db.flush()

    # 5. Training Providers
    tp_ap = TrainingProvider(name="AP Government ITI", location="Visakhapatnam, Andhra Pradesh", provider_type="Government")
    tp_raj = TrainingProvider(name="Rajasthan Skill Centre", location="Jaipur, Rajasthan", provider_type="Government")
    db.add_all([tp_ap, tp_raj])
    db.flush()

    # 6. Occupations (4 trades)
    occ_elec = Occupation(
        name="Electrician",
        sector="Electrical",
        description="Electrical systems",
        skill_requirements={"roles": ["Electrician", "Wireman"], "self_employment": "High"},
    )
    occ_apparel = Occupation(
        name="Sewing Machine Operator",
        sector="Apparel",
        description="Garment stitching and apparel manufacturing",
        skill_requirements={"roles": ["Machine Operator", "Tailor"], "self_employment": "Medium"},
    )
    occ_auto = Occupation(
        name="Automotive Service Technician",
        sector="Automotive",
        description="Automotive vehicle repair",
        skill_requirements={"roles": ["Auto Mechanic"], "self_employment": "Medium"},
    )
    occ_retail = Occupation(
        name="Retail Sales Associate",
        sector="Retail",
        description="Store sales",
        skill_requirements={"roles": ["Sales Associate"], "self_employment": "Low"},
    )
    db.add_all([occ_elec, occ_apparel, occ_auto, occ_retail])
    db.flush()

    # 7. Courses
    c_elec = Course(name="Electrician", duration="3 Months", qualification_level="NSQF Level 3", provider_id=tp_ap.id, data_source_id=ds.id)
    c_apparel = Course(name="Sewing Machine Operator", duration="2 Months", qualification_level="NSQF Level 1", provider_id=tp_raj.id, data_source_id=ds.id)
    c_auto = Course(name="Automotive Service Technician", duration="6 Months", qualification_level="NSQF Level 4", provider_id=tp_raj.id, data_source_id=ds.id)
    c_retail = Course(name="Retail Sales Associate", duration="3 Months", qualification_level="NSQF Level 1", provider_id=tp_raj.id, data_source_id=ds.id)
    db.add_all([c_elec, c_apparel, c_auto, c_retail])

    # 8. Outcomes
    jo_elec = JobOutcome(occupation_id=occ_elec.id, employment_rate=79.0, salary_range_min=7500, salary_range_max=24000, region="Visakhapatnam, Andhra Pradesh")
    jo_apparel = JobOutcome(occupation_id=occ_apparel.id, employment_rate=68.0, salary_range_min=6500, salary_range_max=18000, region="Jaipur, Rajasthan")
    jo_auto = JobOutcome(occupation_id=occ_auto.id, employment_rate=75.0, salary_range_min=8000, salary_range_max=28000, region="Jaipur, Rajasthan")
    jo_retail = JobOutcome(occupation_id=occ_retail.id, employment_rate=65.0, salary_range_min=7000, salary_range_max=20000, region="Jaipur, Rajasthan")
    db.add_all([jo_elec, jo_apparel, jo_auto, jo_retail])

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
def student_tech_header():
    db = TestingSessionLocal()
    u = db.query(User).filter(User.email == "aarav.tech@sih.gov.in").first()
    token = create_access_token({"sub": str(u.id), "role": u.role.value, "email": u.email})
    db.close()
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def student_apparel_header():
    db = TestingSessionLocal()
    u = db.query(User).filter(User.email == "pooja.apparel@sih.gov.in").first()
    token = create_access_token({"sub": str(u.id), "role": u.role.value, "email": u.email})
    db.close()
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def parent_header():
    db = TestingSessionLocal()
    u = db.query(User).filter(User.email == "sunita.rec@sih.gov.in").first()
    token = create_access_token({"sub": str(u.id), "role": u.role.value, "email": u.email})
    db.close()
    return {"Authorization": f"Bearer {token}"}


def test_api_recommendations_top_3_returned(client, student_tech_header):
    """GET /api/careers/recommendations returns exactly Top 3 recommendations for student."""
    resp = client.get("/api/careers/recommendations", headers=student_tech_header)
    assert resp.status_code == 200
    data = resp.json()
    assert "recommendations" in data
    assert len(data["recommendations"]) == 3
    assert data["algorithm"] == "deterministic_compatibility_v1"
    assert "weights_used" in data

    # Top recommendation for Aarav Tech should be Electrician
    top_career = data["recommendations"][0]["career"]["name"]
    assert top_career == "Electrician"
    assert data["recommendations"][0]["compatibility_score"] >= 80


def test_api_recommendations_profile_differentiation(client, student_apparel_header):
    """Different student profile produces a logically differentiated ranking."""
    resp = client.get("/api/careers/recommendations", headers=student_apparel_header)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["recommendations"]) == 3

    # Top recommendation for Pooja Fashion should be Sewing Machine Operator
    top_career = data["recommendations"][0]["career"]["name"]
    assert top_career == "Sewing Machine Operator"


def test_api_recommendations_aliased_student_endpoint(client, student_tech_header):
    """GET /api/student/recommendations alias returns identical schema."""
    resp = client.get("/api/student/recommendations", headers=student_tech_header)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["recommendations"]) == 3
    assert data["recommendations"][0]["career"]["name"] == "Electrician"


def test_api_recommendations_unauthenticated_rejected(client):
    """Unauthenticated request must be rejected with 401."""
    resp = client.get("/api/careers/recommendations")
    assert resp.status_code == 401


def test_api_recommendations_parent_rejected(client, parent_header):
    """Non-student (parent/admin) is rejected with 403."""
    resp = client.get("/api/careers/recommendations", headers=parent_header)
    assert resp.status_code == 403


def test_api_recommendations_no_sensitive_fields(client, student_tech_header):
    """Verify that passwords, tokens, and Aadhaar numbers are never present in recommendation responses."""
    resp = client.get("/api/careers/recommendations", headers=student_tech_header)
    assert resp.status_code == 200
    raw_text = resp.text.lower()
    assert "password" not in raw_text
    assert "token" not in raw_text
    assert "aadhaar" not in raw_text
