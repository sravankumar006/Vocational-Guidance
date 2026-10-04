"""RAG and factual knowledge retrieval package.

Exposes knowledge base normalization, provenance tracking, provider-independent
embeddings, and hybrid semantic/lexical knowledge retriever.
"""

from rag.embeddings import (
    DeterministicLocalEmbedding,
    EmbeddingProvider,
    GoogleEmbeddingProvider,
    cosine_similarity,
    get_embedding_provider,
)
from rag.knowledge_base import (
    KnowledgeBase,
    KnowledgeItem,
    KnowledgeProvenance,
    KnowledgeType,
    determine_provenance,
    normalize_career_path,
    normalize_course,
    normalize_data_source,
    normalize_job_outcome,
    normalize_nsqf_descriptor,
    normalize_occupation,
    normalize_training_provider,
)
from rag.retriever import (
    KnowledgeRetriever,
    RetrievalFilter,
    RetrievedContext,
    RetrievedKnowledgeItem,
)

__all__ = [
    # Knowledge Base & Types
    "KnowledgeType",
    "KnowledgeProvenance",
    "KnowledgeItem",
    "KnowledgeBase",
    "determine_provenance",
    "normalize_occupation",
    "normalize_course",
    "normalize_job_outcome",
    "normalize_training_provider",
    "normalize_career_path",
    "normalize_nsqf_descriptor",
    "normalize_data_source",
    # Embeddings
    "EmbeddingProvider",
    "DeterministicLocalEmbedding",
    "GoogleEmbeddingProvider",
    "get_embedding_provider",
    "cosine_similarity",
    # Retriever
    "RetrievalFilter",
    "RetrievedKnowledgeItem",
    "RetrievedContext",
    "KnowledgeRetriever",
]
