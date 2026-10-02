from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_api_health():
    """Verify GET /api/health returns status ok."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


def test_root_health():
    """Verify legacy GET /health is preserved."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


def test_routers_mounted():
    """Verify all 5 architectural placeholder routers are mounted."""
    routes = [
        "/api/auth/",
        "/api/student/",
        "/api/parent/",
        "/api/counselling/",
        "/api/admin/",
    ]
    for route in routes:
        response = client.get(route)
        assert response.status_code == 200, f"Route {route} failed with status {response.status_code}"
        assert response.json().get("status") == "mounted"
