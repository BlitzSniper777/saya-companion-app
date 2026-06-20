from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from supabase import Client
from pydantic import BaseModel
from typing import Any, Dict
from datetime import datetime, timezone
import json
import random

from config import settings
from database import get_supabase
from routers.auth import get_current_user
from models import (
    UserProfileUpdate, UserResponse, OnboardingRequest
)
from companions_catalog import assign_companion, COMPANIONS_BY_ID

router = APIRouter(prefix="/user", tags=["user"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
AVATAR_MAX_BYTES = 5 * 1024 * 1024  # 5 MB


@router.get("/profile", response_model=UserResponse)
async def get_profile(current_user: dict = Depends(get_current_user)):
    return UserResponse(**current_user)


@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP, and GIF images are supported")

    contents = await file.read()
    if len(contents) > AVATAR_MAX_BYTES:
        raise HTTPException(status_code=400, detail="Image must be under 5 MB")

    user_id = str(current_user["id"])
    ext = file.content_type.split("/")[1].replace("jpeg", "jpg")
    path = f"{user_id}/avatar.{ext}"

    # Ensure bucket exists (idempotent)
    try:
        supabase.storage.create_bucket("avatars", options={"public": True})
    except Exception:
        pass

    # Upload (upsert so re-upload overwrites)
    supabase.storage.from_("avatars").upload(
        path=path,
        file=contents,
        file_options={"content-type": file.content_type, "upsert": "true"},
    )

    avatar_url = supabase.storage.from_("avatars").get_public_url(path)

    # Save URL into user_preferences (no schema change needed)
    prefs = current_user.get("user_preferences") or {}
    prefs["avatar_url"] = avatar_url
    supabase.table("users").update({"user_preferences": prefs}).eq("id", user_id).execute()

    return {"avatar_url": avatar_url}


class PreferencesUpdate(BaseModel):
    updates: Dict[str, Any]


@router.patch("/preferences")
async def update_preferences(
    request: PreferencesUpdate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    """Merge arbitrary key-value pairs into user_preferences (e.g. mode_conversations)."""
    user_id = current_user["id"]
    prefs = dict(current_user.get("user_preferences") or {})
    prefs.update(request.updates)
    supabase.table("users").update({"user_preferences": prefs}).eq("id", user_id).execute()
    return {"success": True}


@router.patch("/profile", response_model=UserResponse)
async def update_profile(
    request: UserProfileUpdate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    update_data = request.model_dump(exclude_unset=True)
    if update_data:
        supabase.table("users").update(update_data).eq("id", current_user["id"]).execute()
        # Fetch updated
        result = supabase.table("users").select("*").eq("id", current_user["id"]).single().execute()
        return UserResponse(**result.data)
    return UserResponse(**current_user)



@router.post("/onboarding")
async def submit_onboarding(
    request: OnboardingRequest,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Submit onboarding answers and complete onboarding flow."""
    user_id = current_user["id"]
    
    # Get user preferences
    user_prefs = current_user.get("user_preferences") or {}
    
    # Assign companion based on onboarding answers
    gender_pref = request.companion_gender_preference or "no_preference"
    answers = {
        "q1_what_brings_you": request.why_came,
        "q2_communication_style": request.communication_style,
        "q3_friendship_values": request.friendship_values,
        "q4_faith_spirituality": request.faith_spirituality,
    }
    
    matched = assign_companion(answers, gender_pref)
    
    # Update user profile with onboarding data
    updated_prefs = {
        **user_prefs,
        "why_came": request.why_came,
        "communication_style": request.communication_style,
        "friendship_values": request.friendship_values,
        "faith_spirituality": request.faith_spirituality,
        "user_name": request.user_name,
        "companion_gender_preference": gender_pref,
        "companion_id": matched["id"],
        "onboarding_completed": True,
    }
    
    supabase.table("users").update({
        "full_name": request.user_name,
        "user_preferences": updated_prefs,
        "onboarding_completed": True,
    }).eq("id", user_id).execute()
    
    # Update or create companion
    supabase.table("companions").update({
        "name": matched["name"],
        "personality_calibration": {
            **answers,
            "personality_id": matched["id"],
            "gender": matched["gender"],
            "companion_name": matched["name"],
        },
        "mode": "friend",
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("user_id", user_id).execute()

    # Log onboarding completion consent
    supabase.table("consent_logs").insert({
        "user_id": user_id,
        "consent_type": "onboarding_completed",
        "consent_given": True,
        "details": {
            "version": "2.1",
            "answers": answers,
            "companion_assigned": matched["id"],
            "user_name": request.user_name,
        },
    }).execute()

    return {
        "success": True,
        "message": "Onboarding completed",
        "companion_name": matched["name"],
        "redirect": "/chat"
    }


@router.delete("/account")
async def delete_account(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    user_id = current_user["id"]
    
    # GDPR: Full cascade delete (handled by FK constraints)
    # Just delete the user - cascades to companions, conversations, messages, subscriptions, etc.
    supabase.table("users").delete().eq("id", user_id).execute()
    
    # Log deletion consent
    supabase.table("consent_logs").insert({
        "user_id": user_id,
        "consent_type": "account_deletion",
        "consent_given": True,
        "details": {"reason": "user_requested", "gdpr": True}
    }).execute()
    
    return {"success": True, "message": "Account deleted permanently"}