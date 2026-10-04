"""AI module package.

Exposes the provider-independent AI interface, data types, domain exceptions,
provider implementations, and factory resolver.
"""

from ai.exceptions import (
    AIProviderConfigurationError,
    AIProviderError,
    AIProviderResponseError,
    AIProviderUnavailableError,
)
from ai.router import clear_ai_provider_cache, get_ai_provider, get_current_ai_provider
from ai.provider import AIProvider
from ai.providers.gemini import GeminiProvider
from ai.providers.own_model import OwnModelProvider
from ai.types import (
    AIMessage,
    AIRequest,
    AIResponse,
    AIRole,
    AIStreamChunk,
    StructuredAIResponse,
    StructuredResponseRequest,
)

__all__ = [
    # Core Interface, Router & Factory
    "AIProvider",
    "get_ai_provider",
    "get_current_ai_provider",
    "clear_ai_provider_cache",
    # Providers
    "GeminiProvider",
    "OwnModelProvider",
    # Types & Models
    "AIRole",
    "AIMessage",
    "AIResponse",
    "AIStreamChunk",
    "AIRequest",
    "StructuredResponseRequest",
    "StructuredAIResponse",
    # Exceptions
    "AIProviderError",
    "AIProviderConfigurationError",
    "AIProviderUnavailableError",
    "AIProviderResponseError",
]
