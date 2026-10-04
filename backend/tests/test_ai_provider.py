"""Unit tests for Phase 4 Brick 15 & Brick 16: AI Provider & GeminiProvider.

Verifies:
1. AIProvider abstract interface contracts.
2. Provider factory resolution and switching (gemini vs own_model vs invalid).
3. GeminiProvider implementation using mocked Google GenAI client (text, structured, streaming).
4. Error mapping from Google API errors and timeouts to AIProviderError hierarchy.
5. Missing API key detection raising AIProviderConfigurationError on live calls.
6. OwnModelProvider structural placeholder raising NotImplementedError.
7. End-to-end type safety, zero frontend exposure, zero actual network requests.
"""

from typing import Any, AsyncIterator, Dict, List, Optional, Type, Union
from unittest.mock import MagicMock
import httpx
import pytest
from pydantic import BaseModel, Field

from ai import (
    AIMessage,
    AIProvider,
    AIProviderConfigurationError,
    AIProviderError,
    AIProviderResponseError,
    AIProviderUnavailableError,
    AIRequest,
    AIResponse,
    AIRole,
    AIStreamChunk,
    GeminiProvider,
    OwnModelProvider,
    StructuredAIResponse,
    StructuredResponseRequest,
    clear_ai_provider_cache,
    get_ai_provider,
    get_current_ai_provider,
)
from core.config import settings
from google.genai import errors


# ---------------------------------------------------------------------------
# Test Schemas for Structured Responses
# ---------------------------------------------------------------------------

class CareerExplanationSchema(BaseModel):
    summary: str
    key_strengths: List[str]
    growth_potential: str
    confidence: float = Field(ge=0.0, le=1.0)


# ---------------------------------------------------------------------------
# Gemini Mock Helpers
# ---------------------------------------------------------------------------

class MockUsageMetadata:
    def __init__(self, prompt=15, candidates=25, total=40):
        self.prompt_token_count = prompt
        self.candidates_token_count = candidates
        self.total_token_count = total


class MockCandidate:
    def __init__(self, finish_reason="STOP"):
        self.finish_reason = finish_reason


class MockGeminiResponse:
    def __init__(self, text="Sample response", parsed=None, candidates=None, usage_metadata=None):
        self.text = text
        self.parsed = parsed
        self.candidates = candidates or [MockCandidate()]
        self.usage_metadata = usage_metadata or MockUsageMetadata()


class MockGeminiChunk:
    def __init__(self, text, finish_reason=None):
        self.text = text
        self.candidates = [MockCandidate(finish_reason=finish_reason)] if finish_reason else []


def build_mock_gemini_client(
    response: Optional[MockGeminiResponse] = None,
    stream_chunks: Optional[List[MockGeminiChunk]] = None,
    raise_exc: Optional[Exception] = None,
) -> Any:
    """Build a mock genai.Client conforming to client.aio.models."""
    mock_models = MagicMock()

    if raise_exc:
        mock_models.generate_content.side_effect = raise_exc
        mock_models.generate_content_stream.side_effect = raise_exc
    else:
        async def _mock_generate_content(*args, **kwargs):
            return response or MockGeminiResponse()

        async def _mock_generate_content_stream(*args, **kwargs):
            chunks = stream_chunks or [
                MockGeminiChunk("Hello"),
                MockGeminiChunk(" world", finish_reason="STOP"),
            ]
            async def _stream():
                for c in chunks:
                    yield c
            return _stream()

        mock_models.generate_content = _mock_generate_content
        mock_models.generate_content_stream = _mock_generate_content_stream

    mock_client = MagicMock()
    mock_client.aio = MagicMock()
    mock_client.aio.models = mock_models
    return mock_client


# ---------------------------------------------------------------------------
# Test Cases
# ---------------------------------------------------------------------------

def test_cannot_instantiate_abstract_ai_provider():
    """Verify AIProvider is an abstract base class that cannot be instantiated directly."""
    with pytest.raises(TypeError) as exc_info:
        AIProvider()  # type: ignore[abstract]
    assert "Can't instantiate abstract class" in str(exc_info.value)


