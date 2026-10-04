"""Embedding abstraction layer and providers for vector search.

Decouples semantic vector generation from any specific external vendor.
Provides an abstract base class, a deterministic local provider for offline
execution and testing, and a factory resolver.
"""

from abc import ABC, abstractmethod
import hashlib
import math
from typing import List, Optional

from core.config import settings


def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Calculate the cosine similarity between two numeric vectors."""
    if len(vec_a) != len(vec_b) or not vec_a:
        return 0.0

    dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))

    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0

    return dot_product / (norm_a * norm_b)


class EmbeddingProvider(ABC):
    """Abstract interface contract for text embedding generation."""

    @property
    @abstractmethod
    def dimension(self) -> int:
        """Vector dimension produced by this embedding provider."""
        ...

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Underlying model identifier."""
        ...

    @abstractmethod
    def embed_text(self, text: str) -> List[float]:
        """Generate a dense vector embedding for a single text query."""
        ...

    @abstractmethod
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """Generate dense vector embeddings for a list of documents."""
        ...


class DeterministicLocalEmbedding(EmbeddingProvider):
    """Safe, zero-network deterministic embedding provider.

    Projects text into a reproducible, unit-normalized dense vector space using
    cryptographic hashing and token n-gram distribution.
    Enables local development, fast testing, and pgvector benchmarking without external APIs.
    """

    def __init__(self, dimension: Optional[int] = None, model_name: str = "deterministic-local-v1"):
        self._dim = dimension or settings.EMBEDDING_DIMENSION
        self._model_name = model_name

    @property
    def dimension(self) -> int:
        return self._dim

    @property
    def model_name(self) -> str:
        return self._model_name

    def embed_text(self, text: str) -> List[float]:
        """Convert text into a deterministic, unit-normalized vector."""
        clean_text = (text or "").strip().lower()
        if not clean_text:
            return [0.0] * self._dim

        vec = [0.0] * self._dim
        tokens = clean_text.split()

        # Project token n-grams across vector dimensions
        for token in tokens:
            token_hash = int(hashlib.sha256(token.encode("utf-8")).hexdigest(), 16)
            primary_idx = token_hash % self._dim
            secondary_idx = (token_hash >> 16) % self._dim
            weight = 1.0 + (token_hash % 5) * 0.2

            vec[primary_idx] += weight
            vec[secondary_idx] += weight * 0.5

        # Also project character 3-grams for subword matching
        for i in range(max(1, len(clean_text) - 2)):
            tri = clean_text[i : i + 3]
            tri_hash = int(hashlib.md5(tri.encode("utf-8")).hexdigest(), 16)
            idx = tri_hash % self._dim
            vec[idx] += 0.3

        # L2-normalize to unit length
        norm = math.sqrt(sum(v * v for v in vec))
        if norm > 0:
            vec = [round(v / norm, 6) for v in vec]

        return vec

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """Batch-embed multiple text documents."""
        return [self.embed_text(t) for t in texts]


class GoogleEmbeddingProvider(EmbeddingProvider):
    """Google Gemini text-embedding-004 provider boundary."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        dimension: Optional[int] = None,
    ):
        self._api_key = api_key or settings.GEMINI_API_KEY
        self._model_name = model_name or settings.EMBEDDING_MODEL
        self._dimension = dimension or settings.EMBEDDING_DIMENSION
        self._fallback = DeterministicLocalEmbedding(dimension=self._dimension)

    @property
    def dimension(self) -> int:
        return self._dimension

    @property
    def model_name(self) -> str:
        return self._model_name

    def embed_text(self, text: str) -> List[float]:
        # If API key is not yet configured, use deterministic local fallback
        if not self._api_key or not self._api_key.strip():
            return self._fallback.embed_text(text)

        try:
            from google import genai
            client = genai.Client(api_key=self._api_key.strip())
            result = client.models.embed_content(
                model=self._model_name,
                contents=text,
            )
            embedding_vals = result.embedding.values
            return list(embedding_vals)
        except Exception:
            # Safe non-crashing fallback
            return self._fallback.embed_text(text)

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [self.embed_text(t) for t in texts]


def get_embedding_provider(provider_type: Optional[str] = None) -> EmbeddingProvider:
    """Factory to resolve configured embedding provider."""
    raw_type = (provider_type or settings.EMBEDDING_PROVIDER).strip().lower()

    if raw_type in ("local", "deterministic", "mock", "offline"):
        return DeterministicLocalEmbedding()
    elif raw_type in ("google", "gemini", "text-embedding-004"):
        return GoogleEmbeddingProvider()
    else:
        # Graceful fallback to deterministic local
        return DeterministicLocalEmbedding()
