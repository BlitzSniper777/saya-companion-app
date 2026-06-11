from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from datetime import datetime, timezone
import json

from config import settings
from database import get_supabase
from routers.auth import get_current_user
from models import (
    UserProfileUpdate, UserResponse
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