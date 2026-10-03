"""
Core cryptographic and security utilities for Phase 1 Brick 7.
- Argon2id modern password hashing & verification
- JWT Access Token generation & decoding with server-side secrets
- Cryptographically secure refresh token generation & SHA-256 hashing
"""

import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError
import jwt

from core.config import settings

# Initialize Argon2id hasher with secure parameters
_ph = PasswordHasher(
    time_cost=2,
    memory_cost=65536,  # 64 MiB
    parallelism=1,
    hash_len=32,
)

ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    """
    Hashes a plaintext password using Argon2id.
    Never stores or returns plaintext.
    """
    if not password:
        raise ValueError("Password cannot be empty")
    return _ph.hash(password)


def verify_password(plain_password: str, hashed_password: Optional[str]) -> bool:
    """
    Verifies a plaintext password against an Argon2id hash.
    Safely rejects null or malformed hashes in constant time.
    """
    if not plain_password or not hashed_password:
        return False
    try:
        return _ph.verify(hashed_password, plain_password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False
    except Exception:
        return False


def create_access_token(
    payload_data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Generates a cryptographically signed JWT access token.
    Token includes sub (user_id), role, email, iat, and exp.
    """
    to_encode = payload_data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({
        "exp": expire,
        "iat": now,
    })
    encoded_jwt = jwt.encode(to_encode, settings.AUTH_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Validates and decodes a JWT access token using the server-side secret.
    Returns decoded payload if signature and expiration are valid; returns None otherwise.
    """
    try:
        payload = jwt.decode(
            token,
            settings.AUTH_SECRET_KEY,
            algorithms=[ALGORITHM],
            options={"require": ["exp", "sub", "role"]}
        )
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
    except Exception:
        return None


def generate_refresh_token() -> str:
    """
    Generates a cryptographically random, URL-safe 64-character refresh token string.
    """
    return secrets.token_urlsafe(48)


def hash_refresh_token(token: str) -> str:
    """
    Computes SHA-256 hash of the raw refresh token for server-side persistence.
    Plaintext refresh tokens are never stored in the database.
    """
    return hashlib.sha256(token.strip().encode("utf-8")).hexdigest()
