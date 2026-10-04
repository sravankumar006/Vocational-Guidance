"""Factual Knowledge Retriever for the RAG pipeline.

Executes hybrid semantic and metadata-filtered retrieval over verified
educational, occupational, and curricular records. Decoupled from all
LLM generation and generative prompts.
"""

from datetime import datetime, timezone
import re
from typing import Any, Dict, List, Optional, Set
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from core.config import settings
from rag.embeddings import EmbeddingProvider, cosine_similarity, get_embedding_provider
from rag.knowledge_base import KnowledgeBase, KnowledgeItem, KnowledgeType


class RetrievalFilter(BaseModel):
    """Optional metadata filters to restrict retrieval scope."""
    knowledge_types: Optional[List[KnowledgeType]] = None
    sectors: Optional[List[str]] = None
    nsqf_levels: Optional[List[str]] = None
    location: Optional[str] = None
    verified_only: Optional[bool] = None
    provider_types: Optional[List[str]] = None

    model_config = ConfigDict(extra="ignore")


class RetrievedKnowledgeItem(BaseModel):
    """A scored knowledge item selected by the retriever."""
    item: KnowledgeItem
    score: float = Field(..., ge=0.0, le=1.0)
    matched_by: str = "hybrid_semantic_lexical"

    model_config = ConfigDict(extra="ignore")


class RetrievedContext(BaseModel):
    """Structured factual context container ready for consumption by AI layers."""
    query: str
    items: List[RetrievedKnowledgeItem] = Field(default_factory=list)
    sources: List[str] = Field(default_factory=list)
    verified_only: bool = True
    total_candidates_evaluated: int = 0
    retrieved_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(extra="ignore")

    def to_context_string(self) -> str:
        """Format retrieved items into a structured factual prompt context."""
        if not self.items:
            return "No verified factual records found matching the query."

        sections: List[str] = []
        for idx, r_item in enumerate(self.items, start=1):
            k = r_item.item
            prov = k.provenance
            status_tag = "VERIFIED" if prov.verified else ("DEMO" if prov.is_demo else "UNVERIFIED")

            header = f"[{idx}] {k.title} (Domain: {k.type.value.upper()} | Status: {status_tag} | Source: {prov.source})"
            if prov.source_url:
                header += f" [Ref: {prov.source_url}]"

            body = k.content
            sections.append(f"{header}\n{body}")

        sources_summary = "\nCited Sources: " + "; ".join(self.sources) if self.sources else ""
        return "\n\n".join(sections) + sources_summary


