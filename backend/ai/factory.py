"""AI Provider factory interface (points to authoritative AI Provider Router)."""

from ai.router import clear_ai_provider_cache, get_ai_provider, get_current_ai_provider

__all__ = [
    "get_ai_provider",
    "get_current_ai_provider",
    "clear_ai_provider_cache",
]
