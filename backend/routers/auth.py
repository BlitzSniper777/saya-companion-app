from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import EmailStr
from supabase import Client
from datetime import datetime, timezone, timedelta
import uuid

from config import settings
from database import get_supabase
from auth import create_access_token, get_password_hash, verify_password, decode_token
from models import (
    RegisterRequest, LoginRequest, TokenResponse, UserResponse, RefreshRequest
)

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    supabase: Client = Depends(get_supabase)
) -> dict:
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    try:
        payload = decode_token(credentials.credentials)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        result = supabase.table("users").select("*").eq("id", user_id).single().execute()
        if not result.data:
            raise HTTPException(status_code=401, detail="User not found")
        if not result.data.get("is_active"):
            raise HTTPException(status_code=401, detail="Account deactivated")
        return result.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")


@router.post("/register")
async def register(request: RegisterRequest, supabase: Client = Depends(get_supabase)):
    # Check if email exists
    existing = supabase.table("users").select("id").eq("email", request.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    password_hash = get_password_hash(request.password)
    user_data = {
        "email": request.email,
        "password_hash": password_hash,
        "full_name": request.full_name,
        "user_preferences": {},
        "onboarding_completed": False,
    }
    result = supabase.table("users").insert(user_data).execute()
    user = result.data[0]
    
    # Create companion record
    import random
    female_names = ["Saya", "Luna", "Nova", "Iris", "Echo", "Zara", "Aiko", "Mara", "Lyra", "Soleil"]
    male_names = ["Atlas", "Orion", "Cael", "Ryo", "Zane", "Luca", "Finn", "Milo", "Noel", "Ren"]
    all_names = female_names + male_names
    companion_name = random.choice(all_names)
    
    companion_data = {
        "user_id": user["id"],
        "name": companion_name,
        "personality_calibration": {},
        "mode": "friend",
        "relationship_length_days": 0,
        "language": "en",
    }
    supabase.table("companions").insert(companion_data).execute()

    # Store companion name on user profile so it's always accessible without a join
    supabase.table("users").update({
        "user_preferences": {"companion_name": companion_name}
    }).eq("id", user["id"]).execute()
    
    # Create subscription record (7-day free trial, no card)
    trial_ends_at = datetime.now(timezone.utc) + timedelta(days=7)
    sub_data = {
        "user_id": user["id"],
        "plan": "free",
        "status": "trialing",
        "daily_message_limit": -1,
        "daily_message_count": 0,
        "current_period_end": trial_ends_at.isoformat(),
    }
    supabase.table("subscriptions").insert(sub_data).execute()
    
    # Log consent
    supabase.table("consent_logs").insert({
        "user_id": user["id"],
        "consent_type": "terms_of_service",
        "consent_given": True,
        "details": {"version": "2.0", "action": "registration"}
    }).execute()
    
    # Create access token
    access_token = create_access_token({"sub": user["id"], "email": user["email"]})
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse(**user)
    )


@router.post("/login")
async def login(request: LoginRequest, supabase: Client = Depends(get_supabase)):
    try:
        result = supabase.table("users").select("*").eq("email", request.email).single().execute()
        if not result.data:
            raise HTTPException(status_code=401, detail="Invalid credentials")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = result.data
    if not verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get("is_active"):
        raise HTTPException(status_code=401, detail="Account deactivated")
    
    # Update last login
    from datetime import datetime, timezone
    supabase.table("users").update({"last_login_at": datetime.now(timezone.utc).isoformat()}).eq("id", user["id"]).execute()
    
    access_token = create_access_token({"sub": user["id"], "email": user["email"]})
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse(**user)
    )


@router.post("/refresh")
async def refresh_token(request: RefreshRequest):
    try:
        # For now, just decode and reissue - in production use refresh token rotation
        from auth import decode_token, create_access_token
        payload = decode_token(request.refresh_token)
        access_token = create_access_token({"sub": payload["sub"], "email": payload["email"]})
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    return UserResponse(**current_user)