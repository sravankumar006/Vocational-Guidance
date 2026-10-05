import pytest
from fastapi.testclient import TestClient
from main import app
from database.session import get_db
from models import User, Course, DataSource, HumanEscalation, StudentProfile
from models.enums import UserRole, RecordStatus, EscalationStatus, EscalationPriority
from core.security import create_access_token

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from database.base import Base

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
def admin_token(db_session):
    admin = db_session.query(User).filter_by(role=UserRole.ADMIN).first()
    if not admin:
        admin = User(name="Admin Tester", email="admin.enhancements@example.com", role=UserRole.ADMIN)
        db_session.add(admin)
        db_session.commit()
        db_session.refresh(admin)
    return create_access_token({"sub": str(admin.id), "role": admin.role.value})


@pytest.fixture
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


def test_bulk_action_verify_and_deactivate(db_session, auth_headers):
    # Setup test source and courses
    source = DataSource(name="Bulk Test Source", source_type="Government Portal", status="verified")
    db_session.add(source)
    db_session.commit()
    db_session.refresh(source)

    c1 = Course(name="Bulk Course 1", data_source_id=source.id, status="unverified")
    c2 = Course(name="Bulk Course 2", data_source_id=source.id, status="unverified")
    c3 = Course(name="Bulk Course 3 No Source", data_source_id=None, status="unverified")
    db_session.add_all([c1, c2, c3])
    db_session.commit()

    # Bulk verify
    res = client.post(
        "/api/admin/data/courses/bulk-action",
        headers=auth_headers,
        json={"action": "verify", "ids": [c1.id, c2.id, c3.id]},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["action"] == "verify"
    assert data["successful"] == 2
    assert data["failed"] == 1
    assert len(data["errors"]) == 1
    assert "linked source is required" in data["errors"][0]

    # Check c1 and c2 are verified
    db_session.refresh(c1)
    db_session.refresh(c2)
    db_session.refresh(c3)
    assert c1.status == "verified"
    assert c2.status == "verified"
    assert c3.status == "unverified"

    # Bulk deactivate
    res_deact = client.post(
        "/api/admin/data/courses/bulk-action",
        headers=auth_headers,
        json={"action": "deactivate", "ids": [c1.id, c2.id]},
    )
    assert res_deact.status_code == 200
    db_session.refresh(c1)
    db_session.refresh(c2)
    assert c1.status == "inactive"
    assert c2.status == "inactive"


def test_csv_export_endpoint(auth_headers):
    res = client.get("/api/admin/data/export/courses?status=all", headers=auth_headers)
    assert res.status_code == 200
    assert res.headers["content-type"].startswith("text/csv")
    content = res.text
    assert "id,name,sector,qualification_level" in content


def test_csv_import_endpoint_validation_and_status(db_session, auth_headers):
    csv_payload = (
        "name,sector,qualification_level,status\n"
        "Valid Imported Course 1,IT,Certificate,verified\n"  # Status 'verified' must be ignored and converted to unverified
        "Valid Imported Course 2,Electronics,Diploma,demo\n" # Status 'demo' is respected
        ",Healthcare,Degree,unverified\n"                     # Missing name -> rejected
    )

    res = client.post(
        "/api/admin/data/courses/import-csv",
        headers=auth_headers,
        json={"csv_text": csv_payload},
    )
    assert res.status_code == 200
    result = res.json()
    assert result["records_imported"] == 2
    assert result["records_rejected"] == 1
    assert len(result["validation_errors"]) == 1
    assert "Missing required 'name' field" in result["validation_errors"][0]

    # Verify created records never become verified automatically
    c1 = db_session.query(Course).filter_by(name="Valid Imported Course 1").first()
    assert c1 is not None
    assert c1.status == "unverified"  # Strictly unverified despite 'verified' in CSV

    c2 = db_session.query(Course).filter_by(name="Valid Imported Course 2").first()
    assert c2 is not None
    assert c2.status == "demo"


def test_rag_sync_endpoint(auth_headers):
    res = client.post("/api/admin/data/rag/sync", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "verified_records_synced" in data
    assert "synced_at" in data


def test_counsellor_assignment_and_priority_workflows(db_session, auth_headers):
    # 1. Fetch counsellors
    res = client.get("/api/admin/counsellors", headers=auth_headers)
    assert res.status_code == 200
    counsellors = res.json()
    assert len(counsellors) > 0
    assigned_staff_id = counsellors[0]["id"]

    # 2. Create sample escalation
    esc = HumanEscalation(
        concern="Career Guidance",
        language="en",
        status=EscalationStatus.PENDING,
        priority=EscalationPriority.MEDIUM,
    )
    db_session.add(esc)
    db_session.commit()
    db_session.refresh(esc)

    # 3. Assign counsellor
    res_assign = client.patch(
        f"/api/admin/escalations/{esc.id}/assign",
        headers=auth_headers,
        json={"assigned_to_user_id": assigned_staff_id},
    )
    assert res_assign.status_code == 200
    detail = res_assign.json()
    assert detail["assigned_to_user_id"] == assigned_staff_id
    assert detail["status"] == "in_progress"

    # 4. Unassign counsellor
    res_unassign = client.patch(
        f"/api/admin/escalations/{esc.id}/assign",
        headers=auth_headers,
        json={"assigned_to_user_id": None},
    )
    assert res_unassign.status_code == 200
    detail = res_unassign.json()
    assert detail["assigned_to_user_id"] is None

    # 5. Update priority
    for pri in ["urgent", "high", "normal"]:
        res_pri = client.patch(
            f"/api/admin/escalations/{esc.id}/priority",
            headers=auth_headers,
            json={"priority": pri},
        )
        assert res_pri.status_code == 200
        pri_data = res_pri.json()
        expected = "medium" if pri == "normal" else pri
        assert pri_data["priority"] == expected
