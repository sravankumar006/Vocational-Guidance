"""Exceptions for the AI provider abstraction layer.

Ensures that upstream API errors, network failures, and configuration gaps
are cleanly mapped to domain-specific exceptions rather than exposing raw
vendor SDK internals to application business logic.
"""


class AIProviderError(Exception):
    """Base exception for all AI provider abstraction errors."""

    def __init__(self, message: str, provider: str = "unknown"):
        super().__init__(message)
        self.message = message
        self.provider = provider

    def __str__(self) -> str:
        return f"[{self.provider}] {self.message}"


class AIProviderConfigurationError(AIProviderError):
    """Raised when an AI provider is missing configuration or requested with an invalid name."""

    def __init__(self, message: str, provider: str = "unknown"):
        super().__init__(message, provider=provider)


class AIProviderUnavailableError(AIProviderError):
    """Raised when an AI provider's upstream service is unreachable, timed out, or rate-limited."""

    def __init__(self, message: str, provider: str = "unknown"):
        super().__init__(message, provider=provider)


class AIProviderResponseError(AIProviderError):
    """Raised when an AI provider returns an invalid response, malformed JSON, or schema violation."""

    def __init__(self, message: str, provider: str = "unknown"):
        super().__init__(message, provider=provider)
