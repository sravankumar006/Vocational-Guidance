"""Google Gemini AI Provider implementation.

Encapsulates all Google Gemini SDK interactions, request formatting,
streaming, structured output validation, and error translation.
Application business logic and frontend layers interact exclusively
with the vendor-neutral AIProvider interface.
"""

import json
from typing import Any, AsyncIterator, Dict, List, Optional, Tuple, Type, Union
import httpx
from pydantic import BaseModel

from google import genai
from google.genai import errors, types

from ai.exceptions import (
    AIProviderConfigurationError,
    AIProviderError,
    AIProviderResponseError,
    AIProviderUnavailableError,
)
from ai.provider import AIProvider
from ai.types import (
    AIMessage,
    AIRequest,
    AIResponse,
    AIRole,
    AIStreamChunk,
    StructuredAIResponse,
    StructuredResponseRequest,
)
from core.config import settings


class GeminiProvider(AIProvider):
    """Google Gemini AI Provider."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        client: Optional[genai.Client] = None,
    ):
        """Initialize the Gemini provider.

        Args:
            api_key: Optional API key override. Defaults to settings.GEMINI_API_KEY.
            model_name: Optional model name. Defaults to 'gemini-1.5-pro'.
            client: Optional pre-configured genai.Client (useful for testing and dependency injection).
        """
        self.api_key = api_key
        self.model_name = model_name or "gemini-1.5-pro"
        self._client = client

    @property
    def client(self) -> genai.Client:
        """Lazily initialize and return the Google GenAI client.

        Raises:
            AIProviderConfigurationError: If no valid API key is configured.
        """
        if self._client is not None:
            return self._client

        # If api_key was explicitly passed (e.g. ""), use it; otherwise read from settings
        clean_key = (self.api_key if self.api_key is not None else settings.GEMINI_API_KEY or "").strip()

        if not clean_key or clean_key.upper().startswith("YOUR_GEMINI"):
            raise AIProviderConfigurationError(
                "GEMINI_API_KEY is not configured. Set GEMINI_API_KEY in your environment or .env file.",
                provider="gemini",
            )

        try:
            self._client = genai.Client(api_key=clean_key)
            return self._client
        except Exception as e:
            raise AIProviderConfigurationError(
                f"Failed to initialize Google GenAI client: {e}",
                provider="gemini",
            ) from e

    def _prepare_contents_and_config(
        self,
        messages: List[AIMessage],
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        top_p: Optional[float] = None,
        response_schema: Optional[Union[Type[BaseModel], Dict[str, Any]]] = None,
        extra_params: Optional[Dict[str, Any]] = None,
    ) -> Tuple[List[types.Content], types.GenerateContentConfig]:
        """Convert neutral AIMessages and parameters into Gemini contents and config."""
        system_instructions: List[str] = []
        if system_prompt and system_prompt.strip():
            system_instructions.append(system_prompt.strip())

        contents: List[types.Content] = []

        for msg in messages:
            role_str = msg.role.value if isinstance(msg.role, AIRole) else str(msg.role).lower()

            if role_str == "system":
                if msg.content.strip():
                    system_instructions.append(msg.content.strip())
            else:
                gemini_role = "user" if role_str in ("user", "function") else "model"
                part = types.Part.from_text(text=msg.content)
                contents.append(types.Content(role=gemini_role, parts=[part]))

        # Gemini requires at least one user content item
        if not contents:
            contents.append(types.Content(role="user", parts=[types.Part.from_text(text="")]))

        config_kwargs: Dict[str, Any] = {}
        if system_instructions:
            config_kwargs["system_instruction"] = "\n\n".join(system_instructions)
        if temperature is not None:
            config_kwargs["temperature"] = temperature
        if max_tokens is not None:
            config_kwargs["max_output_tokens"] = max_tokens
        if top_p is not None:
            config_kwargs["top_p"] = top_p

        if response_schema is not None:
            config_kwargs["response_mime_type"] = "application/json"
            config_kwargs["response_schema"] = response_schema

        if extra_params:
            for k, v in extra_params.items():
                if k not in config_kwargs:
                    config_kwargs[k] = v

        config = types.GenerateContentConfig(**config_kwargs)
        return contents, config

    def _map_exception(self, exc: Exception) -> AIProviderError:
        """Map SDK and network exceptions to standardized AIProviderError subclasses."""
        if isinstance(exc, (AIProviderError, AIProviderConfigurationError)):
            return exc

        if isinstance(exc, errors.APIError):
            status_code = getattr(exc, "code", None)
            message = getattr(exc, "message", str(exc))

            if status_code in (401, 403):
                return AIProviderConfigurationError(
                    f"Gemini authentication or authorization failed ({status_code}): {message}",
                    provider="gemini",
                )
            elif status_code in (429, 500, 502, 503, 504):
                return AIProviderUnavailableError(
                    f"Gemini service unavailable or rate limited ({status_code}): {message}",
                    provider="gemini",
                )
            return AIProviderResponseError(
                f"Gemini API returned error ({status_code}): {message}",
                provider="gemini",
            )

        if isinstance(exc, (httpx.TimeoutException, TimeoutError)):
            return AIProviderUnavailableError(
                f"Gemini request timed out: {exc}",
                provider="gemini",
            )

        if isinstance(exc, (httpx.NetworkError, ConnectionError)):
            return AIProviderUnavailableError(
                f"Network connection to Gemini failed: {exc}",
                provider="gemini",
            )

        return AIProviderResponseError(
            f"Unexpected error communicating with Gemini: {exc}",
            provider="gemini",
        )

    def _extract_usage(self, response: Any) -> Optional[Dict[str, int]]:
        """Extract token usage metrics from Gemini response."""
        usage_meta = getattr(response, "usage_metadata", None)
        if not usage_meta:
            return None

        prompt_tokens = getattr(usage_meta, "prompt_token_count", 0) or 0
        completion_tokens = getattr(usage_meta, "candidates_token_count", 0) or 0
        total_tokens = getattr(usage_meta, "total_token_count", 0) or (prompt_tokens + completion_tokens)

        return {
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": total_tokens,
        }

    def _extract_finish_reason(self, response: Any) -> Optional[str]:
        """Extract candidate termination reason."""
        candidates = getattr(response, "candidates", None)
        if candidates and len(candidates) > 0:
            finish_reason = getattr(candidates[0], "finish_reason", None)
            if finish_reason:
                return str(finish_reason)
        return None

    async def generate_response(
        self,
        messages: Union[List[AIMessage], AIRequest],
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        **kwargs: Any,
    ) -> AIResponse:
        """Generate a standard text response using Google Gemini."""
        if isinstance(messages, AIRequest):
            msg_list = messages.messages
            sys_prompt = messages.system_prompt or system_prompt
            temp = messages.temperature if messages.temperature is not None else temperature
            max_tok = messages.max_tokens if messages.max_tokens is not None else max_tokens
            top_p = messages.top_p
            extra = {**messages.extra_params, **kwargs}
        else:
            msg_list = messages
            sys_prompt = system_prompt
            temp = temperature
            max_tok = max_tokens
            top_p = kwargs.pop("top_p", None)
            extra = kwargs

        client = self.client
        contents, config = self._prepare_contents_and_config(
            messages=msg_list,
            system_prompt=sys_prompt,
            temperature=temp,
            max_tokens=max_tok,
            top_p=top_p,
            extra_params=extra,
        )

        models_to_try = [self.model_name]
        for candidate in ("gemini-3.1-flash-lite", "gemini-3.5-flash-lite", "gemini-3.8-flash"):
            if candidate not in models_to_try:
                models_to_try.append(candidate)

        last_error = None
        for model_id in models_to_try:
            try:
                raw_response = await client.aio.models.generate_content(
                    model=model_id,
                    contents=contents,
                    config=config,
                )

                content_text = getattr(raw_response, "text", "") or ""
                usage = self._extract_usage(raw_response)
                finish_reason = self._extract_finish_reason(raw_response)

                return AIResponse(
                    content=content_text,
                    role="assistant",
                    model=model_id,
                    finish_reason=finish_reason,
                    usage=usage,
                )
            except Exception as e:
                last_error = e
                err_str = str(e).lower()
                if "503" in err_str or "404" in err_str or "high demand" in err_str or "not found" in err_str:
                    continue
                raise self._map_exception(e) from e

        if last_error:
            raise self._map_exception(last_error) from last_error
        raise AIProviderError("No response returned from Gemini provider", provider="gemini")

    async def generate_structured_response(
        self,
        messages: Union[List[AIMessage], StructuredResponseRequest],
        response_schema: Optional[Union[Type[BaseModel], Dict[str, Any]]] = None,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        **kwargs: Any,
    ) -> StructuredAIResponse:
        """Generate structured output adhering to a Pydantic model or JSON Schema."""
        if isinstance(messages, StructuredResponseRequest):
            msg_list = messages.messages
            schema = messages.response_schema
            sys_prompt = messages.system_prompt or system_prompt
            temp = messages.temperature if messages.temperature is not None else temperature
            extra = {**messages.extra_params, **kwargs}
        else:
            msg_list = messages
            schema = response_schema
            sys_prompt = system_prompt
            temp = temperature
            extra = kwargs

        if schema is None:
            raise AIProviderResponseError(
                "response_schema must be provided for generate_structured_response",
                provider="gemini",
            )

        client = self.client
        contents, config = self._prepare_contents_and_config(
            messages=msg_list,
            system_prompt=sys_prompt,
            temperature=temp,
            response_schema=schema,
            extra_params=extra,
        )

        models_to_try = [self.model_name]
        for candidate in ("gemini-3.1-flash-lite", "gemini-3.5-flash-lite", "gemini-3.8-flash"):
            if candidate not in models_to_try:
                models_to_try.append(candidate)

        last_error = None
        for model_id in models_to_try:
            try:
                raw_response = await client.aio.models.generate_content(
                    model=model_id,
                    contents=contents,
                    config=config,
                )

                raw_text = getattr(raw_response, "text", "") or ""
                parsed_data = getattr(raw_response, "parsed", None)

                # If Gemini SDK did not automatically parse the response, parse JSON manually
                if parsed_data is None:
                    if not raw_text.strip():
                        raise AIProviderResponseError(
                            "Gemini returned empty text for structured output request",
                            provider="gemini",
                        )
                    try:
                        loaded = json.loads(raw_text)
                        if isinstance(schema, type) and issubclass(schema, BaseModel):
                            parsed_data = schema.model_validate(loaded)
                        else:
                            parsed_data = loaded
                    except Exception as parse_err:
                        raise AIProviderResponseError(
                            f"Failed to parse Gemini structured JSON: {parse_err}. Raw content: {raw_text[:200]}",
                            provider="gemini",
                        ) from parse_err

                usage = self._extract_usage(raw_response)
                finish_reason = self._extract_finish_reason(raw_response)

                return StructuredAIResponse(
                    parsed=parsed_data,
                    raw_content=raw_text,
                    model=model_id,
                    finish_reason=finish_reason,
                    usage=usage,
                )
            except Exception as e:
                last_error = e
                err_str = str(e).lower()
                if "503" in err_str or "404" in err_str or "high demand" in err_str or "not found" in err_str:
                    continue
                raise self._map_exception(e) from e

        if last_error:
            raise self._map_exception(last_error) from last_error
        raise AIProviderError("No response returned from Gemini provider", provider="gemini")

    async def stream_response(
        self,
        messages: Union[List[AIMessage], AIRequest],
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        **kwargs: Any,
    ) -> AsyncIterator[AIStreamChunk]:
        """Stream generated text chunks incrementally as an asynchronous iterator."""
        if isinstance(messages, AIRequest):
            msg_list = messages.messages
            sys_prompt = messages.system_prompt or system_prompt
            temp = messages.temperature if messages.temperature is not None else temperature
            max_tok = messages.max_tokens if messages.max_tokens is not None else max_tokens
            top_p = messages.top_p
            extra = {**messages.extra_params, **kwargs}
        else:
            msg_list = messages
            sys_prompt = system_prompt
            temp = temperature
            max_tok = max_tokens
            top_p = kwargs.pop("top_p", None)
            extra = kwargs

        try:
            client = self.client
            contents, config = self._prepare_contents_and_config(
                messages=msg_list,
                system_prompt=sys_prompt,
                temperature=temp,
                max_tokens=max_tok,
                top_p=top_p,
                extra_params=extra,
            )

            stream = await client.aio.models.generate_content_stream(
                model=self.model_name,
                contents=contents,
                config=config,
            )
        except Exception as e:
            raise self._map_exception(e) from e

        chunk_index = 0
        try:
            async for chunk in stream:
                chunk_text = getattr(chunk, "text", "") or ""
                finish_reason = self._extract_finish_reason(chunk)
                is_final = bool(finish_reason and finish_reason not in ("", "None"))

                yield AIStreamChunk(
                    content=chunk_text,
                    index=chunk_index,
                    is_final=is_final,
                    finish_reason=finish_reason,
                )
                chunk_index += 1
        except Exception as e:
            raise self._map_exception(e) from e
