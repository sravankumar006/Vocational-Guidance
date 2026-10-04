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
    Occupation,
)
from models.enums import (
    MessageSenderType,
    SessionStatus,
    ConcernSeverity,
    ConcernStatus,
    EscalationPriority,
    EscalationStatus,
    SentimentType,
)
from models.counselling import (
    CounsellingSession,
    CounsellingMessage,
    ParentConcern,
    HumanEscalation,
    SentimentEvent,
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

def seed_rich_data():
    db: Session = SessionLocal()
    try:
        now = datetime.utcnow()
        print("=== Checking existing database records ===")
        print(f"ParentConcern: {db.query(ParentConcern).count()}")
        print(f"CounsellingSession: {db.query(CounsellingSession).count()}")
        print(f"CounsellingMessage: {db.query(CounsellingMessage).count()}")
        print(f"HumanEscalation: {db.query(HumanEscalation).count()}")
        print(f"SentimentEvent: {db.query(SentimentEvent).count()}")

        # Ensure we have parent and student profiles
        parent_profile = db.query(ParentProfile).first()
        student_profile = db.query(StudentProfile).first()
        occupations = db.query(Occupation).limit(10).all()

        if not student_profile:
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

        if not parent_profile:
            user_p = User(
                name="Sunita Sharma",
                email="parent.demo@sih.gov.in",
                phone="+919876543211",
                role="parent",
                password_hash="dev_hash",
            )
            db.add(user_p)
            db.flush()
            parent_profile = ParentProfile(
                user_id=user_p.id,
                relationship_to_student="Mother",
                occupation="Teacher",
                location="Hyderabad, Telangana",
            )
            db.add(parent_profile)
            db.flush()

        # 1. Ensure at least 60+ ParentConcern records
        if db.query(ParentConcern).count() < 40:
            print("[+] Seeding rich ParentConcern records...")
            severities = [ConcernSeverity.HIGH, ConcernSeverity.MEDIUM, ConcernSeverity.LOW]
            statuses = [ConcernStatus.OPEN, ConcernStatus.ADDRESSED, ConcernStatus.RESOLVED]
            for category, descriptions in CANONICAL_CATEGORIES:
                for i in range(random.randint(8, 12)):
                    desc = descriptions[i % len(descriptions)]
                    days_ago = random.randint(0, 45)
                    hours_ago = random.randint(1, 23)
                    concern_time = now - timedelta(days=days_ago, hours=hours_ago)

                    sev = random.choices(severities, weights=[0.45, 0.40, 0.15])[0] if category in ["Income", "Job Security"] else random.choices(severities, weights=[0.20, 0.50, 0.30])[0]
                    stat = random.choices(statuses, weights=[0.20, 0.40, 0.40])[0] if days_ago > 20 else random.choices(statuses, weights=[0.50, 0.35, 0.15])[0]

                    c = ParentConcern(
                        parent_profile_id=parent_profile.id,
                        student_profile_id=student_profile.id,
                        concern_type=category,
                        description=desc,
                        severity=sev,
                        status=stat,
                        created_at=concern_time,
                        updated_at=concern_time + timedelta(hours=2),
                    )
                    db.add(c)
            db.flush()

        # 2. Seed 40+ CounsellingSessions spread over last 45 days
        current_sessions = db.query(CounsellingSession).count()
        if current_sessions < 30:
            print(f"[+] Seeding {45 - current_sessions} CounsellingSessions across last 45 days...")
            session_statuses = [SessionStatus.COMPLETED, SessionStatus.ACTIVE]
            for i in range(45 - current_sessions):
                days_ago = random.randint(0, 45)
                start_t = now - timedelta(days=days_ago, hours=random.randint(1, 20), minutes=random.randint(1, 55))
                st = random.choices(session_statuses, weights=[0.85, 0.15])[0]
                end_t = start_t + timedelta(minutes=random.randint(10, 45)) if st == SessionStatus.COMPLETED else None

                sess = CounsellingSession(
                    student_profile_id=student_profile.id,
                    status=st,
                    started_at=start_t,
                    ended_at=end_t,
                )
                db.add(sess)
            db.flush()

        # 3. Seed CounsellingMessages for sessions that have 0 messages
        all_sessions = db.query(CounsellingSession).all()
        msg_added = 0
        dialogues = [
            (MessageSenderType.STUDENT, "Hello, I want to explore vocational opportunities after 10th."),
            (MessageSenderType.AI, "Welcome! Based on your interest in mechanics, automotive technology or CNC machining are great pathways. What are your core interests?"),
            (MessageSenderType.STUDENT, "I like hands-on work with vehicles and engines, but my parents are worried about salary."),
            (MessageSenderType.AI, "Starting apprentice stipends range from Rs 10,000 to 14,000, and certified technicians often earn Rs 25,000 to 45,000 within 2-3 years."),
            (MessageSenderType.STUDENT, "Can I pursue a polytechnic diploma later if I do ITI first?"),
            (MessageSenderType.AI, "Yes, lateral entry permits direct admission into the second year of 3-year Polytechnic Diplomas."),
            (MessageSenderType.STUDENT, "That sounds reassuring. What are the nearest government institutes in Telangana?"),
            (MessageSenderType.AI, "Government ITI Mallepally and Sanathnagar both offer active NCVT automotive batches with industry tie-ups."),
        ]
        for sess in all_sessions:
            existing_msgs = db.query(CounsellingMessage).filter_by(session_id=sess.id).count()
            if existing_msgs == 0:
                num_msgs = random.randint(4, len(dialogues))
                msg_time = sess.started_at
                for sender_type, content in dialogues[:num_msgs]:
                    m = CounsellingMessage(
                        session_id=sess.id,
                        sender_type=sender_type,
                        content=content,
                        created_at=msg_time,
                    )
                    db.add(m)
                    msg_time += timedelta(minutes=random.randint(1, 3))
                    msg_added += 1
        print(f"[+] Added {msg_added} CounsellingMessage records.")
        db.flush()

        # 4. Seed SentimentEvents across multiple sessions over time
        sent_count = db.query(SentimentEvent).count()
        if sent_count < 40:
            print(f"[+] Seeding SentimentEvents...")
            sentiment_types = [
                SentimentType.POSITIVE,
                SentimentType.NEUTRAL,
                SentimentType.CONCERNED,
                SentimentType.NEGATIVE,
            ]
            for sess in all_sessions[:25]:
                for _ in range(random.randint(2, 4)):
                    s_type = random.choices(sentiment_types, weights=[0.45, 0.30, 0.15, 0.10])[0]
                    score = {
                        SentimentType.POSITIVE: random.uniform(0.70, 0.95),
                        SentimentType.NEUTRAL: random.uniform(0.40, 0.65),
                        SentimentType.CONCERNED: random.uniform(0.25, 0.45),
                        SentimentType.NEGATIVE: random.uniform(0.05, 0.25),
                    }[s_type]
                    se = SentimentEvent(
                        counselling_session_id=sess.id,
                        sentiment=s_type,
                        score=score,
                        created_at=sess.started_at + timedelta(minutes=random.randint(2, 15)),
                    )
                    db.add(se)
            db.flush()

        # 5. Seed HumanEscalations
        esc_count = db.query(HumanEscalation).count()
        if esc_count < 8 and occupations:
            print("[+] Seeding HumanEscalation records...")
            for i, occ in enumerate(occupations[:6]):
                sess = all_sessions[i % len(all_sessions)]
                he = HumanEscalation(
                    counselling_session_id=sess.id,
                    student_id=student_profile.id,
                    career_id=occ.id,
                    concern=CANONICAL_CATEGORIES[i % len(CANONICAL_CATEGORIES)][0],
                    priority=EscalationPriority.HIGH if i % 2 == 0 else EscalationPriority.MEDIUM,
                    status=EscalationStatus.RESOLVED if i >= 3 else EscalationStatus.PENDING,
                    language="te" if i % 3 == 0 else ("hi" if i % 3 == 1 else "en"),
                    reason=f"Family requires expert counselling guidance regarding {occ.name} future prospectus.",
                    created_at=sess.started_at,
                )
                db.add(he)
            db.flush()

        db.commit()
        print("=== DATABASE SEEDING COMPLETED SUCCESSFULLY ===")
        print(f"ParentConcern: {db.query(ParentConcern).count()}")
        print(f"CounsellingSession: {db.query(CounsellingSession).count()}")
        print(f"CounsellingMessage: {db.query(CounsellingMessage).count()}")
        print(f"HumanEscalation: {db.query(HumanEscalation).count()}")
        print(f"SentimentEvent: {db.query(SentimentEvent).count()}")
    except Exception as e:
        db.rollback()
        print(f"[!] Error during seeding: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_rich_data()
