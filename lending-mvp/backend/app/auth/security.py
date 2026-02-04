# import os
# from datetime import datetime, timedelta
# from typing import Optional
# from jose import JWTError, jwt
# from passlib.context import CryptContext
# from ..config import settings

# from fastapi import APIRouter, Body, HTTPException, Depends, Request, Response, status

# # Password hashing
# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# def _truncate_password(password: str, max_bytes: int = 72) -> str:
#     """Truncate a password so its UTF-8 encoding is at most max_bytes long."""
#     if not isinstance(password, str):
#         password = str(password)
    
#     encoded = password.encode("utf-8")
#     if len(encoded) <= max_bytes:
#         return password

#     truncated_bytes = encoded[:max_bytes]
#     return truncated_bytes.decode("utf-8", errors="ignore")

# def verify_password(plain_password: str, hashed_password: str) -> bool:
#     """Verify a password against its hash"""
#     truncated_password = _truncate_password(plain_password)
#     return pwd_context.verify(truncated_password, hashed_password)

# def get_password_hash(password: str) -> str:
#     """Hash a password"""
#     truncated_password = _truncate_password(password)
#     return pwd_context.hash(truncated_password)

# def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
#     """Create JWT access token"""
#     to_encode = data.copy()
#     if expires_delta:
#         expire = datetime.utcnow() + expires_delta
#     else:
#         expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
#     to_encode.update({"exp": expire})
#     encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.ALGORITHM)
#     return encoded_jwt

# def verify_token(token: str) -> Optional[dict]:
#     """Verify JWT token and return payload"""
#     try:
#         payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.ALGORITHM])
#         return payload
#     except JWTError as e:
#         print(f"JWTError decoding token: {e}")
#         return None
    

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Any

from fastapi import HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext

from ..config import settings

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _truncate_password(password: str, max_bytes: int = 72) -> str:
    """Truncate password so UTF-8 encoding fits in bcrypt limit"""
    if not isinstance(password, str):
        password = str(password)
        
    encoded = password.encode("utf-8")
    if len(encoded) <= max_bytes:
        return password
        
    # Truncate and warn (very rare in practice)
    truncated_bytes = encoded[:max_bytes]
    truncated = truncated_bytes.decode("utf-8", errors="ignore")
    logger.warning("Password was truncated to fit bcrypt 72-byte limit")
    return truncated


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(_truncate_password(plain_password), hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(_truncate_password(password))


def create_access_token(
    data: dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    to_encode = data.copy()
    
    expire = (
        datetime.now(timezone.utc) + expires_delta
        if expires_delta
        else datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_token(token: str) -> dict[str, Any]:
    """
    Raises HTTPException on invalid/expired token
    Use this version in Depends() dependencies
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError as e:
        logger.debug("Token verification failed: %s", e)
        raise credentials_exception from e