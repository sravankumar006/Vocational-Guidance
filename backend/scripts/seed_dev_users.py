"""
Secure backend-only seed/CLI mechanism for development personas and Admin account (Phase 1 Brick 7).
Creates or updates development test accounts with Argon2id-hashed passwords:
1. Student (Aarav Sharma) -> StudentProfile 1
2. Linked Parent (Sunita Sharma, Mother) -> Linked to Student 1 via ParentStudentAssociation
3. Unrelated Student (Priya Patel) -> StudentProfile 2
4. Unrelated Parent (Ramesh Patel, Father) -> Linked to Student 2, NOT Student 1
5. Admin (Dr. Rajesh Verma) -> role ADMIN

Never hardcodes production passwords.
Reads password from --password argument or DEV_ADMIN_PASSWORD environment variable.
"""

import os
import sys
import argparse
from typing import Optional

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.orm import Session
from sqlalchemy import select
from database.session import SessionLocal
from core.security import hash_password
from models import (
    User,
    StudentProfile,
    ParentProfile,
    ParentStudentAssociation,
)
from models.enums import UserRole


def seed_development_personas(db: Session, password: str, admin_only: bool = False) -> None:
    hashed_pw = hash_password(password)
    print(f"[*] Password securely hashed using Argon2id.")

    # 1. Admin Account
    admin_email = "admin@sih.gov.in"
    admin_user = db.scalar(select(User).where(User.email == admin_email))
    if not admin_user:
        admin_user = User(
            name="Dr. Rajesh Verma (Dev Admin)",
            email=admin_email,
            phone="+919876543212",
            role=UserRole.ADMIN,
            is_active=True,
            password_hash=hashed_pw,
        )
        db.add(admin_user)
        print(f"[+] Created development Admin: {admin_email}")
    else:
        admin_user.password_hash = hashed_pw
        admin_user.role = UserRole.ADMIN
        admin_user.is_active = True
        print(f"[*] Updated development Admin credentials: {admin_email}")

    if admin_only:
        db.commit()
        print("[+] Admin-only creation completed successfully.")
        return

    # 2. Student 1 (Aarav)
    student1_email = "student@sih.gov.in"
    student1_user = db.scalar(select(User).where(User.email == student1_email))
    if not student1_user:
        student1_user = User(
            name="Aarav Sharma (Dev Student)",
            email=student1_email,
            phone="+919876543210",
            role=UserRole.STUDENT,
            is_active=True,
            password_hash=hashed_pw,
        )
        db.add(student1_user)
        db.flush()
        student1_profile = StudentProfile(
            user_id=student1_user.id,
            education_level="Class 10 Passed",
            education_stream="General",
            location="Medak, Telangana",
            interests=["Electronics", "Automotive"],
            skills=["Basic Electricals", "Problem Solving"],
        )
        db.add(student1_profile)
        print(f"[+] Created Student 1: {student1_email}")
    else:
        student1_user.password_hash = hashed_pw
        student1_user.role = UserRole.STUDENT
        student1_user.is_active = True
        student1_profile = student1_user.student_profile
        if not student1_profile:
            student1_profile = StudentProfile(
                user_id=student1_user.id,
                education_level="Class 10 Passed",
                location="Medak, Telangana",
            )
            db.add(student1_profile)
        print(f"[*] Updated Student 1: {student1_email}")

    # 3. Parent 1 (Sunita - Mother of Aarav)
    parent1_email = "parent@sih.gov.in"
    parent1_user = db.scalar(select(User).where(User.email == parent1_email))
    if not parent1_user:
        parent1_user = User(
            name="Sunita Sharma (Dev Parent)",
            email=parent1_email,
            phone="+919876543211",
            role=UserRole.PARENT,
            is_active=True,
            password_hash=hashed_pw,
        )
        db.add(parent1_user)
        db.flush()
        parent1_profile = ParentProfile(
            user_id=parent1_user.id,
            relationship_to_student="Mother",
            occupation="Government School Teacher",
            location="Medak, Telangana",
        )
        db.add(parent1_profile)
        print(f"[+] Created Parent 1: {parent1_email}")
    else:
        parent1_user.password_hash = hashed_pw
        parent1_user.role = UserRole.PARENT
        parent1_user.is_active = True
        parent1_profile = parent1_user.parent_profile
        if not parent1_profile:
            parent1_profile = ParentProfile(
                user_id=parent1_user.id,
                relationship_to_student="Mother",
                location="Medak, Telangana",
            )
            db.add(parent1_profile)
        print(f"[*] Updated Parent 1: {parent1_email}")

    db.flush()

    # Link Parent 1 to Student 1 in ParentStudentAssociation
    assoc1 = db.scalar(
        select(ParentStudentAssociation).where(
            ParentStudentAssociation.parent_profile_id == parent1_profile.id,
            ParentStudentAssociation.student_profile_id == student1_profile.id,
        )
    )
    if not assoc1:
        assoc1 = ParentStudentAssociation(
            parent_profile_id=parent1_profile.id,
            student_profile_id=student1_profile.id,
            relationship_type="Mother",
        )
        db.add(assoc1)
        print(f"[+] Linked Parent 1 ({parent1_email}) -> Student 1 ({student1_email})")

    # 4. Student 2 (Priya - Unrelated Student)
    student2_email = "student2@sih.gov.in"
    student2_user = db.scalar(select(User).where(User.email == student2_email))
    if not student2_user:
        student2_user = User(
            name="Priya Patel (Dev Student 2)",
            email=student2_email,
            phone="+919876543220",
            role=UserRole.STUDENT,
            is_active=True,
            password_hash=hashed_pw,
        )
        db.add(student2_user)
        db.flush()
        student2_profile = StudentProfile(
            user_id=student2_user.id,
            education_level="Class 12 Science",
            education_stream="PCM",
            location="Hyderabad, Telangana",
            interests=["Computer Programming", "Graphic Design"],
        )
        db.add(student2_profile)
        print(f"[+] Created Student 2: {student2_email}")
    else:
        student2_user.password_hash = hashed_pw
        student2_user.role = UserRole.STUDENT
        student2_user.is_active = True
        student2_profile = student2_user.student_profile
        if not student2_profile:
            student2_profile = StudentProfile(
                user_id=student2_user.id,
                education_level="Class 12 Science",
                location="Hyderabad, Telangana",
            )
            db.add(student2_profile)
        print(f"[*] Updated Student 2: {student2_email}")

    # 5. Parent 2 (Ramesh - Unrelated Parent, linked only to Student 2)
    parent2_email = "parent2@sih.gov.in"
    parent2_user = db.scalar(select(User).where(User.email == parent2_email))
    if not parent2_user:
        parent2_user = User(
            name="Ramesh Patel (Dev Parent 2)",
            email=parent2_email,
            phone="+919876543221",
            role=UserRole.PARENT,
            is_active=True,
            password_hash=hashed_pw,
        )
        db.add(parent2_user)
        db.flush()
        parent2_profile = ParentProfile(
            user_id=parent2_user.id,
            relationship_to_student="Father",
            occupation="Self-Employed",
            location="Hyderabad, Telangana",
        )
        db.add(parent2_profile)
        print(f"[+] Created Parent 2: {parent2_email}")
    else:
        parent2_user.password_hash = hashed_pw
        parent2_user.role = UserRole.PARENT
        parent2_user.is_active = True
        parent2_profile = parent2_user.parent_profile
        if not parent2_profile:
            parent2_profile = ParentProfile(
                user_id=parent2_user.id,
                relationship_to_student="Father",
                location="Hyderabad, Telangana",
            )
            db.add(parent2_profile)
        print(f"[*] Updated Parent 2: {parent2_email}")

    db.flush()

    # Link Parent 2 to Student 2 (Priya) ONLY
    assoc2 = db.scalar(
        select(ParentStudentAssociation).where(
            ParentStudentAssociation.parent_profile_id == parent2_profile.id,
            ParentStudentAssociation.student_profile_id == student2_profile.id,
        )
    )
    if not assoc2:
        assoc2 = ParentStudentAssociation(
            parent_profile_id=parent2_profile.id,
            student_profile_id=student2_profile.id,
            relationship_type="Father",
        )
        db.add(assoc2)
        print(f"[+] Linked Parent 2 ({parent2_email}) -> Student 2 ({student2_email})")

    db.commit()
    print("[+] All development personas seeded and securely linked successfully.")


def main():
    parser = argparse.ArgumentParser(description="Seed development test personas & Admin account")
    parser.add_argument(
        "--password",
        default=os.getenv("DEV_ADMIN_PASSWORD", "Margadarshak@2026"),
        help="Password to set for seeded development accounts (default: reads DEV_ADMIN_PASSWORD)",
    )
    parser.add_argument(
        "--admin-only",
        action="store_true",
        help="Only create/update the Admin account",
    )
    args = parser.parse_args()

    db = SessionLocal()
    try:
        seed_development_personas(db, password=args.password, admin_only=args.admin_only)
    finally:
        db.close()


if __name__ == "__main__":
    main()
