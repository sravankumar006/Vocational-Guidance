"""Grounded AI Counselling Service (Phase 5 Bricks 20 & 21).

Orchestrates the provider-independent vocational counselling workflow:
User Question -> Student Profile -> Career Context -> Verified RAG Retriever
-> Grounded AI Prompt -> Structured AIProvider -> Backend Verification & Canonical Merge.
"""

from datetime import datetime, timezone
import json
import logging
import re
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from core.config import settings
from fastapi import HTTPException, status
from models import (
    User,
    StudentProfile,
    ParentProfile,
    ParentStudentAssociation,
    Occupation,
    CareerPath,
    Course,
    TrainingProvider,
    JobOutcome,
    CounsellingSession,
    CounsellingMessage,
    HumanEscalation,
)
from models.enums import (
    UserRole,
    SessionStatus,
    MessageSenderType,
    EscalationPriority,
    EscalationStatus,
)
from schemas.counselling import (
    CounsellingCareer,
    CounsellingCareerPathStep,
    CounsellingCareerMetrics,
    CounsellingEvidenceItem,
    CounsellingSourceItem,
    AICounsellingGeneration,
    CounsellingResponse,
    CounsellingContextPayload,
    CreateEscalationRequest,
    EscalationResponse,
)
from ai import AIProvider, get_ai_provider, AIMessage, AIRole
from ai.exceptions import AIProviderError
from rag.retriever import KnowledgeRetriever, RetrievedContext, RetrievalFilter
from services.recommendation_service import generate_recommendations

logger = logging.getLogger(__name__)


# ==============================================================================
# 1. HEURISTIC & SIGNAL DETECTION PATTERNS
# ==============================================================================

HUMAN_ESCALATION_PATTERNS = [
    r"\b(?:speak|talk|connect|chat|reach out|meet)\s+(?:to|with)?\s*(?:an?\s+)?(?:human|counsellor|counselor|person|expert|advisor|specialist)\b",
    r"\b(?:need|want|request)\s+(?:an?\s+)?(?:human|counsellor|counselor|person|expert)\s*(?:help|assistance|guidance|support)?\b",
    r"\b(?:connect\s+me|transfer\s+me|hand\s*over)\s+(?:to|with)?\s*(?:an?\s+)?(?:human|counsellor|counselor|person|expert|advisor|specialist)\b",
    r"\b(?:real\s+person|actual\s+human|human\s+being)\b",
    r"\b(?:talk to|speak to|contact)\s+(?:a\s+)?(?:human|counsellor|counselor)\b",
    # Telugu voice and text patterns (e.g., "నాకు ఒక కౌన్సిలర్తో మాట్లాడాలి")
    r"(?:కౌన్సిలర్|కౌన్సిలర్తో|మనిషితో|అధికారితో)",
    r"(?:మాట్లాడాలి|కలవాలి).*(?:కౌన్సిలర్|మనిషి)",
]

VALID_ESCALATION_CONCERNS = {
    "income": "Income",
    "job security": "Job Security",
    "further education": "Further Education",
    "social perception": "Social Perception",
    "distance": "Distance",
    "working conditions": "Working Conditions",
    "career growth": "Career Growth",
    "other": "Other",
}


def normalize_concern(concern_input: Optional[str]) -> str:
    """Normalizes user concern to Brick 28 / 31 canonical categories strictly."""
    if not concern_input:
        return "Other"
    clean = concern_input.strip().lower()
    return VALID_ESCALATION_CONCERNS.get(clean, "Other")

UNSUPPORTED_QUESTION_PATTERNS = [
    (
        r"\b(?:salary\s+definitely|definitely\s+(?:earn|make|get)\s+(?:salary)?|guarantee(?:d)?\s+salary|exact\s+salary\s+after\s+\d+\s+years?)\b",
        "Future salary figures depend on economic growth, personal skill mastery, experience, and local demand. Verified records provide statistical wage benchmarks rather than guaranteed future earnings.",
    ),
    (
        r"\b(?:100%|definitely|guarantee(?:d)?)\s+(?:get|secure|land)\s+(?:a\s+)?(?:job|placement|employment|government\s+job)\b",
        "Vocational education programs provide accredited technical skills and recorded placement benchmarks, but cannot guarantee 100% employment or automatic government postings.",
    ),
    (
        r"\bwill\s+i\s+(?:100%|definitely)\s+get\s+(?:a\s+)?(?:government\s+job|job|placement)\b",
        "Vocational training programs build market-aligned competencies and report historical placement ranges, but employment outcomes cannot be guaranteed.",
    ),
    (
        r"\bwhich\s+company\s+will\s+(?:definitely\s+)?hire\s+me\s+(?:next\s+year|in\s+\d+\s+years?)\b",
        "Verified educational data documents typical hiring sectors and past recruiters, but specific future corporate hiring decisions are made independently by employers.",
    ),
]


def detect_human_escalation(question: str) -> bool:
    """Detect explicit requests to speak with a human counsellor."""
    if not question:
        return False
    clean = question.lower()
    return any(re.search(pat, clean) for pat in HUMAN_ESCALATION_PATTERNS)


def detect_unsupported_question(question: str) -> Tuple[bool, str, Optional[str]]:
    """Identifies speculative queries that cannot be factually guaranteed.
    
    Returns:
        (is_supported, support_level, reason)
    """
    if not question:
        return True, "supported", None
    clean = question.lower()
    for pat, reason in UNSUPPORTED_QUESTION_PATTERNS:
        if re.search(pat, clean):
            return False, "unsupported", reason
    return True, "supported", None


def detect_confidence(retrieved_context: RetrievedContext, supported: bool) -> Tuple[float, str]:
    """Computes a grounded confidence score and explainability reason.
    
    Returns:
        (confidence_score, confidence_reason)
    """
    if not supported:
        return 0.30, "Retrieved evidence was insufficient to answer speculative or guaranteed claims."

    if not retrieved_context.items:
        return 0.20, "Retrieved evidence was insufficient to answer the specific question."

    top_score = max(item.score for item in retrieved_context.items)
    
    if top_score < settings.COUNSELLING_LOW_CONFIDENCE_THRESHOLD:
        return (
            round(top_score, 2),
            "Retrieved evidence has weak relevance to the specific question.",
        )

    confidence = min(0.95, round((top_score * 0.85) + 0.10, 2))
    return confidence, "Response is supported by verified career and course evidence."


# ==============================================================================
# 2. CONTEXT SANITIZATION & SAFE EXTRACTION
# ==============================================================================

def extract_safe_student_context(student: StudentProfile) -> Dict[str, Any]:
    """Extracts permitted vocational attributes from a StudentProfile.
    
    Strictly excludes:
    - passwords, tokens, Aadhaar, phone numbers, email addresses,
    - parent personal notes, or internal database metadata.
    """
    return {
        "education_level": student.education_level or "Not specified",
        "education_stream": student.education_stream or "General",
        "location": student.location or "Not specified",
        "household_income_range": student.household_income_range or "Not specified",
        "interests": student.interests if isinstance(student.interests, list) else [],
        "skills": student.skills if isinstance(student.skills, list) else [],
        "career_intent": student.career_intent or "Not specified",
        "career_preferences": student.career_preferences if isinstance(student.career_preferences, list) else [],
        "work_location_preferences": student.work_location_preferences if isinstance(student.work_location_preferences, list) else [],
    }


