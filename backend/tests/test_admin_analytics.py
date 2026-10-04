"""
Tests for Admin Analytics API (A2 — Admin Analytics).
Verifies:
1. Strict RBAC: Admin access granted; Student/Parent/Unauthenticated denied (401/403).
2. GET /api/admin/analytics returns aggregated counselling volume, concerns, resistance, escalations, sentiment.
3. Sub-endpoints (/overview, /counselling, /concerns, /resistance, /escalations, /sentiment) enforce admin role.
4. Real database aggregation (sessions, messages, concerns, escalations, sentiment).
5. Accurate canonical concern category percentages.
6. Accurate escalation status, priority, career, and language breakdowns.
7. Accurate parent resistance insights without fabricated scores.
8. Accurate sentiment handling: "No sentiment data available yet." when empty, genuine distribution when present.
9. Server-side date range filtering (7d, 30d, all, custom valid dates, custom invalid dates rejection).
10. Career, concern, and language filtering.
11. Privacy: No PII, passwords, or raw message conversation bodies exposed.
"""

import re
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
    StudentProfile,
    ParentProfile,
    Occupation,
    CounsellingSession,
    CounsellingMessage,
    ParentConcern,
    HumanEscalation,
    SentimentEvent,
)
from models.enums import (
    UserRole,
    SessionStatus,
    EscalationPriority,
    EscalationStatus,
    ConcernSeverity,
    ConcernStatus,
    MessageSenderType,
    SentimentType,
)
from core.security import create_access_token, hash_password

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
def seed_analytics_data(db_session: Session):
    """Populates realistic database entities across all analytics models."""
    db = db_session

    # 1. Users & Profiles
    admin_user = User(
        email="admin@sih.gov.in",
        password_hash=hash_password("admin123"),
        role=UserRole.ADMIN,
        name="Admin Lead",
        is_active=True,
    )
    student_user = User(
        email="student@sih.gov.in",
        password_hash=hash_password("student123"),
        role=UserRole.STUDENT,
        name="Aarav Sharma",
        is_active=True,
    )
    parent_user = User(
        email="parent@sih.gov.in",
        password_hash=hash_password("parent123"),
        role=UserRole.PARENT,
        name="Sunita Sharma",
        is_active=True,
    )
    db.add_all([admin_user, student_user, parent_user])
    db.commit()

    student_profile = StudentProfile(
        user_id=student_user.id,
        education_level="Class 10 Passed",
        location="Hyderabad, Telangana",
    )
    parent_profile = ParentProfile(
        user_id=parent_user.id,
        occupation="School Teacher",
        relationship_to_student="Mother",
    )
    db.add_all([student_profile, parent_profile])
    db.commit()

    # 2. Occupation
    occ1 = Occupation(
        name="Automotive Service Technician",
        sector="Automotive",
        description="Vehicle maintenance specialist",
    )
    occ2 = Occupation(
        name="Solar PV Installation Technician",
        sector="Renewable Energy",
        description="Renewable solar installation engineer",
    )
    db.add_all([occ1, occ2])
    db.commit()

    # 3. Counselling Sessions & Messages
    now = datetime.utcnow()
    sess1 = CounsellingSession(
        student_profile_id=student_profile.id,
        status=SessionStatus.ACTIVE,
        started_at=now - timedelta(days=2),
    )
    sess2 = CounsellingSession(
        student_profile_id=student_profile.id,
        status=SessionStatus.COMPLETED,
        started_at=now - timedelta(days=10),
        ended_at=now - timedelta(days=10, hours=-1),
    )
    db.add_all([sess1, sess2])
    db.commit()

    msg1 = CounsellingMessage(
        session_id=sess1.id,
        sender_type=MessageSenderType.STUDENT,
        content="I want to learn automotive electronics.",
        created_at=now - timedelta(days=2),
    )
    msg2 = CounsellingMessage(
        session_id=sess1.id,
        sender_type=MessageSenderType.AI,
        content="Automotive electronics is a high-growth career in Telangana.",
        created_at=now - timedelta(days=2),
    )
    msg3 = CounsellingMessage(
        session_id=sess2.id,
        sender_type=MessageSenderType.PARENT,
        content="What about income security?",
        created_at=now - timedelta(days=10),
    )
    db.add_all([msg1, msg2, msg3])
    db.commit()

    # 4. Parent Concerns (Canonical categories)
    c1 = ParentConcern(
        parent_profile_id=parent_profile.id,
        student_profile_id=student_profile.id,
        counselling_session_id=sess1.id,
        concern_type="Income",
        description="Starting salary might be modest",
        severity=ConcernSeverity.HIGH,
        status=ConcernStatus.OPEN,
        created_at=now - timedelta(days=2),
    )
    c2 = ParentConcern(
        parent_profile_id=parent_profile.id,
        student_profile_id=student_profile.id,
        counselling_session_id=sess1.id,
        concern_type="Job Security",
        description="Contract stability concerns",
        severity=ConcernSeverity.MEDIUM,
        status=ConcernStatus.OPEN,
        created_at=now - timedelta(days=3),
    )
    c3 = ParentConcern(
        parent_profile_id=parent_profile.id,
        student_profile_id=student_profile.id,
        counselling_session_id=sess2.id,
        concern_type="Social Perception",
        description="Relatives look down upon vocational tracks",
        severity=ConcernSeverity.MEDIUM,
        status=ConcernStatus.RESOLVED,
        created_at=now - timedelta(days=10),
    )
    db.add_all([c1, c2, c3])
    db.commit()

    # 5. Human Escalations
    esc1 = HumanEscalation(
        counselling_session_id=sess1.id,
        student_id=student_profile.id,
        parent_id=parent_profile.id,
        career_id=occ1.id,
        concern="Income",
        language="te",
        priority=EscalationPriority.HIGH,
        status=EscalationStatus.PENDING,
        created_at=now - timedelta(days=2),
    )
    esc2 = HumanEscalation(
        counselling_session_id=sess2.id,
        student_id=student_profile.id,
        parent_id=parent_profile.id,
        career_id=occ2.id,
        concern="Job Security",
        language="en",
        priority=EscalationPriority.MEDIUM,
        status=EscalationStatus.RESOLVED,
        resolved_at=now - timedelta(days=9),
        created_at=now - timedelta(days=10),
    )
    db.add_all([esc1, esc2])
    db.commit()

    return {
        "admin": admin_user,
        "student": student_user,
        "parent": parent_user,
        "occ1": occ1,
        "occ2": occ2,
        "sess1": sess1,
        "sess2": sess2,
    }


