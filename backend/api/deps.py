"""
Reusable Authentication & Role-Based Access Control (RBAC) Dependencies (Phase 1 Brick 7).
Enforces:
- Bearer token decoding and signature/expiration validation
- Active account verification
- Role authorization (Student, Parent, Admin)
- Student self-access isolation (Student cannot access another student)
- Server-side family context authorization (Parent can only access linked student)
"""

from typing import List, Optional, Callable
from fastapi import Header, HTTPException, status, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select

from database.session import get_db
from models import User, StudentProfile, ParentProfile, ParentStudentAssociation
from models.enums import UserRole
from core.security import decode_access_token


def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> User:
    """
    Validates the HTTP Authorization Bearer token.
    Decodes JWT, confirms server-side signature and expiration, and fetches active user from DB.
    Raises 401 Unauthorized if missing, malformed, expired, or if user is inactive/not found.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization scheme. Use 'Bearer <token>'",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = parts[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is invalid or expired",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing subject identifier",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = int(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid subject in token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer exists",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is deactivated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def get_optional_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Optional user resolution for endpoints that adapt to logged-in state."""
    if not authorization:
        return None
    try:
        parts = authorization.split(" ")
        if len(parts) == 2 and parts[0].lower() == "bearer":
            payload = decode_access_token(parts[1])
            if payload and "sub" in payload:
                user = db.get(User, int(payload["sub"]))
                if user and user.is_active:
                    return user
    except Exception:
        pass
    return None


def require_role(allowed_roles: List[UserRole]) -> Callable[..., User]:
    """
    Role-based access control dependency factory.
    Enforces that the authenticated user possesses one of the allowed server-side roles.
    Raises 403 Forbidden if user lacks permitted role.
    """
    def _role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. User role '{current_user.role.value}' does not have required permissions.",
            )
        return current_user

    return _role_checker


# Reusable role-specific dependencies
require_authenticated_user = get_current_user
require_student = require_role([UserRole.STUDENT])
require_parent = require_role([UserRole.PARENT])
require_admin = require_role([UserRole.ADMIN])


def verify_student_self(
    student_id: int,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db),
) -> StudentProfile:
    """
    Enforces student self-access isolation.
    Ensures that an authenticated student can ONLY access their own StudentProfile.
    A student cannot access another student simply by manipulating a URL parameter.
    Raises 403 Forbidden on mismatch.
    """
    student_profile = current_user.student_profile
    if not student_profile or student_profile.id != student_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Students are restricted to accessing their own profile and context.",
        )
    return student_profile


def verify_family_access(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StudentProfile:
    """
    Enforces server-side family context authorization.
    Verifies that:
    1. If user is ADMIN: permitted.
    2. If user is STUDENT: must be the student's own profile.
    3. If user is PARENT: must have an explicit link in ParentStudentAssociation to the target student.
    A parent can NEVER access an unrelated student simply by supplying student_id in the request.
    Raises 403 Forbidden if not authorized.
    """
    # Verify student exists
    target_student = db.get(StudentProfile, student_id)
    if not target_student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found",
        )

    # 1. Admin access
    if current_user.role == UserRole.ADMIN:
        return target_student

    # 2. Student self-access
    if current_user.role == UserRole.STUDENT:
        if current_user.student_profile and current_user.student_profile.id == student_id:
            return target_student
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Students cannot access another student's context.",
        )

    # 3. Parent family relationship check
    if current_user.role == UserRole.PARENT:
        parent_profile = current_user.parent_profile
        if not parent_profile:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Parent profile not established.",
            )

        # Query explicit association table
        stmt = select(ParentStudentAssociation).where(
            ParentStudentAssociation.parent_profile_id == parent_profile.id,
            ParentStudentAssociation.student_profile_id == student_id,
        )
        association = db.scalar(stmt)
        if not association:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Parent is not linked to this student context.",
            )
        return target_student

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access denied: Unauthorized role for student context.",
    )