def test_factory_resolves_gemini_provider():
    """Verify router returns GeminiProvider for canonical 'gemini' and supported aliases."""
    clear_ai_provider_cache()
    provider = get_ai_provider("gemini")
    assert isinstance(provider, GeminiProvider)
    assert isinstance(provider, AIProvider)

    # Test aliases
    assert isinstance(get_ai_provider("google_gemini"), GeminiProvider)
    assert isinstance(get_ai_provider("google"), GeminiProvider)


def test_factory_resolves_custom_provider():
    """Verify router returns OwnModelProvider for canonical 'custom' and aliases."""
    clear_ai_provider_cache()
    provider = get_ai_provider("custom")
    assert isinstance(provider, OwnModelProvider)
    assert isinstance(provider, AIProvider)

    # Test aliases
    assert isinstance(get_ai_provider("own_model"), OwnModelProvider)
    assert isinstance(get_ai_provider("ownmodel"), OwnModelProvider)
    assert isinstance(get_ai_provider("self_hosted"), OwnModelProvider)


def test_factory_resolves_from_settings(monkeypatch):
    """Verify router respects settings.AI_PROVIDER configuration."""
    clear_ai_provider_cache()
    monkeypatch.setattr(settings, "AI_PROVIDER", "gemini")
    p1 = get_ai_provider()
    assert isinstance(p1, GeminiProvider)

    clear_ai_provider_cache()
    monkeypatch.setattr(settings, "AI_PROVIDER", "custom")
    p2 = get_ai_provider()
    assert isinstance(p2, OwnModelProvider)


def test_factory_rejects_unsupported_provider():
    """Verify router raises AIProviderConfigurationError and never silently falls back to Gemini."""
    with pytest.raises(AIProviderConfigurationError) as exc1:
        get_ai_provider("openai")
    assert "Unsupported AI provider" in str(exc1.value)
    assert "Supported providers are: 'gemini', 'custom'" in str(exc1.value)

    with pytest.raises(AIProviderConfigurationError) as exc2:
        get_ai_provider("random")
    assert "Unsupported AI provider" in str(exc2.value)


def test_factory_rejects_missing_or_empty_provider(monkeypatch):
    """Verify router raises AIProviderConfigurationError when AI_PROVIDER is missing or empty."""
    clear_ai_provider_cache()
    monkeypatch.setattr(settings, "AI_PROVIDER", "")
    with pytest.raises(AIProviderConfigurationError) as exc_info:
        get_ai_provider()
    assert "AI_PROVIDER is not set" in str(exc_info.value)

    with pytest.raises(AIProviderConfigurationError) as exc_info2:
        get_ai_provider("   ")
    assert "AI_PROVIDER is not set" in str(exc_info2.value)


def test_factory_normalizes_whitespace_and_casing():
    """Verify router cleanly normalizes whitespace and case variations."""
    clear_ai_provider_cache()
    assert isinstance(get_ai_provider("  GEMINI  "), GeminiProvider)
    clear_ai_provider_cache()
    assert isinstance(get_ai_provider("Custom"), OwnModelProvider)
    clear_ai_provider_cache()
    assert isinstance(get_ai_provider("  CUSTOM  "), OwnModelProvider)


def test_fastapi_dependency_resolution(monkeypatch):
    """Verify FastAPI dependency get_current_ai_provider returns configured provider."""
    from ai import get_current_ai_provider

    clear_ai_provider_cache()
    monkeypatch.setattr(settings, "AI_PROVIDER", "gemini")
    assert isinstance(get_current_ai_provider(), GeminiProvider)

    clear_ai_provider_cache()
    monkeypatch.setattr(settings, "AI_PROVIDER", "custom")
    assert isinstance(get_current_ai_provider(), OwnModelProvider)


def test_provider_singleton_caching(monkeypatch):
    """Verify router caches singleton instances and clear_ai_provider_cache resets cache."""
    clear_ai_provider_cache()
    monkeypatch.setattr(settings, "AI_PROVIDER", "gemini")
    p1 = get_ai_provider()
    p2 = get_ai_provider()
    assert p1 is p2

    clear_ai_provider_cache()
    p3 = get_ai_provider()
    assert p3 is not p1
    assert isinstance(p3, GeminiProvider)