def _auth_header(user: User) -> dict:
    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return {"Authorization": f"Bearer {token}"}


# -------------------------------------------------------------------------
# Test Cases
# -------------------------------------------------------------------------

def test_admin_analytics_rbac_protection(db_session, seed_analytics_data):
    """
    1. /admin/analytics loads for Admin.
    2. Student cannot access analytics (403).
    3. Parent cannot access analytics (403).
    4. Unauthenticated cannot access analytics (401).
    """
    admin = seed_analytics_data["admin"]
    student = seed_analytics_data["student"]
    parent = seed_analytics_data["parent"]

    # Admin: Success 200
    res_admin = client.get("/api/admin/analytics", headers=_auth_header(admin))
    assert res_admin.status_code == 200
    data = res_admin.json()
    assert "summary" in data
    assert "volume" in data
    assert "concerns" in data
    assert "resistance" in data
    assert "escalations" in data
    assert "sentiment" in data

    # Student: Forbidden 403
    res_student = client.get("/api/admin/analytics", headers=_auth_header(student))
    assert res_student.status_code == 403

    # Parent: Forbidden 403
    res_parent = client.get("/api/admin/analytics", headers=_auth_header(parent))
    assert res_parent.status_code == 403

    # Unauthenticated: Unauthorized 401
    res_unauth = client.get("/api/admin/analytics")
    assert res_unauth.status_code == 401


def test_modular_analytics_endpoints_rbac(db_session, seed_analytics_data):
    """Sub-endpoints must strictly enforce Admin role."""
    admin = seed_analytics_data["admin"]
    student = seed_analytics_data["student"]

    endpoints = [
        "/api/admin/analytics/overview",
        "/api/admin/analytics/counselling",
        "/api/admin/analytics/concerns",
        "/api/admin/analytics/resistance",
        "/api/admin/analytics/escalations",
        "/api/admin/analytics/sentiment",
    ]

    for ep in endpoints:
        res = client.get(ep, headers=_auth_header(admin))
        assert res.status_code == 200, f"Failed for admin on {ep}"

        res_stud = client.get(ep, headers=_auth_header(student))
        assert res_stud.status_code == 403, f"Expected 403 for student on {ep}"


def test_counselling_volume_aggregation(db_session, seed_analytics_data):
    """Verifies counselling volume counts and activity trends use real DB aggregation."""
    admin = seed_analytics_data["admin"]
    res = client.get("/api/admin/analytics?date_range=30d", headers=_auth_header(admin))
    assert res.status_code == 200
    vol = res.json()["volume"]

    assert vol["total_sessions"] == 2
    assert vol["total_messages"] == 3
    assert len(vol["activity_trends"]) > 0
    # Check trend structure
    trend = vol["activity_trends"][0]
    assert "date" in trend
    assert "sessions" in trend
    assert "messages" in trend


def test_parent_concern_counts_and_canonical_categories(db_session, seed_analytics_data):
    """Verifies parent concern counts and canonical categories percentages."""
    admin = seed_analytics_data["admin"]
    res = client.get("/api/admin/analytics?date_range=30d", headers=_auth_header(admin))
    assert res.status_code == 200
    concerns = res.json()["concerns"]

    assert concerns["total_concerns"] == 3
    categories = concerns["categories"]
    cat_map = {c["category"]: c for c in categories}

    # Verify canonical categories are present
    assert "Income" in cat_map
    assert "Job Security" in cat_map
    assert "Social Perception" in cat_map
    assert "Distance" in cat_map

    # Counts
    assert cat_map["Income"]["count"] == 1
    assert cat_map["Job Security"]["count"] == 1
    assert cat_map["Social Perception"]["count"] == 1
    assert cat_map["Distance"]["count"] == 0

    # Percentages: 1/3 = 33.3%
    assert cat_map["Income"]["percentage"] == 33.3


def test_human_escalation_breakdowns(db_session, seed_analytics_data):
    """Verifies escalation counts and status, priority, career, and language breakdowns."""
    admin = seed_analytics_data["admin"]
    res = client.get("/api/admin/analytics?date_range=30d", headers=_auth_header(admin))
    assert res.status_code == 200
    esc = res.json()["escalations"]

    assert esc["total"] == 2
    assert esc["pending"] == 1
    assert esc["resolved"] == 1
    assert esc["in_progress"] == 0

    # Status breakdown
    status_map = {s["key"]: s["count"] for s in esc["by_status"]}
    assert status_map["Pending"] == 1
    assert status_map["Resolved"] == 1

    # Language breakdown
    lang_map = {l["key"]: l["count"] for l in esc["by_language"]}
    assert lang_map.get("TE") == 1
    assert lang_map.get("EN") == 1

    # Career breakdown
    career_map = {c["key"]: c["count"] for c in esc["by_career"]}
    assert career_map.get("Automotive Service Technician") == 1
    assert career_map.get("Solar PV Installation Technician") == 1


