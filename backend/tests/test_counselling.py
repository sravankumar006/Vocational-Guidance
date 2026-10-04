"""Comprehensive Unit and Integration Tests for Grounded Structured AI Counselling (Phase 5 Bricks 20 & 21).

Verifies:
1. Canonical Response Schema: Validates required fields (message, language, career, evidence, career_path, suggested_questions, confidence, requires_human, sources).
2. Long Response Support: Message supports long detailed counselling guidance without artificial truncation.
3. Missing Fields & Strict Validation: Rejects malformed structures and invalid data types.
4. Confidence Bounds: Strictly constrained between 0.0 and 1.0 (rejects -0.1 and 1.5).
5. Evidence & Provenance Preservation: Preserves IDs, knowledge types, statutory sources, and relevance scores.
6. Backend-Owned Career & Deterministic Recommendations: AI cannot alter compatibility scores or invent careers.
7. Verified Career Paths: Derived strictly from database records without hallucinations.
8. User-Facing Sources: Directly derived from retrieved evidence without fabricated URLs.
9. Human Escalation: requires_human flag properly toggles and integrates with HumanEscalation records.
10. Provider Independence: Mocked AIProvider verifies complete decoupling with zero external API calls.
11. Bounded Conversation History: Adheres strictly to COUNSELLING_HISTORY_LIMIT and appends latest question.
12. RBAC & Security Isolation: Student self-access, parent family checks, and cross-student blocking.
"""

from datetime import datetime, timezone
from typing import Any, AsyncIterator, Dict, List, Optional, Type, Union
from pydantic import BaseModel, ValidationError
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from core.config import settings
from core.security import create_access_token, hash_password
from database.base import Base
from database.session import get_db
from models import (
    User,
    StudentProfile,
    ParentProfile,
    ParentStudentAssociation,
    Occupation,
    Course,
    CareerPath,
    TrainingProvider,
    JobOutcome,
    DataSource,
    CounsellingSession,
    CounsellingMessage,
    HumanEscalation,
)
from models.enums import (
    UserRole,
    SessionStatus,
    MessageSenderType,
    EscalationStatus,
)
from schemas.counselling import (
    CounsellingCareer,
    CounsellingEvidenceItem,
    CounsellingCareerPathStep,
    CounsellingCareerMetrics,
    CounsellingSourceItem,
    AICounsellingGeneration,
    CounsellingResponse,
    CreateCounsellingSessionRequest,
    SendCounsellingMessageRequest,
)
from ai import (
    AIProvider,
    AIMessage,
    AIRequest,
    AIResponse,
    AIRole,
    AIStreamChunk,
    StructuredAIResponse,
    StructuredResponseRequest,
    AIProviderUnavailableError,
)
from rag.retriever import KnowledgeRetriever
from services.counselling_service import (
    CounsellingService,
    counselling_service,
    detect_human_escalation,
    detect_unsupported_question,
    detect_confidence,
    extract_safe_student_context,
    extract_career_and_path,
    extract_career_metrics,
    build_system_prompt,
    format_grounded_messages,
)
from main import app


# ---------------------------------------------------------------------------
# 1. Mock AI Provider (Provider Independence)
# ---------------------------------------------------------------------------

class MockAIProvider(AIProvider):
    """Mock AI Provider implementing the vendor-neutral AIProvider interface.
    
    Verifies that the counselling orchestration layer interacts strictly with
    the provider abstraction without importing Gemini SDK directly.
    """

    def __init__(self, response_text: str = "Based on verified statutory records, Electrician training takes 12 months at Government ITI."):
        self.response_text = response_text
        self.last_messages: List[AIMessage] = []
        self.last_system_prompt: Optional[str] = None
        self.call_count: int = 0
        self.should_fail: bool = False

    async def generate_response(
        self,
        messages: Union[List[AIMessage], AIRequest],
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        **kwargs: Any,
    ) -> AIResponse:
        self.call_count += 1
        if self.should_fail:
            raise AIProviderUnavailableError("Simulated mock provider failure")

        if isinstance(messages, AIRequest):
            self.last_messages = messages.messages
            self.last_system_prompt = system_prompt or messages.system_prompt
        else:
            self.last_messages = list(messages)
            self.last_system_prompt = system_prompt

        return AIResponse(
            content=self.response_text,
            role="assistant",
            model="mock-counsellor-v1",
        )

    async def generate_structured_response(
        self,
        messages: Union[List[AIMessage], StructuredResponseRequest],
        response_schema: Optional[Union[Type[BaseModel], Dict[str, Any]]] = None,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        **kwargs: Any,
    ) -> StructuredAIResponse:
        self.call_count += 1
        if self.should_fail:
            raise AIProviderUnavailableError("Simulated mock provider failure")

        if isinstance(messages, StructuredResponseRequest):
            self.last_messages = messages.messages
            self.last_system_prompt = system_prompt or messages.system_prompt
        else:
            self.last_messages = list(messages)
            self.last_system_prompt = system_prompt

        parsed = AICounsellingGeneration(
            message=self.response_text,
            suggested_questions=[
                "What qualifications are required to enroll?",
                "Which government ITIs offer this course?",
                "What are the typical entry-level salary ranges?",
            ],
            language="en",
        )
        return StructuredAIResponse(
            parsed=parsed,
            raw_content=parsed.model_dump_json(),
            model="mock-counsellor-v1",
        )

    async def stream_response(
        self,
        messages: Union[List[AIMessage], AIRequest],
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        **kwargs: Any,
    ) -> AsyncIterator[AIStreamChunk]:
        yield AIStreamChunk(content=self.response_text, is_final=True)


