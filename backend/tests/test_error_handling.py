"""
Test Suite for Application-Wide Error Handling (Phase 9 Brick 33).
Verifies:
- Standard error response structure (code, message, retryable, correlation_id)
- Zero leakage of raw stack traces, database internals, SQL, or secrets
- AI unavailable, database unavailable, timeout, and validation error classifications
- Correlation ID propagation and sensitive data masking
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError, ProgrammingError
from core.errors import (
    ErrorCode,
    AppException,
    AIUnavailableException,
    DatabaseUnavailableException,
    NoCareerMatchException,
    NoVerifiedEvidenceException,
    mask_sensitive_data,
)
from main import app

client = TestClient(app)


def test_correlation_id_generated_and_returned():
    """Verify that requests receive a correlation ID in header and response."""
    res = client.get("/health")
    assert res.status_code == 200
    assert "X-Correlation-ID" in res.headers
    assert res.headers["X-Correlation-ID"].startswith("corr_")


def test_correlation_id_propagated_if_supplied():
    """Verify that client-supplied X-Correlation-ID is preserved."""
    custom_id = "test-client-trace-12345"
    res = client.get("/health", headers={"X-Correlation-ID": custom_id})
    assert res.status_code == 200
    assert res.headers["X-Correlation-ID"] == custom_id


def test_unauthenticated_error_structure():
    """Verify 401 returns standardized AUTHENTICATION_REQUIRED error structure."""
    res = client.get("/api/auth/me")
    assert res.status_code == 401
    data = res.json()
    assert "error" in data
    assert data["error"]["code"] == ErrorCode.AUTHENTICATION_REQUIRED.value
    assert data["error"]["retryable"] is False
    assert "correlation_id" in data["error"]
    assert "detail" in data  # Backwards compatibility mirror


def test_validation_error_structure():
    """Verify 422 returns standardized VALIDATION_ERROR without technical stack traces."""
    # Invalid JSON body to /api/auth/login
    res = client.post("/api/auth/login", json={"invalid_field": 123})
    assert res.status_code == 422
    data = res.json()
    assert "error" in data
    assert data["error"]["code"] == ErrorCode.VALIDATION_ERROR.value
    assert data["error"]["retryable"] is False
    assert "Missing required information" in data["error"]["message"] or "validation" in data["error"]["message"].lower()
    # Zero Python exception strings
    assert "pydantic" not in str(data).lower()
    assert "traceback" not in str(data).lower()


def test_custom_app_exception_formatting():
    """Verify custom AppException creates standard error payload."""
    exc = AIUnavailableException()
    assert exc.code == ErrorCode.AI_UNAVAILABLE
    assert exc.status_code == 503
    assert exc.retryable is True
    assert "AI counsellor is temporarily unavailable" in exc.message


def test_no_career_match_exception():
    """Verify NoCareerMatchException defaults."""
    exc = NoCareerMatchException()
    assert exc.code == ErrorCode.NO_CAREER_MATCH
    assert exc.status_code == 404
    assert exc.retryable is False


def test_no_verified_evidence_exception():
    """Verify NoVerifiedEvidenceException defaults."""
    exc = NoVerifiedEvidenceException()
    assert exc.code == ErrorCode.NO_VERIFIED_EVIDENCE
    assert exc.status_code == 404
    assert exc.retryable is False


def test_mask_sensitive_data():
    """Verify password, tokens, and authorization fields are completely redacted."""
    raw_payload = {
        "email": "student@sih.gov.in",
        "password": "SuperSecretPassword123!",
        "access_token": "jwt.token.string",
        "gemini_api_key": "AIzaSySecretApiKey",
        "nested": {
            "token": "bearer xyz",
            "aadhaar": "1234-5678-9012",
            "safe_field": "Automobile Technician",
        },
    }
    masked = mask_sensitive_data(raw_payload)
    assert masked["password"] == "[REDACTED]"
    assert masked["access_token"] == "[REDACTED]"
    assert masked["gemini_api_key"] == "[REDACTED]"
    assert masked["nested"]["token"] == "[REDACTED]"
    assert masked["nested"]["aadhaar"] == "[REDACTED]"
    assert masked["nested"]["safe_field"] == "Automobile Technician"
    assert masked["email"] == "student@sih.gov.in"


def test_database_error_masking_zero_leakage():
    """Verify simulated database errors return 503 DATABASE_UNAVAILABLE without leaking SQL."""
    from core.handlers import sqlalchemy_exception_handler
    from starlette.requests import Request
    import asyncio

    # Create dummy request
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/api/careers",
        "headers": [],
    }
    req = Request(scope)
    req.state.correlation_id = "corr_db_test_999"

    # Simulate raw SQLAlchemy OperationalError with leaked SQL credentials and table schema
    simulated_sql_err = OperationalError(
        statement="SELECT * FROM users WHERE password_hash = 'secret_hash'",
        params={},
        orig=Exception("FATAL: password authentication failed for user 'postgres_admin'"),
    )

    response = asyncio.run(sqlalchemy_exception_handler(req, simulated_sql_err))
    assert response.status_code == 503
    import json
    data = json.loads(response.body.decode("utf-8"))

    assert data["error"]["code"] == ErrorCode.DATABASE_UNAVAILABLE.value
    assert data["error"]["retryable"] is True
    assert data["error"]["correlation_id"] == "corr_db_test_999"

    # CRITICAL: Verify zero SQL or credential leakage in user response
    body_str = response.body.decode("utf-8")
    assert "password_hash" not in body_str
    assert "SELECT *" not in body_str
    assert "postgres_admin" not in body_str
    assert "OperationalError" not in body_str


def test_generic_internal_error_zero_stack_trace_leakage():
    """Verify unexpected crashes return 500 INTERNAL_ERROR with zero stack trace."""
    from core.handlers import generic_exception_handler
    from starlette.requests import Request
    import asyncio

    scope = {
        "type": "http",
        "method": "POST",
        "path": "/api/counselling/sessions",
        "headers": [],
    }
    req = Request(scope)
    req.state.correlation_id = "corr_crash_test_111"

    simulated_crash = ZeroDivisionError("division by zero at file /var/backend/secret_algo.py line 42")

    response = asyncio.run(generic_exception_handler(req, simulated_crash))
    assert response.status_code == 500
    import json
    data = json.loads(response.body.decode("utf-8"))

    assert data["error"]["code"] == ErrorCode.INTERNAL_ERROR.value
    assert data["error"]["retryable"] is True
    assert data["error"]["correlation_id"] == "corr_crash_test_111"

    # CRITICAL: Verify zero stack trace or file path leakage
    body_str = response.body.decode("utf-8")
    assert "ZeroDivisionError" not in body_str
    assert "secret_algo.py" not in body_str
    assert "division by zero" not in body_str


def test_ai_provider_unavailable_handling():
    """Verify AI provider unavailable error produces 503 AI_UNAVAILABLE."""
    from core.handlers import ai_provider_exception_handler
    from ai.exceptions import AIProviderUnavailableError
    from starlette.requests import Request
    import asyncio
    import json

    scope = {"type": "http", "method": "POST", "path": "/api/counselling/sessions/1/messages", "headers": []}
    req = Request(scope)
    req.state.correlation_id = "corr_ai_test_222"

    err = AIProviderUnavailableError("Gemini 503 service overloaded: connection reset by peer", provider="gemini")
    response = asyncio.run(ai_provider_exception_handler(req, err))
    assert response.status_code == 503
    data = json.loads(response.body.decode("utf-8"))

    assert data["error"]["code"] == ErrorCode.AI_UNAVAILABLE.value
    assert data["error"]["retryable"] is True
    assert data["error"]["correlation_id"] == "corr_ai_test_222"
    assert "AI counsellor is temporarily unavailable" in data["error"]["message"]
    # Verify no raw vendor SDK strings leaked
    assert "connection reset by peer" not in response.body.decode("utf-8")


def test_ai_provider_response_error_handling():
    """Verify AI provider malformed response produces 502 INVALID_AI_RESPONSE."""
    from core.handlers import ai_provider_exception_handler
    from ai.exceptions import AIProviderResponseError
    from starlette.requests import Request
    import asyncio
    import json

    scope = {"type": "http", "method": "POST", "path": "/api/counselling/sessions/1/messages", "headers": []}
    req = Request(scope)
    req.state.correlation_id = "corr_ai_test_333"

    err = AIProviderResponseError("Malformed JSON output from model: Unterminated string at char 543", provider="gemini")
    response = asyncio.run(ai_provider_exception_handler(req, err))
    assert response.status_code == 502
    data = json.loads(response.body.decode("utf-8"))

    assert data["error"]["code"] == ErrorCode.INVALID_AI_RESPONSE.value
    assert data["error"]["retryable"] is True
    assert "could not be verified" in data["error"]["message"]
    assert "Unterminated string" not in response.body.decode("utf-8")