def test_parent_resistance_without_fabricated_score(db_session, seed_analytics_data):
    """Verifies parent resistance reports parents expressing concerns and career breakdown without fake metrics."""
    admin = seed_analytics_data["admin"]
    res = client.get("/api/admin/analytics?date_range=30d", headers=_auth_header(admin))
    assert res.status_code == 200
    res_data = res.json()["resistance"]

    assert res_data["parents_expressing_concerns"] == 1
    assert res_data["total_resistance_events"] == 3
    assert len(res_data["top_resistance_areas"]) > 0

    # Resistance by career
    career_res = res_data["resistance_by_career"]
    assert len(career_res) == 2
    career_names = [c["career_title"] for c in career_res]
    assert "Automotive Service Technician" in career_names
    assert "Solar PV Installation Technician" in career_names


def test_sentiment_analytics_empty_and_populated(db_session, seed_analytics_data):
    """
    8. Sentiment data comes from SentimentEvent.
    When 0 events: has_sentiment_data = False, message = 'No sentiment data available yet.'
    When populated: calculates observed sentiment shift.
    """
    admin = seed_analytics_data["admin"]
    sess1 = seed_analytics_data["sess1"]

    # Initial state: 0 SentimentEvent records
    res_empty = client.get("/api/admin/analytics?date_range=30d", headers=_auth_header(admin))
    assert res_empty.status_code == 200
    sent_empty = res_empty.json()["sentiment"]
    assert sent_empty["has_sentiment_data"] is False
    assert sent_empty["status_message"] in [
        "No sentiment data available yet.",
        "No sentiment data available for this period.",
    ]
    assert res_empty.json()["summary"]["observed_sentiment_shift"] is None

    # Now seed real SentimentEvents
    now = datetime.utcnow()
    se1 = SentimentEvent(
        counselling_session_id=sess1.id,
        sentiment=SentimentType.CONCERNED,
        score=-0.4,
        created_at=now - timedelta(days=2, hours=1),
    )
    se2 = SentimentEvent(
        counselling_session_id=sess1.id,
        sentiment=SentimentType.POSITIVE,
        score=0.8,
        created_at=now - timedelta(days=2),
    )
    db_session.add_all([se1, se2])
    db_session.commit()

    # Re-fetch analytics
    res_pop = client.get("/api/admin/analytics?date_range=30d", headers=_auth_header(admin))
    assert res_pop.status_code == 200
    sent_pop = res_pop.json()["sentiment"]
    assert sent_pop["has_sentiment_data"] is True
    assert sent_pop["total_events"] == 2
    assert "concerned" in sent_pop["overall_distribution"]
    assert "positive" in sent_pop["overall_distribution"]
    assert sent_pop["positive_shift_rate"] == 100.0  # From 0% positive to 100% positive
    assert res_pop.json()["summary"]["observed_sentiment_shift"] == "+100.0% Positive Shift"


def test_date_range_filtering(db_session, seed_analytics_data):
    """Verifies date filtering (7d excludes 10d old sessions, all includes all)."""
    admin = seed_analytics_data["admin"]

    # 7d filter should only include session 1 (2 days ago), excluding session 2 (10 days ago)
    res_7d = client.get("/api/admin/analytics?date_range=7d", headers=_auth_header(admin))
    assert res_7d.status_code == 200
    data_7d = res_7d.json()
    assert data_7d["volume"]["total_sessions"] == 1
    assert data_7d["concerns"]["total_concerns"] == 2  # c1 and c2 are 2 and 3 days ago

    # All time includes both
    res_all = client.get("/api/admin/analytics?date_range=all", headers=_auth_header(admin))
    assert res_all.status_code == 200
    data_all = res_all.json()
    assert data_all["volume"]["total_sessions"] == 2
    assert data_all["concerns"]["total_concerns"] == 3


def test_custom_date_validation(db_session, seed_analytics_data):
    """Custom date ranges must be validated on the backend."""
    admin = seed_analytics_data["admin"]

    # Valid custom dates
    res_valid = client.get(
        "/api/admin/analytics?start_date=2026-01-01&end_date=2026-12-31",
        headers=_auth_header(admin),
    )
    assert res_valid.status_code == 200

    # Invalid range: start > end
    res_invalid = client.get(
        "/api/admin/analytics?start_date=2026-12-31&end_date=2026-01-01",
        headers=_auth_header(admin),
    )
    assert res_invalid.status_code == 400
    assert "start_date cannot be after end_date" in res_invalid.json()["detail"]


def test_career_concern_and_language_filters(db_session, seed_analytics_data):
    """Career, concern, and language filtering operate server-side."""
    admin = seed_analytics_data["admin"]
    occ1 = seed_analytics_data["occ1"]

    # Concern filter
    res_concern = client.get(
        "/api/admin/analytics?concern=Income",
        headers=_auth_header(admin),
    )
    assert res_concern.status_code == 200
    assert res_concern.json()["concerns"]["total_concerns"] == 1

    # Language filter
    res_lang = client.get(
        "/api/admin/analytics?language=te",
        headers=_auth_header(admin),
    )
    assert res_lang.status_code == 200
    assert res_lang.json()["escalations"]["total"] == 1

    # Career filter
    res_career = client.get(
        f"/api/admin/analytics?career_id={occ1.id}",
        headers=_auth_header(admin),
    )
    assert res_career.status_code == 200
    assert res_career.json()["escalations"]["total"] == 1


