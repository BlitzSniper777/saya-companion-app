from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel
import uuid as uuid_module

from database import get_supabase
from routers.auth import get_current_user
from routers.coins import get_or_create_coins
from models import CompanionResponse, CompanionUpdate
from companions_catalog import assign_companion, COMPANIONS_BY_ID, COMPANIONS

router = APIRouter(prefix="/companion", tags=["companion"])

COMPANION_CHANGE_COST = 300
COMPANION_RESTORE_COST = 800

# ── helpers ───────────────────────────────────────────────────────────────────

def _get_companion(supabase: Client, user_id: str) -> dict:
    result = supabase.table("companions").select("*").eq("user_id", user_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Companion not found")
    return result.data


def _get_plan(supabase: Client, user_id: str) -> str:
    sub = supabase.table("subscriptions").select("plan").eq("user_id", user_id).single().execute()
    return sub.data["plan"] if sub.data else "free"


def _get_prefs(supabase: Client, user_id: str) -> dict:
    result = supabase.table("users").select("user_preferences").eq("id", user_id).single().execute()
    return (result.data or {}).get("user_preferences") or {}


def _save_prefs(supabase: Client, user_id: str, prefs: dict):
    supabase.table("users").update({"user_preferences": prefs}).eq("id", user_id).execute()


def _push_history(prefs: dict, entry: dict) -> dict:
    history = prefs.get("companion_history", [])
    # One entry per companion — remove any existing entry for the same companion_id before appending
    history = [h for h in history if h.get("companion_id") != entry.get("companion_id")]
    history.append(entry)
    prefs["companion_history"] = history[-20:]  # keep last 20 unique companions
    return prefs


# ── routes ────────────────────────────────────────────────────────────────────

@router.get("", response_model=CompanionResponse)
async def get_companion(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    comp = _get_companion(supabase, current_user["id"])
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


class ModeRequest(BaseModel):
    mode: str


@router.post("/mode")
async def switch_mode(
    request: ModeRequest,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    mode = request.mode
    plan = _get_plan(supabase, current_user["id"])

    allowed = {
        "free":         ["friend"],
        "companion":    ["friend"],
        "gfbf":         ["friend", "romantic"],
        "adult":        ["friend", "adult"],
        "vip":          ["friend", "romantic", "adult"],
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


class AdultModeRequest(BaseModel):
    date_of_birth: str
    tos_accepted: bool


@router.post("/adult")
async def toggle_adult_mode(
    request: AdultModeRequest,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    plan = _get_plan(supabase, current_user["id"])

    if plan not in ("gfbf", "adult", "vip"):
        raise HTTPException(status_code=403, detail="Adult mode requires Romantic Companion or Adult Bundle plan")

    try:
        dob = datetime.fromisoformat(request.date_of_birth).date()
        today = datetime.now(timezone.utc).date()
        age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        if age < 18:
            raise HTTPException(status_code=403, detail="Must be 18 or older for adult mode")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date of birth format (use YYYY-MM-DD)")

    if not request.tos_accepted:
        raise HTTPException(status_code=400, detail="Must accept Adult ToS")

    user_id = current_user["id"]

    supabase.table("companions").update({
        "mode": "adult",
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("user_id", user_id).execute()

    # Record consent + mark age-verified so future switches skip the gate
    supabase.table("consent_logs").insert({
        "user_id": user_id,
        "consent_type": "adult_mode",
        "consent_given": True,
        "details": {
            "version": "2.1",
            "action": "enabled",
            "plan": plan,
            "age_verified": True,
        },
    }).execute()

    prefs = _get_prefs(supabase, user_id)
    prefs["adult_verified"] = True
    _save_prefs(supabase, user_id, prefs)

    comp = _get_companion(supabase, user_id)
    return {"mode": comp["mode"], "companion": CompanionResponse(**comp)}


@router.get("/catalog")
async def get_companion_catalog(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    """Return all companions with availability — locked if current or in history (use Restore instead)."""
    prefs = _get_prefs(supabase, current_user["id"])
    history_ids = {h.get("companion_id") for h in prefs.get("companion_history", [])}
    try:
        comp = _get_companion(supabase, current_user["id"])
        current_pid = (comp.get("personality_calibration") or {}).get("personality_id", "")
    except Exception:
        current_pid = ""

    result = []
    for c in COMPANIONS:
        cid = c["id"]
        if cid == current_pid:
            available, locked_reason = False, "current"
        elif cid in history_ids:
            available, locked_reason = False, "in_history"
        else:
            available, locked_reason = True, None
        result.append({
            "id": cid,
            "name": c["name"],
            "gender": c["gender"],
            "personality_type": c["personality_type"],
            "bio": c["bio"],
            "pronoun": c["pronoun"],
            "available": available,
            "locked_reason": locked_reason,
        })
    return {"companions": result}


class CompanionChangeRequest(BaseModel):
    conversation_id: Optional[str] = None
    companion_id: Optional[str] = None  # when set, skip auto-match and use directly


@router.post("/change")
async def change_companion(
    request: CompanionChangeRequest = None,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    """Pay 300 coins to get a newly matched companion. Cannot get the same companion twice in a row."""
    user_id = current_user["id"]

    coins = get_or_create_coins(supabase, user_id)
    if coins["balance"] < COMPANION_CHANGE_COST:
        raise HTTPException(
            status_code=402,
            detail=f"Not enough coins. Need {COMPANION_CHANGE_COST}, have {coins['balance']}."
        )

    comp = _get_companion(supabase, user_id)
    cal = comp.get("personality_calibration") or {}
    current_pid = cal.get("personality_id", "")

    # Fetch prefs early so we can check history
    prefs = _get_prefs(supabase, user_id)
    history_ids = {h.get("companion_id") for h in prefs.get("companion_history", [])}

    chosen_id = (request.companion_id if request else None)
    if chosen_id:
        # User picked a specific companion
        if chosen_id == current_pid:
            raise HTTPException(status_code=400, detail="You already have this companion")
        if chosen_id in history_ids:
            raise HTTPException(status_code=400, detail="This companion is in your history — use Restore (800 coins) to bring them back.")
        if chosen_id not in COMPANIONS_BY_ID:
            raise HTTPException(status_code=404, detail="Companion not found in catalog")
        matched = COMPANIONS_BY_ID[chosen_id]
    else:
        # Auto-match: exclude current AND all history companions
        user_prefs = current_user.get("user_preferences") or {}
        answers = {
            "q1_what_brings_you":     cal.get("q1_what_brings_you",     user_prefs.get("why_came", "")),
            "q2_communication_style": cal.get("q2_communication_style", user_prefs.get("communication_style", "")),
            "q3_friendship_values":   cal.get("q3_friendship_values",   user_prefs.get("friendship_values", "")),
            "q4_faith_spirituality":  cal.get("q4_faith_spirituality",  user_prefs.get("faith_spirituality", "")),
        }
        current_gender = cal.get("gender", "")
        gender_pref = current_gender if current_gender in ("female", "male") else user_prefs.get("companion_gender_preference", "no_preference")
        exclude = list(history_ids | {current_pid})
        matched = assign_companion(answers, gender_pref, exclude_ids=exclude)

    # Save current companion to history before replacing
    conv_id = (request.conversation_id if request else None)
    history_entry = {
        "history_id": str(uuid_module.uuid4()),
        "companion_id": current_pid,
        "name": comp.get("name", ""),
        "gender": cal.get("gender", "female"),
        "conversation_id": conv_id,
        "changed_at": datetime.now(timezone.utc).isoformat(),
    }
    prefs = _push_history(prefs, history_entry)
    prefs["companion_id"] = matched["id"]

    # Deduct coins
    supabase.table("user_coins").upsert({
        "user_id": user_id,
        "balance": coins["balance"] - COMPANION_CHANGE_COST,
    }).execute()

    supabase.table("coin_transactions").insert({
        "user_id": user_id,
        "amount": -COMPANION_CHANGE_COST,
        "type": "companion_change",
        "note": f"Changed companion to {matched['name']}",
    }).execute()

    new_cal = {**cal, "personality_id": matched["id"], "gender": matched["gender"]}
    supabase.table("companions").update({
        "name": matched["name"],
        "personality_calibration": new_cal,
        "mode": "friend",
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("user_id", user_id).execute()

    _save_prefs(supabase, user_id, prefs)

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


@router.get("/history")
async def get_companion_history(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    """Return the list of previous companions this user has had."""
    prefs = _get_prefs(supabase, current_user["id"])
    history = list(reversed(prefs.get("companion_history", [])))  # most recent first

    enriched = []
    for entry in history:
        cat = COMPANIONS_BY_ID.get(entry.get("companion_id", ""), {})
        enriched.append({
            **entry,
            "personality_type": cat.get("personality_type", ""),
            "bio": cat.get("bio", ""),
        })

    return {"history": enriched}


class CompanionRestoreRequest(BaseModel):
    history_id: str


@router.post("/restore")
async def restore_companion(
    request: CompanionRestoreRequest,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    """Pay 800 coins to restore a previous companion and their chat history."""
    user_id = current_user["id"]

    coins = get_or_create_coins(supabase, user_id)
    if coins["balance"] < COMPANION_RESTORE_COST:
        raise HTTPException(
            status_code=402,
            detail=f"Not enough coins. Need {COMPANION_RESTORE_COST}, have {coins['balance']}."
        )

    prefs = _get_prefs(supabase, user_id)
    history = prefs.get("companion_history", [])
    entry = next((h for h in history if h.get("history_id") == request.history_id), None)
    if not entry:
        raise HTTPException(status_code=404, detail="History entry not found")

    pid = entry.get("companion_id", "")
    cat = COMPANIONS_BY_ID.get(pid, {})
    if not cat:
        raise HTTPException(status_code=404, detail="Companion no longer available in catalog")

    # Save current companion to history before replacing
    comp = _get_companion(supabase, user_id)
    cal = comp.get("personality_calibration") or {}
    current_pid = cal.get("personality_id", "")
    snapshot = {
        "history_id": str(uuid_module.uuid4()),
        "companion_id": current_pid,
        "name": comp.get("name", ""),
        "gender": cal.get("gender", "female"),
        "conversation_id": None,
        "changed_at": datetime.now(timezone.utc).isoformat(),
    }
    history = [h for h in history if h.get("history_id") != request.history_id]
    history.append(snapshot)
    prefs["companion_history"] = history[-10:]
    prefs["companion_id"] = pid

    # Deduct coins
    supabase.table("user_coins").upsert({
        "user_id": user_id,
        "balance": coins["balance"] - COMPANION_RESTORE_COST,
    }).execute()

    supabase.table("coin_transactions").insert({
        "user_id": user_id,
        "amount": -COMPANION_RESTORE_COST,
        "type": "companion_restore",
        "note": f"Restored companion {entry.get('name', '')}",
    }).execute()

    # Restore companion record — keep Q1-Q4 calibration answers from current companion
    current_answers = {k: v for k, v in cal.items() if k.startswith("q")}
    restored_cal = {
        **current_answers,
        "personality_id": pid,
        "gender": cat.get("gender", entry.get("gender", "female")),
        "companion_name": cat["name"],
    }
    supabase.table("companions").update({
        "name": cat["name"],
        "personality_calibration": restored_cal,
        "mode": "friend",
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("user_id", user_id).execute()

    _save_prefs(supabase, user_id, prefs)

    supabase.table("consent_logs").insert({
        "user_id": user_id,
        "consent_type": "companion_restore",
        "consent_given": True,
        "details": {"from": current_pid, "to": pid, "cost_coins": COMPANION_RESTORE_COST},
    }).execute()

    # Verify old conversation still exists
    conversation_id = entry.get("conversation_id")
    if conversation_id:
        try:
            check = supabase.table("conversations").select("id").eq("id", conversation_id).eq("user_id", user_id).single().execute()
            if not check.data:
                conversation_id = None
        except Exception:
            conversation_id = None

    comp = _get_companion(supabase, user_id)
    return {
        "success": True,
        "companion_name": cat["name"],
        "personality": cat.get("personality_type", ""),
        "coins_spent": COMPANION_RESTORE_COST,
        "companion": CompanionResponse(**comp),
        "conversation_id": conversation_id,
    }
