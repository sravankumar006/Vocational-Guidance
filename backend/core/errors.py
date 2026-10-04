"""
Centralized Error Handling Architecture (Phase 9 Brick 33).
Defines standard application error codes, exceptions, and safe error sanitization.
"""

from enum import Enum
from typing import Optional, Any
import re


class ErrorCode(str, Enum):
    AI_UNAVAILABLE = "AI_UNAVAILABLE"
    DATABASE_UNAVAILABLE = "DATABASE_UNAVAILABLE"
    VOICE_UNAVAILABLE = "VOICE_UNAVAILABLE"
    INVALID_AI_RESPONSE = "INVALID_AI_RESPONSE"
    NO_CAREER_MATCH = "NO_CAREER_MATCH"
    NO_VERIFIED_EVIDENCE = "NO_VERIFIED_EVIDENCE"
    NETWORK_ERROR = "NETWORK_ERROR"
    AUTHENTICATION_REQUIRED = "AUTHENTICATION_REQUIRED"
    FORBIDDEN = "FORBIDDEN"
    VALIDATION_ERROR = "VALIDATION_ERROR"
    RATE_LIMITED = "RATE_LIMITED"
    REQUEST_TIMEOUT = "REQUEST_TIMEOUT"
    INTERNAL_ERROR = "INTERNAL_ERROR"


# User-friendly default messages (calm, reassuring, never technical)
USER_FRIENDLY_MESSAGES: dict[ErrorCode, str] = {
    ErrorCode.AI_UNAVAILABLE: "The AI counsellor is temporarily unavailable. Please try again in a little while.",
    ErrorCode.DATABASE_UNAVAILABLE: "We couldn't load this information right now. Please try again shortly.",
    ErrorCode.VOICE_UNAVAILABLE: "Voice isn't available right now. You can type your question instead.",
    ErrorCode.INVALID_AI_RESPONSE: "The counselling response could not be verified. Please ask again or talk to a human counsellor.",
    ErrorCode.NO_CAREER_MATCH: "We couldn't find a career that matches these preferences yet. Try changing your preferences.",
    ErrorCode.NO_VERIFIED_EVIDENCE: "I don't have enough verified information to answer that with full confidence.",
    ErrorCode.NETWORK_ERROR: "We couldn't connect right now. Please check your internet connection and try again.",
    ErrorCode.AUTHENTICATION_REQUIRED: "Your session has expired. Please sign in again.",
    ErrorCode.FORBIDDEN: "You do not have permission to view or modify this information.",
    ErrorCode.VALIDATION_ERROR: "Some information provided is incomplete or in an unexpected format. Please check your input.",
    ErrorCode.RATE_LIMITED: "You're sending requests too quickly. Please wait a moment and try again.",
    ErrorCode.REQUEST_TIMEOUT: "The request is taking longer than expected. Please try again.",
    ErrorCode.INTERNAL_ERROR: "Something went wrong on our end. Please try again shortly.",
}


class AppException(Exception):
    """Base application exception for all standardized errors."""

    def __init__(
        self,
        code: ErrorCode,
        message: Optional[str] = None,
        status_code: int = 500,
        retryable: bool = False,
        details: Optional[Any] = None,
    ):
        super().__init__(message or USER_FRIENDLY_MESSAGES.get(code, "An error occurred."))
        self.code = code
        self.message = message or USER_FRIENDLY_MESSAGES.get(code, "An error occurred.")
        self.status_code = status_code
        self.retryable = retryable
        self.details = details


class AIUnavailableException(AppException):
    def __init__(self, message: Optional[str] = None, details: Optional[Any] = None):
        super().__init__(
            code=ErrorCode.AI_UNAVAILABLE,
            message=message or USER_FRIENDLY_MESSAGES[ErrorCode.AI_UNAVAILABLE],
            status_code=503,
            retryable=True,
            details=details,
        )


class DatabaseUnavailableException(AppException):
    def __init__(self, message: Optional[str] = None, details: Optional[Any] = None):
        super().__init__(
            code=ErrorCode.DATABASE_UNAVAILABLE,
            message=message or USER_FRIENDLY_MESSAGES[ErrorCode.DATABASE_UNAVAILABLE],
            status_code=503,
            retryable=True,
            details=details,
        )


class VoiceUnavailableException(AppException):
    def __init__(self, message: Optional[str] = None, details: Optional[Any] = None):
        super().__init__(
            code=ErrorCode.VOICE_UNAVAILABLE,
            message=message or USER_FRIENDLY_MESSAGES[ErrorCode.VOICE_UNAVAILABLE],
            status_code=503,
            retryable=True,
            details=details,
        )