def test_privacy_and_data_isolation(db_session, seed_analytics_data):
    """
    Analytics must NOT expose raw counselling messages, student Aadhaar,
    or authentication tokens.
    """
    admin = seed_analytics_data["admin"]
    res = client.get("/api/admin/analytics", headers=_auth_header(admin))
    assert res.status_code == 200
    raw_text = res.text

    # Verify no private conversation text leaked
    assert "I want to learn automotive electronics." not in raw_text
    assert "What about income security?" not in raw_text
    assert "password" not in raw_text
    assert "token" not in raw_text.lower() or "filter_options" in raw_text


def test_a3_concern_analytics_breakdowns_and_metrics(db_session, seed_analytics_data):
    """
    A3 — Concern Analytics:
    Verifies severity breakdowns, resolution status breakdowns, trends, and summary metrics.
    """
    admin = seed_analytics_data["admin"]
    res = client.get("/api/admin/analytics/concerns?date_range=30d", headers=_auth_header(admin))
    assert res.status_code == 200
    concerns = res.json()

    assert concerns["total_concerns"] == 3
    assert concerns["highest_concern"] in ["Income", "Job Security", "Social Perception"]
    assert concerns["high_severity_count"] == 1
    assert concerns["resolved_count"] == 1
    assert concerns["resolution_rate"] > 0

    # Severity breakdown
    sev_map = {s["severity"]: s["count"] for s in concerns["by_severity"]}
    assert sev_map["High"] == 1
    assert sev_map["Medium"] == 2
    assert sev_map["Low"] == 0

    # Status breakdown
    stat_map = {s["status"]: s["count"] for s in concerns["by_status"]}
    assert stat_map["Open"] == 2
    assert stat_map["Resolved"] == 1


def test_a3_concern_severity_and_status_filtering(db_session, seed_analytics_data):
    """
    A3 — Concern Analytics:
    Verifies that severity and status filters operate server-side on concerns.
    """
    admin = seed_analytics_data["admin"]

    # Filter by severity=high
    res_high = client.get(
        "/api/admin/analytics/concerns?severity=high",
        headers=_auth_header(admin),
    )
    assert res_high.status_code == 200
    assert res_high.json()["total_concerns"] == 1

    # Filter by concern_status=resolved
    res_res = client.get(
        "/api/admin/analytics/concerns?concern_status=resolved",
        headers=_auth_header(admin),
    )
    assert res_res.status_code == 200
    assert res_res.json()["total_concerns"] == 1


def test_a3_concern_analytics_rbac(db_session, seed_analytics_data):
    """
    Section 9: Admin Authorization for /api/admin/analytics/concerns
    Admin -> allowed (200)
    Student -> denied (403)
    Parent -> denied (403)
    Unauthenticated -> denied (401)
    """
    admin = seed_analytics_data["admin"]
    student = seed_analytics_data["student"]
    parent = seed_analytics_data["parent"]

    # 1. Admin allowed
    res_admin = client.get("/api/admin/analytics/concerns", headers=_auth_header(admin))
    assert res_admin.status_code == 200

    # 2. Student denied (403)
    res_student = client.get("/api/admin/analytics/concerns", headers=_auth_header(student))
    assert res_student.status_code == 403

    # 3. Parent denied (403)
    res_parent = client.get("/api/admin/analytics/concerns", headers=_auth_header(parent))
    assert res_parent.status_code == 403

    # 4. Unauthenticated denied (401)
    res_anon = client.get("/api/admin/analytics/concerns")
    assert res_anon.status_code == 401


def test_a3_concern_analytics_canonical_categories_and_percentages(db_session, seed_analytics_data):
    """
    Section 2 & 3: Canonical categories and accurate percentages
    Categories: Income, Job Security, Further Education, Social Perception, Distance, Working Conditions, Career Growth
    """
    admin = seed_analytics_data["admin"]
    res = client.get("/api/admin/analytics/concerns?date_range=all", headers=_auth_header(admin))
    assert res.status_code == 200
    data = res.json()

    assert data["total"] == 3
    assert data["total_concerns"] == 3

    categories = {c["category"]: c for c in data["categories"]}
    expected_categories = [
        "Income",
        "Job Security",
        "Further Education",
        "Social Perception",
        "Distance",
        "Working Conditions",
        "Career Growth",
    ]
    for exp_cat in expected_categories:
        assert exp_cat in categories, f"Missing canonical category: {exp_cat}"

    # Verify counts and percentage math
    assert categories["Income"]["count"] == 1
    assert categories["Income"]["percentage"] == round(1 / 3 * 100, 1)

    assert categories["Job Security"]["count"] == 1
    assert categories["Job Security"]["percentage"] == round(1 / 3 * 100, 1)

    assert categories["Social Perception"]["count"] == 1
    assert categories["Social Perception"]["percentage"] == round(1 / 3 * 100, 1)

    # Categories with 0 occurrences must remain present with count 0 and 0.0%
    assert categories["Further Education"]["count"] == 0
    assert categories["Further Education"]["percentage"] == 0.0


def test_a3_concern_analytics_trend_dynamic_aggregation(db_session, seed_analytics_data):
    """
    Section 5: Trend aggregation based on date range (daily for 7d/30d, monthly for year/all).
    """
    admin = seed_analytics_data["admin"]

    # 7d / 30d should produce YYYY-MM-DD periods
    res_30d = client.get("/api/admin/analytics/concerns?date_range=30d", headers=_auth_header(admin))
    assert res_30d.status_code == 200
    data_30d = res_30d.json()
    assert len(data_30d["trend"]) > 0
    for t in data_30d["trend"]:
        assert re.match(r"^\d{4}-\d{2}-\d{2}$", t["period"])

    # year / all should produce YYYY-MM periods
    res_year = client.get("/api/admin/analytics/concerns?date_range=year", headers=_auth_header(admin))
    assert res_year.status_code == 200
    data_year = res_year.json()
    assert len(data_year["trend"]) > 0
    for t in data_year["trend"]:
        assert re.match(r"^\d{4}-\d{2}$", t["period"])


