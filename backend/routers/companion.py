from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from datetime import datetime, timezone

from database import get_supabase
from routers.auth import get_current_user
from models import CompanionResponse, CompanionUpdate

router = APIRouter(prefix="/companion", tags=["companion"])


@router.get("", response_model=CompanionResponse)
async def get_companion(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    result = supabase.table("companions").select("*").eq("user_id", current_user["id"]).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Companion not found")
    return CompanionResponse(**result.data)


@router.patch("", response_model=CompanionResponse)
async def update_companion(
    request: CompanionUpdate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    update_data = request.model_dump(exclude_unset=True)
    if "personality_calibration" in update_data:
        # Merge with existing calibration
        existing = supabase.table("companions").select("personality_calibration").eq("user_id", current_user["id"]).single().execute()
        if existing.data:
            calibration = existing.data.get("personality_calibration", {}) or {}
            calibration.update(update_data.pop("personality_calibration"))
            update_data["personality_calibration"] = calibration
    
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        supabase.table("companions").update(update_data).eq("user_id", current_user["id"]).execute()
    
    result = supabase.table("companions").select("*").eq("user_id", current_user["id"]).single().execute()
    return CompanionResponse(**result.data)


@router.post("/mode", response_model=CompanionResponse)
async def switch_mode(
    mode: str,  # "friend" or "romantic"
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    if mode not in ["friend", "romantic"]:
        raise HTTPException(status_code=400, detail="Invalid mode. Must be 'friend' or 'romantic'")
    
    # Check subscription for romantic mode
    if mode == "romantic":
        sub = supabase.table("subscriptions").select("plan").eq("user_id", current_user["id"]).single().execute()
        if not sub.data or sub.data["plan"] not in ["gfbf", "adult"]:
            raise HTTPException(status_code=403, detail="Romantic mode requires GF/BF plan")
    
    supabase.table("companions").update({
        "mode": mode,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }).eq("user_id", current_user["id"]).execute()
    
    # Log consent for romantic mode
    if mode == "romantic":
        supabase.table("consent_logs").insert({
            "user_id": current_user["id"],
            "consent_type": "romantic_mode",
            "consent_given": True,
            "details": {"version": "2.0", "action": "enabled"}
        }).execute()
    
    result = supabase.table("companions").select("*").eq("user_id", current_user["id"]).single().execute()
    return CompanionResponse(**result.data)


@router.post("/adult", response_model=CompanionResponse)
async def toggle_adult_mode(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    # Check GF/BF plan
    sub = supabase.table("subscriptions").select("plan").eq("user_id", current_user["id"]).single().execute()
    if not sub.data or sub.data["plan"] != "gfbf":
        raise HTTPException(status_code=403, detail="Adult mode requires GF/BF plan")
    
    # Check romantic mode is active
    comp = supabase.table("companions").select("mode").eq("user_id", current_user["id"]).single().execute()
    if not comp.data or comp.data["mode"] != "romantic":
        raise HTTPException(status_code=400, detail="Romantic mode must be active first")
    
    # Toggle adult mode
    new_mode = "adult" if comp.data["mode"] == "romantic" else "romantic"
    
    supabase.table("companions").update({
        "mode": new_mode,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }).eq("user_id", current_user["id"]).execute()
    
    # Log consent
    supabase.table("consent_logs").insert({
        "user_id": current_user["id"],
        "consent_type": "adult_mode",
        "consent_given": new_mode == "adult",
        "details": {"version": "2.0", "action": "enabled" if new_mode == "adult" else "disabled"}
    }).execute()
    
    result = supabase.table("companions").select("*").eq("user_id", current_user["id"]).single().execute()
    return CompanionResponse(**result.data)