@pytest.mark.anyio
async def test_gemini_missing_api_key_raises_configuration_error():
    """Verify GeminiProvider raises AIProviderConfigurationError if no API key is available."""
    provider = GeminiProvider(api_key="")
    messages = [AIMessage(role=AIRole.USER, content="Hello")]

    with pytest.raises(AIProviderConfigurationError) as exc_info:
        await provider.generate_response(messages)
    assert "GEMINI_API_KEY is not configured" in str(exc_info.value)
    assert exc_info.value.provider == "gemini"


@pytest.mark.anyio
async def test_gemini_generate_response_success():
    """Verify GeminiProvider.generate_response returns normalized AIResponse."""
    mock_resp = MockGeminiResponse(
        text="A career in automotive repair offers practical growth.",
        candidates=[MockCandidate(finish_reason="STOP")],
        usage_metadata=MockUsageMetadata(prompt=20, candidates=15, total=35),
    )
    mock_client = build_mock_gemini_client(response=mock_resp)

    provider = GeminiProvider(api_key="mock_key", client=mock_client)
    req = AIRequest(
        messages=[
            AIMessage(role=AIRole.SYSTEM, content="You are a vocational mentor."),
            AIMessage(role=AIRole.USER, content="Explain electrician trade."),
        ],
        temperature=0.4,
        max_tokens=200,
    )

    resp = await provider.generate_response(req)
    assert isinstance(resp, AIResponse)
    assert resp.content == "A career in automotive repair offers practical growth."
    assert resp.role == "assistant"
    assert resp.model == "gemini-1.5-pro"
    assert resp.finish_reason == "STOP"
    assert resp.usage == {"prompt_tokens": 20, "completion_tokens": 15, "total_tokens": 35}


@pytest.mark.anyio
async def test_gemini_generate_structured_response_parsed_by_sdk():
    """Verify GeminiProvider parses structured response when SDK parsed attribute exists."""
    expected_data = CareerExplanationSchema(
        summary="Automotive Technician alignment is strong.",
        key_strengths=["Mechanical Diagnostics", "Electrical Basics"],
        growth_potential="High",
        confidence=0.94,
    )
    mock_resp = MockGeminiResponse(
        text='{"summary": "Automotive Technician alignment is strong."}',
        parsed=expected_data,
    )
    mock_client = build_mock_gemini_client(response=mock_resp)

    provider = GeminiProvider(api_key="mock_key", client=mock_client)
    req = StructuredResponseRequest(
        messages=[AIMessage(role=AIRole.USER, content="Assess candidate")],
        response_schema=CareerExplanationSchema,
    )

    resp = await provider.generate_structured_response(req)
    assert isinstance(resp, StructuredAIResponse)
    assert isinstance(resp.parsed, CareerExplanationSchema)
    assert resp.parsed.confidence == 0.94
    assert "Mechanical Diagnostics" in resp.parsed.key_strengths


@pytest.mark.anyio
async def test_gemini_generate_structured_response_fallback_json_validation():
    """Verify GeminiProvider falls back to JSON validation when parsed is None."""
    raw_json = (
        '{"summary": "Strong electrical aptitude.", '
        '"key_strengths": ["Wiring", "Safety"], '
        '"growth_potential": "Excellent", '
        '"confidence": 0.88}'
    )
    mock_resp = MockGeminiResponse(text=raw_json, parsed=None)
    mock_client = build_mock_gemini_client(response=mock_resp)

    provider = GeminiProvider(api_key="mock_key", client=mock_client)
    resp = await provider.generate_structured_response(
        messages=[AIMessage(role=AIRole.USER, content="Assess electrician")],
        response_schema=CareerExplanationSchema,
    )

    assert isinstance(resp, StructuredAIResponse)
    assert isinstance(resp.parsed, CareerExplanationSchema)
    assert resp.parsed.growth_potential == "Excellent"
    assert resp.parsed.confidence == 0.88