def test_a3_concern_analytics_empty_state(db_session, seed_analytics_data):
    """
    Section 14: Empty state when no records match filter.
    Returns 0 total, empty trend, all canonical categories with count 0.
    """
    admin = seed_analytics_data["admin"]
    res = client.get(
        "/api/admin/analytics/concerns?start_date=2020-01-01&end_date=2020-01-02",
        headers=_auth_header(admin),
    )
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 0
    assert data["total_concerns"] == 0
    assert len(data["trend"]) == 0
    for c in data["categories"]:
        assert c["count"] == 0
        assert c["percentage"] == 0.0


# =========================================================================
# A4 — Sentiment Analytics Tests
# =========================================================================

def test_a4_sentiment_analytics_rbac(db_session, seed_analytics_data):
    """
    Section 20 & 22: Authorization checks.
    Admin -> 200
    Student -> 403
    Parent -> 403
    Unauthenticated -> 401
    """
    admin = seed_analytics_data["admin"]
    student = seed_analytics_data["student"]
    parent = seed_analytics_data["parent"]

    # 1. Admin allowed
    res_admin = client.get("/api/admin/analytics/sentiment", headers=_auth_header(admin))
    assert res_admin.status_code == 200

    # 2. Student denied (403)
    res_student = client.get("/api/admin/analytics/sentiment", headers=_auth_header(student))
    assert res_student.status_code == 403

    # 3. Parent denied (403)
    res_parent = client.get("/api/admin/analytics/sentiment", headers=_auth_header(parent))
    assert res_parent.status_code == 403

    # 4. Anonymous denied (401)
    res_anon = client.get("/api/admin/analytics/sentiment")
    assert res_anon.status_code == 401


def test_a4_sentiment_analytics_empty_state(db_session, seed_analytics_data):
    """
    Section 11 & 17: Empty state when no records match filter.
    Returns has_sentiment_data = False, total_events = 0, status_message = 'No sentiment data available for this period.'
    """
    admin = seed_analytics_data["admin"]
    res = client.get(
        "/api/admin/analytics/sentiment?start_date=2015-01-01&end_date=2015-01-02",
        headers=_auth_header(admin),
    )
    assert res.status_code == 200
    data = res.json()
    assert data["has_sentiment_data"] is False
    assert data["total_events"] == 0
    assert data["status_message"] == "No sentiment data available for this period."
    assert "methodology_note" in data
    assert "Observed sentiment is based on recorded sentiment events" in data["methodology_note"]


def test_a4_sentiment_stages_and_comparison(db_session, seed_analytics_data):
    """
    Section 1, 3, 4, 5, 6, 7:
    Calculates Before, During, and After counselling stages and comparison.
    """
    admin = seed_analytics_data["admin"]
    sess1 = seed_analytics_data["sess1"]

    now = datetime.utcnow()
    # Create 3 events for sess1:
    # 1. Before: CONCERNED
    # 2. During: NEUTRAL
    # 3. After: POSITIVE
    e1 = SentimentEvent(
        counselling_session_id=sess1.id,
        sentiment=SentimentType.CONCERNED,
        score=0.3,
        created_at=now - timedelta(days=1, minutes=30),
    )
    e2 = SentimentEvent(
        counselling_session_id=sess1.id,
        sentiment=SentimentType.NEUTRAL,
        score=0.5,
        created_at=now - timedelta(days=1, minutes=15),
    )
    e3 = SentimentEvent(
        counselling_session_id=sess1.id,
        sentiment=SentimentType.POSITIVE,
        score=0.9,
        created_at=now - timedelta(days=1),
    )
    db_session.add_all([e1, e2, e3])
    db_session.commit()

    res = client.get("/api/admin/analytics/sentiment?date_range=7d", headers=_auth_header(admin))
    assert res.status_code == 200
    data = res.json()

    assert data["title"] == "Observed Sentiment Shift"
    assert data["has_sentiment_data"] is True
    assert data["has_before_data"] is True
    assert data["has_during_data"] is True
    assert data["has_after_data"] is True
    assert data["can_compare"] is True
    assert data["status_message"] == "Observed sentiment before and after counselling"

    # Before stage
    assert data["before"]["is_available"] is True
    assert data["before"]["total"] >= 1
    before_cats = {c["sentiment"]: c for c in data["before"]["categories"]}
    assert "concerned" in before_cats
    assert before_cats["concerned"]["count"] >= 1

    # During stage
    assert data["during"] is not None
    assert data["during"]["is_available"] is True
    assert data["during"]["total"] >= 1
    during_cats = {c["sentiment"]: c for c in data["during"]["categories"]}
    assert "neutral" in during_cats

    # After stage
    assert data["after"]["is_available"] is True
    assert data["after"]["total"] >= 1
    after_cats = {c["sentiment"]: c for c in data["after"]["categories"]}
    assert "positive" in after_cats
    assert after_cats["positive"]["count"] >= 1

    # Comparison
    comp_map = {c["sentiment"]: c for c in data["comparison"]}
    assert "positive" in comp_map
    assert comp_map["positive"]["change_percentage"] is not None


