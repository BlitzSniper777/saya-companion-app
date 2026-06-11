from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict

from database import get_supabase
from auth import get_current_user
from models import VoiceStartRequest, VoiceCreditsResponse

router = APIRouter(prefix="/voice", tags=["Voice"])

VOICE_PACKAGES = [
    {"id": "v60", "minutes": 60, "price_cents": 500, "label": "$5 — 60 minutes"},
    {"id": "v130", "minutes": 130, "price_cents": 1000, "label": "$10 — 130 minutes"},
    {"id": "v350", "minutes": 350, "price_cents": 2500, "label": "$25 — 350 minutes"},
    {"id": "v750", "minutes": 750, "price_cents": 5000, "label": "$50 — 750 minutes"},
]


async def get_or_create_voice_credits(supabase, user_id: str) -> dict:
    """Get user's voice credits, create row with 0 if not exists."""
    result = supabase.table("voice_credits").select("*").eq("user_id", user_id).single().execute()
    if result.data:
        return result.data
    # Create new row
    insert_result = supabase.table("voice_credits").insert({
        "user_id": user_id,
        "balance_minutes": 0,
    }).execute()
    return insert_result.data[0] if insert_result.data else {"user_id": user_id, "balance_minutes": 0}


@router.get("/credits", response_model=VoiceCreditsResponse)
async def get_voice_credits(
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase),
):
    """Get user's voice credit balance. Requires gfbf or adult plan."""
    user_id = current_user["id"]
    
    # Check subscription plan
    plan_result = supabase.table("subscriptions").select("plan").eq("user_id", user_id).single().execute()
    plan = plan_result.data["plan"] if plan_result.data else "free"
    
    if plan not in ("gfbf", "adult_bundle"):
        raise HTTPException(status_code=403, detail="Voice credits require GF/BF or Adult plan")
    
    credits = await get_or_create_voice_credits(supabase, user_id)
    
    return VoiceCreditsResponse(
        balance=credits.get("balance_minutes", 0),
        plan=plan,
        tier_limits={"gfbf": -1, "adult_bundle": -1}  # -1 means unlimited
    )


@router.get("/packages")
async def get_voice_packages():
    """Get available voice credit packages."""
    return {"packages": VOICE_PACKAGES}


@router.post("/purchase")
async def purchase_voice_package(
    package_id: str,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase),
):
    """Purchase a voice credit package."""
    user_id = current_user["id"]
    
    # Check plan
    plan_result = supabase.table("subscriptions").select("plan").eq("user_id", user_id).single().execute()
    plan = plan_result.data["plan"] if plan_result.data else "free"
    
    if plan not in ("gfbf", "adult_bundle"):
        raise HTTPException(status_code=403, detail="Voice purchases require GF/BF or Adult plan")
    
    # Validate package
    package = next((p for p in VOICE_PACKAGES if p["id"] == package_id), None)
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    
    # Check if Stripe is configured
    from config import settings
    stripe_configured = bool(getattr(settings, "STRIPE_SECRET_KEY", None) and getattr(settings, "STRIPE_PUBLISHABLE_KEY", None))
    
    if stripe_configured:
        # TODO: Create Stripe payment intent
        # For now, simulate success
        pass
    else:
        # Simulate success - add minutes to balance
        credits = await get_or_create_voice_credits(supabase, user_id)
        new_balance = credits.get("balance_minutes", 0) + package["minutes"]
        
        supabase.table("voice_credits").update({
            "balance_minutes": new_balance,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }).eq("user_id", user_id).execute()
        
        return {
            "success": True,
            "minutes_added": package["minutes"],
            "new_balance": new_balance,
            "checkout_url": None
        }
    
    return {
        "success": True,
        "minutes_added": package["minutes"],
        "new_balance": new_balance,
        "checkout_url": None  # Would be Stripe checkout URL
    }


@router.post("/start")
async def start_voice_call(
    request: VoiceStartRequest,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase),
):
    """Start a voice call. Requires gfbf or adult plan and credits > 0."""
    user_id = current_user["id"]
    
    # Check plan
    plan_result = supabase.table("subscriptions").select("plan").eq("user_id", user_id).single().execute()
    plan = plan_result.data["plan"] if plan_result.data else "free"
    
    if plan not in ("gfbf", "adult_bundle"):
        raise HTTPException(status_code=403, detail="Voice calls require GF/BF or Adult plan")
    
    # Check balance
    credits = await get_or_create_voice_credits(supabase, user_id)
    balance = credits.get("balance_minutes", 0)
    
    if balance <= 0:
        raise HTTPException(status_code=400, detail="Insufficient voice credits")
    
    return {
        "status": "coming_soon",
        "message": "Voice calls are coming in Phase 2 — Miso One TTS. Your credits are saved.",
        "balance": balance
    }