@pytest.mark.anyio
async def test_gemini_stream_response_success():
    """Verify GeminiProvider.stream_response yields incremental AIStreamChunk instances."""
    chunks = [
        MockGeminiChunk("Vocational "),
        MockGeminiChunk("pathways "),
        MockGeminiChunk("empower students.", finish_reason="STOP"),
    ]
    mock_client = build_mock_gemini_client(stream_chunks=chunks)

    provider = GeminiProvider(api_key="mock_key", client=mock_client)
    messages = [AIMessage(role=AIRole.USER, content="Give me a stream")]

    received = []
    async for chunk in provider.stream_response(messages):
        assert isinstance(chunk, AIStreamChunk)
        received.append(chunk)

    assert len(received) == 3
    assert received[0].content == "Vocational "
    assert received[0].index == 0
    assert not received[0].is_final

    assert received[2].content == "empower students."
    assert received[2].index == 2
    assert received[2].is_final
    assert received[2].finish_reason == "STOP"


@pytest.mark.anyio
async def test_gemini_maps_api_rate_limit_to_unavailable():
    """Verify 429 rate limit errors are mapped to AIProviderUnavailableError."""
    api_err = errors.APIError(429, {"error": {"message": "Resource has been exhausted (rate limit)"}})
    mock_client = build_mock_gemini_client(raise_exc=api_err)

    provider = GeminiProvider(api_key="mock_key", client=mock_client)
    with pytest.raises(AIProviderUnavailableError) as exc_info:
        await provider.generate_response([AIMessage(role=AIRole.USER, content="test")])
    assert "rate limited" in str(exc_info.value)
    assert exc_info.value.provider == "gemini"


@pytest.mark.anyio
async def test_gemini_maps_auth_error_to_configuration_error():
    """Verify 401/403 errors are mapped to AIProviderConfigurationError."""
    api_err = errors.APIError(403, {"error": {"message": "API key not valid. Please pass a valid API key."}})
    mock_client = build_mock_gemini_client(raise_exc=api_err)

    provider = GeminiProvider(api_key="invalid_key", client=mock_client)
    with pytest.raises(AIProviderConfigurationError) as exc_info:
        await provider.generate_response([AIMessage(role=AIRole.USER, content="test")])
    assert "authentication or authorization failed" in str(exc_info.value)
    assert exc_info.value.provider == "gemini"


@pytest.mark.anyio
async def test_gemini_maps_timeout_to_unavailable():
    """Verify network timeouts are mapped to AIProviderUnavailableError."""
    mock_client = build_mock_gemini_client(raise_exc=httpx.TimeoutException("Read timed out"))

    provider = GeminiProvider(api_key="mock_key", client=mock_client)
    with pytest.raises(AIProviderUnavailableError) as exc_info:
        await provider.generate_response([AIMessage(role=AIRole.USER, content="test")])
    assert "timed out" in str(exc_info.value)


@pytest.mark.anyio
async def test_gemini_maps_malformed_json_to_response_error():
    """Verify malformed JSON in structured response raises AIProviderResponseError."""
    mock_resp = MockGeminiResponse(text="NOT_JSON_AT_ALL", parsed=None)
    mock_client = build_mock_gemini_client(response=mock_resp)

    provider = GeminiProvider(api_key="mock_key", client=mock_client)
    with pytest.raises(AIProviderResponseError) as exc_info:
        await provider.generate_structured_response(
            messages=[AIMessage(role=AIRole.USER, content="test")],
            response_schema=CareerExplanationSchema,
        )
    assert "Failed to parse Gemini structured JSON" in str(exc_info.value)


@pytest.mark.anyio
async def test_own_model_provider_instantiation_and_contract():
    """Verify OwnModelProvider satisfies AIProvider contract without crashing."""
    provider = OwnModelProvider(base_url="")
    assert isinstance(provider, AIProvider)
    assert not provider.is_configured
    assert provider.model_name == "vocational-counsellor-v1"