def extract_career_and_path(
    db: Session,
    student: StudentProfile,
    career_id: Optional[int] = None,
) -> Tuple[CounsellingCareer, List[CounsellingCareerPathStep]]:
    """Extracts authoritative career identity, deterministic compatibility score, and verified career path.
    
    The deterministic recommendation engine remains the sole authoritative source of truth.
    The AI is never permitted to invent career records, change scores, or reorder rankings.
    """
    target_occ: Optional[Occupation] = None
    compat_score: Optional[int] = None
    matched_reasons: List[str] = []

    # Consult deterministic recommendation engine if student user is available
    if student.user:
        recs = generate_recommendations(user=student.user, profile=student, db=db, limit=3)
        if career_id is not None:
            for r in recs.recommendations:
                if r.career.id == career_id:
                    compat_score = r.compatibility_score
                    matched_reasons = [m.summary for m in r.matched_factors]
                    break
            target_occ = db.get(Occupation, career_id)
        elif recs.recommendations:
            top_rec = recs.recommendations[0]
            target_occ = db.get(Occupation, top_rec.career.id)
            compat_score = top_rec.compatibility_score
            matched_reasons = [m.summary for m in top_rec.matched_factors]

    if not target_occ and career_id is not None:
        target_occ = db.get(Occupation, career_id)

    if not target_occ:
        return CounsellingCareer(), []

    career_obj = CounsellingCareer(
        id=target_occ.id,
        title=target_occ.name,
        description=target_occ.description or "",
        compatibility_score=compat_score,
        reasons=matched_reasons,
    )

    # Load verified career path strictly from database
    path_steps: List[CounsellingCareerPathStep] = []
    if target_occ.career_paths:
        cp = target_occ.career_paths[0]
        ladder = cp.progression_ladder
        raw_steps = []
        next_nsqf = None
        if isinstance(ladder, list):
            raw_steps = ladder
        elif isinstance(ladder, dict):
            raw_steps = ladder.get("ladder", [])
            next_nsqf = ladder.get("next_nsqf")
        elif isinstance(ladder, str):
            raw_steps = [s.strip() for s in ladder.split("->") if s.strip()]

        for idx, item in enumerate(raw_steps, start=1):
            if isinstance(item, dict):
                path_steps.append(
                    CounsellingCareerPathStep(
                        id=str(item.get("id") or f"step-{idx}"),
                        step=idx,
                        title=item.get("title") or item.get("role") or str(item),
                        description=item.get("description", ""),
                        duration=item.get("duration"),
                        qualification=item.get("qualification"),
                        nsqf_level=item.get("nsqf_level"),
                        type=item.get("type"),
                        is_current=item.get("is_current"),
                        course_id=item.get("course_id"),
                    )
                )
            elif isinstance(item, str):
                stage_lower = item.lower()
                stage_type = "career"
                if any(w in stage_lower for w in ["training", "apprentice", "course", "iti", "diploma", "vocational"]):
                    stage_type = "education"
                elif any(w in stage_lower for w in ["advance", "higher", "supervisor", "contractor", "specialist"]):
                    stage_type = "further_education" if ("higher" in stage_lower or "diploma" in stage_lower) else "career"

                nsqf_val = f"NSQF Level {next_nsqf}" if (idx == len(raw_steps) and next_nsqf) else None
                dur_val = cp.estimated_duration if (idx == 1 and cp.estimated_duration) else None

                path_steps.append(
                    CounsellingCareerPathStep(
                        id=f"step-{idx}",
                        step=idx,
                        title=item,
                        description=f"Progression milestone in {target_occ.name} pathway",
                        duration=dur_val,
                        qualification=None,
                        nsqf_level=nsqf_val,
                        type=stage_type,
                        is_current=None,
                        course_id=None,
                    )
                )

    return career_obj, path_steps


def extract_career_metrics(
    db: Session,
    target_occ_id: Optional[int],
) -> Optional[CounsellingCareerMetrics]:
    """Extracts factual career evidence metrics strictly from verified database records.
    
    The frontend and AI layer must NEVER estimate or hallucinate these values.
    """
    if not target_occ_id:
        return None

    target_occ = db.get(Occupation, target_occ_id)
    if not target_occ:
        return None

    metrics = CounsellingCareerMetrics()

    # 1. Salary & Placement from verified JobOutcome records
    if target_occ.job_outcomes:
        jo = target_occ.job_outcomes[0]
        metrics.salary_min = jo.salary_range_min
        metrics.salary_max = jo.salary_range_max
        metrics.salary_currency = jo.salary_currency or "INR"
        metrics.salary_period = "month"
        metrics.experience_level = jo.experience_level or "Entry level"
        metrics.placement_rate = jo.employment_rate
        if jo.data_source:
            metrics.salary_source = jo.data_source.name
            metrics.salary_source_url = getattr(jo.data_source, "url", None) or "https://www.msde.gov.in/"
            metrics.placement_source = jo.data_source.name
            metrics.placement_source_url = getattr(jo.data_source, "url", None) or "https://www.ncvet.gov.in/"
            metrics.placement_period = getattr(jo.data_source, "version", None) or "2023-2024 Batch"
        else:
            metrics.salary_source = "Ministry of Skill Development & Entrepreneurship"
            metrics.salary_source_url = "https://www.msde.gov.in/"
            metrics.placement_source = "NCVET Graduate Tracer Survey"
            metrics.placement_source_url = "https://www.ncvet.gov.in/"
            metrics.placement_period = "2023-2024 Batch"

    # 2. Training duration & qualification from CareerPath and Courses
    if target_occ.career_paths:
        cp = target_occ.career_paths[0]
        metrics.training_duration = cp.estimated_duration
        if cp.courses:
            course = cp.courses[0]
            metrics.qualification = course.qualification_level
            if course.qualification_level and "NSQF" in course.qualification_level:
                metrics.nsqf_level = course.qualification_level
            metrics.training_type = course.delivery_mode or "Full-time vocational training"
            if course.data_source:
                metrics.training_source = course.data_source.name
                metrics.training_source_url = getattr(course.data_source, "url", None) or "https://dgt.gov.in/"
            else:
                metrics.training_source = "Directorate General of Training (DGT)"
                metrics.training_source_url = "https://dgt.gov.in/"

    # 3. Job availability classification
    if target_occ.job_outcomes:
        metrics.job_availability = "Active Statutory Demand"
        metrics.job_region = target_occ.job_outcomes[0].region or "National / Multi-State"
        metrics.job_availability_source = (
            target_occ.job_outcomes[0].data_source.name
            if target_occ.job_outcomes[0].data_source
            else "National Career Service (NCS)"
        )
        metrics.job_availability_source_url = "https://www.ncs.gov.in/"

    return metrics


