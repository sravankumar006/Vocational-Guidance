"""
Database-backed Authentication and Session Management Service (Phase 1 Brick 7).
Handles credential verification, Argon2id validation, session lifecycle,
and refresh token rotation with server-side revocation.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple, List
from sqlalchemy.orm import Session
from sqlalchemy import or_, select

from core.config import settings
from core.security import (
    verify_password,
    hash_password,
    create_access_token,
    generate_refresh_token,
    hash_refresh_token,
)
from models import User, UserSession, StudentProfile, ParentProfile, ParentStudentAssociation
from schemas.auth import SafeUserResponse


def authenticate_user_credentials(
    db: Session,
    identifier: str,
    password: str,
) -> Tuple[Optional[User], Optional[str]]:
    """
    Validates user credentials against database records.
    Returns (user, None) if successful.
    Returns (None, error_code) if failed (e.g. 'not_found', 'invalid_password', 'inactive').
    """
    clean_id = identifier.strip()
    if not clean_id or not password:
        return None, "invalid_credentials"

    # Lookup user by email (case-insensitive) or phone
    stmt = select(User).where(
        or_(
            User.email.ilike(clean_id),
            User.phone == clean_id,
        )
    )
    user = db.scalar(stmt)

    if not user:
        return None, "user_not_found"

    if not user.password_hash or not verify_password(password, user.password_hash):
        return None, "invalid_password"

    if not user.is_active:
        return None, "account_inactive"

    return user, None


def create_user_session(db: Session, user: User) -> Tuple[str, UserSession]:
    """
    Generates a cryptographically secure refresh token and records its SHA-256 hash in DB.
    Never stores the raw refresh token in the database.
    """
    raw_token = generate_refresh_token()
    token_hash = hash_refresh_token(raw_token)
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    session = UserSession(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return raw_token, session


def rotate_user_session(db: Session, raw_token: str) -> Tuple[str, str, User]:
    """
    Rotates a refresh token:
    1. Validates existing session and checks for revocation.
    2. If a revoked token is used (token reuse attack), invalidates all user sessions.
    3. Revokes the old session and creates a new session.
    4. Generates a fresh short-lived access token.
    Returns (new_raw_refresh_token, new_access_token, user).
    """
    token_hash = hash_refresh_token(raw_token)
    stmt = select(UserSession).where(UserSession.token_hash == token_hash)
    session = db.scalar(stmt)

    if not session:
        raise ValueError("Invalid refresh token")

    # Reuse detection: if a revoked token is presented, compromise is suspected
    if session.revoked_at is not None:
        # Revoke all sessions for this user for security
        all_sessions_stmt = select(UserSession).where(
            UserSession.user_id == session.user_id,
            UserSession.revoked_at.is_(None)
        )
        active_sessions = db.scalars(all_sessions_stmt).all()
        now = datetime.now(timezone.utc)
        for s in active_sessions:
            s.revoked_at = now
        db.commit()
        raise ValueError("Revoked refresh token reuse detected. All sessions terminated.")

    # Check expiration
    now = datetime.now(timezone.utc)
    # Ensure session.expires_at is timezone-aware for comparison
    expires_at = session.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < now:
        session.revoked_at = now
        db.commit()
        raise ValueError("Refresh token has expired")

    user = session.user
    if not user or not user.is_active:
        raise ValueError("User account is inactive or not found")

    # Invalidate old session
    session.revoked_at = now

    # Issue new session
    new_raw_token, _ = create_user_session(db, user)

    # Issue new access token
    new_access_token = create_access_token({
        "sub": str(user.id),
        "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
        "email": user.email,
        "name": user.name,
    })

    return new_raw_token, new_access_token, user


def revoke_user_session(db: Session, raw_token: str) -> bool:
    """
    Invalidates the session associated with the provided raw refresh token.
    """
    token_hash = hash_refresh_token(raw_token)
    stmt = select(UserSession).where(UserSession.token_hash == token_hash)
    session = db.scalar(stmt)

    if session and session.revoked_at is None:
        session.revoked_at = datetime.now(timezone.utc)
        db.commit()
        return True
    return False


def build_safe_user_response(user: User) -> SafeUserResponse:
    """Constructs a sanitized user identity representation without secrets."""
    student_profile_id = user.student_profile.id if user.student_profile else None
    parent_profile_id = user.parent_profile.id if user.parent_profile else None

    associated_student_ids: List[int] = []
    if user.parent_profile and user.parent_profile.student_associations:
        associated_student_ids = [
            assoc.student_profile_id for assoc in user.parent_profile.student_associations
        ]

    role_str = user.role.value if hasattr(user.role, 'value') else str(user.role)

    return SafeUserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        phone=user.phone,
        role=role_str,
        is_active=user.is_active,
        student_profile_id=student_profile_id,
        parent_profile_id=parent_profile_id,
        associated_student_ids=associated_student_ids,
    )
