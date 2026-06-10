from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from datetime import datetime, timezone
import json

from config import settings
from database import get_supabase
from routers.auth import get_current_user
from models import (
    UserProfileUpdate, OnboardingRequest, OnboardingResponse,
    UserResponse, CompanionResponse
)

router = APIRouter(prefix="/user", tags=["user"])


@router.get("/profile", response_model=UserResponse)
async def get_profile(current_user: dict = Depends(get_current_user)):
    return UserResponse(**current_user)


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


@router.post("/onboarding", response_model=OnboardingResponse)
async def complete_onboarding(
    request: OnboardingRequest,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    if current_user.get("onboarding_completed"):
        raise HTTPException(status_code=400, detail="Onboarding already completed")
    
    # Build user_preferences JSON
    user_preferences = {
        "why_came": request.q1_what_brings_you,
        "communication_style": request.q2_communication_style,
        "friendship_values": request.q3_friendship_values,
        "faith_spirituality": request.q4_faith_spirituality,
        "user_name": request.q5_user_name,
    }
    
    # Update user
    supabase.table("users").update({
        "user_preferences": user_preferences,
        "full_name": request.q5_user_name,
        "onboarding_completed": True,
    }).eq("id", current_user["id"]).execute()
    
    # Update companion with calibration
    calibration = {
        "why_came": request.q1_what_brings_you,
        "communication_style": request.q2_communication_style,
        "friendship_values": request.q3_friendship_values,
        "faith_spirituality": request.q4_faith_spirituality,
        "user_name": request.q5_user_name,
    }
    if request.companion_name:
        calibration["companion_name"] = request.companion_name
    
    supabase.table("companions").update({
        "personality_calibration": calibration,
        "name": request.companion_name or "Saya",
    }).eq("user_id", current_user["id"]).execute()
    
    # Log consent
    supabase.table("consent_logs").insert({
        "user_id": current_user["id"],
        "consent_type": "onboarding_completed",
        "consent_given": True,
        "details": {"version": "2.0"}
    }).execute()
    
    # Fetch updated records
    user_result = supabase.table("users").select("*").eq("id", current_user["id"]).single().execute()
    comp_result = supabase.table("companions").select("*").eq("user_id", current_user["id"]).single().execute()
    
    return OnboardingResponse(
        success=True,
        message="Welcome! Saya is ready to chat.",
        user=UserResponse(**user_result.data),
        companion=CompanionResponse(**comp_result.data) if comp_result.data else None
    )


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