# ---------------------------------------------------------------------------
# 2. In-Memory SQLite Test Fixture
# ---------------------------------------------------------------------------

@pytest.fixture(scope="function")
def test_setup():
    """Sets up an isolated database with users, profiles, statutory knowledge, and mock AI provider."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSession()

    # 1. Statutory Data Source
    ds = DataSource(
        name="MSDE National Qualification Register",
        source_type="Government Statutory Registry",
        url="https://www.nqr.gov.in",
        description="Official vocational registry",
        version="2026.1",
        retrieved_at=datetime(2026, 1, 15, tzinfo=timezone.utc),
    )
    db.add(ds)
    db.commit()

    # 2. Training Provider
    tp = TrainingProvider(
        name="Government ITI Hyderabad",
        location="Hyderabad, Telangana",
        provider_type="Government ITI",
        description="Premier ITI training center",
    )
    db.add(tp)
    db.commit()

    # 3. Occupations
    occ_elec = Occupation(
        name="Electrician",
        sector="Electrical & Power",
        description="Installs and maintains electrical wiring systems and circuits.",
        skill_requirements={"roles": ["Wireman", "Panel Assembler", "Maintenance Electrician"]},
    )
    occ_auto = Occupation(
        name="Automotive Service Technician",
        sector="Automotive",
        description="Diagnoses and repairs motor vehicle electronics and mechanical systems.",
        skill_requirements={"roles": ["Service Technician", "Diagnostic Specialist"]},
    )
    db.add_all([occ_elec, occ_auto])
    db.commit()

    # 4. Courses
    crs_elec = Course(
        name="Certificate in Domestic & Industrial Electrician",
        sector="Electrical & Power",
        qualification_level="NSQF Level 4",
        duration="12 Months",
        delivery_mode="Classroom & Workshop",
        provider_id=tp.id,
        data_source_id=ds.id,
        description="Complete practical training for domestic wiring and industrial control panels.",
    )
    db.add(crs_elec)
    db.commit()

    # 5. Career Path
    cp_elec = CareerPath(
        name="Electrical Trade Progression Pathway",
        description="From Apprentice to Master Electrical Technician",
        estimated_duration="2-4 Years",
        progression_ladder=[
            "Assistant Wireman",
            "Certified Electrician (NSQF 4)",
            "Industrial Panel Technician",
            "Electrical Supervisor",
        ],
    )
    cp_elec.occupations.append(occ_elec)
    db.add(cp_elec)
    db.commit()

    # 6. Job Outcomes
    outcome_elec = JobOutcome(
        occupation_id=occ_elec.id,
        data_source_id=ds.id,
        employment_rate=82.0,
        salary_range_min=12000,
        salary_range_max=26000,
        salary_currency="INR",
        region="Telangana",
        experience_level="Entry Level",
    )
    db.add(outcome_elec)
    db.commit()

    # 7. Users & Profiles
    # Student A (Owner)
    student_a_user = User(
        name="Ramesh Kumar",
        email="ramesh@example.com",
        password_hash=hash_password("SecretPass123!"),
        role=UserRole.STUDENT,
        is_active=True,
    )
    # Student B (Other Student)
    student_b_user = User(
        name="Priya Sharma",
        email="priya@example.com",
        password_hash=hash_password("SecretPass123!"),
        role=UserRole.STUDENT,
        is_active=True,
    )
    # Parent A (Linked to Student A)
    parent_a_user = User(
        name="Suresh Kumar",
        email="suresh@example.com",
        password_hash=hash_password("SecretPass123!"),
        role=UserRole.PARENT,
        is_active=True,
    )
    # Admin
    admin_user = User(
        name="Admin User",
        email="admin@example.com",
        password_hash=hash_password("SecretPass123!"),
        role=UserRole.ADMIN,
        is_active=True,
    )
    db.add_all([student_a_user, student_b_user, parent_a_user, admin_user])
    db.commit()

    student_a_prof = StudentProfile(
        user_id=student_a_user.id,
        age=17,
        education_level="Class 10 Passed",
        education_stream="Science",
        location="Hyderabad, Telangana",
        household_income_range="1–3 Lakhs",
        interests=["Electrical", "Wiring"],
        skills=["Hand Tools"],
        career_intent="Job Soon",
        career_preferences=["Skilled Trade"],
        work_location_preferences=["Hyderabad"],
    )
    student_b_prof = StudentProfile(
        user_id=student_b_user.id,
        age=18,
        education_level="12th Pass",
        education_stream="Vocational",
        location="Warangal, Telangana",
        household_income_range="3–5 Lakhs",
        interests=["Automotive"],
        skills=["Engine Repair"],
    )
    parent_a_prof = ParentProfile(
        user_id=parent_a_user.id,
        relationship_to_student="Father",
        occupation="Shopkeeper",
        location="Hyderabad, Telangana",
    )
    db.add_all([student_a_prof, student_b_prof, parent_a_prof])
    db.commit()

    # Link Parent A to Student A
    assoc = ParentStudentAssociation(
        parent_profile_id=parent_a_prof.id,
        student_profile_id=student_a_prof.id,
        relationship_type="Father",
    )
    db.add(assoc)
    db.commit()

    # Configure Mock AI Provider
    mock_provider = MockAIProvider()
    custom_service = CounsellingService(ai_provider=mock_provider)

    # FastAPI Test Client with dependency override
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    counselling_service._custom_ai_provider = mock_provider

    client = TestClient(app)

    # Auth Tokens
    token_student_a = create_access_token(payload_data={"sub": str(student_a_user.id), "role": "student"})
    token_student_b = create_access_token(payload_data={"sub": str(student_b_user.id), "role": "student"})
    token_parent_a = create_access_token(payload_data={"sub": str(parent_a_user.id), "role": "parent"})
    token_admin = create_access_token(payload_data={"sub": str(admin_user.id), "role": "admin"})

    context = {
        "db": db,
        "client": client,
        "mock_provider": mock_provider,
        "service": custom_service,
        "student_a": student_a_prof,
        "student_b": student_b_prof,
        "parent_a": parent_a_prof,
        "tokens": {
            "student_a": token_student_a,
            "student_b": token_student_b,
            "parent_a": token_parent_a,
            "admin": token_admin,
        },
        "occ_elec": occ_elec,
    }

    yield context

    app.dependency_overrides.clear()
    counselling_service._custom_ai_provider = None
    db.close()
    Base.metadata.drop_all(bind=engine)


# ---------------------------------------------------------------------------
# 3. Canonical Schema Unit Tests (Brick 21)
# ---------------------------------------------------------------------------

def test_canonical_counselling_response_schema_valid():
    """Verify CounsellingResponse validates all 9 canonical required fields."""
    valid_payload = {
        "message": "Detailed counselling explanation of vocational paths.",
        "language": "en",
        "career": {
            "id": 1,
            "title": "Electrician",
            "description": "Electrical maintenance trade",
            "compatibility_score": 85,
            "reasons": ["Education matches", "Interest matches"],
        },
        "evidence": [
            {
                "id": "crs:1",
                "type": "course",
                "title": "Certificate in Electrician",
                "content": "Course covers wiring and panels.",
                "relevance": 0.88,
                "verified": True,
                "source": "MSDE",
                "source_url": "https://www.nqr.gov.in",
            }
        ],
        "career_path": [
            {"step": 1, "title": "Assistant Wireman", "description": "Entry apprentice", "course_id": None}
        ],
        "suggested_questions": [
            "What are the prerequisites?",
            "Which institutes offer this?",
            "What is the salary?",
        ],
        "confidence": 0.85,
        "requires_human": False,
        "sources": [
            {"title": "Certificate in Electrician", "source": "MSDE", "url": "https://www.nqr.gov.in", "type": "course"}
        ],
    }
    model = CounsellingResponse.model_validate(valid_payload)
    assert model.message == "Detailed counselling explanation of vocational paths."
    assert model.language == "en"
    assert model.career.title == "Electrician"
    assert len(model.evidence) == 1
    assert model.evidence[0].verified is True
    assert len(model.career_path) == 1
    assert len(model.suggested_questions) == 3
    assert model.confidence == 0.85
    assert model.requires_human is False
    assert len(model.sources) == 1


def test_long_counselling_response_support():
    """Verify long, detailed counselling responses (paragraphs, headings) validate without truncation."""
    long_text = "\n\n".join([
        "### Complete Vocational Guide for Becoming an Electrician",
        "The trade of an Electrician is one of India's most in-demand technical vocations...",
        "#### 1. Entry Requirements and Eligibility\nStudents must possess class 10 qualification...",
        "#### 2. Curriculum and Practical Skills\nPractical training spans domestic installation, wiring, safety...",
        "#### 3. Salary and Economic Outcomes\nInitial earnings range from ₹12,000 to ₹26,000 per month...",
        "#### 4. Progression Pathway\nGraduates advance to Panel Assembler, Supervisor, and licensed Contractor.",
    ] * 5)  # Multi-paragraph detailed roadmap

    response = CounsellingResponse(
        message=long_text,
        language="en",
        confidence=0.90,
        requires_human=False,
    )
    assert len(response.message) > 2000
    assert "### Complete Vocational Guide" in response.message
    assert response.confidence == 0.90


def test_counselling_response_missing_required_fields_rejected():
    """Verify schema strictly rejects missing required fields like message or confidence."""
    # Missing confidence
    with pytest.raises(ValidationError):
        CounsellingResponse(message="Hello")

    # Missing message
    with pytest.raises(ValidationError):
        CounsellingResponse(confidence=0.8)


def test_confidence_bounds_enforced():
    """Verify confidence must be strictly between 0.0 and 1.0."""
    # Reject < 0.0
    with pytest.raises(ValidationError):
        CounsellingResponse(message="Hi", confidence=-0.1)

    # Reject > 1.0
    with pytest.raises(ValidationError):
        CounsellingResponse(message="Hi", confidence=1.5)

    # Accept boundaries and midpoint
    assert CounsellingResponse(message="Hi", confidence=0.0).confidence == 0.0
    assert CounsellingResponse(message="Hi", confidence=0.5).confidence == 0.5
    assert CounsellingResponse(message="Hi", confidence=1.0).confidence == 1.0


# ---------------------------------------------------------------------------
# 4. Service-Level Orchestration & Structured Contract Tests
# ---------------------------------------------------------------------------

@pytest.mark.anyio
async def test_counselling_service_happy_path_structured(test_setup):
    """Verify complete happy path producing the canonical CounsellingResponse contract."""
    db = test_setup["db"]
    service = test_setup["service"]
    student = test_setup["student_a"]
    user = student.user
    mock_provider = test_setup["mock_provider"]

    session = service.create_session(db, student_profile_id=student.id)

    mock_provider.response_text = (
        "Electrician trade requires 12 months at Government ITI Hyderabad under NSQF Level 4."
    )
    response = await service.process_counselling_message(
        db=db,
        session_id=session.id,
        sender_user=user,
        message_text="What are the details for the Electrician course?",
    )

    # Canonical 9 Fields Verification
    assert isinstance(response, CounsellingResponse)
    assert response.session_id == session.id
    assert "Electrician" in response.message
    assert response.language == "en"
    assert response.confidence >= 0.50
    assert response.requires_human is False

    # Backend-owned Career Identity & Score
    assert response.career.title == "Electrician"
    assert response.career.id == test_setup["occ_elec"].id
    assert response.career.compatibility_score is not None

    # Backend-owned Evidence Provenance
    assert len(response.evidence) > 0
    top_ev = response.evidence[0]
    assert top_ev.title is not None
    assert top_ev.verified is True
    assert "MSDE" in top_ev.source or "National" in top_ev.source
    assert top_ev.relevance > 0.0

    # Backend-owned Career Path
    assert len(response.career_path) > 0
    assert response.career_path[0].step == 1
    assert "Wireman" in response.career_path[0].title or "Electrician" in response.career_path[0].title

    # Backend-owned Sources
    assert len(response.sources) > 0
    assert response.sources[0].source is not None

    # AI-generated Suggested Questions
    assert len(response.suggested_questions) >= 3
    assert len(response.suggested_questions) <= 5

    # DB Persistence
    messages = service.get_recent_history(db, session.id)
    assert len(messages) == 2
    assert messages[0].sender_type == MessageSenderType.STUDENT
    assert messages[1].sender_type == MessageSenderType.AI
    assert messages[1].content == response.message


@pytest.mark.anyio
async def test_counselling_service_human_escalation_flow(test_setup):
    """Verify 'I want to talk to a human' triggers requires_human=True and HumanEscalation record."""
    db = test_setup["db"]
    service = test_setup["service"]
    student = test_setup["student_a"]
    user = student.user

    session = service.create_session(db, student_profile_id=student.id)

    response = await service.process_counselling_message(
        db=db,
        session_id=session.id,
        sender_user=user,
        message_text="I feel completely confused and I want to speak to a human counsellor please.",
    )

    assert response.requires_human is True
    assert "counsellor" in response.message.lower()

    # Verify session status updated to ESCALATED
    db.refresh(session)
    assert session.status == SessionStatus.ESCALATED

    # Verify HumanEscalation record in database
    escalation = db.query(HumanEscalation).filter_by(counselling_session_id=session.id).first()
    assert escalation is not None
    assert escalation.status == EscalationStatus.PENDING


@pytest.mark.anyio
async def test_counselling_service_unsupported_question(test_setup):
    """Verify speculative salary guarantee yields low confidence and clear explanation."""
    db = test_setup["db"]
    service = test_setup["service"]
    student = test_setup["student_a"]
    user = student.user

    session = service.create_session(db, student_profile_id=student.id)

    response = await service.process_counselling_message(
        db=db,
        session_id=session.id,
        sender_user=user,
        message_text="What will my salary definitely be after 5 years? Can you guarantee my salary?",
    )

    assert response.confidence <= 0.50
    assert len(response.suggested_questions) >= 3


# ---------------------------------------------------------------------------
# 5. API Integration & RBAC Tests
# ---------------------------------------------------------------------------

def test_api_create_session_student_self(test_setup):
    """Student can create a counselling session for themselves."""
    client = test_setup["client"]
    token = test_setup["tokens"]["student_a"]
    student = test_setup["student_a"]

    headers = {"Authorization": f"Bearer {token}"}
    payload = {"student_id": student.id}
    res = client.post("/api/counselling/sessions", json=payload, headers=headers)
    assert res.status_code == 201
    data = res.json()
    assert data["student_profile_id"] == student.id
    assert data["status"] == "active"


def test_api_create_session_with_initial_question(test_setup):
    """Creating a session with an initial question processes response immediately."""
    client = test_setup["client"]
    token = test_setup["tokens"]["student_a"]
    student = test_setup["student_a"]

    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "student_id": student.id,
        "initial_question": "Tell me about the Electrician course requirements.",
    }
    res = client.post("/api/counselling/sessions", json=payload, headers=headers)
    assert res.status_code == 201
    data = res.json()
    assert len(data["messages"]) == 2


def test_api_post_message_canonical_contract(test_setup):
    """Post message endpoint returns the full canonical CounsellingResponse contract."""
    client = test_setup["client"]
    db = test_setup["db"]
    student_a = test_setup["student_a"]
    token_a = test_setup["tokens"]["student_a"]

    session = CounsellingSession(student_profile_id=student_a.id, status=SessionStatus.ACTIVE)
    db.add(session)
    db.commit()

    headers = {"Authorization": f"Bearer {token_a}"}
    payload = {"message": "What is the typical salary range for an Electrician in Telangana?"}

    res = client.post(f"/api/counselling/sessions/{session.id}/messages", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()

    # All canonical fields must exist
    for field in [
        "message",
        "language",
        "career",
        "evidence",
        "career_path",
        "suggested_questions",
        "confidence",
        "requires_human",
        "sources",
    ]:
        assert field in data

    assert data["career"]["title"] == "Electrician"
    assert len(data["career_path"]) > 0
    assert len(data["suggested_questions"]) >= 3
    assert len(data["sources"]) > 0


def test_api_student_cannot_access_other_student_session(test_setup):
    """Student B cannot access Student A's counselling session (403 Forbidden)."""
    client = test_setup["client"]
    db = test_setup["db"]
    student_a = test_setup["student_a"]
    token_b = test_setup["tokens"]["student_b"]

    session_a = CounsellingSession(student_profile_id=student_a.id, status=SessionStatus.ACTIVE)
    db.add(session_a)
    db.commit()

    headers_b = {"Authorization": f"Bearer {token_b}"}

    res_get = client.get(f"/api/counselling/sessions/{session_a.id}", headers=headers_b)
    assert res_get.status_code == 403

    res_post = client.post(
        f"/api/counselling/sessions/{session_a.id}/messages",
        json={"message": "Unauthorized probe"},
        headers=headers_b,
    )
    assert res_post.status_code == 403