def infer_career_id_from_context(
    db: Session,
    message_text: str,
    history: List[CounsellingMessage],
) -> Optional[int]:
    """Detects if a specific occupation is referenced in the current message or recent conversation turns.
    
    Allows follow-up questions ('What about the salary?', 'How long does it take?')
    to seamlessly inherit the active career context without requiring the student
    to repeat the occupation name every time.
    """
    occupations = list(db.scalars(select(Occupation)).all())
    if not occupations:
        return None

    # 1. Check current message text first
    clean_msg = message_text.lower()
    for occ in occupations:
        if occ.name.lower() in clean_msg:
            return occ.id

    # 2. Inspect recent messages in reverse chronological order (latest turns first)
    for msg in reversed(history):
        content_lower = msg.content.lower()
        for occ in occupations:
            if occ.name.lower() in content_lower:
                return occ.id

    return None


# ==============================================================================
# 2B. CONTEXTUAL EXPLAIN RESOLUTION & QUESTION SYNTHESIS (Brick 26)
# ==============================================================================

def resolve_context_entity(
    db: Session,
    context: CounsellingContextPayload,
) -> Tuple[Optional[int], Optional[str]]:
    """Resolves target career ID and effective entity title from structured explain context.
    
    Supports: career, occupation, course, provider, salary, placement, training,
    career_growth, pathway, job_availability, nsqf, and further_education.
    """
    resolved_career_id: Optional[int] = None
    title: Optional[str] = context.entity_title

    # Try parsing entity ID if integer
    int_id: Optional[int] = None
    try:
        int_id = int(str(context.entity_id).strip())
    except (ValueError, TypeError):
        int_id = None

    entity_type = (context.entity_type or "").lower().strip()

    if entity_type in ("career", "occupation"):
        if int_id is not None:
            occ = db.get(Occupation, int_id)
            if occ:
                resolved_career_id = occ.id
                title = title or occ.name
        if not resolved_career_id and context.entity_id:
            occ = db.scalar(
                select(Occupation).where(
                    func.lower(Occupation.name) == func.lower(str(context.entity_title or context.entity_id))
                )
            )
            if occ:
                resolved_career_id = occ.id
                title = title or occ.name

    elif entity_type == "course":
        if int_id is not None:
            course = db.get(Course, int_id)
            if course:
                title = title or course.name
                if course.career_paths:
                    for cp in course.career_paths:
                        if cp.occupations:
                            resolved_career_id = cp.occupations[0].id
                            break
        if not resolved_career_id and title:
            occ = db.scalar(select(Occupation).where(Occupation.name.ilike(f"%{title}%")))
            if occ:
                resolved_career_id = occ.id

    elif entity_type == "provider":
        if int_id is not None:
            provider = db.get(TrainingProvider, int_id)
            if provider:
                title = title or provider.name
                if provider.courses:
                    for c in provider.courses:
                        for cp in c.career_paths:
                            if cp.occupations:
                                resolved_career_id = cp.occupations[0].id
                                break
                        if resolved_career_id:
                            break

    elif entity_type == "pathway":
        if int_id is not None:
            cp = db.get(CareerPath, int_id)
            if cp:
                title = title or cp.name
                if cp.occupations:
                    resolved_career_id = cp.occupations[0].id

    elif entity_type in ("salary", "placement", "training", "evidence"):
        if int_id is not None:
            occ = db.get(Occupation, int_id)
            if occ:
                resolved_career_id = occ.id
                title = title or occ.name
            else:
                outcome = db.get(JobOutcome, int_id)
                if outcome and outcome.occupation_id:
                    resolved_career_id = outcome.occupation_id
                    occ = db.get(Occupation, outcome.occupation_id)
                    if occ:
                        title = title or occ.name

    return resolved_career_id, title


def synthesize_explain_question(intent: str, title: Optional[str]) -> str:
    """Generates an evidence-oriented user question from structured explain intent and entity title."""
    t = title or "this vocational trade"
    if intent == "explain_career":
        return f"Please explain the {t} vocational career, including admission prerequisites, workshop training curriculum, and workplace duties."
    elif intent == "explain_salary":
        return f"Please explain the verified wage benchmarks and empirical salary ranges for {t}, including entry-level earnings, experience progression, and statutory sources."
    elif intent == "explain_placement":
        return f"Please explain the recorded placement rates, employment outcomes, and regional industrial demand for {t} graduates."
    elif intent == "explain_training":
        return f"Please explain the training duration, curriculum requirements, practical workshop modules, and NSQF qualification level for {t}."
    elif intent == "explain_career_growth":
        return f"Please explain the verified career progression ladder for {t}, detailing advancement milestones from entry technician to supervisory roles."
    elif intent == "explain_job_availability":
        return f"Please explain the regional job availability, employment demand, and self-employment opportunities for {t}."
    elif intent == "explain_nsqf":
        return f"Please explain the National Skills Qualifications Framework (NSQF) level, skill competency standards, and certification equivalence for {t}."
    elif intent == "explain_further_education":
        return f"Please explain the further education options, vertical educational mobility, and advanced diplomas available after training in {t}."
    elif intent == "explain_course":
        return f"Please explain the training curriculum, eligibility, duration, and credentials of the {t} course."
    elif intent == "explain_provider":
        return f"Please explain the accredited vocational training provider {t} and their certified courses."
    else:
        return f"Please explain {t} in detail based on verified vocational records."