def test_a4_sentiment_partial_data_status(db_session, seed_analytics_data):
    """
    Section 11: When only before-counselling data is available (e.g. 1 event),
    status_message indicates after-counselling data is not available yet.
    """
    admin = seed_analytics_data["admin"]
    sess2 = seed_analytics_data["sess2"]

    now = datetime.utcnow()
    # Single event in an isolated date range
    target_date = now - timedelta(days=70)
    e_single = SentimentEvent(
        counselling_session_id=sess2.id,
        sentiment=SentimentType.CONCERNED,
        score=0.2,
        created_at=target_date,
    )
    db_session.add(e_single)
    db_session.commit()

    start_str = (target_date - timedelta(days=1)).strftime("%Y-%m-%d")
    end_str = (target_date + timedelta(days=1)).strftime("%Y-%m-%d")

    res = client.get(
        f"/api/admin/analytics/sentiment?start_date={start_str}&end_date={end_str}",
        headers=_auth_header(admin),
    )
    assert res.status_code == 200
    data = res.json()
    assert data["has_before_data"] is True
    assert data["has_after_data"] is False
    assert data["can_compare"] is False
    assert data["status_message"] == "After-counselling sentiment data is not available yet."


# =========================================================================
# A5 Geographic Analytics Tests
# =========================================================================

def test_a5_geographic_analytics_rbac(seed_analytics_data):
    """
    Section 22: Authorization check:
    Admin -> 200 OK
    Student -> 403 Forbidden
    Parent -> 403 Forbidden
    Unauthenticated -> 401 Unauthorized
    """
    admin = seed_analytics_data["admin"]
    student = seed_analytics_data["student"]
    parent = seed_analytics_data["parent"]

    # 1. Admin allowed
    res_admin = client.get("/api/admin/analytics/geography", headers=_auth_header(admin))
    assert res_admin.status_code == 200

    # 2. Student denied
    res_student = client.get("/api/admin/analytics/geography", headers=_auth_header(student))
    assert res_student.status_code == 403

    # 3. Parent denied
    res_parent = client.get("/api/admin/analytics/geography", headers=_auth_header(parent))
    assert res_parent.status_code == 403

    # 4. Unauthenticated denied
    res_anon = client.get("/api/admin/analytics/geography")
    assert res_anon.status_code == 401


def test_a5_geographic_analytics_demo_label_and_summary(seed_analytics_data):
    """
    Section 2, 4, 11:
    - Labeled clearly as is_demo_data=True
    - Contains demo_note
    - Summary metrics: total, top_state, top_district, top_region
    """
    admin = seed_analytics_data["admin"]
    res = client.get("/api/admin/analytics/geography", headers=_auth_header(admin))
    assert res.status_code == 200
    data = res.json()

    assert data["is_demo_data"] is True
    assert "generated data and do not represent real-world statistics" in data["demo_note"]
    summary = data["summary"]
    assert summary["total"] > 0
    assert summary["top_state"] is not None
    assert summary["top_district"] is not None
    assert summary["top_region"] is not None
    assert summary["is_demo_data"] is True


def test_a5_geographic_state_district_region_aggregation(seed_analytics_data):
    """
    Section 5, 6, 7, 13, 15:
    - Server-side aggregation by State, District, and Region
    - Counts and Percentages calculated accurately
    - Available filter collections discovered
    """
    admin = seed_analytics_data["admin"]
    res = client.get("/api/admin/analytics/geography", headers=_auth_header(admin))
    assert res.status_code == 200
    data = res.json()

    total = data["summary"]["total"]
    assert total > 0

    # States
    states = data["states"]
    assert len(states) > 0
    sum_state_counts = sum(s["count"] for s in states)
    assert sum_state_counts == total
    # Check percentage formula
    for s in states:
        expected_pct = round((s["count"] / total) * 100, 1)
        assert abs(s["percentage"] - expected_pct) <= 0.2

    # Districts
    districts = data["districts"]
    assert len(districts) > 0
    sum_district_counts = sum(d["count"] for d in districts)
    assert sum_district_counts == total

    # Regions
    regions = data["regions"]
    assert len(regions) > 0
    sum_region_counts = sum(r["count"] for r in regions)
    assert sum_region_counts == total

    # Available filter options
    assert len(data["available_states"]) > 0
    assert len(data["available_districts"]) > 0
    assert len(data["available_regions"]) > 0
    assert len(data["available_concerns"]) >= 7


def test_a5_geographic_state_and_district_filtering(seed_analytics_data):
    """
    Section 1, 6:
    - When state filter is provided, only districts and activity for that state are returned.
    """
    admin = seed_analytics_data["admin"]
    res_all = client.get("/api/admin/analytics/geography", headers=_auth_header(admin))
    all_data = res_all.json()

    top_state = all_data["summary"]["top_state"]
    assert top_state is not None

    res_filtered = client.get(
        f"/api/admin/analytics/geography?state={top_state}",
        headers=_auth_header(admin),
    )
    assert res_filtered.status_code == 200
    filtered_data = res_filtered.json()

    assert filtered_data["summary"]["top_state"] == top_state
    # Every returned state item in states array should match top_state
    for st in filtered_data["states"]:
        assert st["location"] == top_state

    # District filter test
    if filtered_data["districts"]:
        test_district = filtered_data["districts"][0]["location"]
        res_dist = client.get(
            f"/api/admin/analytics/geography?district={test_district}",
            headers=_auth_header(admin),
        )
        assert res_dist.status_code == 200
        dist_data = res_dist.json()
        assert dist_data["summary"]["total"] >= 1
        for d in dist_data["districts"]:
            assert d["location"] == test_district


