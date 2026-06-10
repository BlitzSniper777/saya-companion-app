import jwt
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config import settings
from typing import Optional, Dict, Any

_security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_security),
) -> dict:
    from database import get_supabase
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    try:
        payload = decode_token(credentials.credentials)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        sb = get_supabase()
        result = sb.table("users").select("*").eq("id", user_id).single().execute()
        if not result.data:
            raise HTTPException(status_code=401, detail="User not found")
        if not result.data.get("is_active", True):
            raise HTTPException(status_code=401, detail="Account deactivated")
        return result.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")


async def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(_security),
) -> dict:
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    try:
        payload = decode_admin_token(credentials.credentials)
        return payload
    except (ValueError, Exception) as e:
        raise HTTPException(status_code=401, detail=f"Admin authentication failed: {str(e)}")


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRY_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def create_admin_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ADMIN_JWT_EXPIRY_MINUTES)
    to_encode.update({"exp": expire, "type": "admin"})
    return jwt.encode(to_encode, settings.ADMIN_JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid token")


def decode_admin_token(token: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(token, settings.ADMIN_JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("type") != "admin":
            raise ValueError("Not an admin token")
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("Admin token has expired")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid admin token")


def get_password_hash(password: str) -> str:
    import bcrypt
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    import bcrypt
    return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())