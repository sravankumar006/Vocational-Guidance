"""
Standardized Error Schema (Phase 9 Brick 33).
Guarantees consistent, non-leaking JSON error representations.
"""

from typing import Optional, Any
from pydantic import BaseModel, Field


class ErrorDetail(BaseModel):
    code: str = Field(..., description="Canonical application error code")
    message: str = Field(..., description="Human-friendly, reassuring error message")
    retryable: bool = Field(False, description="Whether repeating the request is safe and may succeed")
    correlation_id: Optional[str] = Field(None, description="Request tracking ID for diagnostics")
    details: Optional[Any] = Field(None, description="Safe auxiliary context (never secrets or traces)")


class ErrorResponse(BaseModel):
    error: ErrorDetail
    detail: Optional[str] = Field(None, description="Backwards-compatible mirror of error.message")
