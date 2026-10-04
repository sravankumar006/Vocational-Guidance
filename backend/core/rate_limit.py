"""
Lightweight In-Memory Rate Limiting Dependency (Phase 10 Brick 34).
Protects high-cost endpoints (authentication, AI counselling, escalations)
from brute-force and rapid spam without blocking ordinary users.
"""

import time
from collections import defaultdict
from typing import Callable, Dict, List
from fastapi import Request, Depends

from core.errors import RateLimitedException


class InMemoryRateLimiter:
    """Sliding-window in-memory rate limiter per client IP or user key."""

    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.window_seconds = 60.0
        self._history: Dict[str, List[float]] = defaultdict(list)

    def is_allowed(self, key: str) -> bool:
        now = time.time()
        cutoff = now - self.window_seconds
        
        # Clean older entries
        recent = [t for t in self._history[key] if t > cutoff]
        self._history[key] = recent

        if len(recent) >= self.requests_per_minute:
            return False

        self._history[key].append(now)
        return True

    def clear(self) -> None:
        """Clear rate limit history (for testing)."""
        self._history.clear()


# Standard Limiters (Generous to prevent false positives in test suites, protective against abuse)
login_limiter = InMemoryRateLimiter(requests_per_minute=100)
counselling_limiter = InMemoryRateLimiter(requests_per_minute=120)
escalation_limiter = InMemoryRateLimiter(requests_per_minute=50)


def rate_limit_login(request: Request) -> None:
    """Limits login attempts per IP."""
    client_ip = request.client.host if request.client else "unknown"
    if not login_limiter.is_allowed(client_ip):
        raise RateLimitedException(
            message="Too many login attempts. Please wait a moment and try again."
        )


def rate_limit_counselling(request: Request) -> None:
    """Limits counselling message generation per IP/session."""
    client_ip = request.client.host if request.client else "unknown"
    if not counselling_limiter.is_allowed(client_ip):
        raise RateLimitedException(
            message="You're sending counselling requests too quickly. Please wait a moment."
        )