def test_api_parent_access_linked_student_session(test_setup):
    """Parent A can access linked Student A's session, but cannot access unrelated Student B."""
    client = test_setup["client"]
    db = test_setup["db"]
    student_a = test_setup["student_a"]
    student_b = test_setup["student_b"]
    token_parent_a = test_setup["tokens"]["parent_a"]

    session_a = CounsellingSession(student_profile_id=student_a.id, status=SessionStatus.ACTIVE)
    session_b = CounsellingSession(student_profile_id=student_b.id, status=SessionStatus.ACTIVE)
    db.add_all([session_a, session_b])
    db.commit()

    headers_parent = {"Authorization": f"Bearer {token_parent_a}"}

    res_a = client.get(f"/api/counselling/sessions/{session_a.id}", headers=headers_parent)
    assert res_a.status_code == 200

    res_b = client.get(f"/api/counselling/sessions/{session_b.id}", headers=headers_parent)
    assert res_b.status_code == 403


def test_api_unauthenticated_requests_rejected(test_setup):
    """Unauthenticated requests are strictly rejected with 401 Unauthorized."""
    client = test_setup["client"]
    assert client.get("/api/counselling/sessions").status_code == 401
    assert client.post("/api/counselling/sessions", json={"message": "hello"}).status_code == 401