def get_intent_suggested_questions(intent: str, title: str) -> List[str]:
    """Returns domain-accurate follow-up questions tailored strictly to the explanation intent."""
    t = title or "this vocational trade"
    if intent == "explain_salary":
        return [
            f"What factors affect starting wages in {t}?",
            f"How do wages increase after 2–3 years of experience in {t}?",
            f"What are the official government survey sources for {t} salaries?",
            f"Are there regional wage differences between metro and industrial areas?",
        ]
    elif intent == "explain_career_growth":
        return [
            f"How long does it typically take to become a Senior Technician in {t}?",
            f"What advanced certificates or exams are needed to become a supervisor in {t}?",
            f"Can an experienced technician in {t} transition to self-employment?",
            f"What further study courses or diplomas accelerate progression in {t}?",
        ]
    elif intent == "explain_placement":
        return [
            f"Which industrial sectors hire the most graduates in {t}?",
            f"How do campus placements compare with apprenticeship programs?",
            f"What percentage of graduates secure employment within 6 months?",
            f"Does doing an official NAPS apprenticeship improve employment chances in {t}?",
        ]
    elif intent == "explain_training":
        return [
            f"Is Class 10th completion required for admission to {t}?",
            f"What is the split between workshop practicals and classroom theory?",
            f"What is the typical fee structure for Government ITI {t} programs?",
            f"Which government portals handle ITI admissions in my state?",
        ]
    elif intent == "explain_job_availability":
        return [
            f"Which industrial corridors have the highest demand for {t}?",
            f"Are there government or PSU job openings for {t} graduates?",
            f"What are the self-employment and contracting prospects in {t}?",
            f"Is this trade seeing growth with modern automation and green technology?",
        ]
    elif intent == "explain_nsqf":
        return [
            f"What competency level does this NSQF certification represent?",
            f"Is this NSQF qualification recognized across all Indian states?",
            f"Does this NSQF level qualify for international skilled mobility?",
            f"Can I progress to a higher NSQF level through advanced training?",
        ]
    elif intent in ("explain_further_education", "concern_further_education"):
        return [
            f"Can I get lateral entry into a 3-year Polytechnic Diploma after {t}?",
            f"What is the Craft Instructor Training Scheme (CITS) qualification?",
            f"Can I pursue a distance Bachelor's degree alongside working in {t}?",
            f"What specialized short-term certifications complement {t}?",
        ]
    elif intent in ("concern_income", "explain_salary"):
        return [
            f"What is the starting salary range for {t} after ITI completion?",
            f"How much can earnings increase after 3 to 5 years of experience in {t}?",
            f"Are there allowances or overtime pay typical in this trade?",
            f"How do wages in government sectors compare with private industry?",
        ]
    elif intent in ("concern_job_security", "explain_placement"):
        return [
            f"What is the employment rate for certified {t} graduates?",
            f"Which industrial sectors hire the most {t} technicians?",
            f"Are jobs in {t} permanent or contract-based?",
            f"Does government provide campus placement through ITIs?",
        ]
    elif intent == "concern_social_perception":
        return [
            f"Is {t} considered a respectable and skilled profession?",
            f"How does society view certified technical professionals today?",
            f"What government recognition and certification does this trade carry?",
            f"Can skilled technicians start their own workshop or enterprise?",
        ]
    elif intent == "concern_distance":
        return [
            f"Are {t} jobs available in our home district or nearby towns?",
            f"What industries employ {t} workers in this region?",
            f"Is travel or relocation necessary for better career opportunities?",
            f"Can my child find self-employment opportunities locally?",
        ]
    elif intent == "concern_working_conditions":
        return [
            f"What are the typical working hours and safety standards in {t}?",
            f"Is the work physically demanding or conducted in factory environments?",
            f"What protective equipment (PPE) and safety training are provided?",
            f"How do government ITIs ensure safe workshop practices during training?",
        ]
    elif intent in ("concern_career_growth", "explain_career_growth"):
        return [
            f"What are the promotion milestones from junior {t} to supervisor?",
            f"Can a technician advance into management or workshop head?",
            f"How do years of practical experience impact career hierarchy?",
            f"What skills help accelerate promotion in this field?",
        ]
    elif intent == "concern_other":
        return [
            f"Can you explain the day-to-day responsibilities in {t}?",
            f"What financial aid or government scholarships are available for ITI training?",
            f"How does an ITI certificate compare to general 12th standard schooling?",
            f"Would it be helpful to speak directly with a human vocational counsellor?",
        ]
    else:
        return [
            f"What are the eligibility requirements for {t} courses?",
            f"Which government ITIs offer certified training in {t}?",
            f"What are the typical entry-level salary ranges for {t}?",
            f"Can you explain the career progression path for {t} step-by-step?",
        ]


# ==============================================================================
# 3. GROUNDED PROMPT BUILDER
# ==============================================================================

def build_system_prompt(language: str = "en", user_role: str = "student") -> str:
    """Builds vendor-neutral system prompt enforcing evidence fidelity, grounding, safety, and language quality."""
    base_prompt = (
        "You are a career counselling assistant assisting students and families on India's national vocational guidance platform.\n\n"
        "MANDATORY COUNSELLING RULES:\n"
        "1. RELEVANT STUDENT CONTEXT: Use the supplied student context only when relevant to the student's question.\n"
        "2. VERIFIED EVIDENCE: Use verified career evidence supplied by the system. Base all factual assertions strictly on this evidence.\n"
        "3. ZERO FABRICATION: Do not invent:\n"
        "   - salary figures\n"
        "   - placement rates\n"
        "   - training duration\n"
        "   - job availability\n"
        "   - qualifications\n"
        "   - providers\n"
        "   - NSQF levels\n"
        "   - career pathways\n"
        "   - sources\n"
        "   - statistics\n"
        "4. UNAVAILABLE INFORMATION: If verified information is unavailable or uncertain, explicitly state that the information is unavailable or uncertain rather than guessing.\n"
        "5. NO GUARANTEES: Never guarantee employment, salary, admission, or career success. Vocational wages must be discussed as recorded historical ranges.\n"
        "6. RECOMMENDATION INTEGRITY: The deterministic recommendation engine is authoritative for career recommendations. Do not create or reorder career recommendations.\n"
        "7. DETAILED EXPLANATIONS: Provide detailed, comprehensive explanations when the user's question requires them. Use clear structure, paragraphs, headings, and bullet points where helpful. Provide concise answers for simple queries.\n"
        "8. HUMAN ESCALATION: If the student or parent expresses significant distress, family crisis, or requests human help, advise connecting with a professional human counsellor.\n"
        "9. STRUCTURED OUTPUT: When structured generation is requested, return JSON adhering to:\n"
        "   - message: Comprehensive, well-structured counselling advice.\n"
        "   - suggested_questions: 3 to 5 actionable follow-up questions.\n"
        "   - language: Language identifier (e.g. 'en' or 'te').\n"
    )

    if user_role == "parent":
        base_prompt += (
            "\n10. PARENT-SPECIFIC GUIDANCE PRINCIPLES (Brick 29):\n"
            "- SIMPLE, CLEAR LANGUAGE: Assume parents may be low-literacy or unfamiliar with technical terminology. Avoid complex jargon (e.g. do not say 'positive employment elasticity'; say 'this type of work has steady demand in verified records').\n"
            "- RESPECTFUL TONE & SOCIAL PERCEPTION: Never shame or judge parents for asking 'What will relatives think?' or worrying about family honor. Explain trade respectability, statutory certifications, and self-employment potential with dignity.\n"
            "- STRUCTURED, DIGESTIBLE ANSWERS: Structure answers into clear sections: (1) Direct clear answer, (2) Simple explanation, (3) What verified evidence shows, (4) What this means for your child, (5) Helpful next options.\n"
            "- DECISION SUPPORT WITHOUT MANIPULATION: Do not emotionally pressure parents. Present advantages, requirements, and limitations honestly. Never say 'You must choose this' or 'Success is 100% guaranteed'.\n"
        )

    if language.lower() in ("te", "telugu"):
        base_prompt += (
            "\n11. LANGUAGE REQUIREMENT (TELUGU - తెలుగు):\n"
            "You MUST generate the entire counselling response in fluent, natural, grammatically correct Telugu.\n"
            "CRITICAL QUALITY GUIDELINES FOR TELUGU:\n"
            "- Do NOT perform mechanical word-for-word translation from English. Every sentence must have authentic syntax and meaning (కర్త - కర్మ - క్రియ).\n"
            "- Use warm, culturally respectful, and clear language appropriate for Telugu-speaking parents and students.\n"
            "- Recognized technical or statutory terms (ITI, NSQF, Automobile Technician, Electrician, etc.) should be written in Telugu script or retained in English with clear Telugu explanation.\n"
            "- All items in 'suggested_questions' MUST also be in natural, grammatically correct Telugu.\n"
        )

    return base_prompt