class InvalidAIResponseException(AppException):
    def __init__(self, message: Optional[str] = None, details: Optional[Any] = None):
        super().__init__(
            code=ErrorCode.INVALID_AI_RESPONSE,
            message=message or USER_FRIENDLY_MESSAGES[ErrorCode.INVALID_AI_RESPONSE],
            status_code=502,
            retryable=True,
            details=details,
        )


class NoCareerMatchException(AppException):
    def __init__(self, message: Optional[str] = None, details: Optional[Any] = None):
        super().__init__(
            code=ErrorCode.NO_CAREER_MATCH,
            message=message or USER_FRIENDLY_MESSAGES[ErrorCode.NO_CAREER_MATCH],
            status_code=404,
            retryable=False,
            details=details,
        )


class NoVerifiedEvidenceException(AppException):
    def __init__(self, message: Optional[str] = None, details: Optional[Any] = None):
        super().__init__(
            code=ErrorCode.NO_VERIFIED_EVIDENCE,
            message=message or USER_FRIENDLY_MESSAGES[ErrorCode.NO_VERIFIED_EVIDENCE],
            status_code=404,
            retryable=False,
            details=details,
        )


class AuthenticationRequiredException(AppException):
    def __init__(self, message: Optional[str] = None, details: Optional[Any] = None):
        super().__init__(
            code=ErrorCode.AUTHENTICATION_REQUIRED,
            message=message or USER_FRIENDLY_MESSAGES[ErrorCode.AUTHENTICATION_REQUIRED],
            status_code=401,
            retryable=False,
            details=details,
        )


class ForbiddenException(AppException):
    def __init__(self, message: Optional[str] = None, details: Optional[Any] = None):
        super().__init__(
            code=ErrorCode.FORBIDDEN,
            message=message or USER_FRIENDLY_MESSAGES[ErrorCode.FORBIDDEN],
            status_code=403,
            retryable=False,
            details=details,
        )


class ValidationException(AppException):
    def __init__(self, message: Optional[str] = None, details: Optional[Any] = None):
        super().__init__(
            code=ErrorCode.VALIDATION_ERROR,
            message=message or USER_FRIENDLY_MESSAGES[ErrorCode.VALIDATION_ERROR],
            status_code=422,
            retryable=False,
            details=details,
        )


class RateLimitedException(AppException):
    def __init__(self, message: Optional[str] = None, details: Optional[Any] = None):
        super().__init__(
            code=ErrorCode.RATE_LIMITED,
            message=message or USER_FRIENDLY_MESSAGES[ErrorCode.RATE_LIMITED],
            status_code=429,
            retryable=True,
            details=details,
        )


class RequestTimeoutException(AppException):
    def __init__(self, message: Optional[str] = None, details: Optional[Any] = None):
        super().__init__(
            code=ErrorCode.REQUEST_TIMEOUT,
            message=message or USER_FRIENDLY_MESSAGES[ErrorCode.REQUEST_TIMEOUT],
            status_code=504,
            retryable=True,
            details=details,
        )


class InternalException(AppException):
    def __init__(self, message: Optional[str] = None, details: Optional[Any] = None):
        super().__init__(
            code=ErrorCode.INTERNAL_ERROR,
            message=message or USER_FRIENDLY_MESSAGES[ErrorCode.INTERNAL_ERROR],
            status_code=500,
            retryable=True,
            details=details,
        )


SENSITIVE_KEYS = {
    "password", "passwd", "token", "secret", "authorization",
    "access_token", "refresh_token", "api_key", "gemini_api_key",
    "aadhaar", "ssn", "credit_card", "private_key"
}


def mask_sensitive_data(obj: Any) -> Any:
    """Recursively mask passwords, tokens, API keys, and sensitive fields before logging."""
    if isinstance(obj, dict):
        sanitized = {}
        for k, v in obj.items():
            if str(k).lower() in SENSITIVE_KEYS:
                sanitized[k] = "[REDACTED]"
            else:
                sanitized[k] = mask_sensitive_data(v)
        return sanitized
    elif isinstance(obj, list):
        return [mask_sensitive_data(item) for item in obj]
    elif isinstance(obj, str):
        # Redact bearer token patterns in strings
        if "bearer " in obj.lower():
            return re.sub(r'(bearer\s+)[a-zA-Z0-9_\-\.]+', r'\1[REDACTED]', obj, flags=re.IGNORECASE)
    return obj