def test_api_nonexistent_session_returns_404(test_setup):
    """Requesting an invalid or non-existent session ID returns 404 Not Found."""
    client = test_setup["client"]
    token = test_setup["tokens"]["student_a"]
    headers = {"Authorization": f"Bearer {token}"}
    assert client.get("/api/counselling/sessions/99999", headers=headers).status_code == 404


def test_api_blank_message_returns_422(test_setup):
    """Submitting empty or whitespace-only messages returns 422 Unprocessable Entity."""
    client = test_setup["client"]
    db = test_setup["db"]
    student_a = test_setup["student_a"]
    token = test_setup["tokens"]["student_a"]

    session = CounsellingSession(student_profile_id=student_a.id, status=SessionStatus.ACTIVE)
    db.add(session)
    db.commit()

    headers = {"Authorization": f"Bearer {token}"}
    res = client.post(f"/api/counselling/sessions/{session.id}/messages", json={"message": "   "}, headers=headers)
    assert res.status_code == 422


def test_api_provider_failure_returns_controlled_error(test_setup):
    """When AIProvider fails or is unavailable, returns controlled 503 instead of crashing."""
    client = test_setup["client"]
    db = test_setup["db"]
    student_a = test_setup["student_a"]
    token = test_setup["tokens"]["student_a"]
    mock_provider = test_setup["mock_provider"]

    session = CounsellingSession(student_profile_id=student_a.id, status=SessionStatus.ACTIVE)
    db.add(session)
    db.commit()

    mock_provider.should_fail = True

    headers = {"Authorization": f"Bearer {token}"}
    res = client.post(
        f"/api/counselling/sessions/{session.id}/messages",
        json={"message": "What is the Electrician qualification?"},
        headers=headers,
    )
    assert res.status_code == 503
    assert "unavailable" in res.json()["detail"].lower()


