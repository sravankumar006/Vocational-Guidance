# RAG & Factual Knowledge Retrieval Layer

## 1. Architectural Role
The RAG retrieval layer (`backend/rag/`) is strictly responsible for **finding and assembling verified factual context** from the platform's career and qualification database.

```
                    User Query
                        │
                        ▼
                KnowledgeRetriever
                        │
             ┌──────────┴──────────┐
             ▼                     ▼
        Dense Vector          Lexical / Metadata
         Similarity                 Filter
             │                     │
             └──────────┬──────────┘
                        ▼
                 RetrievedContext
                        │
                  (Verified Only)
                        │
                        ▼
                 Future AI Layer
                 (Phase 5 Brick 20)
```

**Core Invariant**:
- The Retriever is responsible for **finding factual data**.
- The LLM is responsible for **explaining and synthesizing** that data.
- The LLM is **never** permitted to hallucinate or act as the primary factual source for qualifications, salaries, or course details.

## 2. Supported Knowledge Domains
The knowledge base normalizes data across 7 core domains:
1. **Occupations**: Approved trade profiles, descriptions, competency requirements.
2. **Courses**: Accredited vocational courses, duration, delivery modes, provider associations.
3. **Salary & Job Outcomes**: Regional salary bands (min-max), placement rates, experience levels.
4. **Training Providers**: Accredited government ITIs, NSTIs, and approved centers.
5. **Career Paths**: Multi-stage progression ladders connecting entry-level trades to supervisor/technician roles.
6. **NSQF Descriptors**: National Skills Qualification Framework competency levels 1 to 10.
7. **Data Sources**: Source registry provenance, versions, and verification authorities.

## 3. Provenance & Verification Filtering
Every `KnowledgeItem` carries a `KnowledgeProvenance` payload:
- `source`: Authority name (e.g. MSDE, NCVET, DGT).
- `source_url`: Verifiable government portal URL.
- `verified`: Boolean flag strictly set to `True` only for verified statutory registries.
- `is_demo`: Boolean flag marking synthetic, unlinked, or test records.
- `verified_only=True` (Default): Excludes all unverified or demo items from entering the factual context passed to the counselling AI.

## 4. Embedding Layer
- Abstract interface: `EmbeddingProvider` (`backend/rag/embeddings.py`).
- Deterministic Local Provider: `DeterministicLocalEmbedding` produces unit-normalized 768-dimensional vectors using SHA-256 token n-gram distribution for zero-network, zero-cost development and testing.
- Vendor Boundary: `GoogleEmbeddingProvider` structured for `text-embedding-004` when live production keys are active.

## 5. Security & Privacy Guarantees
- The public knowledge base only indexes public occupational, educational, and institutional records.
- User tables (`users`, `student_profiles`, `parent_profiles`, `user_sessions`) are **completely segregated** and cannot be queried or leaked by the RAG knowledge base.
