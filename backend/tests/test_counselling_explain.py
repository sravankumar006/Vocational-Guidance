"""Unit and Integration Tests for Contextual Explain -> AI Counsellor (Phase 5 Brick 26).

Verifies:
1. Structured Explain Schema: CounsellingContextPayload adheres to type constraints.
2. Entity Resolution: Resolves occupation, course, provider, pathway, salary, and placement IDs.
3. Question Synthesis: Generates authoritative queries across all 10 supported explain intents.
4. Prompt Context Injection: Directives and instructions are grounded in verified records.
5. Intent-Specific Follow-Up Questions: Generates topical suggested questions (salary, growth, etc.).
6. Automatic Initial Guidance: Starting a session with context produces an immediate grounded AI response.
7. Contextual Message Post: Posting with context returns canonical response with career metrics.
8. Parent Access & Security Isolation: Enforces verify_family_access and prevents cross-student access.
9. Missing/Invalid Entity Graceful Degradation: Handles invalid or unmapped entity IDs safely.
10. Human Escalation Compatibility: Preserves requires_human signals during contextual guidance.
"""

import asyncio
from datetime import datetime, timezone
from typing import Any, AsyncIterator, Dict, List, Optional, Type, Union
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
    CounsellingContextPayload,
    CreateCounsellingSessionRequest,
    SendCounsellingMessageRequest,
    AICounsellingGeneration,
    CounsellingResponse,
    CounsellingCareer,
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
)
from services.counselling_service import (
    CounsellingService,
    counselling_service,
    resolve_context_entity,
    synthesize_explain_question,
    get_intent_suggested_questions,
    format_grounded_messages,
)
from rag.retriever import KnowledgeRetriever, RetrievedContext, RetrievedKnowledgeItem
from rag.knowledge_base import KnowledgeItem, KnowledgeProvenance, KnowledgeType
from main import app


# ---------------------------------------------------------------------------
# 1. Mock AI Provider for Provider Independence
# ---------------------------------------------------------------------------

class MockExplainAIProvider(AIProvider):
    """Mock AI Provider recording prompt messages and returning intent-grounded responses."""

    def __init__(self, message_text: str = "Detailed explanation grounded in verified records."):
        self.message_text = message_text
        self.last_messages: List[AIMessage] = []
        self.last_system_prompt: Optional[str] = None
        self.call_count: int = 0

    async def generate_response(
        self,
        messages: Union[List[AIMessage], AIRequest],
        system_prompt: Optional[str] = None,
        **kwargs: Any,
    ) -> AIResponse:
        self.call_count += 1
        if isinstance(messages, AIRequest):
            self.last_messages = messages.messages
        else:
            self.last_messages = list(messages)
        self.last_system_prompt = system_prompt
        return AIResponse(content=self.message_text, role="assistant", model="mock-explain-v1")

    async def generate_structured_response(
        self,
        messages: Union[List[AIMessage], StructuredResponseRequest],
        response_schema: Optional[Union[Type[Any], Dict[str, Any]]] = None,
        system_prompt: Optional[str] = None,
        **kwargs: Any,
    ) -> StructuredAIResponse:
        self.call_count += 1
        if isinstance(messages, StructuredResponseRequest):
            self.last_messages = messages.messages
        else:
            self.last_messages = list(messages)
        self.last_system_prompt = system_prompt

        parsed = AICounsellingGeneration(
            message=self.message_text,
            suggested_questions=[
                "What are the typical entry-level wages?",
                "How do I progress from technician to supervisor?",
                "Which ITIs offer this course near me?",
            ],
            language="en",
        )
        return StructuredAIResponse(
            content=parsed.model_dump_json(),
            role="assistant",
            model="mock-explain-v1",
            parsed=parsed,
        )

    async def stream_response(
        self,
        messages: Union[List[AIMessage], AIRequest],
        system_prompt: Optional[str] = None,
        **kwargs: Any,
    ) -> AsyncIterator[AIStreamChunk]:
        yield AIStreamChunk(content=self.message_text)