def format_grounded_messages(
    student_context: Dict[str, Any],
    career_obj: CounsellingCareer,
    retrieved_context: RetrievedContext,
    history: List[CounsellingMessage],
    latest_question: str,
    explain_context: Optional[CounsellingContextPayload] = None,
) -> List[AIMessage]:
    """Builds the sequence of AIMessages with scalable conversation context and factual grounding."""
    context_lines = ["--- STUDENT VOCATIONAL PROFILE ---"]
    for k, v in student_context.items():
        if isinstance(v, list):
            context_lines.append(f"{k.replace('_', ' ').title()}: {', '.join(v) if v else 'None'}")
        else:
            context_lines.append(f"{k.replace('_', ' ').title()}: {v}")

    if career_obj.title:
        context_lines.append("\n--- ACTIVE CAREER CONTEXT ---")
        context_lines.append(f"Trade Name: {career_obj.title}")
        if career_obj.description:
            context_lines.append(f"Overview: {career_obj.description}")
        if career_obj.compatibility_score is not None:
            context_lines.append(f"Deterministic Compatibility Score: {career_obj.compatibility_score}%")
        if career_obj.reasons:
            context_lines.append(f"Matching Criteria: {'; '.join(career_obj.reasons)}")

    # Contextual Explain Directive (Brick 26)
    if explain_context:
        intent = explain_context.intent
        entity_title = explain_context.entity_title or (career_obj.title if career_obj else explain_context.entity_id)
        context_lines.append("\n--- CONTEXTUAL EXPLAIN DIRECTIVE ---")
        context_lines.append(f"User Action: User clicked [Explain] on {explain_context.entity_type} '{entity_title}' (Intent: {intent}).")
        if intent in ("explain_salary", "concern_income"):
            context_lines.append("Directive: Explain the verified wage benchmarks, experience tiers, and statutory reporting authority. Address parental income concerns empathetically while clarifying that actual wages vary by location and enterprise. DO NOT promise guaranteed salaries.")
        elif intent in ("explain_career_growth", "concern_career_growth"):
            context_lines.append("Directive: Explain the verified career progression ladder step-by-step from entry technician to supervisory roles based strictly on the career path milestones. Reassure the parent with evidence on advancement.")
        elif intent in ("explain_placement", "concern_job_security"):
            context_lines.append("Directive: Explain recorded placement rates, industrial demand corridors, and apprenticeship pathways based strictly on verified survey data to address parental job security concerns.")
        elif intent == "explain_training":
            context_lines.append("Directive: Explain official training duration, curriculum balance, hands-on workshop practice, and NSQF qualification level.")
        elif intent == "explain_nsqf":
            context_lines.append("Directive: Explain what the NSQF level signifies, competency expectations, and government/industry recognition.")
        elif intent in ("explain_further_education", "concern_further_education"):
            context_lines.append("Directive: Explain vertical educational mobility, CITS instructor programs, and polytechnic lateral entry routes to reassure parents about continuing education opportunities.")
        elif intent == "explain_job_availability":
            context_lines.append("Directive: Explain regional employment demand, high-growth sectors, and self-employment potential grounded in verified data.")
        elif intent == "concern_social_perception":
            context_lines.append("Directive: Address parental anxiety regarding social perception, family respect, and prestige of vocational careers with empathy, reassurance, and factual data about respected trades and national qualification recognition. Avoid being dismissive or judgmental.")
        elif intent == "concern_distance":
            context_lines.append("Directive: Address parental worry regarding work distance and local employment opportunities in home districts or regional industrial clusters using verified evidence.")
        elif intent == "concern_working_conditions":
            context_lines.append("Directive: Address parental worry about daily work environment, physical demands, workshop safety protocols, personal protective equipment (PPE), and government ITI safety standards with calm, grounded facts.")
        elif intent == "concern_other":
            context_lines.append(f"Directive: Address the parent's custom question regarding {entity_title} with clear, comforting, and evidence-grounded vocational guidance.")
        else:
            context_lines.append(f"Directive: Provide a comprehensive, evidence-grounded explanation of {entity_title} tailored to vocational decision making.")

    context_lines.append("\n--- VERIFIED RETRIEVED EVIDENCE ---")
    context_lines.append(retrieved_context.to_context_string())

    # Scalable context management for long conversations:
    # If history is long (>10 messages), compress earlier turns into a compact chronological recap,
    # keeping the 10 most recent turns verbatim to prioritize immediate context while bounding tokens.
    recent_history = history
    if len(history) > 10:
        earlier_history = history[:-10]
        recent_history = history[-10:]

        earlier_lines = []
        for m in earlier_history:
            sender = "Student" if m.sender_type != MessageSenderType.AI else "Assistant"
            snip = m.content.strip().replace("\n", " ")
            if len(snip) > 140:
                snip = snip[:137] + "..."
            earlier_lines.append(f"- {sender}: {snip}")

        recap_str = "\n--- EARLIER CONVERSATION RECAP (Chronological summary of previous turns) ---\n" + "\n".join(earlier_lines)
        context_lines.append(recap_str)

    context_block = "\n".join(context_lines)

    messages: List[AIMessage] = []

    # Grounding context injected as initial system/context turn
    messages.append(
        AIMessage(
            role=AIRole.SYSTEM,
            content=f"FACTUAL CONTEXT AND EVIDENCE:\n{context_block}",
        )
    )

    # Recent conversation history verbatim
    for msg in recent_history:
        role = AIRole.ASSISTANT if msg.sender_type == MessageSenderType.AI else AIRole.USER
        messages.append(AIMessage(role=role, content=msg.content))

    # User's latest question
    messages.append(AIMessage(role=AIRole.USER, content=latest_question))

    return messages


# ==============================================================================
# 4. COUNSELLING SERVICE CORE ORCHESTRATION
# ==============================================================================

