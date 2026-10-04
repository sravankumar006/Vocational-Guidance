"""
Global Application Exception Handlers (Phase 9 Brick 33).
Converts internal and third-party exceptions into standardized, safe,
non-leaking error responses while logging technical details server-side.
"""

import logging
from typing import Optional
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError

from core.errors import (
    AppException,
    ErrorCode,
    USER_FRIENDLY_MESSAGES,
    mask_sensitive_data,
)

logger = logging.getLogger("sih.error")


def _get_correlation_id(request: Request) -> Optional[str]:
    return getattr(request.state, "correlation_id", None)


def _build_error_payload(
    code: str,
    message: str,
    retryable: bool = False,
    correlation_id: Optional[str] = None,
    details: Optional[any] = None,
) -> dict:
    """Builds the canonical error payload with backward-compatible detail field."""
    return {
        "error": {
            "code": code,
            "message": message,
            "retryable": retryable,
            "correlation_id": correlation_id,
            "details": mask_sensitive_data(details) if details else None,
        },
        "detail": message,  # Mirrors error.message for backwards compatibility with legacy tests/clients
    }


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    corr_id = _get_correlation_id(request)
    logger.warning(
        f"AppException: code={exc.code.value} status={exc.status_code} path={request.url.path} corr={corr_id}: {exc.message}"
    )
    content = _build_error_payload(
        code=exc.code.value,
        message=exc.message,
        retryable=exc.retryable,
        correlation_id=corr_id,
        details=exc.details,
    )
    headers = {"X-Correlation-ID": corr_id} if corr_id else {}
    return JSONResponse(status_code=exc.status_code, content=content, headers=headers)


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    corr_id = _get_correlation_id(request)

    # Classify standard HTTP status codes into canonical ErrorCodes
    detail_str = str(exc.detail) if exc.detail else "Request failed"

    if exc.status_code == 401:
        code = ErrorCode.AUTHENTICATION_REQUIRED.value
        retryable = False
    elif exc.status_code == 403:
        code = ErrorCode.FORBIDDEN.value
        retryable = False
    elif exc.status_code == 404:
        if "/careers" in request.url.path:
            code = ErrorCode.NO_CAREER_MATCH.value
        elif "/counselling" in request.url.path and "evidence" in detail_str.lower():
            code = ErrorCode.NO_VERIFIED_EVIDENCE.value
        else:
            code = "NOT_FOUND"
        retryable = False
    elif exc.status_code == 422:
        code = ErrorCode.VALIDATION_ERROR.value
        retryable = False
    elif exc.status_code == 429:
        code = ErrorCode.RATE_LIMITED.value
        retryable = True
    elif exc.status_code == 503:
        if "ai" in detail_str.lower() or "counsell" in detail_str.lower() or "gemini" in detail_str.lower():
            code = ErrorCode.AI_UNAVAILABLE.value
        else:
            code = ErrorCode.DATABASE_UNAVAILABLE.value
        retryable = True
    elif exc.status_code == 504:
        code = ErrorCode.REQUEST_TIMEOUT.value
        retryable = True
    else:
        code = ErrorCode.INTERNAL_ERROR.value
        retryable = exc.status_code >= 500

    logger.warning(
        f"HTTPException: status={exc.status_code} code={code} path={request.url.path} corr={corr_id}: {detail_str}"
    )

    content = _build_error_payload(
        code=code,
        message=detail_str,
        retryable=retryable,
        correlation_id=corr_id,
    )
    headers = {"X-Correlation-ID": corr_id} if corr_id else {}
    return JSONResponse(status_code=exc.status_code, content=content, headers=headers)


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    corr_id = _get_correlation_id(request)
    raw_errors = exc.errors()
    
    # Format a human-friendly summary of validation issues
    missing_fields = [e["loc"][-1] for e in raw_errors if e.get("type") == "missing"]
    if missing_fields:
        message = f"Missing required information: {', '.join(str(f) for f in missing_fields)}."
    else:
        message = USER_FRIENDLY_MESSAGES[ErrorCode.VALIDATION_ERROR]

    logger.info(f"ValidationError: path={request.url.path} corr={corr_id} errors={raw_errors}")

    content = _build_error_payload(
        code=ErrorCode.VALIDATION_ERROR.value,
        message=message,
        retryable=False,
        correlation_id=corr_id,
        details=[{"field": ".".join(str(x) for x in e.get("loc", [])), "issue": e.get("msg")} for e in raw_errors],
    )
    headers = {"X-Correlation-ID": corr_id} if corr_id else {}
    return JSONResponse(status_code=422, content=content, headers=headers)


async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    corr_id = _get_correlation_id(request)
    # Log complete traceback server-side for developers
    logger.error(
        f"DatabaseError (SQLAlchemy): path={request.url.path} corr={corr_id} exc={type(exc).__name__}: {str(exc)}",
        exc_info=True,
    )

    # Never return raw SQL, table names, or database credentials to user
    safe_message = USER_FRIENDLY_MESSAGES[ErrorCode.DATABASE_UNAVAILABLE]
    content = _build_error_payload(
        code=ErrorCode.DATABASE_UNAVAILABLE.value,
        message=safe_message,
        retryable=True,
        correlation_id=corr_id,
    )
    headers = {"X-Correlation-ID": corr_id} if corr_id else {}
    return JSONResponse(status_code=503, content=content, headers=headers)


async def ai_provider_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    from ai.exceptions import (
        AIProviderError,
        AIProviderUnavailableError,
        AIProviderResponseError,
        AIProviderConfigurationError,
    )

    corr_id = _get_correlation_id(request)
    logger.error(
        f"AIProviderError: path={request.url.path} corr={corr_id} type={type(exc).__name__}: {str(exc)}",
        exc_info=True,
    )

    if isinstance(exc, AIProviderResponseError):
        code = ErrorCode.INVALID_AI_RESPONSE.value
        message = USER_FRIENDLY_MESSAGES[ErrorCode.INVALID_AI_RESPONSE]
        status_code = 502
        retryable = True
    else:
        # AIProviderUnavailableError or Configuration error
        code = ErrorCode.AI_UNAVAILABLE.value
        message = USER_FRIENDLY_MESSAGES[ErrorCode.AI_UNAVAILABLE]
        status_code = 503
        retryable = isinstance(exc, AIProviderUnavailableError)

    content = _build_error_payload(
        code=code,
        message=message,
        retryable=retryable,
        correlation_id=corr_id,
    )
    headers = {"X-Correlation-ID": corr_id} if corr_id else {}
    return JSONResponse(status_code=status_code, content=content, headers=headers)


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    corr_id = _get_correlation_id(request)
    # Log complete unexpected failure server-side
    logger.error(
        f"UnhandledException: path={request.url.path} corr={corr_id} exc={type(exc).__name__}: {str(exc)}",
        exc_info=True,
    )

    # Never return stack traces, file paths, or internals to user
    safe_message = USER_FRIENDLY_MESSAGES[ErrorCode.INTERNAL_ERROR]
    content = _build_error_payload(
        code=ErrorCode.INTERNAL_ERROR.value,
        message=safe_message,
        retryable=True,
        correlation_id=corr_id,
    )
    headers = {"X-Correlation-ID": corr_id} if corr_id else {}
    return JSONResponse(status_code=500, content=content, headers=headers)