def test_a5_geographic_career_and_concern_filtering(seed_analytics_data):
    """
    Section 8, 9:
    - Career filter restricts observed activity.
    - Concern filter restricts observed activity.
    """
    admin = seed_analytics_data["admin"]
    occ1 = seed_analytics_data["occ1"]

    # Filter by Career
    res_career = client.get(
        f"/api/admin/analytics/geography?career_id={occ1.id}",
        headers=_auth_header(admin),
    )
    assert res_career.status_code == 200
    career_data = res_career.json()
    assert "summary" in career_data

    # Filter by Concern
    res_concern = client.get(
        "/api/admin/analytics/geography?concern=Income",
        headers=_auth_header(admin),
    )
    assert res_concern.status_code == 200
    concern_data = res_concern.json()
    assert concern_data["summary"]["total"] >= 1
    assert concern_data["summary"]["top_concern"] == "Income"


def test_a5_geographic_time_filtering_and_trend(seed_analytics_data):
    """
    Section 10: Time filtering updates geographic analytics; trend returned as time-series.
    """
    admin = seed_analytics_data["admin"]
    res_7d = client.get(
        "/api/admin/analytics/geography?date_range=7d",
        headers=_auth_header(admin),
    )
    assert res_7d.status_code == 200
    data_7d = res_7d.json()

    res_all = client.get(
        "/api/admin/analytics/geography?date_range=all_time",
        headers=_auth_header(admin),
    )
    assert res_all.status_code == 200
    data_all = res_all.json()

    # 7-day total should be <= all-time total
    assert data_7d["summary"]["total"] <= data_all["summary"]["total"]

    # Trend points should be chronological
    trend = data_all["trend"]
    if len(trend) > 1:
        dates = [p["date"] for p in trend]
        assert dates == sorted(dates)


def test_a5_geographic_empty_state_and_privacy(seed_analytics_data):
    """
    Section 15, 20:
    - Empty state when no data matches (e.g. non-existent state)
    - Privacy: no GPS, phone, email, Aadhaar, or private messages exposed
    """
    admin = seed_analytics_data["admin"]
    res = client.get(
        "/api/admin/analytics/geography?state=NonExistentStateXYZ",
        headers=_auth_header(admin),
    )
    assert res.status_code == 200
    data = res.json()

    assert data["summary"]["total"] == 0
    assert data["summary"]["top_state"] is None
    assert len(data["states"]) == 0
    assert len(data["districts"]) == 0
    assert len(data["regions"]) == 0
    assert len(data["trend"]) == 0

    # Privacy check on normal response
    res_normal = client.get("/api/admin/analytics/geography", headers=_auth_header(admin))
    raw_text = res_normal.text
    forbidden_terms = ["aadhaar", "password_hash", "phone", "gps", "exact_address"]
    for term in forbidden_terms:
        assert term not in raw_text.lower()


# =========================================================================
# A6 — AI Performance Analytics Tests
# =========================================================================

def test_a6_ai_analytics_rbac_protection(seed_analytics_data):
    """
    Section 21, 24:
    - Admin: allowed (200)
    - Student: denied (403)
    - Parent: denied (403)
    - Unauthenticated: denied (401)
    """
    admin = seed_analytics_data["admin"]
    student = seed_analytics_data["student"]
    parent = seed_analytics_data["parent"]

    # 1. Admin allowed
    res_admin = client.get("/api/admin/analytics/ai", headers=_auth_header(admin))
    assert res_admin.status_code == 200

    # 2. Student denied (403)
    res_student = client.get("/api/admin/analytics/ai", headers=_auth_header(student))
    assert res_student.status_code == 403

    # 3. Parent denied (403)
    res_parent = client.get("/api/admin/analytics/ai", headers=_auth_header(parent))
    assert res_parent.status_code == 403

    # 4. Unauthenticated denied (401)
    res_anon = client.get("/api/admin/analytics/ai")
    assert res_anon.status_code == 401


