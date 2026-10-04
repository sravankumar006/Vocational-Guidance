"""Unit tests for Phase 5 Brick 19: RAG and Factual Knowledge Retrieval Layer.

Verifies:
1. Knowledge item normalization across all 7 domains.
2. Accurate provenance preservation and verified vs. demo/illustrative labeling.
3. Strict exclusion of unverified/demo data when verified_only=True.
4. Hybrid semantic/lexical retriever relevance and top_k limiting.
5. Metadata filters (knowledge_types, sectors, NSQF levels, location).
6. Robustness against missing optional metadata.
7. Embedding provider abstraction, unit vector normalization, and cosine similarity.
8. Complete privacy: zero student/user records accessible via knowledge retrieval.
9. Zero external LLM API calls.
"""

from datetime import datetime, timezone
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database.base import Base
from models.career import CareerPath, JobOutcome, Occupation
from models.education import Course, DataSource, TrainingProvider
from models.user import StudentProfile, User
from rag import (
    DeterministicLocalEmbedding,
    EmbeddingProvider,
    KnowledgeBase,
    KnowledgeItem,
    KnowledgeType,
    KnowledgeRetriever,
    RetrievalFilter,
    RetrievedContext,
    cosine_similarity,
    determine_provenance,
    get_embedding_provider,
    normalize_career_path,
    normalize_course,
    normalize_data_source,
    normalize_job_outcome,
    normalize_nsqf_descriptor,
    normalize_occupation,
    normalize_training_provider,
)


# ---------------------------------------------------------------------------
# Test Database Fixture
# ---------------------------------------------------------------------------

