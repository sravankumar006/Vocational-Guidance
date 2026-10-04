"""Custom self-hosted / fine-tuned model provider implementation.

This provider implements the AIProvider contract for the project's future
proprietary/fine-tuned vocational guidance model (configured via OWN_MODEL_URL).
Currently, the model server is not deployed, so all operations safely indicate
"Not configured" via AIProviderConfigurationError without crashing the application
or making external network requests.
"""

import logging
from typing import Any, AsyncIterator, Dict, List, Optional, Type, Union
from urllib.parse import urlparse
from pydantic import BaseModel

from ai.exceptions import AIProviderConfigurationError
from ai.provider import AIProvider
from ai.types import (
    AIMessage,
    AIRequest,
    AIResponse,
    AIStreamChunk,
    StructuredAIResponse,
    StructuredResponseRequest,
)
from core.config import settings

logger = logging.getLogger(__name__)


def _sanitize_url(url: Optional[str]) -> str:
    """Sanitize URL to prevent leaking any embedded authentication credentials."""
    if not url:
        return ""
    try:
        parsed = urlparse(url)
        if parsed.password:
            sanitized = parsed._replace(netloc=f"{parsed.username}:***@{parsed.hostname}:{parsed.port}")
            return sanitized.geturl()
        return url
    except Exception:
        return "<sanitized-url>"


class OwnModelProvider(AIProvider):
    """Custom self-hosted model AI Provider."""

    def __init__(
        self,
        base_url: Optional[str] = None,
        model_name: Optional[str] = None,
        client: Optional[Any] = None,
        timeout: float = 30.0,
    ):
        """Initialize OwnModel provider configuration.

        Args:
            base_url: Optional endpoint URL. Defaults to settings.OWN_MODEL_URL.
            model_name: Optional model identifier. Defaults to 'vocational-counsellor-v1'.
            client: Optional pre-configured HTTP client (for future inference/testing).
            timeout: Default request timeout in seconds.
        """
        self.base_url = (base_url if base_url is not None else settings.OWN_MODEL_URL).strip()
        self.model_name = model_name or "vocational-counsellor-v1"
        self._client = client
        self.timeout = timeout

    @property
    def is_configured(self) -> bool:
        """Check whether the model provider has a configured endpoint URL."""
        return bool(self.base_url)

    def _ensure_configured(self) -> None:
        """Validate that the custom model endpoint is configured and active.

        Raises:
            AIProviderConfigurationError: Explaining the own model is not configured.
        """
        if not self.is_configured:
            logger.warning("Own model provider is not configured.")
            raise AIProviderConfigurationError(
                "Own model provider is not configured: OWN_MODEL_URL is missing or empty.",
                provider="own_model",
            )

        # In this phase, the custom model endpoint is not yet activated/deployed.
        sanitized = _sanitize_url(self.base_url)
        logger.info(f"Own model provider endpoint is set ({sanitized}), but service is not yet deployed.")
        raise AIProviderConfigurationError(
            "Own model provider is not configured: custom model server is not yet deployed.",
            provider="own_model",
        )

    async def generate_response(
        self,
        messages: Union[List[AIMessage], AIRequest],
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        **kwargs: Any,
    ) -> AIResponse:
        """Safely indicate that the custom model is not configured."""
        self._ensure_configured()
        # Future implementation will send async inference request to self.base_url
        raise AIProviderConfigurationError(
            "Own model provider is not configured.",
            provider="own_model",
        )

    async def generate_structured_response(
        self,
        messages: Union[List[AIMessage], StructuredResponseRequest],
        response_schema: Optional[Union[Type[BaseModel], Dict[str, Any]]] = None,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        **kwargs: Any,
    ) -> StructuredAIResponse:
        """Safely indicate that the custom model is not configured."""
        self._ensure_configured()
        # Future implementation will enforce schema on self.base_url output
        raise AIProviderConfigurationError(
            "Own model provider is not configured.",
            provider="own_model",
        )

    async def stream_response(
        self,
        messages: Union[List[AIMessage], AIRequest],
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        **kwargs: Any,
    ) -> AsyncIterator[AIStreamChunk]:
        """Safely indicate that the custom model is not configured during streaming."""
        self._ensure_configured()
        # Unreachable in current phase due to _ensure_configured, but preserves generator signature
        if False:
            yield AIStreamChunk(content="")