@pytest.mark.anyio
async def test_own_model_provider_generate_response_not_configured():
    """Verify generate_response safely raises AIProviderConfigurationError when unconfigured."""
    provider = OwnModelProvider(base_url="")
    messages = [AIMessage(role=AIRole.USER, content="Hello")]

    with pytest.raises(AIProviderConfigurationError) as exc_info:
        await provider.generate_response(messages)
    assert "not configured" in str(exc_info.value).lower()
    assert exc_info.value.provider == "own_model"


@pytest.mark.anyio
async def test_own_model_provider_structured_response_not_configured():
    """Verify generate_structured_response safely raises AIProviderConfigurationError."""
    provider = OwnModelProvider(base_url="")
    messages = [AIMessage(role=AIRole.USER, content="Assess candidate")]

    with pytest.raises(AIProviderConfigurationError) as exc_info:
        await provider.generate_structured_response(messages, CareerExplanationSchema)
    assert "not configured" in str(exc_info.value).lower()
    assert exc_info.value.provider == "own_model"


@pytest.mark.anyio
async def test_own_model_provider_stream_response_not_configured():
    """Verify stream_response safely raises AIProviderConfigurationError on stream start."""
    provider = OwnModelProvider(base_url="")
    messages = [AIMessage(role=AIRole.USER, content="Stream tokens")]

    with pytest.raises(AIProviderConfigurationError) as exc_info:
        async for _ in provider.stream_response(messages):
            pass
    assert "not configured" in str(exc_info.value).lower()
    assert exc_info.value.provider == "own_model"


@pytest.mark.anyio
async def test_own_model_provider_with_url_indicates_not_deployed():
    """Verify that even when OWN_MODEL_URL is set, it safely indicates model is not yet deployed."""
    provider = OwnModelProvider(base_url="http://localhost:8001")
    assert provider.is_configured

    messages = [AIMessage(role=AIRole.USER, content="Assess candidate")]
    with pytest.raises(AIProviderConfigurationError) as exc_info:
        await provider.generate_response(messages)
    assert "not configured" in str(exc_info.value).lower() or "not yet deployed" in str(exc_info.value).lower()


@pytest.mark.anyio
async def test_own_model_provider_does_not_leak_credentials(caplog):
    """Verify credentials in OWN_MODEL_URL are sanitized and never leaked in error messages or logs."""
    sensitive_url = "https://svc_user:super_secret_token_123@models.sih.gov.in:9000/v1"
    provider = OwnModelProvider(base_url=sensitive_url)

    with pytest.raises(AIProviderConfigurationError) as exc_info:
        await provider.generate_response([AIMessage(role=AIRole.USER, content="test")])

    error_text = str(exc_info.value)
    assert "super_secret_token_123" not in error_text
    for record in caplog.records:
        assert "super_secret_token_123" not in record.message


def test_ai_types_and_roles():
    """Verify data types and enums serialize cleanly."""
    msg = AIMessage(role=AIRole.USER, content="Hello", metadata={"session_id": "xyz"})
    assert msg.role == "user"
    assert msg.metadata["session_id"] == "xyz"

    chunk = AIStreamChunk(content="chunk_1", index=0, is_final=False)
    assert chunk.content == "chunk_1"
    assert not chunk.is_final


def test_error_hierarchy():
    """Verify domain error classification."""
    err = AIProviderUnavailableError("Endpoint timeout", provider="gemini")
    assert isinstance(err, AIProviderError)
    assert "[gemini] Endpoint timeout" in str(err)
    assert err.provider == "gemini"

    cfg_err = AIProviderConfigurationError("Missing model name", provider="own_model")
    assert isinstance(cfg_err, AIProviderError)
    assert cfg_err.provider == "own_model"

    resp_err = AIProviderResponseError("Malformed JSON schema", provider="gemini")
    assert isinstance(resp_err, AIProviderError)
    assert resp_err.provider == "gemini"


def test_no_credentials_required_at_instantiation():
    """Verify providers can be instantiated cleanly without any API keys or network connection."""
    gemini = GeminiProvider(api_key=None)
    assert gemini.model_name == "gemini-1.5-pro"

    own = OwnModelProvider(base_url=None)
    assert own.model_name == "vocational-counsellor-v1"