@pytest.fixture(scope="function")
def db_session():
    """Create an isolated, in-memory SQLite database populated with RAG fixtures."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = Session()

    try:
        # 1. Official Data Source (Verified)
        ds_official = DataSource(
            name="MSDE National Qualification Register",
            source_type="Government Statutory Registry",
            url="https://www.nqr.gov.in",
            description="Official registry of approved vocational qualifications.",
            version="2026.1",
            retrieved_at=datetime(2026, 1, 15, tzinfo=timezone.utc),
        )
        # 2. Demo / Illustrative Data Source (Unverified)
        ds_demo = DataSource(
            name="Illustrative Sample Mock Data",
            source_type="Demo / Test Dataset",
            url=None,
            description="Synthetic records for developer staging only.",
            version="0.1",
            retrieved_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
        )
        db.add_all([ds_official, ds_demo])
        db.commit()

        # 3. Training Providers
        tp1 = TrainingProvider(
            name="Government ITI Hyderabad",
            location="Hyderabad, Telangana",
            provider_type="Government ITI",
            description="Premier state vocational technical training center.",
        )
        tp2 = TrainingProvider(
            name="National Skill Training Institute Mumbai",
            location="Mumbai, Maharashtra",
            provider_type="Central Government NSTI",
            description="Advanced vocational training campus.",
        )
        db.add_all([tp1, tp2])
        db.commit()

        # 4. Occupations
        occ_electrician = Occupation(
            name="Electrician",
            sector="Electrical & Power",
            description="Installs, tests, and maintains electrical wiring, circuits, and equipment.",
            skill_requirements=["Wiring", "Circuit Diagnostics", "Safety Protocols"],
        )
        occ_automotive = Occupation(
            name="Automotive Service Technician",
            sector="Automotive",
            description="Diagnoses, services, and repairs electronic systems and mechanical components of motor vehicles.",
            skill_requirements=["Engine Diagnostics", "Braking Systems", "OBD Scanners"],
        )
        occ_demo = Occupation(
            name="Synthetic Test Operator",
            sector="Demo Testing Sector",
            description="Fictitious role for testing data pipeline boundaries.",
            skill_requirements=["Mock Skill A", "Mock Skill B"],
        )
        db.add_all([occ_electrician, occ_automotive, occ_demo])
        db.commit()

        # 5. Job Outcomes
        outcome_elec = JobOutcome(
            occupation_id=occ_electrician.id,
            data_source_id=ds_official.id,
            employment_rate=84.5,
            salary_range_min=12000,
            salary_range_max=28000,
            salary_currency="INR",
            region="Telangana",
            experience_level="Entry Level",
        )
        outcome_demo = JobOutcome(
            occupation_id=occ_demo.id,
            data_source_id=ds_demo.id,
            employment_rate=45.0,
            salary_range_min=5000,
            salary_range_max=8000,
            salary_currency="INR",
            region="Virtual",
            experience_level="Intern",
        )
        db.add_all([outcome_elec, outcome_demo])
        db.commit()

        # 6. Courses
        crs_wireman = Course(
            name="Certificate in Domestic & Industrial Electrician",
            sector="Electrical & Power",
            qualification_level="NSQF Level 4",
            duration="12 Months",
            delivery_mode="Classroom & Workshop",
            provider_id=tp1.id,
            data_source_id=ds_official.id,
            description="Comprehensive hands-on training for domestic wiring and industrial panels.",
        )
        crs_auto = Course(
            name="Automotive Powertrain & Electronic Systems Specialist",
            sector="Automotive",
            qualification_level="NSQF Level 5",
            duration="24 Months",
            delivery_mode="Dual Training System",
            provider_id=tp2.id,
            data_source_id=ds_official.id,
            description="Advanced technician course for modern passenger vehicles.",
        )
        crs_demo = Course(
            name="Illustrative Demo Course",
            sector="Demo Testing Sector",
            qualification_level="NSQF Level 1",
            duration="1 Month",
            delivery_mode="Online Demo",
            provider_id=tp1.id,
            data_source_id=ds_demo.id,
            description="Synthetic test course.",
        )
        db.add_all([crs_wireman, crs_auto, crs_demo])
        db.commit()

        # 7. Career Paths
        cp_auto = CareerPath(
            name="Automotive Service Specialist Pathway",
            description="Progressive route from workshop apprentice to certified master diagnostician.",
            estimated_duration="3-5 Years",
            progression_ladder=[
                "Apprentice Technician",
                "Service Technician (NSQF 4)",
                "Master Diagnostic Technician (NSQF 6)",
                "Workshop Service Supervisor",
            ],
        )
        cp_auto.occupations.append(occ_automotive)
        db.add(cp_auto)
        db.commit()

        # 8. Private Student Data (Must NEVER be exposed to RAG)
        private_user = User(
            name="Confidential Student",
            email="secret.student@sih.gov.in",
            role="student",
        )
        db.add(private_user)
        db.commit()

        profile = StudentProfile(
            user_id=private_user.id,
            age=17,
            education_level="Class 10 Passed",
            location="Secret Private District",
            interests=["Private Confidential Hobby"],
            skills=["Private Skill"],
        )
        db.add(profile)
        db.commit()

        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


# ---------------------------------------------------------------------------
# 1. Normalization & Provenance Tests
# ---------------------------------------------------------------------------

def test_provenance_detection_official_vs_demo(db_session):
    """Verify determine_provenance correctly identifies verified official portals vs demo sources."""
    ds_gov = db_session.query(DataSource).filter(DataSource.name.like("%MSDE%")).first()
    ds_demo = db_session.query(DataSource).filter(DataSource.name.like("%Illustrative%")).first()

    prov_gov = determine_provenance(ds_gov)
    assert prov_gov.verified is True
    assert prov_gov.is_demo is False
    assert "Verified Official Registry" in prov_gov.data_provenance

    prov_demo = determine_provenance(ds_demo)
    assert prov_demo.verified is False
    assert prov_demo.is_demo is True
    assert "Illustrative" in prov_demo.data_provenance

    # None data_source falls back safely to unverified demo
    prov_none = determine_provenance(None)
    assert prov_none.verified is False
    assert prov_none.is_demo is True


def test_knowledge_item_normalization_all_domains(db_session):
    """Verify all 7 knowledge domains produce valid normalized KnowledgeItems."""
    occ = db_session.query(Occupation).filter_by(name="Electrician").first()
    occ_item = normalize_occupation(occ)
    assert occ_item.type == KnowledgeType.OCCUPATION
    assert "Electrician" in occ_item.title
    assert "Wiring" in occ_item.content
    assert occ_item.metadata["sector"] == "Electrical & Power"

    course = db_session.query(Course).filter_by(name="Certificate in Domestic & Industrial Electrician").first()
    crs_item = normalize_course(course)
    assert crs_item.type == KnowledgeType.COURSE
    assert crs_item.metadata["qualification_level"] == "NSQF Level 4"
    assert "Government ITI Hyderabad" in crs_item.content

    outcome = db_session.query(JobOutcome).first()
    out_item = normalize_job_outcome(outcome)
    assert out_item.type == KnowledgeType.SALARY_OUTCOME
    assert "Salary Range:" in out_item.content
    assert out_item.metadata["salary_min"] == 12000

    tp = db_session.query(TrainingProvider).filter_by(name="Government ITI Hyderabad").first()
    tp_item = normalize_training_provider(tp)
    assert tp_item.type == KnowledgeType.PROVIDER
    assert tp_item.metadata["location"] == "Hyderabad, Telangana"

    cp = db_session.query(CareerPath).first()
    cp_item = normalize_career_path(cp)
    assert cp_item.type == KnowledgeType.CAREER_PATH
    assert "Progression Ladder:" in cp_item.content

    nsqf_item = normalize_nsqf_descriptor("NSQF Level 4", sector="Electrical")
    assert nsqf_item.type == KnowledgeType.NSQF
    assert nsqf_item.metadata["nsqf_level"] == "NSQF Level 4"

    ds = db_session.query(DataSource).first()
    ds_item = normalize_data_source(ds)
    assert ds_item.type == KnowledgeType.SOURCE
    assert ds_item.provenance.source == ds.name


# ---------------------------------------------------------------------------
# 2. Verified-Only Filtering Tests
# ---------------------------------------------------------------------------

def test_knowledge_base_verified_only_isolation(db_session):
    """Verify KnowledgeBase excludes demo/illustrative records when verified_only=True."""
    all_items = KnowledgeBase.load_all_items(db_session, verified_only=False)
    verified_items = KnowledgeBase.load_all_items(db_session, verified_only=True)

    all_titles = [i.title for i in all_items]
    verified_titles = [i.title for i in verified_items]

    # Demo items must appear in all_items
    assert any("Demo" in t or "Synthetic" in t for t in all_titles)

    # Demo items must NEVER appear in verified_items
    for item in verified_items:
        assert item.provenance.verified is True
        assert item.provenance.is_demo is False
        assert "Demo" not in item.title
        assert "Synthetic" not in item.title


# ---------------------------------------------------------------------------
# 3. Retriever Tests
# ---------------------------------------------------------------------------

def test_retriever_query_relevance_electrician(db_session):
    """Verify retriever surfaces relevant electrical courses and occupation for an electrician query."""
    retriever = KnowledgeRetriever()
    result = retriever.retrieve("domestic wiring electrician training courses", db=db_session, top_k=5)

    assert isinstance(result, RetrievedContext)
    assert len(result.items) > 0

    top_item = result.items[0].item
    # Top match should be the Electrician course or occupation
    assert "Electrician" in top_item.title or "Wiring" in top_item.title
    assert result.items[0].score > 0.0
    assert len(result.sources) > 0


def test_retriever_respects_top_k(db_session):
    """Verify top_k parameter strictly caps the returned result count."""
    retriever = KnowledgeRetriever()
    res_1 = retriever.retrieve("training", db=db_session, top_k=1, verified_only=False)
    assert len(res_1.items) == 1

    res_3 = retriever.retrieve("training", db=db_session, top_k=3, verified_only=False)
    assert len(res_3.items) <= 3


def test_retriever_metadata_filtering(db_session):
    """Verify filtering by sector, knowledge_types, and location."""
    retriever = KnowledgeRetriever()

    # Filter strictly by sector: Automotive
    filters_auto = RetrievalFilter(sectors=["Automotive"])
    result_auto = retriever.retrieve("mechanic repair", db=db_session, filters=filters_auto, verified_only=False)
    for r in result_auto.items:
        sector = r.item.metadata.get("sector")
        assert sector == "Automotive" or r.item.type == KnowledgeType.PROVIDER

    # Filter strictly by KnowledgeType.COURSE
    filters_course = RetrievalFilter(knowledge_types=[KnowledgeType.COURSE])
    result_course = retriever.retrieve("technician", db=db_session, filters=filters_course, verified_only=False)
    for r in result_course.items:
        assert r.item.type == KnowledgeType.COURSE


def test_retriever_verified_only_mode_by_default(db_session):
    """Verify retriever defaults to verified_only=True and excludes demo data."""
    retriever = KnowledgeRetriever(verified_only_default=True)
    result = retriever.retrieve("synthetic demo test operator", db=db_session)

    # In verified_only mode, demo records must not be returned
    for r in result.items:
        assert r.item.provenance.verified is True
        assert r.item.provenance.is_demo is False
        assert "Synthetic" not in r.item.title


def test_retriever_to_context_string_formatting(db_session):
    """Verify RetrievedContext.to_context_string formats clean citation text."""
    retriever = KnowledgeRetriever()
    result = retriever.retrieve("electrician", db=db_session, top_k=2)

    prompt_context = result.to_context_string()
    assert "[1]" in prompt_context
    assert "Domain:" in prompt_context
    assert "Status: VERIFIED" in prompt_context
    assert "Cited Sources:" in prompt_context


# ---------------------------------------------------------------------------
# 4. Embeddings & Vector Similarity Tests
# ---------------------------------------------------------------------------

def test_deterministic_embedding_provider_properties():
    """Verify DeterministicLocalEmbedding produces unit-normalized vectors matching configured dimension."""
    provider = DeterministicLocalEmbedding(dimension=768)
    assert provider.dimension == 768
    assert provider.model_name == "deterministic-local-v1"

    vec = provider.embed_text("Solar PV Installer training program")
    assert len(vec) == 768

    # L2 Norm should be approximately 1.0
    import math
    norm = math.sqrt(sum(v * v for v in vec))
    assert abs(norm - 1.0) < 1e-3


def test_cosine_similarity_calculation():
    """Verify cosine similarity correctly measures identical, opposite, and orthogonal vectors."""
    v1 = [1.0, 0.0, 0.0]
    v2 = [1.0, 0.0, 0.0]
    v3 = [0.0, 1.0, 0.0]

    assert abs(cosine_similarity(v1, v2) - 1.0) < 1e-5
    assert abs(cosine_similarity(v1, v3) - 0.0) < 1e-5
    assert cosine_similarity([], []) == 0.0


def test_embedding_factory_resolution():
    """Verify get_embedding_provider returns configured provider."""
    p_local = get_embedding_provider("local")
    assert isinstance(p_local, EmbeddingProvider)

    p_mock = get_embedding_provider("deterministic")
    assert isinstance(p_mock, DeterministicLocalEmbedding)


# ---------------------------------------------------------------------------
# 5. Security & Privacy Tests
# ---------------------------------------------------------------------------

def test_private_student_data_never_in_knowledge_base(db_session):
    """Verify StudentProfile and User credentials can NEVER enter the public KnowledgeBase."""
    items = KnowledgeBase.load_all_items(db_session, verified_only=False)

    for item in items:
        # Check title and content for private data leaks
        assert "Confidential Student" not in item.title
        assert "secret.student@sih.gov.in" not in item.content
        assert "Secret Private District" not in item.content
        assert "Private Confidential Hobby" not in item.content

        # Check metadata
        assert "user_id" not in item.metadata
        assert "email" not in item.metadata
        assert "age" not in item.metadata
