"""Authoritative AI Provider Router.

Selects, instantiates, and manages the lifecycle of the active AIProvider
implementation based on the centralized configuration (`settings.AI_PROVIDER`)
or an explicit override.

Canonical documented values:
- 'gemini' -> GeminiProvider
- 'custom' -> OwnModelProvider (project's own/fine-tuned model)
"""

from typing import Dict, Optional

from ai.exceptions import AIProviderConfigurationError
from ai.provider import AIProvider
from ai.providers.gemini import GeminiProvider
from ai.providers.own_model import OwnModelProvider
from core.config import settings

# In-memory singleton cache to prevent redundant client instantiation
_PROVIDER_INSTANCES: Dict[str, AIProvider] = {}


def clear_ai_provider_cache() -> None:
    """Clear cached AIProvider singleton instances (used in tests and reconfiguration)."""
    _PROVIDER_INSTANCES.clear()


def get_ai_provider(provider_type: Optional[str] = None, use_cache: bool = True) -> AIProvider:
    """Authoritative router to resolve and return the active AIProvider instance.

    Args:
        provider_type: Optional explicit provider name override ('gemini', 'custom').
                       If omitted or None, reads `settings.AI_PROVIDER`.
        use_cache: Whether to return a cached singleton instance. Defaults to True.

    Returns:
        An instance conforming to the `AIProvider` abstract contract.

    Raises:
        AIProviderConfigurationError: If AI_PROVIDER is missing, empty, or unsupported.
    """
    if provider_type is not None:
        raw_type = provider_type
    else:
        raw_type = getattr(settings, "AI_PROVIDER", None)

    # 1. Missing or empty check (strict, do not hide configuration mistakes)
    if raw_type is None or not str(raw_type).strip():
        raise AIProviderConfigurationError(
            "AI_PROVIDER is not set. Please configure AI_PROVIDER in your environment or .env file (supported values: 'gemini', 'custom').",
            provider="unknown",
        )

    # 2. Normalization (whitespace, casing)
    clean_type = str(raw_type).strip().lower()

    # 3. Canonical mapping
    if clean_type in ("gemini", "google_gemini", "google"):
        canonical_key = "gemini"
    elif clean_type in ("custom", "own_model", "ownmodel", "self_hosted"):
        canonical_key = "custom"
    else:
        # Strict: never silently fall back to Gemini on typos or unsupported providers!
        raise AIProviderConfigurationError(
            f"Unsupported AI provider '{raw_type.strip()}'. Supported providers are: 'gemini', 'custom'.",
            provider=raw_type.strip(),
        )

    # 4. Cached lifecycle resolution
    if use_cache and canonical_key in _PROVIDER_INSTANCES:
        return _PROVIDER_INSTANCES[canonical_key]

    if canonical_key == "gemini":
        instance = GeminiProvider()
    else:  # custom / own_model
        instance = OwnModelProvider()

    if use_cache:
        _PROVIDER_INSTANCES[canonical_key] = instance

    return instance


def get_current_ai_provider() -> AIProvider:
    """FastAPI-compatible dependency function to inject the configured AIProvider."""
    return get_ai_provider()