class KnowledgeRetriever:
    """Hybrid semantic and metadata-filtered factual knowledge retriever."""

    def __init__(
        self,
        embedding_provider: Optional[EmbeddingProvider] = None,
        verified_only_default: Optional[bool] = None,
        top_k_default: Optional[int] = None,
    ):
        self.embedding_provider = embedding_provider or get_embedding_provider()
        self.verified_only_default = (
            verified_only_default if verified_only_default is not None else settings.RAG_VERIFIED_ONLY_DEFAULT
        )
        self.top_k_default = top_k_default or settings.RAG_TOP_K_DEFAULT

    def _tokenize(self, text: str) -> Set[str]:
        """Extract lowercase alpha tokens for lexical scoring."""
        return set(re.findall(r"\b[a-zA-Z0-9]{3,}\b", (text or "").lower()))

    def _calculate_lexical_score(self, query_tokens: Set[str], item: KnowledgeItem) -> float:
        """Compute keyword and title match strength."""
        if not query_tokens:
            return 0.0

        title_tokens = self._tokenize(item.title)
        content_tokens = self._tokenize(item.content)

        # Title match has 3x weight
        title_overlap = len(query_tokens.intersection(title_tokens))
        content_overlap = len(query_tokens.intersection(content_tokens))

        score = (title_overlap * 0.6) + (content_overlap * 0.15)
        return min(1.0, score)

    def retrieve(
        self,
        query: str,
        db: Session,
        filters: Optional[RetrievalFilter] = None,
        top_k: Optional[int] = None,
        verified_only: Optional[bool] = None,
    ) -> RetrievedContext:
        """Retrieve the top-K relevant, verified factual knowledge items for a query.

        Args:
            query: The user or student query string.
            db: Active SQLAlchemy database session.
            filters: Optional metadata filters.
            top_k: Number of top items to return (clamped between 1 and 20).
            verified_only: If True, strictly excludes unverified and demo items.

        Returns:
            RetrievedContext populated with scored knowledge items and citations.
        """
        # 1. Determine parameters
        effective_verified_only = (
            verified_only if verified_only is not None else (
                filters.verified_only if filters and filters.verified_only is not None else self.verified_only_default
            )
        )
        effective_top_k = max(1, min(20, top_k or self.top_k_default))

        # 2. Extract candidate items from KnowledgeBase
        target_types = filters.knowledge_types if filters else None
        candidates = KnowledgeBase.load_all_items(
            db=db,
            verified_only=effective_verified_only,
            types=target_types,
        )

        # 3. Apply post-load metadata filters
        if filters:
            if filters.sectors:
                sec_set = {s.lower() for s in filters.sectors}
                candidates = [
                    c for c in candidates
                    if c.metadata.get("sector") and c.metadata["sector"].lower() in sec_set
                ]
            if filters.nsqf_levels:
                nsqf_set = {n.lower() for n in filters.nsqf_levels}
                candidates = [
                    c for c in candidates
                    if c.metadata.get("qualification_level") and c.metadata["qualification_level"].lower() in nsqf_set
                    or c.metadata.get("nsqf_level") and c.metadata["nsqf_level"].lower() in nsqf_set
                ]
            if filters.location:
                loc_clean = filters.location.lower()
                candidates = [
                    c for c in candidates
                    if c.metadata.get("location") and loc_clean in c.metadata["location"].lower()
                    or c.metadata.get("region") and loc_clean in c.metadata["region"].lower()
                ]

        if not candidates:
            return RetrievedContext(
                query=query,
                items=[],
                sources=[],
                verified_only=effective_verified_only,
                total_candidates_evaluated=0,
            )

        # 4. Generate query embedding
        query_vec = self.embedding_provider.embed_text(query)
        query_tokens = self._tokenize(query)

        # 5. Score candidates
        scored_candidates: List[RetrievedKnowledgeItem] = []

        # Batch embed candidate content for vector similarity
        candidate_texts = [f"{c.title}\n{c.content}" for c in candidates]
        candidate_vecs = self.embedding_provider.embed_documents(candidate_texts)

        for item, item_vec in zip(candidates, candidate_vecs):
            # Semantic cosine similarity (0.0 to 1.0)
            sem_sim = max(0.0, cosine_similarity(query_vec, item_vec))

            # Lexical keyword match (0.0 to 1.0)
            lex_sim = self._calculate_lexical_score(query_tokens, item)

            # Combined hybrid score (60% semantic + 40% lexical)
            hybrid_score = (sem_sim * 0.60) + (lex_sim * 0.40)

            # Reliability boost for verified statutory records
            if item.provenance.verified:
                hybrid_score = min(1.0, hybrid_score * 1.10)

            scored_candidates.append(
                RetrievedKnowledgeItem(
                    item=item,
                    score=round(hybrid_score, 4),
                    matched_by="hybrid_semantic_lexical",
                )
            )

        # 6. Rank candidates descending by score
        scored_candidates.sort(key=lambda x: x.score, reverse=True)
        top_items = scored_candidates[:effective_top_k]

        # 7. Collect unique source citations
        unique_sources: List[str] = []
        seen_src = set()
        for r in top_items:
            src = r.item.provenance.source
            if src and src not in seen_src:
                seen_src.add(src)
                unique_sources.append(src)

        return RetrievedContext(
            query=query,
            items=top_items,
            sources=unique_sources,
            verified_only=effective_verified_only,
            total_candidates_evaluated=len(candidates),
        )