def test_a6_ai_analytics_summary_and_metrics_calculations(db_session: Session, seed_analytics_data):
    """
    Section 1, 2, 8, 9, 10, 11:
    - 5 Primary metrics: Total AI Sessions, Resolution Rate, Escalation Rate,
      Low-Confidence Responses, Unanswered Questions.
    - Demonstrates accurate server-side aggregation.
    - Deterministic summary generated without LLM.
    - Demo-data label (is_demo_data == True).
    """
    admin = seed_analytics_data["admin"]
    db = db_session
    now = datetime.utcnow()

    # Create dedicated student profile for controlled A6 scenario
    user_test = User(
        email="a6student@sih.gov.in",
        password_hash=hash_password("pass123"),
        role=UserRole.STUDENT,
        name="A6 Student",
        is_active=True,
    )
    db.add(user_test)
    db.commit()

    student_prof = StudentProfile(
        user_id=user_test.id,
        education_level="Class 10 Passed",
        location="Hyderabad, Telangana",
    )
    db.add(student_prof)
    db.commit()

    # Session A: COMPLETED, no escalation -> RESOLVED. Has 2 AI messages (conf 0.90, conf 0.85)
    sess_a = CounsellingSession(
        student_profile_id=student_prof.id,
        status=SessionStatus.COMPLETED,
        started_at=now - timedelta(days=5),
        ended_at=now - timedelta(days=5, hours=-1),
    )
    # Session B: ACTIVE, has escalation -> ESCALATED. Has 1 AI msg (conf 0.40 -> LOW CONFIDENCE, requires_human=True -> UNANSWERED)
    sess_b = CounsellingSession(
        student_profile_id=student_prof.id,
        status=SessionStatus.ACTIVE,
        started_at=now - timedelta(days=3),
    )
    # Session C: ACTIVE, no escalation -> ACTIVE/UNRESOLVED. Has 1 AI msg (conf 0.75)
    sess_c = CounsellingSession(
        student_profile_id=student_prof.id,
        status=SessionStatus.ACTIVE,
        started_at=now - timedelta(days=1),
    )
    db.add_all([sess_a, sess_b, sess_c])
    db.commit()

    # AI Messages
    msg_a1 = CounsellingMessage(
        session_id=sess_a.id,
        sender_type=MessageSenderType.AI,
        content="AI response A1",
        confidence=0.90,
        requires_human=False,
        created_at=now - timedelta(days=5),
    )
    msg_a2 = CounsellingMessage(
        session_id=sess_a.id,
        sender_type=MessageSenderType.AI,
        content="AI response A2",
        confidence=0.85,
        requires_human=False,
        created_at=now - timedelta(days=5),
    )
    msg_b1 = CounsellingMessage(
        session_id=sess_b.id,
        sender_type=MessageSenderType.AI,
        content="I am not sure about this specific salary detail.",
        confidence=0.40,
        requires_human=True,
        created_at=now - timedelta(days=3),
    )
    msg_c1 = CounsellingMessage(
        session_id=sess_c.id,
        sender_type=MessageSenderType.AI,
        content="Solar technicians work outdoors on installations.",
        confidence=0.75,
        requires_human=False,
        created_at=now - timedelta(days=1),
    )
    db.add_all([msg_a1, msg_a2, msg_b1, msg_c1])

    # Escalation for Session B
    esc_b = HumanEscalation(
        counselling_session_id=sess_b.id,
        student_id=student_prof.id,
        concern="Salary Uncertainty",
        language="en",
        priority=EscalationPriority.HIGH,
        status=EscalationStatus.PENDING,
        created_at=now - timedelta(days=3),
    )
    db.add(esc_b)
    db.commit()

    # Request analytics
    res = client.get("/api/admin/analytics/ai?date_range=7d", headers=_auth_header(admin))
    assert res.status_code == 200
    data = res.json()

    # Demo data label
    assert data["is_demo_data"] is True
    assert "generated" in data["demo_note"].lower()

    summary = data["summary"]
    # Total AI sessions within last 7 days includes sess_a, sess_b, sess_c (and sess1 from seed)
    assert summary["total_sessions"] >= 3
    assert summary["resolution_rate"] >= 0.0
    assert summary["escalation_rate"] >= 0.0
    assert summary["low_confidence_responses"] >= 1
    assert summary["unanswered_questions"] >= 1
    assert summary["low_confidence_rate"] > 0

    # Resolution breakdown
    breakdown = data["resolution_breakdown"]
    assert breakdown["resolved"] >= 1  # sess_a
    assert breakdown["escalated"] >= 1  # sess_b
    assert breakdown["active_unresolved"] >= 1  # sess_c
    total_breakdown = breakdown["resolved"] + breakdown["escalated"] + breakdown["active_unresolved"]
    assert total_breakdown == summary["total_sessions"]

    # Low confidence telemetry
    assert data["confidence_threshold"] == 0.60

    # Unanswered categories
    categories = data["unanswered_categories"]
    assert len(categories) >= 1
    category_names = [c["category"] for c in categories]
    assert "Salary Uncertainty" in category_names

    # Deterministic summary
    perf_summary = data["deterministic_summary"]
    assert isinstance(perf_summary, list)
    assert len(perf_summary) >= 2


def test_a6_ai_analytics_time_filtering_and_trend(seed_analytics_data):
    """
    Section 5, 6:
    - Time filters: 7d, 30d, 90d, this_year, all_time.
    - Trend contains chronological items with session, resolved, escalated, low_confidence counts.
    """
    admin = seed_analytics_data["admin"]

    # 7-day filter
    res_7d = client.get("/api/admin/analytics/ai?date_range=7d", headers=_auth_header(admin))
    assert res_7d.status_code == 200
    data_7d = res_7d.json()

    # All-time filter
    res_all = client.get("/api/admin/analytics/ai?date_range=all_time", headers=_auth_header(admin))
    assert res_all.status_code == 200
    data_all = res_all.json()

    assert data_7d["summary"]["total_sessions"] <= data_all["summary"]["total_sessions"]

    # Trend chronological validation
    trend = data_all["trend"]
    if len(trend) > 1:
        dates = [p["date"] for p in trend]
        assert dates == sorted(dates)
        for p in trend:
            assert "total_sessions" in p
            assert "resolved" in p
            assert "escalated" in p
            assert "low_confidence" in p


def test_a6_ai_analytics_empty_state_and_privacy(seed_analytics_data):
    """
    Section 19, 20, 22:
    - Empty state when filtering far into future.
    - Privacy: No conversation bodies, passwords, Aadhaar, or student PII.
    """
    admin = seed_analytics_data["admin"]

    # Future date filter to verify empty state
    res_empty = client.get(
        "/api/admin/analytics/ai?start_date=2099-01-01&end_date=2099-01-02",
        headers=_auth_header(admin),
    )
    assert res_empty.status_code == 200
    empty_data = res_empty.json()
    assert empty_data["summary"]["total_sessions"] == 0
    assert empty_data["summary"]["resolution_rate"] == 0.0
    assert empty_data["summary"]["escalation_rate"] == 0.0
    assert empty_data["summary"]["low_confidence_responses"] == 0
    assert empty_data["summary"]["unanswered_questions"] == 0
    assert len(empty_data["trend"]) == 0
    assert len(empty_data["unanswered_categories"]) == 0

    # Privacy check on raw text
    res = client.get("/api/admin/analytics/ai", headers=_auth_header(admin))
    raw_text = res.text
    forbidden_tokens = [
        "aadhaar",
        "password_hash",
        "private_message",
        "counsellingmessage.content",
    ]
    for token in forbidden_tokens:
        assert token not in raw_text.lower()