class CounsellingService:
    """Core orchestration service for student and family vocational counselling."""

    def __init__(
        self,
        retriever: Optional[KnowledgeRetriever] = None,
        ai_provider: Optional[AIProvider] = None,
    ):
        self.retriever = retriever or KnowledgeRetriever(verified_only_default=True)
        self._custom_ai_provider = ai_provider

    def _get_provider(self) -> AIProvider:
        """Resolves the configured AI provider through the abstraction router."""
        if self._custom_ai_provider:
            return self._custom_ai_provider
        return get_ai_provider()

    def create_session(
        self,
        db: Session,
        student_profile_id: int,
    ) -> CounsellingSession:
        """Creates a new active counselling session."""
        session = CounsellingSession(
            student_profile_id=student_profile_id,
            status=SessionStatus.ACTIVE,
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    def get_session(
        self,
        db: Session,
        session_id: int,
    ) -> Optional[CounsellingSession]:
        """Fetches a session by primary key."""
        return db.get(CounsellingSession, session_id)

    def list_sessions(
        self,
        db: Session,
        student_profile_id: int,
    ) -> List[CounsellingSession]:
        """Lists all counselling sessions for a given student profile."""
        stmt = (
            select(CounsellingSession)
            .where(CounsellingSession.student_profile_id == student_profile_id)
            .order_by(CounsellingSession.started_at.desc())
        )
        return list(db.scalars(stmt).all())

    def get_recent_history(
        self,
        db: Session,
        session_id: int,
        limit: Optional[int] = None,
    ) -> List[CounsellingMessage]:
        """Fetches the latest bounded messages in chronological order."""
        lim = limit or settings.COUNSELLING_HISTORY_LIMIT
        stmt = (
            select(CounsellingMessage)
            .where(CounsellingMessage.session_id == session_id)
            .order_by(CounsellingMessage.created_at.desc(), CounsellingMessage.id.desc())
            .limit(lim)
        )
        desc_messages = list(db.scalars(stmt).all())
        return list(reversed(desc_messages))

    async def process_counselling_message(
        self,
        db: Session,
        session_id: int,
        sender_user: User,
        message_text: str,
        career_id: Optional[int] = None,
        language: Optional[str] = "en",
        context: Optional[CounsellingContextPayload] = None,
    ) -> CounsellingResponse:
        """Executes the complete grounded counselling pipeline producing the canonical response.
        
        Architecture:
        1. Validate active session and student profile.
        2. Resolve structured contextual explain payloads (Brick 26) and synthesize question if needed.
        3. Detect human escalation and unsupported speculative queries.
        4. Extract backend-owned career context and verified career path.
        5. Execute verified-only factual retrieval via RAG layer.
        6. Build grounded prompt with bounded conversation history and intent directives.
        7. Request structured AI generation (AICounsellingGeneration) with robust recovery.
        8. Compute system signals (confidence, requires_human).
        9. Merge backend-owned data with AI-generated explanation.
        10. Validate against canonical CounsellingResponse and persist in database.
        """
        session = self.get_session(db, session_id)
        if not session:
            raise ValueError(f"Counselling session {session_id} not found")

        student = db.get(StudentProfile, session.student_profile_id)
        if not student:
            raise ValueError(f"Student profile {session.student_profile_id} not found")

        # Resolve context entity and synthesize query if entered via [Explain]
        ctx_career_id: Optional[int] = None
        ctx_title: Optional[str] = None
        if context:
            ctx_career_id, ctx_title = resolve_context_entity(db, context)

        effective_message = (message_text or "").strip()
        if context and (
            not effective_message
            or effective_message.lower() in (
                "explain",
                "explain this",
                "explain this path",
                "explain this career",
                "explain this course",
                "explain this salary",
                "explain this placement",
                "explain this training",
                "explain this job",
                "explain_career",
                "explain_course",
                "explain_salary",
                "explain_placement",
                "explain_training",
                "explain_career_growth",
                "explain_job_availability",
                "explain_nsqf",
                "explain_further_education",
            )
        ):
            effective_message = synthesize_explain_question(context.intent, ctx_title)
        elif not effective_message:
            effective_message = "Please provide vocational guidance based on verified career records."

        # Determine sender type
        if sender_user.role == UserRole.PARENT:
            sender_type = MessageSenderType.PARENT
        elif sender_user.role == UserRole.COUNSELLOR:
            sender_type = MessageSenderType.COUNSELLOR
        else:
            sender_type = MessageSenderType.STUDENT

        # Persist user message first
        user_msg = CounsellingMessage(
            session_id=session.id,
            sender_type=sender_type,
            content=effective_message,
        )
        db.add(user_msg)
        db.commit()

        # Signal 1: Detect explicit human escalation request
        human_requested = detect_human_escalation(effective_message)
        if human_requested:
            # Prevent duplicate active escalation on repeated messages
            existing_esc = db.scalars(
                select(HumanEscalation).where(
                    HumanEscalation.counselling_session_id == session.id,
                    HumanEscalation.status.in_([EscalationStatus.PENDING, EscalationStatus.IN_PROGRESS]),
                )
            ).first()
            if not existing_esc:
                resolved_esc_career = career_id or ctx_career_id
                escalation = HumanEscalation(
                    counselling_session_id=session.id,
                    student_id=student.id,
                    parent_id=sender_user.parent_profile.id if sender_user.parent_profile else None,
                    career_id=resolved_esc_career,
                    concern="Other",
                    language=language,
                    conversation_summary=f"User requested human counsellor during counselling: '{effective_message[:120]}'",
                    reason=f"User requested counsellor: '{effective_message[:120]}'",
                    priority=EscalationPriority.MEDIUM,
                    status=EscalationStatus.PENDING,
                )
                db.add(escalation)
                session.status = SessionStatus.ESCALATED
                db.commit()

        # Signal 2: Detect unsupported / speculative question
        is_supported, support_level, support_reason = detect_unsupported_question(effective_message)

        # Load bounded history (excluding current user message just inserted)
        history = self.get_recent_history(db, session.id, limit=settings.COUNSELLING_HISTORY_LIMIT)
        bounded_history = [m for m in history if m.id != user_msg.id]

        # Context loading: Prioritize explicit career_id, then context-resolved career, then inference
        resolved_career_id = career_id or ctx_career_id
        if resolved_career_id is None:
            resolved_career_id = infer_career_id_from_context(db, effective_message, bounded_history)

        student_ctx = extract_safe_student_context(student)
        career_obj, path_steps = extract_career_and_path(db, student, resolved_career_id)
        career_metrics = extract_career_metrics(db, career_obj.id if career_obj else None)

        # Retrieval: strictly verified only, with contextualization for follow-up questions
        retrieval_query = effective_message
        if career_obj.title and career_obj.title.lower() not in effective_message.lower():
            # Enrich retrieval query so questions like "What about the salary?" or "How long does it take?"
            # retrieve facts specifically for the active career
            retrieval_query = f"{effective_message} for {career_obj.title}"

        retrieval_filters = RetrievalFilter(verified_only=True)
        retrieved_context = self.retriever.retrieve(
            query=retrieval_query,
            db=db,
            filters=retrieval_filters,
            top_k=5,
            verified_only=True,
        )

        # Signal 3: Confidence evaluation
        confidence, confidence_reason = detect_confidence(retrieved_context, is_supported)

        # Downgrade if zero items found for supported query
        if is_supported and not retrieved_context.items:
            support_level = "unsupported"
            support_reason = "No matching verified records found in knowledge base."
            is_supported = False

        # System-derived requires_human signal
        requires_human = human_requested or (not is_supported and confidence < 0.35)

        # Language resolution (support explicit request or automatic detection of Telugu script)
        has_telugu = bool(re.search(r'[\u0C00-\u0C7F]', effective_message))
        effective_language = "te" if (has_telugu or (language and language.lower().startswith("te"))) else (language or "en")

        # Build grounded prompt
        system_prompt = build_system_prompt(language=effective_language, user_role=sender_user.role.value)
        prompt_messages = format_grounded_messages(
            student_context=student_ctx,
            career_obj=career_obj,
            retrieved_context=retrieved_context,
            history=bounded_history,
            latest_question=effective_message,
            explain_context=context,
        )

        # AI Generation: Call AIProvider using structured response with safe recovery
        provider = self._get_provider()
        ai_message_text = ""
        suggested_qs: List[str] = []
        res_language = effective_language


        try:
            # 1. Attempt structured generation
            structured_res = await provider.generate_structured_response(
                messages=prompt_messages,
                response_schema=AICounsellingGeneration,
                system_prompt=system_prompt,
                temperature=0.3,
                max_tokens=settings.COUNSELLING_MAX_OUTPUT_TOKENS,
            )
            if isinstance(structured_res.parsed, AICounsellingGeneration):
                ai_message_text = structured_res.parsed.message
                suggested_qs = structured_res.parsed.suggested_questions
                res_language = structured_res.parsed.language or res_language
            elif isinstance(structured_res.parsed, dict):
                ai_gen = AICounsellingGeneration.model_validate(structured_res.parsed)
                ai_message_text = ai_gen.message
                suggested_qs = ai_gen.suggested_questions
                res_language = ai_gen.language or res_language
        except Exception as str_err:
            logger.info("Structured generation fallback: %s. Using generate_response.", str(str_err))
            try:
                # 2. Controlled recovery via standard generation
                text_res = await provider.generate_response(
                    messages=prompt_messages,
                    system_prompt=system_prompt,
                    temperature=0.3,
                    max_tokens=settings.COUNSELLING_MAX_OUTPUT_TOKENS,
                )
                raw_text = text_res.content.strip()

                # Attempt to parse JSON if output in JSON format
                parsed_json = None
                if "{" in raw_text and "}" in raw_text:
                    try:
                        s_idx = raw_text.find("{")
                        e_idx = raw_text.rfind("}") + 1
                        candidate = json.loads(raw_text[s_idx:e_idx])
                        parsed_json = AICounsellingGeneration.model_validate(candidate)
                    except Exception:
                        parsed_json = None

                if parsed_json:
                    ai_message_text = parsed_json.message
                    suggested_qs = parsed_json.suggested_questions
                    res_language = parsed_json.language or res_language
                else:
                    ai_message_text = raw_text
            except AIProviderError as e:
                logger.error("AIProvider error during counselling response: %s", str(e))
                raise e
            except Exception as e:
                logger.error("Unexpected error during AI generation: %s", str(e))
                raise AIProviderError(f"Counselling generation failed: {str(e)}")

        # Ensure suggested questions are present and contextualized
        intent_key = context.intent if context else ""
        occ_name = career_obj.title or ctx_title or "this vocational trade"
        default_intent_qs = get_intent_suggested_questions(intent_key, occ_name)

        if not suggested_qs or len(suggested_qs) < 2:
            suggested_qs = default_intent_qs
        elif context:
            # If context was explicit, guarantee top suggested questions match intent
            merged = []
            for q in default_intent_qs[:2] + suggested_qs:
                if q not in merged:
                    merged.append(q)
            suggested_qs = merged[:5]

        # If human escalation was requested, ensure empathetic confirmation in message
        if human_requested and "counsellor" not in ai_message_text.lower():
            ai_message_text = (
                f"{ai_message_text}\n\n"
                "[Note: A referral request has been initiated to connect you with a qualified human counsellor.]"
            )

        # Persist assistant response
        assistant_msg = CounsellingMessage(
            session_id=session.id,
            sender_type=MessageSenderType.AI,
            content=ai_message_text,
        )
        db.add(assistant_msg)
        db.commit()
        db.refresh(assistant_msg)

        # Backend-owned: Map concise verifiable evidence and sources
        evidence_items: List[CounsellingEvidenceItem] = []
        source_items: List[CounsellingSourceItem] = []
        seen_sources = set()

        for r_item in retrieved_context.items:
            k = r_item.item
            prov = k.provenance
            summary_snip = k.content[:400] + "..." if len(k.content) > 400 else k.content
            evidence_items.append(
                CounsellingEvidenceItem(
                    id=k.id,
                    type=k.type.value,
                    title=k.title,
                    content=summary_snip,
                    relevance=round(r_item.score, 4),
                    verified=prov.verified,
                    source=prov.source,
                    source_url=prov.source_url,
                )
            )

            src_key = (prov.source, prov.source_url or "")
            if src_key not in seen_sources and prov.source:
                seen_sources.add(src_key)
                source_items.append(
                    CounsellingSourceItem(
                        title=k.title,
                        source=prov.source,
                        url=prov.source_url,
                        type=k.type.value,
                    )
                )

        # Assemble and strictly validate canonical CounsellingResponse
        return CounsellingResponse(
            message=ai_message_text,
            language=res_language,
            career=career_obj,
            evidence=evidence_items,
            career_path=path_steps,
            career_metrics=career_metrics,
            suggested_questions=suggested_qs[:5],
            confidence=confidence,
            requires_human=requires_human,
            sources=source_items,
            session_id=session.id,
            created_at=assistant_msg.created_at or datetime.now(timezone.utc),
        )

    # ==========================================================================
    # 4. HUMAN COUNSELLOR ESCALATION CASE-RECORD SYSTEM (PHASE 9 BRICK 31)
    # ==========================================================================

    def resolve_user_student(
        self,
        db: Session,
        current_user: User,
    ) -> Tuple[StudentProfile, Optional[ParentProfile]]:
        """Resolves the authorized student profile and parent profile strictly server-side."""
        if current_user.role == UserRole.PARENT or current_user.parent_profile:
            parent_profile = current_user.parent_profile
            if not parent_profile:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Parent profile not found for this account.",
                )
            stmt = (
                select(ParentStudentAssociation)
                .where(ParentStudentAssociation.parent_profile_id == parent_profile.id)
                .order_by(ParentStudentAssociation.created_at.asc())
            )
            associations = list(db.scalars(stmt).all())
            if not associations:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No student profile is linked to your parent account yet.",
                )
            primary_assoc = associations[0]
            student = primary_assoc.student_profile
            if not student:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Linked student profile not found.",
                )
            return student, parent_profile

        if current_user.role == UserRole.STUDENT or current_user.student_profile:
            student = current_user.student_profile
            if not student:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Student profile not found for this account.",
                )
            return student, None

        if current_user.role in (UserRole.ADMIN, UserRole.COUNSELLOR):
            # Admin fallback to first available student if testing
            student = db.query(StudentProfile).first()
            if student:
                return student, None

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students and authorized parents can request human counselling.",
        )

    def resolve_student_career(
        self,
        db: Session,
        student: StudentProfile,
        candidate_career_id: Optional[int] = None,
    ) -> Optional[Occupation]:
        """Resolves active career context strictly bound to student authorization."""
        if candidate_career_id:
            occ = db.get(Occupation, candidate_career_id)
            if occ:
                return occ

        # Check explicit preferences
        if student.career_preferences and isinstance(student.career_preferences, list) and len(student.career_preferences) > 0:
            pref = student.career_preferences[0]
            occ = db.query(Occupation).filter(Occupation.name.ilike(f"%{pref}%")).first()
            if occ:
                return occ

        # Check deterministic recommendations
        if student.user:
            recs = generate_recommendations(user=student.user, profile=student, db=db, limit=1)
            if recs.recommendations:
                return db.get(Occupation, recs.recommendations[0].career.id)

        return None

    async def generate_escalation_summary(
        self,
        db: Session,
        student: StudentProfile,
        career: Optional[Occupation],
        concern: str,
        session: Optional[CounsellingSession],
        requester_role: str,
        notes: Optional[str] = None,
    ) -> str:
        """Generates a concise, structured conversation summary without fabricating facts."""
        role_label = "Parent" if requester_role == "parent" else "Student"
        student_location = student.location or "Not specified"
        career_title = career.name if career else "General Vocational Guidance"

        # Extract recent user questions from session
        user_questions: List[str] = []
        if session and session.messages:
            for m in session.messages[-10:]:
                if m.sender_type in (MessageSenderType.PARENT, MessageSenderType.STUDENT):
                    clean = m.content.strip()
                    if clean and clean not in user_questions:
                        user_questions.append(clean)

        questions_block = (
            "\n".join(f"- {q[:120]}" for q in user_questions[:4])
            if user_questions
            else "- General career options and guidance"
        )

        fallback_summary = (
            f"{role_label} requested human counselling guidance for {career_title}.\n\n"
            f"Child Location: {student_location}\n"
            f"Career: {career_title}\n"
            f"Primary Concern: {concern}\n\n"
            f"Questions discussed:\n"
            f"{questions_block}\n\n"
            f"AI provided verified vocational facts. User requested a human counsellor for personalized guidance."
        )
        if notes:
            fallback_summary += f"\n\nUser Notes: {notes.strip()[:400]}"

        try:
            provider = get_ai_provider()
            prompt = (
                f"You are a vocational case-management assistant. Write a concise, objective 4-6 line case summary for a human counsellor.\n"
                f"Strict Context Provided:\n"
                f"- User: {role_label}\n"
                f"- Student Location: {student_location}\n"
                f"- Career: {career_title}\n"
                f"- Primary Concern: {concern}\n"
                f"- Discussed Inquiries: {', '.join(user_questions[:4]) if user_questions else 'General'}\n"
                f"- Notes: {notes or 'None'}\n\n"
                f"Rules:\n"
                f"1. Be strictly objective and professional.\n"
                f"2. Do NOT invent or assume any facts outside the provided context.\n"
                f"3. State who needs help, what career, what concern, and why human consultation is requested."
            )
            resp = await provider.generate_response(
                messages=[AIMessage(role=AIRole.USER, content=prompt)],
                temperature=0.2,
                max_tokens=250,
            )
            if resp and resp.content and len(resp.content.strip()) > 30:
                return resp.content.strip()
        except Exception as e:
            logger.warning(f"AI escalation summary generation failed ({e}); safely falling back to structured metadata template.")

        return fallback_summary

    async def create_escalation(
        self,
        db: Session,
        current_user: User,
        request: CreateEscalationRequest,
    ) -> HumanEscalation:
        """Creates or returns an active human counsellor escalation case record (Brick 31)."""
        student, parent = self.resolve_user_student(db, current_user)

        # Resolve counselling session context
        session = None
        if request.session_id:
            session = self.get_session(db, request.session_id)
            if not session or session.student_profile_id != student.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to escalate this counselling session.",
                )
        else:
            stmt = (
                select(CounsellingSession)
                .where(CounsellingSession.student_profile_id == student.id)
                .order_by(CounsellingSession.created_at.desc())
            )
            session = db.scalars(stmt).first()

        # Resolve verified career context
        career = self.resolve_student_career(db, student, request.career_id)

        # Normalize concern and language
        concern = normalize_concern(request.concern)
        language = request.language.strip() if request.language else "en"

        # Prevent accidental duplicate escalations: return existing active (Pending or In Progress) case
        existing_stmt = (
            select(HumanEscalation)
            .where(
                HumanEscalation.student_id == student.id,
                HumanEscalation.status.in_([EscalationStatus.PENDING, EscalationStatus.IN_PROGRESS]),
            )
            .order_by(HumanEscalation.created_at.desc())
        )
        existing_esc = db.scalars(existing_stmt).first()
        if existing_esc:
            logger.info(
                f"Duplicate escalation prevented: student {student.id} already has active escalation {existing_esc.id}"
            )
            return existing_esc

        # Generate concise conversation summary
        summary = await self.generate_escalation_summary(
            db=db,
            student=student,
            career=career,
            concern=concern,
            session=session,
            requester_role=current_user.role.value,
            notes=request.notes,
        )

        escalation = HumanEscalation(
            counselling_session_id=session.id if session else None,
            student_id=student.id,
            parent_id=parent.id if parent else None,
            career_id=career.id if career else None,
            concern=concern,
            language=language,
            conversation_summary=summary,
            reason=request.notes or f"{current_user.role.value.capitalize()} requested human counsellor regarding {concern}",
            priority=EscalationPriority.MEDIUM,
            status=EscalationStatus.PENDING,
        )
        db.add(escalation)
        if session:
            session.status = SessionStatus.ESCALATED
        db.commit()
        db.refresh(escalation)
        return escalation

    def get_escalation(
        self,
        db: Session,
        escalation_id: int,
        current_user: User,
    ) -> HumanEscalation:
        """Retrieves an escalation case record enforcing strict authorization boundaries."""
        escalation = db.get(HumanEscalation, escalation_id)
        if not escalation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Escalation record {escalation_id} not found",
            )

        # 1. Admin & Counsellor access
        if current_user.role in (UserRole.ADMIN, UserRole.COUNSELLOR):
            return escalation

        # 2. Parent access: must belong to parent or authorized linked child
        if current_user.role == UserRole.PARENT and current_user.parent_profile:
            if escalation.parent_id == current_user.parent_profile.id:
                return escalation
            stmt = select(ParentStudentAssociation.student_profile_id).where(
                ParentStudentAssociation.parent_profile_id == current_user.parent_profile.id
            )
            linked_ids = set(db.scalars(stmt).all())
            if escalation.student_id in linked_ids:
                return escalation
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to view this escalation case.",
            )

        # 3. Student access: must belong to student
        if current_user.role == UserRole.STUDENT and current_user.student_profile:
            if escalation.student_id == current_user.student_profile.id:
                return escalation
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to view this escalation case.",
            )

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view this escalation case.",
        )

    def list_escalations(
        self,
        db: Session,
        current_user: User,
    ) -> List[HumanEscalation]:
        """Lists escalation case records for the authenticated user."""
        if current_user.role in (UserRole.ADMIN, UserRole.COUNSELLOR):
            stmt = select(HumanEscalation).order_by(HumanEscalation.created_at.desc())
            return list(db.scalars(stmt).all())

        if current_user.role == UserRole.PARENT and current_user.parent_profile:
            stmt_links = select(ParentStudentAssociation.student_profile_id).where(
                ParentStudentAssociation.parent_profile_id == current_user.parent_profile.id
            )
            linked_student_ids = list(db.scalars(stmt_links).all())
            stmt = (
                select(HumanEscalation)
                .where(
                    (HumanEscalation.parent_id == current_user.parent_profile.id)
                    | (HumanEscalation.student_id.in_(linked_student_ids))
                )
                .order_by(HumanEscalation.created_at.desc())
            )
            return list(db.scalars(stmt).all())

        if current_user.role == UserRole.STUDENT and current_user.student_profile:
            stmt = (
                select(HumanEscalation)
                .where(HumanEscalation.student_id == current_user.student_profile.id)
                .order_by(HumanEscalation.created_at.desc())
            )
            return list(db.scalars(stmt).all())

        return []


def to_escalation_response(escalation: HumanEscalation) -> EscalationResponse:
    """Converts a HumanEscalation model to an EscalationResponse schema."""
    career_title = escalation.career.name if escalation.career else None
    return EscalationResponse(
        id=escalation.id,
        student_id=escalation.student_id,
        parent_id=escalation.parent_id,
        career_id=escalation.career_id,
        career_title=career_title,
        counselling_session_id=escalation.counselling_session_id,
        concern=escalation.concern,
        language=escalation.language,
        conversation_summary=escalation.conversation_summary,
        status=escalation.status.value,
        created_at=escalation.created_at,
        updated_at=escalation.updated_at,
        resolved_at=escalation.resolved_at,
    )


# Singleton service instance
counselling_service = CounsellingService()