# ---------------------------------------------------------------------------
# 2. Database Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def explain_db_session():
    """In-memory SQLite database session isolated per test."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def explain_seed_data(explain_db_session):
    """Seeds verified vocational records, student, and parent users."""
    db = explain_db_session

    # 1. Statutory data source
    src = DataSource(
        name="MSDE National Skills Repository",
        source_type="Ministry of Skill Development and Entrepreneurship",
        url="https://www.msde.gov.in",
    )
    db.add(src)
    db.commit()

    # 2. Verified Occupation
    occ = Occupation(
        name="Automobile Technician",
        description="Diagnoses, services, and repairs electronic and mechanical automotive systems.",
        sector="Automotive",
        skill_requirements=["Engine diagnostics", "Brake systems", "OBD-II scanners"],
    )
    db.add(occ)
    db.commit()

    # 3. Verified Career Path
    cp = CareerPath(
        name="Automotive Service Progression",
        description="Apprentice to Master Technician pathway",
        progression_ladder=[
            "Vocational Apprentice",
            "Junior Service Technician",
            "Senior Diagnostic Technician",
            "Workshop Supervisor",
        ],
        estimated_duration="3-5 years",
    )
    cp.occupations.append(occ)
    db.add(cp)
    db.commit()

    # 4. Verified Training Provider & Course
    prov = TrainingProvider(
        name="Government ITI Hyderabad",
        provider_type="Government ITI",
        location="Telangana",
    )
    db.add(prov)
    db.commit()

    course = Course(
        name="Mechanic Motor Vehicle (CTS)",
        description="2-year NCVT accredited automotive curriculum",
        duration="2 years",
        qualification_level="NSQF Level 4",
        sector="Automotive",
        provider_id=prov.id,
        data_source_id=src.id,
    )
    course.career_paths.append(cp)
    db.add(course)
    db.commit()

    # 5. Verified Job Outcome
    outcome = JobOutcome(
        occupation_id=occ.id,
        career_path_id=cp.id,
        data_source_id=src.id,
        employment_rate=82.5,
        salary_range_min=18000,
        salary_range_max=32000,
        salary_currency="INR",
    )
    db.add(outcome)
    db.commit()

    # 6. Student User & Profile
    student_user = User(
        name="Rahul Sharma",
        email="rahul.auto@example.com",
        password_hash=hash_password("StudentPass123!"),
        role=UserRole.STUDENT,
        is_active=True,
    )
    db.add(student_user)
    db.commit()

    student_profile = StudentProfile(
        user_id=student_user.id,
        education_level="Class 10th",
        education_stream="Science",
        location="Hyderabad, Telangana",
    )
    db.add(student_profile)
    db.commit()

    # 7. Parent User & Profile linked to Rahul
    parent_user = User(
        name="Suresh Sharma",
        email="parent.auto@example.com",
        password_hash=hash_password("ParentPass123!"),
        role=UserRole.PARENT,
        is_active=True,
    )
    db.add(parent_user)
    db.commit()

    parent_profile = ParentProfile(
        user_id=parent_user.id,
        relationship_to_student="Father",
        location="Hyderabad, Telangana",
    )
    db.add(parent_profile)
    db.commit()

    assoc = ParentStudentAssociation(
        parent_profile_id=parent_profile.id,
        student_profile_id=student_profile.id,
        relationship_type="Father",
    )
    db.add(assoc)
    db.commit()

    # 8. Unlinked Parent User (for authorization isolation testing)
    unlinked_parent = User(
        name="Other Parent",
        email="other.parent@example.com",
        password_hash=hash_password("OtherPass123!"),
        role=UserRole.PARENT,
        is_active=True,
    )
    db.add(unlinked_parent)
    db.commit()

    unlinked_parent_profile = ParentProfile(
        user_id=unlinked_parent.id,
        relationship_to_student="Mother",
        location="Warangal, Telangana",
    )
    db.add(unlinked_parent_profile)
    db.commit()

    return {
        "occupation": occ,
        "course": course,
        "provider": prov,
        "career_path": cp,
        "job_outcome": outcome,
        "student_user": student_user,
        "student_profile": student_profile,
        "parent_user": parent_user,
        "parent_profile": parent_profile,
        "unlinked_parent": unlinked_parent,
    }


# ---------------------------------------------------------------------------
# 3. Unit Tests: Schema, Resolution & Synthesis
# ---------------------------------------------------------------------------

def test_counselling_context_payload_validation():
    """Verifies CounsellingContextPayload validation."""
    ctx = CounsellingContextPayload(
        intent="explain_salary",
        entity_type="salary",
        entity_id="123",
        entity_title="Automobile Technician",
    )
    assert ctx.intent == "explain_salary"
    assert ctx.entity_type == "salary"
    assert ctx.entity_id == "123"
    assert ctx.entity_title == "Automobile Technician"


def test_resolve_context_entity_career(explain_db_session, explain_seed_data):
    """Resolves occupation from career intent and integer ID."""
    db = explain_db_session
    occ = explain_seed_data["occupation"]

    ctx = CounsellingContextPayload(
        intent="explain_career",
        entity_type="career",
        entity_id=str(occ.id),
    )
    career_id, title = resolve_context_entity(db, ctx)
    assert career_id == occ.id
    assert title == occ.name


def test_resolve_context_entity_course(explain_db_session, explain_seed_data):
    """Resolves linked career ID from course context."""
    db = explain_db_session
    course = explain_seed_data["course"]
    occ = explain_seed_data["occupation"]

    ctx = CounsellingContextPayload(
        intent="explain_course",
        entity_type="course",
        entity_id=str(course.id),
        entity_title=course.name,
    )
    career_id, title = resolve_context_entity(db, ctx)
    assert career_id == occ.id
    assert title == course.name


def test_resolve_context_entity_pathway(explain_db_session, explain_seed_data):
    """Resolves career ID from pathway context."""
    db = explain_db_session
    cp = explain_seed_data["career_path"]
    occ = explain_seed_data["occupation"]

    ctx = CounsellingContextPayload(
        intent="explain_career_growth",
        entity_type="pathway",
        entity_id=str(cp.id),
    )
    career_id, title = resolve_context_entity(db, ctx)
    assert career_id == occ.id
    assert title == cp.name


def test_resolve_context_entity_missing_safe(explain_db_session):
    """Missing or non-existent entity IDs are handled safely without exception."""
    db = explain_db_session
    ctx = CounsellingContextPayload(
        intent="explain_career",
        entity_type="career",
        entity_id="99999",
        entity_title="Unknown Trade",
    )
    career_id, title = resolve_context_entity(db, ctx)
    assert career_id is None
    assert title == "Unknown Trade"


def test_synthesize_explain_questions_all_intents():
    """Verifies that all 10 supported intents generate grounded, clear user questions."""
    title = "Automobile Technician"
    intents = [
        "explain_career",
        "explain_course",
        "explain_provider",
        "explain_salary",
        "explain_placement",
        "explain_training",
        "explain_career_growth",
        "explain_job_availability",
        "explain_nsqf",
        "explain_further_education",
    ]
    for intent in intents:
        q = synthesize_explain_question(intent, title)
        assert len(q) > 20
        assert title in q or "trade" in q


def test_intent_suggested_questions_all_intents():
    """Verifies suggested questions are specifically relevant to the explanation intent."""
    title = "Electrician"
    salary_qs = get_intent_suggested_questions("explain_salary", title)
    assert any("wage" in q.lower() or "salary" in q.lower() for q in salary_qs)

    growth_qs = get_intent_suggested_questions("explain_career_growth", title)
    assert any("senior" in q.lower() or "supervisor" in q.lower() or "progression" in q.lower() for q in growth_qs)

    placement_qs = get_intent_suggested_questions("explain_placement", title)
    assert any("placement" in q.lower() or "hiring" in q.lower() or "apprenticeship" in q.lower() for q in placement_qs)


def test_format_grounded_messages_includes_explain_directive(explain_seed_data):
    """Verifies that contextual explain directives are injected into AI prompt messages."""
    student_ctx = {"education_level": "Class 10th"}
    career_obj = CounsellingCareer(id=1, title="Automobile Technician")
    retrieved_ctx = RetrievedContext(
        query="salary",
        items=[
            RetrievedKnowledgeItem(
                item=KnowledgeItem(
                    id="occ:1",
                    type=KnowledgeType.OCCUPATION,
                    title="Automobile Technician",
                    content="Automobile Technician verified records",
                    provenance=KnowledgeProvenance(
                        source="MSDE",
                        verified=True,
                    ),
                ),
                score=0.9,
            )
        ],
    )
    explain_ctx = CounsellingContextPayload(
        intent="explain_salary",
        entity_type="salary",
        entity_id="1",
        entity_title="Automobile Technician",
    )

    messages = format_grounded_messages(
        student_context=student_ctx,
        career_obj=career_obj,
        retrieved_context=retrieved_ctx,
        history=[],
        latest_question="Explain",
        explain_context=explain_ctx,
    )

    system_turn = next(m for m in messages if m.role == AIRole.SYSTEM)
    assert "CONTEXTUAL EXPLAIN DIRECTIVE" in system_turn.content
    assert "explain_salary" in system_turn.content
    assert "DO NOT promise guaranteed salaries" in system_turn.content


# ---------------------------------------------------------------------------
# 4. Integration Tests: Service & Router Orchestration
# ---------------------------------------------------------------------------

def test_service_contextual_explain_career(explain_db_session, explain_seed_data):
    """Verifies end-to-end service execution for explain_career."""
    db = explain_db_session
    student = explain_seed_data["student_profile"]
    student_user = explain_seed_data["student_user"]
    occ = explain_seed_data["occupation"]

    mock_provider = MockExplainAIProvider(
        "Automobile Technicians inspect and maintain motor vehicles with hands-on workshop training."
    )
    service = CounsellingService(ai_provider=mock_provider)

    session = service.create_session(db, student_profile_id=student.id)

    ctx = CounsellingContextPayload(
        intent="explain_career",
        entity_type="career",
        entity_id=str(occ.id),
        entity_title=occ.name,
    )

    response = asyncio.run(
        service.process_counselling_message(
            db=db,
            session_id=session.id,
            sender_user=student_user,
            message_text="Explain",
            context=ctx,
        )
    )

    assert isinstance(response, CounsellingResponse)
    assert response.career.title == "Automobile Technician"
    assert len(response.career_path) > 0
    assert response.career_metrics is not None
    assert response.career_metrics.salary_min == 18000
    assert response.career_metrics.salary_max == 32000

    # User message persisted should be the synthesized query
    msgs = service.get_recent_history(db, session.id)
    assert len(msgs) == 2
    assert "Automobile Technician" in msgs[0].content


def test_service_contextual_explain_salary_preserves_bounds(explain_db_session, explain_seed_data):
    """Verifies explain_salary populates metrics and intent-focused suggested questions."""
    db = explain_db_session
    student = explain_seed_data["student_profile"]
    student_user = explain_seed_data["student_user"]
    occ = explain_seed_data["occupation"]

    mock_provider = MockExplainAIProvider("Verified monthly wage data shows starting wages of ₹18,000.")
    service = CounsellingService(ai_provider=mock_provider)

    session = service.create_session(db, student_profile_id=student.id)

    ctx = CounsellingContextPayload(
        intent="explain_salary",
        entity_type="salary",
        entity_id=str(occ.id),
        entity_title=occ.name,
    )

    response = asyncio.run(
        service.process_counselling_message(
            db=db,
            session_id=session.id,
            sender_user=student_user,
            message_text="Explain this",
            context=ctx,
        )
    )

    assert response.career_metrics.salary_min == 18000
    assert response.career_metrics.salary_max == 32000
    # Suggested questions should prioritize salary
    assert any("wage" in q.lower() or "salaries" in q.lower() for q in response.suggested_questions)


def test_service_human_escalation_in_contextual_request(explain_db_session, explain_seed_data):
    """Verifies that human escalation requests within a contextual inquiry correctly set requires_human."""
    db = explain_db_session
    student = explain_seed_data["student_profile"]
    student_user = explain_seed_data["student_user"]
    occ = explain_seed_data["occupation"]

    mock_provider = MockExplainAIProvider("I will connect you with a human counsellor right away.")
    service = CounsellingService(ai_provider=mock_provider)

    session = service.create_session(db, student_profile_id=student.id)

    ctx = CounsellingContextPayload(
        intent="explain_career",
        entity_type="career",
        entity_id=str(occ.id),
        entity_title=occ.name,
    )

    response = asyncio.run(
        service.process_counselling_message(
            db=db,
            session_id=session.id,
            sender_user=student_user,
            message_text="Please connect me to a human counsellor to explain this career",
            context=ctx,
        )
    )

    assert response.requires_human is True
    # Human escalation record created
    escalation = db.query(HumanEscalation).filter(HumanEscalation.counselling_session_id == session.id).first()
    assert escalation is not None


# ---------------------------------------------------------------------------
# 5. API Endpoints: Student & Parent Authorization Tests
# ---------------------------------------------------------------------------

def test_api_create_session_with_explain_context(explain_db_session, explain_seed_data):
    """API: POST /api/counselling/sessions with context creates session with initial AI explanation."""
    def override_get_db():
        try:
            yield explain_db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    mock_provider = MockExplainAIProvider()
    counselling_service._custom_ai_provider = mock_provider
    client = TestClient(app)

    student_user = explain_seed_data["student_user"]
    occ = explain_seed_data["occupation"]
    token = create_access_token(payload_data={"sub": str(student_user.id), "role": "student"})

    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "context": {
            "intent": "explain_career",
            "entity_type": "career",
            "entity_id": str(occ.id),
            "entity_title": occ.name,
        }
    }

    res = client.post("/api/counselling/sessions", json=payload, headers=headers)
    assert res.status_code == 201
    data = res.json()
    assert data["id"] > 0
    assert len(data["messages"]) == 2  # user question + initial AI answer
    assert "Automobile Technician" in data["messages"][0]["content"]

    app.dependency_overrides.clear()


def test_api_parent_contextual_counselling_authorized(explain_db_session, explain_seed_data):
    """API: Parent creates contextual session for linked child."""
    def override_get_db():
        try:
            yield explain_db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    mock_provider = MockExplainAIProvider()
    counselling_service._custom_ai_provider = mock_provider
    client = TestClient(app)

    parent_user = explain_seed_data["parent_user"]
    student = explain_seed_data["student_profile"]
    occ = explain_seed_data["occupation"]
    token = create_access_token(payload_data={"sub": str(parent_user.id), "role": "parent"})

    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "student_id": student.id,
        "context": {
            "intent": "explain_job_availability",
            "entity_type": "career",
            "entity_id": str(occ.id),
            "entity_title": occ.name,
        },
    }

    res = client.post("/api/counselling/sessions", json=payload, headers=headers)
    assert res.status_code == 201
    data = res.json()
    assert data["student_profile_id"] == student.id
    assert len(data["messages"]) == 2
    assert data["messages"][0]["sender_type"] == "parent"

    app.dependency_overrides.clear()


def test_api_parent_cross_student_access_rejected(explain_db_session, explain_seed_data):
    """API: Unlinked parent cannot create session for another student (403 Forbidden)."""
    def override_get_db():
        try:
            yield explain_db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)

    unlinked_parent = explain_seed_data["unlinked_parent"]
    student = explain_seed_data["student_profile"]
    occ = explain_seed_data["occupation"]
    token = create_access_token(payload_data={"sub": str(unlinked_parent.id), "role": "parent"})

    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "student_id": student.id,
        "context": {
            "intent": "explain_career",
            "entity_type": "career",
            "entity_id": str(occ.id),
        },
    }

    res = client.post("/api/counselling/sessions", json=payload, headers=headers)
    assert res.status_code == 403

    app.dependency_overrides.clear()


def test_api_post_message_with_explain_salary_context(explain_db_session, explain_seed_data):
    """API: POST /api/counselling/sessions/{id}/messages with explain_salary context."""
    def override_get_db():
        try:
            yield explain_db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    mock_provider = MockExplainAIProvider()
    counselling_service._custom_ai_provider = mock_provider
    client = TestClient(app)

    student_user = explain_seed_data["student_user"]
    student = explain_seed_data["student_profile"]
    occ = explain_seed_data["occupation"]
    token = create_access_token(payload_data={"sub": str(student_user.id), "role": "student"})
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create session first
    create_res = client.post("/api/counselling/sessions", json={}, headers=headers)
    assert create_res.status_code == 201
    session_id = create_res.json()["id"]

    # 2. Post contextual explain message
    msg_payload = {
        "message": "Explain this",
        "context": {
            "intent": "explain_salary",
            "entity_type": "salary",
            "entity_id": str(occ.id),
            "entity_title": occ.name,
        },
    }

    res = client.post(f"/api/counselling/sessions/{session_id}/messages", json=msg_payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["career"]["title"] == "Automobile Technician"
    assert data["career_metrics"]["salary_min"] == 18000
    assert data["career_metrics"]["salary_max"] == 32000
    assert len(data["suggested_questions"]) >= 3

    app.dependency_overrides.clear()
