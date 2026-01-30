import os
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    # bcrypt has a 72-byte input limit. Ensure we truncate consistently
    # to avoid passlib/bcrypt raising: "password cannot be longer than 72 bytes"
    return pwd_context.verify(_truncate_password(plain_password), hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    # bcrypt only accepts up to 72 bytes. Truncate the UTF-8 bytes to 72
    # bytes in a consistent, unicode-safe way before hashing so that
    # verification uses the same truncated value.
    truncated_password = _truncate_password(password)
    return pwd_context.hash(truncated_password)


def _truncate_password(password: str, max_bytes: int = 72) -> str:
    """Truncate a password so its UTF-8 encoding is at most max_bytes long.

    This encodes the string to UTF-8, slices the byte sequence to max_bytes,
    then decodes with 'ignore' to avoid cutting a multi-byte sequence in the
    middle. The approach is deterministic and applied both when hashing and
    verifying.
    """
    if not isinstance(password, str):
        # Ensure we're always working with str
        password = str(password)

    encoded = password.encode("utf-8")
    if len(encoded) <= max_bytes:
        return password

    truncated_bytes = encoded[:max_bytes]
    # Decode ignoring partial-byte sequences at the end to ensure valid UTF-8
    return truncated_bytes.decode("utf-8", errors="ignore")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[dict]:
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