# ===========================================================================
# 9. Brick 23 — Career Pathway Contract & Normalization Tests
# ===========================================================================

def test_career_path_step_schema_brick23_fields():
    """CounsellingCareerPathStep supports all Brick 23 fields with strict typing."""
    step = CounsellingCareerPathStep(
        id="stage-01",
        step=1,
        title="Vocational Training (ITI Electrician)",
        description="Core practical and theoretical electrical skills",
        duration="2 years",
        qualification="10th Pass with Science & Math",
        nsqf_level="NSQF Level 4",
        type="education",
        is_current=True,
        course_id=12,
    )
    data = step.model_dump()
    assert data["id"] == "stage-01"
    assert data["step"] == 1
    assert data["title"] == "Vocational Training (ITI Electrician)"
    assert data["duration"] == "2 years"
    assert data["qualification"] == "10th Pass with Science & Math"
    assert data["nsqf_level"] == "NSQF Level 4"
    assert data["type"] == "education"
    assert data["is_current"] is True
    assert data["course_id"] == 12


def test_career_path_step_missing_optional_fields_no_fabrication():
    """Optional fields default to None and are never populated with fabricated placeholders."""
    step = CounsellingCareerPathStep(
        step=2,
        title="Apprenticeship",
    )
    data = step.model_dump()
    assert data["step"] == 2
    assert data["title"] == "Apprenticeship"
    assert data["duration"] is None
    assert data["qualification"] is None
    assert data["nsqf_level"] is None
    assert data["type"] is None
    assert data["is_current"] is None
    assert data["course_id"] is None


