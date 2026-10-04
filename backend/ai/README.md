# AI Architecture: AIProvider Abstraction Layer

## 1. What `AIProvider` Is
`AIProvider` is an abstract base class (`backend/ai/provider.py`) defining a vendor-neutral contract for AI model interactions within the Vocational Guidance Platform. It standardizes three primary asynchronous operations:
- `generate_response()`: Standard text generation.
- `generate_structured_response()`: Schema-driven JSON / Pydantic object generation.
- `stream_response()`: Incremental async token chunk streaming.

## 2. Why the Application Uses It
Direct coupling to vendor SDKs (such as Google Gemini, Anthropic, or OpenAI) introduces technical debt, vendor lock-in, and fragile test suites. The `AIProvider` layer:
- **Decouples Business Logic**: Features (counselling, explanations, recommendations) only depend on neutral request/response contracts (`AIMessage`, `AIResponse`, `StructuredAIResponse`).
- **Simplifies Testing**: Unit and integration tests can execute against mock or stub providers with zero external network overhead and zero API key requirements.
- **Enables Provider Portability**: Switching between cloud LLMs and private on-premise infrastructure requires zero changes to application controllers or domain services.

## 3. How Gemini Will Later Be Plugged In (Phase 4 Brick 16)
The structural placeholder `GeminiProvider` (`backend/ai/providers/gemini.py`):
1. Reads `settings.GEMINI_API_KEY`.
2. Translates vendor-neutral `AIMessage` history into Gemini's `Content` and `Part` objects.
3. Calls the official Google GenAI / Gemini SDK inside `GeminiProvider` methods.
4. Normalizes Gemini responses and streaming chunks back into standard `AIResponse` and `AIStreamChunk` instances.

## 4. Future Custom Model Provider (Phase 4 Brick 17)
The custom model provider `OwnModelProvider` (`backend/ai/providers/own_model.py`):
1. Reads `settings.OWN_MODEL_URL`.
2. Validates deployment status via `is_configured` and `_ensure_configured()`.
3. In this phase, since the custom model server is not yet deployed, all operations safely raise a controlled `AIProviderConfigurationError` ("Own model provider is not configured") without attempting network requests or crashing the application.
4. Once the model server is live, the provider will send async HTTP inference requests to `OWN_MODEL_URL` without altering the `AIProvider` contract.
5. Can be activated at any time by configuring `AI_PROVIDER=own_model` in `.env`.


## 5. Why Business Logic Must Never Call Providers Directly
```
                  Application Layer
        (Services, Routers, Background Tasks)
                         │
                         ▼
                    AIProvider
                   /          \
                  ▼            ▼
          GeminiProvider   OwnModelProvider
                │                  │
                ▼                  ▼
           Gemini API         OWN_MODEL_URL
```
1. **Security & Leaks**: Vendor SDK instances could inadvertently log API credentials or leak internal tokens.
2. **Deterministic Fallbacks**: Business logic should never fail catastrophically when a single AI vendor experiences an outage; the provider abstraction enables clean fallbacks or synthetic error handling.
3. **Architectural Purity**: Business logic is responsible for educational counselling rules, family decision workflows, and student telemetry — not HTTP headers, rate-limiting backoffs, or vendor-specific serialization quirks.

## 6. Authoritative AI Provider Router (Phase 4 Brick 18)
The provider router (`backend/ai/router.py`) acts as the single point of resolution for model providers:
```
                      Application
                           │
                           ▼
                  get_ai_provider()
                  (AI Provider Router)
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
    AI_PROVIDER=gemini          AI_PROVIDER=custom
             │                           │
             ▼                           ▼
      GeminiProvider              OwnModelProvider
```
- **Canonical Values**:
  - `AI_PROVIDER=gemini` $\rightarrow$ resolves `GeminiProvider`
  - `AI_PROVIDER=custom` $\rightarrow$ resolves `OwnModelProvider`
- **Strict Validation**: Typo or unsupported provider names (e.g. `openai`, `random`) raise `AIProviderConfigurationError` and **never** silently fall back to Gemini.
- **Missing Value Handling**: Missing or empty `AI_PROVIDER` raises an explicit `AIProviderConfigurationError`.
- **FastAPI Integration**: Exposes `get_current_ai_provider()` as a dependency for dependency injection into route endpoints.
- **Singleton Caching**: Caches instantiated providers in-memory to prevent repeated client recreation, with `clear_ai_provider_cache()` for testing.

