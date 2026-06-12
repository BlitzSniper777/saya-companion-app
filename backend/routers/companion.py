from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from datetime import datetime, timezone

from database import get_supabase
from routers.auth import get_current_user
from models import CompanionResponse, CompanionUpdate
from companions_catalog import assign_companion, COMPANIONS_BY_ID

router = APIRouter(prefix="/companion", tags=["companion"])

COMPANION_CHANGE_COST = 300  # coins ($3 at 1c/coin)

# ── helpers ───────────────────────────────────────────────────────────────────

def _get_companion(supabase: Client, user_id: str) -> dict:
    result = supabase.table("companions").select("*").eq("user_id", user_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Companion not found")
    return result.data


def _get_plan(supabase: Client, user_id: str) -> str:
    sub = supabase.table("subscriptions").select("plan").eq("user_id", user_id).single().execute()
    return sub.data["plan"] if sub.data else "free"


# ── routes ────────────────────────────────────────────────────────────────────

@router.get("", response_model=CompanionResponse)
async def get_companion(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    comp = _get_companion(supabase, current_user["id"])
    # Enrich with catalog data if personality_id is set
    cal = comp.get("personality_calibration") or {}
    pid = cal.get("personality_id")
    if pid and pid in COMPANIONS_BY_ID:
        cat = COMPANIONS_BY_ID[pid]
        comp["personality_type"] = cat["personality_type"]
        comp["bio"] = cat["bio"]
        comp["gender"] = cat["gender"]
    return CompanionResponse(**comp)


@router.patch("", response_model=CompanionResponse)
async def update_companion(
    request: CompanionUpdate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    update_data = request.model_dump(exclude_unset=True)

    if "personality_calibration" in update_data:
        existing = supabase.table("companions").select("personality_calibration").eq("user_id", current_user["id"]).single().execute()
        if existing.data:
            calibration = existing.data.get("personality_calibration") or {}
            calibration.update(update_data.pop("personality_calibration"))
            update_data["personality_calibration"] = calibration

    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        supabase.table("companions").update(update_data).eq("user_id", current_user["id"]).execute()

    comp = _get_companion(supabase, current_user["id"])
    return CompanionResponse(**comp)


@router.post("/mode")
async def switch_mode(
    mode: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    """
    Switch companion mode.
    companion/free → only "friend"
    gfbf           → "friend" | "romantic"
    adult          → "friend" | "romantic" | "adult"
    """
    plan = _get_plan(supabase, current_user["id"])

    allowed = {
        "free":         ["friend"],
        "companion":    ["friend"],
        "gfbf":         ["friend", "romantic"],
        "adult_bundle": ["friend", "romantic", "adult"],
    }
    if mode not in allowed.get(plan, ["friend"]):
        raise HTTPException(status_code=403, detail=f"Mode '{mode}' not available on your {plan} plan")

    supabase.table("companions").update({
        "mode": mode,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("user_id", current_user["id"]).execute()

    if mode in ("romantic", "adult"):
        supabase.table("consent_logs").insert({
            "user_id": current_user["id"],
            "consent_type": f"{mode}_mode",
            "consent_given": True,
            "details": {"version": "2.1", "action": "enabled", "plan": plan},
        }).execute()

    comp = _get_companion(supabase, current_user["id"])
    return {"mode": comp["mode"], "companion": CompanionResponse(**comp)}


@router.post("/change")
async def change_companion(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    """
    Pay 300 coins to get a newly matched companion.
    Cannot get the same companion twice in a row.
    """
    user_id = current_user["id"]

    # Check coin balance
    coins_row = supabase.table("user_coins").select("balance").eq("user_id", user_id).single().execute()
    balance = coins_row.data["balance"] if coins_row.data else 0
    if balance < COMPANION_CHANGE_COST:
        raise HTTPException(
            status_code=402,
            detail=f"Not enough coins. Need {COMPANION_CHANGE_COST}, have {balance}."
        )

    # Get current companion so we can exclude it
    comp = _get_companion(supabase, user_id)
    cal = comp.get("personality_calibration") or {}
    current_pid = cal.get("personality_id", "")

    # Re-run matching, excluding current companion
    user_prefs = current_user.get("user_preferences") or {}
    answers = {
        "q1_what_brings_you":    cal.get("q1_what_brings_you", user_prefs.get("why_came", "")),
        "q2_communication_style": cal.get("q2_communication_style", user_prefs.get("communication_style", "")),
        "q3_friendship_values":   cal.get("q3_friendship_values", user_prefs.get("friendship_values", "")),
        "q4_faith_spirituality":  cal.get("q4_faith_spirituality", user_prefs.get("faith_spirituality", "")),
    }
    gender_pref = user_prefs.get("companion_gender_preference", "no_preference")
    matched = assign_companion(answers, gender_pref, exclude_ids=[current_pid])

    # Deduct coins
    supabase.table("user_coins").update({
        "balance": balance - COMPANION_CHANGE_COST,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("user_id", user_id).execute()

    supabase.table("coin_transactions").insert({
        "user_id": user_id,
        "amount": -COMPANION_CHANGE_COST,
        "type": "companion_change",
        "note": f"Changed companion to {matched['name']}",
    }).execute()

    # Update companion record
    new_cal = {**cal, "personality_id": matched["id"], "gender": matched["gender"]}
    supabase.table("companions").update({
        "name": matched["name"],
        "personality_calibration": new_cal,
        "mode": "friend",  # reset mode on companion change
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("user_id", user_id).execute()

    # Keep companion_id on user profile in sync — name resolved from catalog at runtime
    existing_prefs_result = supabase.table("users").select("user_preferences").eq("id", user_id).single().execute()
    existing_prefs = existing_prefs_result.data.get("user_preferences") or {} if existing_prefs_result.data else {}
    supabase.table("users").update({
        "user_preferences": {**existing_prefs, "companion_id": matched["id"]}
    }).eq("id", user_id).execute()

    supabase.table("consent_logs").insert({
        "user_id": user_id,
        "consent_type": "companion_change",
        "consent_given": True,
        "details": {"from": current_pid, "to": matched["id"], "cost_coins": COMPANION_CHANGE_COST},
    }).execute()

    comp = _get_companion(supabase, user_id)
    return {
        "success": True,
        "new_companion": matched["name"],
        "personality": matched["personality_type"],
        "coins_spent": COMPANION_CHANGE_COST,
        "companion": CompanionResponse(**comp),
    }
