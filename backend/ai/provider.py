"""Abstract base class for the provider-independent AI interface.

All model interactions across the application MUST use this contract.
Direct references to vendor SDKs (e.g. Google Gemini, Anthropic, or OpenAI)
are strictly prohibited in business services, routes, and background jobs.
"""

from abc import ABC, abstractmethod
from typing import Any, AsyncIterator, Dict, List, Optional, Type, Union
from pydantic import BaseModel

from ai.types import (
    AIMessage,
    AIRequest,
    AIResponse,
    AIStreamChunk,
    StructuredAIResponse,
    StructuredResponseRequest,
)


class AIProvider(ABC):
    """Abstract AI Provider interface contract."""

    @abstractmethod
    async def generate_response(
        self,
        messages: Union[List[AIMessage], AIRequest],
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        **kwargs: Any,
    ) -> AIResponse:
        """Generate a standard text response asynchronously.

        Args:
            messages: A list of AIMessage objects or a bundled AIRequest.
            system_prompt: Optional system instructions or persona.
            temperature: Sampling temperature between 0.0 and 1.0.
            max_tokens: Optional token generation limit.
            **kwargs: Optional provider-agnostic parameters.

        Returns:
            AIResponse containing the generated text, role, and metadata.
        """
        raise NotImplementedError

    @abstractmethod
    async def generate_structured_response(
        self,
        messages: Union[List[AIMessage], StructuredResponseRequest],
        response_schema: Optional[Union[Type[BaseModel], Dict[str, Any]]] = None,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        **kwargs: Any,
    ) -> StructuredAIResponse:
        """Generate structured output adhering to a Pydantic model or JSON Schema.

        Args:
            messages: A list of AIMessage objects or a bundled StructuredResponseRequest.
            response_schema: Target Pydantic model class or JSON Schema dictionary.
            system_prompt: Optional system instructions.
            temperature: Sampling temperature.
            **kwargs: Optional provider-agnostic parameters.

        Returns:
            StructuredAIResponse containing parsed structured data and raw response.
        """
        raise NotImplementedError

    @abstractmethod
    async def stream_response(
        self,
        messages: Union[List[AIMessage], AIRequest],
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        **kwargs: Any,
    ) -> AsyncIterator[AIStreamChunk]:
        """Stream generated text chunks incrementally as an asynchronous iterator.

        Args:
            messages: A list of AIMessage objects or a bundled AIRequest.
            system_prompt: Optional system instructions.
            temperature: Sampling temperature.
            max_tokens: Maximum tokens.
            **kwargs: Optional provider-agnostic parameters.

        Yields:
            AIStreamChunk instances carrying incremental content deltas.
        """
        raise NotImplementedError
        if False:
            yield AIStreamChunk(content="")
