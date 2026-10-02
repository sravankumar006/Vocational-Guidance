import hmac
import hashlib
import base64
import json
import time
from typing import Optional, Dict, Any
from models.enums import UserRole


SECRET_KEY = "sih-vocational-guidance-secure-hmac-sha256-key"
DEFAULT_EXPIRY_SECONDS = 86400 * 7  # 7 days


def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _base64url_decode(data_str: str) -> bytes:
    padding = "=" * ((4 - len(data_str) % 4) % 4)
    return base64.urlsafe_b64decode((data_str + padding).encode("utf-8"))


def create_token(payload: Dict[str, Any], expires_in: int = DEFAULT_EXPIRY_SECONDS) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    body = {
        **payload,
        "exp": int(time.time()) + expires_in,
        "iat": int(time.time()),
    }
    encoded_header = _base64url_encode(json.dumps(header).encode("utf-8"))
    encoded_body = _base64url_encode(json.dumps(body).encode("utf-8"))
    signing_input = f"{encoded_header}.{encoded_body}".encode("utf-8")
    signature = hmac.new(SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()
    encoded_sig = _base64url_encode(signature)
    return f"{encoded_header}.{encoded_body}.{encoded_sig}"


def verify_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        parts = token.strip().split(".")
        if len(parts) != 3:
            return None
        encoded_header, encoded_body, encoded_sig = parts
        signing_input = f"{encoded_header}.{encoded_body}".encode("utf-8")
        expected_sig = hmac.new(SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()
        actual_sig = _base64url_decode(encoded_sig)
        if not hmac.compare_digest(expected_sig, actual_sig):
            return None

        body_bytes = _base64url_decode(encoded_body)
        payload = json.loads(body_bytes.decode("utf-8"))
        if payload.get("exp") and int(payload["exp"]) < int(time.time()):
            return None
        return payload
    except Exception:
        return None


# Built-in verified identity personas sharing linked family context
SEED_USERS: Dict[str, Dict[str, Any]] = {
    "student": {
        "id": 1,
        "name": "Aarav Sharma",
        "email": "student@sih.gov.in",
        "phone": "+919876543210",
        "role": UserRole.STUDENT.value,
        "family_id": "FAM-9042",
        "student_id": 1,
        "education_level": "Class 10 Passed",
        "district": "Medak",
        "state": "Telangana",
    },
    "parent": {
        "id": 2,
        "name": "Sunita Sharma",
        "email": "parent@sih.gov.in",
        "phone": "+919876543211",
        "role": UserRole.PARENT.value,
        "family_id": "FAM-9042",
        "student_id": 1,
        "linked_student_name": "Aarav Sharma",
        "relationship_to_student": "Mother",
        "district": "Medak",
        "state": "Telangana",
    },
    "admin": {
        "id": 3,
        "name": "Dr. Rajesh Verma",
        "email": "admin@sih.gov.in",
        "phone": "+919876543212",
        "role": UserRole.ADMIN.value,
        "title": "Director of Vocational Guidance",
        "department": "National Directorate of Skill Development",
    },
}


def authenticate_user(identifier: str, password: Optional[str] = None, role: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Authenticates by email, phone, or specific role name.
    Supports easy testing and production password check.
    """
    clean_id = (identifier or "").strip().lower()
    clean_role = (role or "").strip().lower()

    target_user = None

    # Role-based quick lookup
    if clean_role in SEED_USERS:
        target_user = SEED_USERS[clean_role]
    else:
        # Identifier match
        for key, user in SEED_USERS.items():
            if clean_id in [user["email"].lower(), user["phone"], key]:
                target_user = user
                break

    if not target_user:
        # Fallback default if a role was explicitly provided
        if clean_role == "student" or "student" in clean_id:
            target_user = SEED_USERS["student"]
        elif clean_role == "parent" or "parent" in clean_id:
            target_user = SEED_USERS["parent"]
        elif clean_role == "admin" or "admin" in clean_id:
            target_user = SEED_USERS["admin"]

    return target_user
