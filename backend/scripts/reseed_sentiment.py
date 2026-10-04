import os
import sys
from datetime import datetime, timedelta
import random

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.orm import Session
from database.session import SessionLocal
from models.counselling import CounsellingSession, SentimentEvent
from models.enums import SentimentType

def reseed_sentiment():
    db: Session = SessionLocal()
    try:
        # Clear existing sentiment events
        db.query(SentimentEvent).delete()
        db.flush()

        sessions = db.query(CounsellingSession).all()
        print(f"Distributing sentiment events across {len(sessions)} counselling sessions...")

        # Realistic progression:
        # Before counselling: Higher concerned/negative/neutral
        # During counselling: Mixed neutral/concerned/positive
        # After counselling: Higher positive/neutral
        before_choices = [SentimentType.CONCERNED, SentimentType.NEGATIVE, SentimentType.NEUTRAL, SentimentType.POSITIVE]
        before_weights = [0.45, 0.25, 0.20, 0.10]

        during_choices = [SentimentType.NEUTRAL, SentimentType.CONCERNED, SentimentType.POSITIVE, SentimentType.NEGATIVE]
        during_weights = [0.40, 0.30, 0.20, 0.10]

        after_choices = [SentimentType.POSITIVE, SentimentType.NEUTRAL, SentimentType.CONCERNED, SentimentType.NEGATIVE]
        after_weights = [0.65, 0.20, 0.10, 0.05]

        total_seeded = 0
        for sess in sessions:
            start_t = sess.started_at
            
            # 1. Before counselling event
            s_before = random.choices(before_choices, weights=before_weights)[0]
            e_before = SentimentEvent(
                counselling_session_id=sess.id,
                sentiment=s_before,
                score=0.35 if s_before in [SentimentType.CONCERNED, SentimentType.NEGATIVE] else 0.65,
                created_at=start_t,
            )
            db.add(e_before)
            total_seeded += 1

            # 2. Intermediate during counselling event
            s_during = random.choices(during_choices, weights=during_weights)[0]
            e_during = SentimentEvent(
                counselling_session_id=sess.id,
                sentiment=s_during,
                score=0.55,
                created_at=start_t + timedelta(minutes=random.randint(5, 15)),
            )
            db.add(e_during)
            total_seeded += 1

            # 3. After counselling event (if session has ended or is completed)
            if sess.ended_at or random.random() > 0.15:
                s_after = random.choices(after_choices, weights=after_weights)[0]
                end_t = sess.ended_at or (start_t + timedelta(minutes=random.randint(20, 35)))
                e_after = SentimentEvent(
                    counselling_session_id=sess.id,
                    sentiment=s_after,
                    score=0.85 if s_after == SentimentType.POSITIVE else 0.50,
                    created_at=end_t,
                )
                db.add(e_after)
                total_seeded += 1

        db.commit()
        print(f"[SUCCESS] Seeded {total_seeded} SentimentEvents across {len(sessions)} sessions.")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    reseed_sentiment()
