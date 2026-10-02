from typing import List, Optional, Dict, Any, Callable
from fastapi import Header, HTTPException, status, Depends
from services.auth_service import verify_token


def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """
    Validates the HTTP Authorization Bearer token.
    Raises 401 Unauthorized if missing, malformed, or expired.
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
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is invalid or expired",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return payload


def get_optional_current_user(authorization: Optional[str] = Header(None)) -> Optional[Dict[str, Any]]:
    """Optional user resolution for endpoints that adapt to logged-in state."""
    if not authorization:
        return None
    try:
        parts = authorization.split(" ")
        if len(parts) == 2 and parts[0].lower() == "bearer":
            return verify_token(parts[1])
    except Exception:
        pass
    return None


def require_role(allowed_roles: List[str]) -> Callable[..., Dict[str, Any]]:
    """
    Role-based access control dependency factory.
    Returns dependency that validates the user's role.
    Raises 403 Forbidden if user lacks permitted role.
    """
    def _role_checker(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        user_role = current_user.get("role", "").lower()
        normalized_allowed = [r.lower() for r in allowed_roles]
        if user_role not in normalized_allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role in {allowed_roles}, but current user has role '{user_role}'",
            )
        return current_user

    return _role_checker
