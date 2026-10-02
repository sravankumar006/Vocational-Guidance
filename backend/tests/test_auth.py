from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_auth_placeholder():
    response = client.get("/api/auth/")
    assert response.status_code == 200
    assert response.json() == {"module": "auth", "status": "mounted"}


def test_login_student():
    response = client.post("/api/auth/login", json={"role": "student"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "student"
    assert data["user"]["name"] == "Aarav Sharma"
    assert data["user"]["family_id"] == "FAM-9042"


def test_login_parent():
    response = client.post("/api/auth/login", json={"role": "parent"})
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["role"] == "parent"
    assert data["user"]["name"] == "Sunita Sharma"
    assert data["user"]["family_id"] == "FAM-9042"


def test_login_admin():
    response = client.post("/api/auth/login", json={"role": "admin"})
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["role"] == "admin"
    assert data["user"]["name"] == "Dr. Rajesh Verma"


def test_protected_me_endpoint():
    # Login as student to get token
    login_res = client.post("/api/auth/login", json={"role": "student"})
    token = login_res.json()["access_token"]

    # Calling /me without token fails
    unauth_res = client.get("/api/auth/me")
    assert unauth_res.status_code == 401

    # Calling with valid token succeeds
    auth_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert auth_res.status_code == 200
    assert auth_res.json()["role"] == "student"