def test_career_path_long_pathway_preservation():
    """Long pathways (>5 stages) are preserved without truncation and maintain step order."""
    stages = [
        CounsellingCareerPathStep(step=i, title=f"Stage {i:02d}", description=f"Details for stage {i}")
        for i in range(1, 9)
    ]
    response = CounsellingResponse(
        message="Full comprehensive career pathway from trainee to master consultant.",
        career=CounsellingCareer(title="Electrical Engineering"),
        evidence=[],
        career_path=stages,
        further_education=["B.Tech Lateral Entry", "Post-Diploma Advanced Automation"],
        suggested_questions=["What is the next step?", "How do I enroll?"],
        confidence=0.92,
        requires_human=False,
        sources=[],
    )
    assert len(response.career_path) == 8
    assert [s.step for s in response.career_path] == list(range(1, 9))
    assert response.further_education == ["B.Tech Lateral Entry", "Post-Diploma Advanced Automation"]


def test_extract_career_and_path_dict_ladder(test_setup):
    """extract_career_and_path extracts dictionary progression ladders with next_nsqf."""
    db = test_setup["db"]
    occ = Occupation(
        name="Solar Panel Technician",
        sector="Renewable Energy",
        description="Installation and commissioning of solar photovoltaic systems",
    )
    db.add(occ)
    db.flush()

    cpath = CareerPath(
        name="Solar Technician Progression",
        description="Path from helper to solar project lead",
        progression_ladder={
            "ladder": ["Solar Helper", "Installation Technician", "Solar Site Supervisor", "Project Engineer"],
            "next_nsqf": "5",
        },
        estimated_duration="6 Months to entry",
    )
    cpath.occupations.append(occ)
    db.add(cpath)
    db.commit()

    student_a = test_setup["student_a"]
    career_obj, path_steps = extract_career_and_path(db, student_a, career_id=occ.id)
    assert career_obj.title == "Solar Panel Technician"
    assert len(path_steps) == 4
    assert path_steps[0].title == "Solar Helper"
    assert path_steps[0].duration == "6 Months to entry"
    assert path_steps[0].type == "career"
    # Last step should have the next_nsqf level tagged
    assert path_steps[3].title == "Project Engineer"
    assert path_steps[3].nsqf_level == "NSQF Level 5"


# ===========================================================================
# 10. Brick 24 — Evidence & Data Visualization Contract Tests
# ===========================================================================

def test_extract_career_metrics_verified_data(test_setup):
    """extract_career_metrics extracts verified salary, placement, and training data without fabrication."""
    db = test_setup["db"]
    occ = Occupation(
        name="Industrial Electrician",
        sector="Electrical & Electronics",
        description="Industrial wiring and power distribution systems",
    )
    db.add(occ)
    db.flush()

    # Add verified JobOutcome
    jo = JobOutcome(
        occupation_id=occ.id,
        employment_rate=82.5,
        salary_range_min=18000,
        salary_range_max=32000,
        salary_currency="INR",
        experience_level="Entry level",
        region="Telangana",
    )
    db.add(jo)

    # Add verified CareerPath and Course
    cpath = CareerPath(
        name="Industrial Electrician Progression",
        description="Vocational ladder to master contractor",
        estimated_duration="12 Months",
    )
    course = Course(
        name="Certificate in Industrial Electrician",
        duration="12 Months",
        qualification_level="NSQF Level 4",
        delivery_mode="Full-time vocational training",
    )
    cpath.courses.append(course)
    cpath.occupations.append(occ)
    db.add(cpath)
    db.add(course)
    db.commit()

    metrics = extract_career_metrics(db, occ.id)
    assert metrics is not None
    assert metrics.salary_min == 18000
    assert metrics.salary_max == 32000
    assert metrics.salary_currency == "INR"
    assert metrics.salary_period == "month"
    assert metrics.experience_level == "Entry level"
    assert metrics.placement_rate == 82.5
    assert metrics.training_duration == "12 Months"
    assert metrics.nsqf_level == "NSQF Level 4"
    assert metrics.training_type == "Full-time vocational training"
    assert metrics.job_availability == "Active Statutory Demand"
    assert metrics.job_region == "Telangana"


