"""
Seeds comprehensive realistic analytics data (Parent Concerns across all 7 canonical categories,
counselling sessions, escalations, and sentiment events) to ensure analytics charts are rich and populated.
"""
import os
import sys
from datetime import datetime, timedelta
import random

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.orm import Session
from database.session import SessionLocal
from models import (
    User,
    StudentProfile,
    ParentProfile,
    ParentStudentAssociation,
    Occupation,
)
from models.counselling import (
    CounsellingSession,
    CounsellingMessage,
    ParentConcern,
    HumanEscalation,
    SentimentEvent,
    SessionStatus,
    ConcernSeverity,
    ConcernStatus,
    EscalationPriority,
    EscalationStatus,
    SentimentType,
)

CANONICAL_CATEGORIES = [
    ("Income", [
        "Starting apprentice salary might not be sufficient for household support",
        "Comparison of 3-year ITI earnings vs degree graduate earnings",
        "Overtime compensation and wage increments over the first 24 months",
        "Immediate family financial contribution requirements during training",
    ]),
    ("Job Security", [
        "Permanent employment guarantees post-apprenticeship completion",
        "Vulnerability to sector automation and AI equipment upgrades",
        "Public sector recruitment eligibility and government contractor quotas",
        "Contract renewal policies in manufacturing and electronics plants",
    ]),
    ("Further Education", [
        "Pathway for lateral entry into 2nd year Polytechnic Diploma",
        "Credit transfer to IGNOU / State Open University degree programs",
        "Higher certification sponsorship through employer partnerships",
        "Options to pursue specialized mechatronics certifications later",
    ]),
    ("Social Perception", [
        "Extended family preference for conventional 4-year engineering degrees",
        "Community recognition of vocational technical qualifications",
        "Matrimonial and social status perceptions of technician roles",
        "Explaining trade certifications to relatives and peer groups",
    ]),
    ("Distance", [
        "Training institute located 45km from our rural mandal village",
        "Safe subsidized bus transport availability for morning batches",
        "Quality and security of government hostel facilities for students",
        "Relocation costs if industrial placement is in a Tier-1 urban center",
    ]),
    ("Working Conditions", [
        "Industrial floor occupational health and machine safety standards",
        "Heat, noise, and shift rotations in heavy manufacturing workshops",
        "Medical insurance coverage and safety equipment compliance",
        "Ergonomic working conditions and physical workload expectations",
    ]),
    ("Career Growth", [
        "Promotion timeline from Junior Technician to Master Technician",
        "Transition pathways into workshop supervisor and operations manager",
        "Self-employment and entrepreneurship grant opportunities under PMKVY",
        "Long-term career ceiling compared to conventional degree holders",
    ]),
]

