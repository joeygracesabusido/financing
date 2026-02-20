"""
Security utilities: password hashing, JWT access & refresh tokens,
password complexity validation, and session management via Redis.
"""

import logging
import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Any

from fastapi import HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext

from ..config import settings

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ── Password boundaries ───────────────────────────────────────────────────────

_COMPLEXITY_PATTERN = re.compile(
    r"^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]).{8,}$"
)

_PASSWORD_HISTORY_LIMIT = 5  # never reuse last N passwords


def _truncate_password(password: str, max_bytes: int = 72) -> str:
    """Truncate password so UTF-8 encoding fits in bcrypt's 72-byte limit."""
    if not isinstance(password, str):
        password = str(password)
    encoded = password.encode("utf-8")
    if len(encoded) <= max_bytes:
        return password
    truncated = encoded[:max_bytes].decode("utf-8", errors="ignore")
    logger.warning("Password was truncated to fit bcrypt 72-byte limit")
    return truncated


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(_truncate_password(plain_password), hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(_truncate_password(password))


def check_password_complexity(password: str) -> tuple[bool, str]:
    """
    Returns (ok, reason).
    Industry-standard rules:
      - Minimum 8 characters
      - At least one uppercase letter
      - At least one lowercase letter
      - At least one digit
      - At least one special character
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter."
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter."
    if not re.search(r"\d", password):
        return False, "Password must contain at least one digit."
    if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]", password):
        return False, "Password must contain at least one special character."
    return True, ""


def check_password_history(new_password: str, history_hashes: list[str]) -> bool:
    """
    Returns True if the password is NOT in history (safe to use).
    Checks only the last _PASSWORD_HISTORY_LIMIT entries.
    """
    for old_hash in history_hashes[-_PASSWORD_HISTORY_LIMIT:]:
        if pwd_context.verify(_truncate_password(new_password), old_hash):
            return False
    return True


# ── JWT tokens ────────────────────────────────────────────────────────────────

def _make_jti() -> str:
    return str(uuid.uuid4())


def create_access_token(
    data: dict[str, Any],
    expires_delta: Optional[timedelta] = None,
) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "type": "access", "jti": _make_jti()})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(
    data: dict[str, Any],
    expires_delta: Optional[timedelta] = None,
) -> tuple[str, str]:
    """
    Returns (encoded_token, jti).
    jti is stored in Redis / DB so the token can be revoked.
    """
    to_encode = data.copy()
    jti = _make_jti()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    to_encode.update({"exp": expire, "type": "refresh", "jti": jti})
    token = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.ALGORITHM)
    return token, jti


def verify_token(token: str) -> dict[str, Any]:
    """Raises HTTPException on invalid/expired token."""
    err = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError as exc:
        logger.debug("Token verification failed: %s", exc)
        raise err from exc