def test_extract_career_metrics_missing_data_no_zero_fabrication(test_setup):
    """Missing fields evaluate strictly to None, never 0, empty string, or fake placeholders."""
    db = test_setup["db"]
    occ = Occupation(
        name="Emerging Nano-Technician",
        sector="Advanced Materials",
        description="Newly notified speculative trade with no surveyed outcomes",
    )
    db.add(occ)
    db.commit()

    metrics = extract_career_metrics(db, occ.id)
    assert metrics is not None
    assert metrics.salary_min is None
    assert metrics.salary_max is None
    assert metrics.placement_rate is None
    assert metrics.training_duration is None
    assert metrics.nsqf_level is None
    assert metrics.job_availability is None
    assert metrics.job_openings_count is None


def test_counselling_response_with_career_metrics():
    """CounsellingResponse schema supports and validates career_metrics serialization."""
    metrics = CounsellingCareerMetrics(
        salary_min=15000,
        salary_max=28000,
        salary_currency="INR",
        salary_period="month",
        placement_rate=78.4,
        training_duration="1 year",
        nsqf_level="NSQF Level 4",
        job_availability="Active Statutory Demand",
        job_region="National",
    )
    res = CounsellingResponse(
        message="Verified vocational analysis for CNC Operator.",
        career=CounsellingCareer(title="CNC Machine Operator"),
        evidence=[],
        career_path=[],
        career_metrics=metrics,
        suggested_questions=["What ITI offers CNC training?"],
        confidence=0.88,
        requires_human=False,
        sources=[],
    )
    dumped = res.model_dump()
    assert dumped["career_metrics"]["salary_min"] == 15000
    assert dumped["career_metrics"]["salary_max"] == 28000
    assert dumped["career_metrics"]["placement_rate"] == 78.4
    assert dumped["career_metrics"]["training_duration"] == "1 year"
    assert dumped["career_metrics"]["nsqf_level"] == "NSQF Level 4"


# ==============================================================================
# BRICK 25: LONG CONVERSATIONS, GEMINI INTEGRATION & CONTEXT MEMORY TESTS
# ==============================================================================

from unittest.mock import MagicMock, AsyncMock
from ai.providers.gemini import GeminiProvider
from ai.exceptions import AIProviderConfigurationError, AIProviderUnavailableError
from ai.types import AIMessage, AIRole
from rag.retriever import RetrievedContext
from services.counselling_service import (
    infer_career_id_from_context,
    format_grounded_messages,
    build_system_prompt,
)


def test_gemini_provider_missing_key_configuration_error():
    """Verify GeminiProvider raises controlled AIProviderConfigurationError when key is missing or placeholder."""
    # Empty key
    p1 = GeminiProvider(api_key="")
    with pytest.raises(AIProviderConfigurationError) as exc_info:
        _ = p1.client
    assert "GEMINI_API_KEY is not configured" in str(exc_info.value)
    assert exc_info.value.provider == "gemini"

    # Placeholder key
    p2 = GeminiProvider(api_key="YOUR_GEMINI_API_KEY")
    with pytest.raises(AIProviderConfigurationError) as exc_info2:
        _ = p2.client
    assert "GEMINI_API_KEY is not configured" in str(exc_info2.value)


@pytest.mark.anyio
async def test_gemini_provider_mock_client_invocation():
    """Verify GeminiProvider formats messages and converts responses using the vendor SDK abstraction."""
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = "Comprehensive counselling explanation for ITI Electrician course."
    mock_response.usage_metadata = MagicMock(prompt_token_count=120, candidates_token_count=85, total_token_count=205)

    mock_client.aio.models.generate_content = AsyncMock(return_value=mock_response)

    provider = GeminiProvider(api_key="test-valid-key", client=mock_client)
    res = await provider.generate_response(
        messages=[AIMessage(role=AIRole.USER, content="Explain electrician trade")],
        system_prompt="You are a career counsellor",
        temperature=0.3,
        max_tokens=4096,
    )
    assert res.content == "Comprehensive counselling explanation for ITI Electrician course."
    assert res.usage["total_tokens"] == 205


def test_long_conversation_scalable_context_compression():
    """Verify conversations > 10 messages compress earlier turns into recap while keeping last 10 verbatim."""
    history: List[CounsellingMessage] = []
    # Create 16 turns (8 student, 8 AI)
    for i in range(1, 17):
        sender = MessageSenderType.STUDENT if i % 2 == 1 else MessageSenderType.AI
        history.append(
            CounsellingMessage(
                id=i,
                session_id=1,
                sender_type=sender,
                content=f"Message turn {i} discussing vocational careers and training options in detail.",
            )
        )

    retrieved = RetrievedContext(query="test", items=[])
    career = CounsellingCareer(id=1, title="Electrician")
    student_ctx = {"education_level": "Class 10 Pass"}

    messages = format_grounded_messages(
        student_context=student_ctx,
        career_obj=career,
        retrieved_context=retrieved,
        history=history,
        latest_question="What about the exam pattern?",
    )

    # First message is SYSTEM containing factual grounding + recap
    assert messages[0].role == AIRole.SYSTEM
    assert "EARLIER CONVERSATION RECAP" in messages[0].content
    assert "Message turn 1" in messages[0].content
    assert "Message turn 6" in messages[0].content

    # The next 10 messages must be the last 10 messages verbatim
    assert len(messages) == 1 + 10 + 1  # 1 system + 10 recent + 1 latest question
    assert messages[1].content == "Message turn 7 discussing vocational careers and training options in detail."
    assert messages[10].content == "Message turn 16 discussing vocational careers and training options in detail."
    assert messages[-1].content == "What about the exam pattern?"


