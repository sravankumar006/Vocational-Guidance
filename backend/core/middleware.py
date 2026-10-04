"""
Correlation ID & Request Logging Middleware (Phase 9 Brick 33).
Tracks incoming requests with unique correlation identifiers and attaches them
to responses and error logs without leaking sensitive data.
"""

import uuid
import time
import logging
from typing import Callable
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("sih.request")

CORRELATION_HEADER = "X-Correlation-ID"


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Resolve or generate correlation ID
        correlation_id = request.headers.get(CORRELATION_HEADER)
        if not correlation_id or len(correlation_id) > 64:
            correlation_id = f"corr_{uuid.uuid4().hex[:16]}"

        request.state.correlation_id = correlation_id
        start_time = time.perf_counter()

        try:
            response = await call_next(request)
        except Exception:
            # Let global exception handlers format the response with the correlation ID
            raise
        finally:
            duration_ms = (time.perf_counter() - start_time) * 1000
            # Safe log: never log body or authorization header here
            logger.info(
                "request_completed",
                extra={
                    "correlation_id": correlation_id,
                    "method": request.method,
                    "path": request.url.path,
                    "duration_ms": round(duration_ms, 2),
                },
            )

        response.headers[CORRELATION_HEADER] = correlation_id
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Enforces HTTP security headers across all API responses (Brick 34).
    - X-Content-Type-Options: nosniff
    - X-Frame-Options: DENY (clickjacking protection)
    - Referrer-Policy: strict-origin-when-cross-origin
    - Permissions-Policy: camera=(), microphone=(self), geolocation=()
    """
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(self), geolocation=()"
        return response