def seed_analytics():
    db: Session = SessionLocal()
    try:
        # Check or create parent profile
        parent_profile = db.query(ParentProfile).first()
        student_profile = db.query(StudentProfile).first()
        occupations = db.query(Occupation).limit(5).all()

        if not parent_profile:
            print("[!] No ParentProfile found. Creating default dev parent...")
            user = User(
                name="Sunita Sharma",
                email="parent.demo@sih.gov.in",
                phone="+919876543211",
                role="parent",
                password_hash="dev_hash",
            )
            db.add(user)
            db.flush()
            parent_profile = ParentProfile(
                user_id=user.id,
                relationship_to_student="Mother",
                occupation="Teacher",
                location="Hyderabad, Telangana",
            )
            db.add(parent_profile)
            db.flush()

        if not student_profile:
            print("[!] No StudentProfile found. Creating default dev student...")
            user_s = User(
                name="Aarav Sharma",
                email="student.demo@sih.gov.in",
                phone="+919876543210",
                role="student",
                password_hash="dev_hash",
            )
            db.add(user_s)
            db.flush()
            student_profile = StudentProfile(
                user_id=user_s.id,
                education_level="Class 10 Passed",
                career_intent="Automotive Service Technician",
            )
            db.add(student_profile)
            db.flush()

        # Seed rich Parent Concerns
        print("[*] Generating realistic ParentConcern records across all 7 canonical categories...")
        now = datetime.utcnow()

        severities = [ConcernSeverity.HIGH, ConcernSeverity.MEDIUM, ConcernSeverity.LOW]
        statuses = [ConcernStatus.OPEN, ConcernStatus.ADDRESSED, ConcernStatus.RESOLVED]

        # Weights: more high severity for Income/Job Security, good resolution balance
        created_count = 0
        for category, descriptions in CANONICAL_CATEGORIES:
            # Create 6-12 concerns per category
            num_items = random.randint(6, 11)
            for i in range(num_items):
                desc = descriptions[i % len(descriptions)]
                # Distribute created_at over the last 50 days
                days_ago = random.randint(0, 50)
                hours_ago = random.randint(1, 23)
                concern_time = now - timedelta(days=days_ago, hours=hours_ago)

                # Severity logic
                if category in ["Income", "Job Security"]:
                    sev = random.choices(severities, weights=[0.45, 0.40, 0.15])[0]
                else:
                    sev = random.choices(severities, weights=[0.20, 0.50, 0.30])[0]

                # Older concerns more likely addressed/resolved
                if days_ago > 20:
                    stat = random.choices(statuses, weights=[0.20, 0.40, 0.40])[0]
                elif days_ago > 7:
                    stat = random.choices(statuses, weights=[0.35, 0.45, 0.20])[0]
                else:
                    stat = random.choices(statuses, weights=[0.60, 0.30, 0.10])[0]

                concern = ParentConcern(
                    parent_profile_id=parent_profile.id,
                    student_profile_id=student_profile.id,
                    concern_type=category,
                    description=desc,
                    severity=sev,
                    status=stat,
                    created_at=concern_time,
                    updated_at=concern_time + timedelta(hours=2),
                )
                db.add(concern)
                created_count += 1

        # Seed additional counselling sessions and sentiment events
        print(f"[*] Added {created_count} ParentConcern records.")

        session = db.query(CounsellingSession).first()
        if not session:
            session = CounsellingSession(
                student_profile_id=student_profile.id,
                status=SessionStatus.ACTIVE,
                started_at=now - timedelta(days=2),
            )
            db.add(session)
            db.flush()

        # Seed SentimentEvents if none exist
        if db.query(SentimentEvent).count() == 0:
            print("[*] Seeding SentimentEvent progression records...")
            sentiments_progression = [
                (SentimentType.CONCERNED, 0.35, 14),
                (SentimentType.NEGATIVE, 0.20, 8),
                (SentimentType.NEUTRAL, 0.50, 12),
                (SentimentType.POSITIVE, 0.85, 22),
                (SentimentType.NEUTRAL, 0.55, 9),
                (SentimentType.CONCERNED, 0.40, 3),
            ]
            for stype, sc, count in sentiments_progression:
                for _ in range(count):
                    event = SentimentEvent(
                        counselling_session_id=session.id,
                        sentiment=stype,
                        score=sc,
                        created_at=now - timedelta(days=random.randint(1, 30)),
                    )
                    db.add(event)

        # Seed human escalations if needed
        if db.query(HumanEscalation).count() < 5 and occupations:
            print("[*] Seeding HumanEscalation cases...")
            for i, occ in enumerate(occupations):
                esc = HumanEscalation(
                    counselling_session_id=session.id,
                    student_id=student_profile.id,
                    career_id=occ.id,
                    concern=CANONICAL_CATEGORIES[i % len(CANONICAL_CATEGORIES)][0],
                    priority=EscalationPriority.HIGH if i % 2 == 0 else EscalationPriority.MEDIUM,
                    status=EscalationStatus.RESOLVED if i > 2 else EscalationStatus.PENDING,
                    language="te" if i % 2 == 1 else "en",
                    reason=f"Detailed parental hesitation regarding {occ.name} entry barriers.",
                    created_at=now - timedelta(days=i * 3 + 1),
                )
                db.add(esc)

        db.commit()
        total_c = db.query(ParentConcern).count()
        print(f"[SUCCESS] Database populated! Total ParentConcerns now in DB: {total_c}")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to seed analytics: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_analytics()