@pytest.mark.anyio
async def test_follow_up_question_inherits_career_context(test_setup):
    """Verify follow-up questions ('What about the salary?') inherit active career from conversation history."""
    db = test_setup["db"]
    service = test_setup["service"]
    student = test_setup["student_a"]
    user = student.user
    mock_provider = test_setup["mock_provider"]

    session = service.create_session(db, student_profile_id=student.id)

    # Turn 1: Discuss Electrician trade
    mock_provider.response_text = "Electrician is a 2-year National Trade Certificate course under NCVET."
    res1 = await service.process_counselling_message(
        db=db,
        session_id=session.id,
        sender_user=user,
        message_text="Tell me about Electrician careers",
    )
    assert res1.career.title == "Electrician"

    # Turn 2: Follow-up question without explicit career_id or career mention in text
    mock_provider.response_text = (
        "For an Electrician, entry-level salaries typically range from Rs 15,000 to Rs 25,000 per month."
    )
    res2 = await service.process_counselling_message(
        db=db,
        session_id=session.id,
        sender_user=user,
        message_text="What about the salary?",
        career_id=None,  # Not provided in payload!
    )

    # Verify Turn 2 inherited Electrician context
    assert res2.career.title == "Electrician"
    assert res2.career.id == test_setup["occ_elec"].id
    assert res2.career_metrics is not None
    assert res2.career_metrics.salary_min == 12000
    assert res2.career_metrics.salary_max == 26000


@pytest.mark.anyio
async def test_long_ai_response_preservation(test_setup):
    """Verify very long, detailed counselling responses (4096 tokens max) are preserved completely."""
    db = test_setup["db"]
    service = test_setup["service"]
    student = test_setup["student_a"]
    user = student.user
    mock_provider = test_setup["mock_provider"]

    session = service.create_session(db, student_profile_id=student.id)

    # Generate a long, comprehensive response (2000+ words / 4000+ chars)
    long_answer = (
        "### Complete Career Pathway Analysis: Automotive Technician\n\n"
        "#### 1. Foundation Stage (Months 1-12)\n"
        "Enrolling in a CTS accredited Industrial Training Institute offers formal training across "
        "basic workshop calculations, engineering drawing, electrical systems, and engine mechanics. "
        "Students acquire NSQF Level 4 certification upon passing the All India Trade Test (AITT).\n\n"
        "#### 2. Apprenticeship & Practical Exposure (Months 13-24)\n"
        "Under the Apprenticeship Act of 1961, candidates undergo shop-floor training with major automobile OEMs. "
        "Monthly stipends range between Rs 8,000 and Rs 12,000 while gaining hands-on diagnostic experience.\n\n"
        "#### 3. Journeyman Technician (Years 2-4)\n"
        "Entering authorized dealerships or independent service centers as a Certified Service Technician. "
        "Responsibilities include ECU diagnostics, ABS calibration, and high-voltage safety for electric vehicles.\n\n"
        "#### 4. Master Technician & Workshop Supervisor (Years 5+)\n"
        "Through Craft Instructor Training Scheme (CITS) or advanced manufacturer certifications, "
        "technicians advance to supervisory roles managing customer satisfaction, quality audits, and apprentice mentoring."
    )
    mock_provider.response_text = long_answer

    response = await service.process_counselling_message(
        db=db,
        session_id=session.id,
        sender_user=user,
        message_text="Can you explain the complete career path from vocational training to becoming a senior technician?",
    )

    # Verify no artificial truncation occurs
    assert len(response.message) >= len(long_answer)
    assert "Master Technician & Workshop Supervisor" in response.message
    assert "Apprenticeship Act of 1961" in response.message

    # Verify persisted in database completely
    msgs = service.get_recent_history(db, session.id)
    ai_msg = [m for m in msgs if m.sender_type == MessageSenderType.AI][0]
    assert ai_msg.content == response.message


@pytest.mark.anyio
async def test_retry_after_failure_preserves_user_message(test_setup):
    """Verify that if AI generation fails, the user message is preserved and a retry succeeds without duplication."""
    db = test_setup["db"]
    service = test_setup["service"]
    student = test_setup["student_a"]
    user = student.user
    mock_provider = test_setup["mock_provider"]

    session = service.create_session(db, student_profile_id=student.id)

    # Make provider fail on first attempt
    mock_provider.should_fail = True

    with pytest.raises(AIProviderUnavailableError):
        await service.process_counselling_message(
            db=db,
            session_id=session.id,
            sender_user=user,
            message_text="What are the trade options in renewable energy?",
        )

    # Verify user message was preserved in database
    history1 = service.get_recent_history(db, session.id)
    assert len(history1) == 1
    assert history1[0].sender_type == MessageSenderType.STUDENT
    assert history1[0].content == "What are the trade options in renewable energy?"

    # Retry with working provider
    mock_provider.should_fail = False
    mock_provider.response_text = "Solar Panel Installation Technician is an NSQF Level 4 green trade."

    res = await service.process_counselling_message(
        db=db,
        session_id=session.id,
        sender_user=user,
        message_text="What are the trade options in renewable energy?",
    )

    assert "Solar Panel Installation" in res.message
    history2 = service.get_recent_history(db, session.id)
    ai_msgs = [m for m in history2 if m.sender_type == MessageSenderType.AI]
    assert len(ai_msgs) == 1


