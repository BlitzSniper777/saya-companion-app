"""
Legal records export — per-user chat logs saved to Supabase Storage.
Vercel cron calls GET /admin/export at 02:00 UTC.

Training data is handled separately by the LOCAL script:
  D:\Claude\Empire\Saya Companion App\training_data\export_training.py
  (runs on Windows Task Scheduler, writes saya_combined_training.jsonl)

Storage layout:
  saya-legal-records/   (private bucket)
    {user_id}.jsonl     — full message log per user, append-only
"""
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Request, Depends, HTTPException
from supabase import Client

from config import settings
from database import get_supabase

router = APIRouter(prefix="/admin", tags=["export"])

LEGAL_BUCKET = "saya-legal-records"
STATE_BUCKET = "saya-legal-records"
STATE_PATH   = "_state.json"


# ── auth ──────────────────────────────────────────────────────────────────────

def _verify_cron_or_admin(request: Request):
    auth = request.headers.get("authorization", "")
    cron_secret = getattr(settings, "CRON_SECRET", "")
    if cron_secret and auth == f"Bearer {cron_secret}":
        return
    if auth.startswith("Bearer "):
        from auth import decode_token
        try:
            payload = decode_token(auth[7:])
            if payload.get("is_admin") or payload.get("email") == settings.ADMIN_EMAIL:
                return
        except Exception:
            pass
    raise HTTPException(status_code=401, detail="Unauthorized")


# ── storage helpers ───────────────────────────────────────────────────────────

def _ensure_bucket(supabase: Client):
    try:
        supabase.storage.create_bucket(LEGAL_BUCKET, {"public": False})
    except Exception:
        pass


def _download(supabase: Client, path: str) -> bytes:
    try:
        data = supabase.storage.from_(LEGAL_BUCKET).download(path)
        return data if isinstance(data, bytes) else bytes(data)
    except Exception:
        return b""


def _upload(supabase: Client, path: str, data: bytes):
    try:
        supabase.storage.from_(LEGAL_BUCKET).upload(path, data, {"upsert": "true"})
        return
    except Exception:
        pass
    try:
        supabase.storage.from_(LEGAL_BUCKET).update(path, data)
        return
    except Exception:
        pass
    try:
        supabase.storage.from_(LEGAL_BUCKET).remove([path])
    except Exception:
        pass
    supabase.storage.from_(LEGAL_BUCKET).upload(path, data)


def _load_state(supabase: Client) -> dict:
    raw = _download(supabase, STATE_PATH)
    if raw:
        try:
            return json.loads(raw)
        except Exception:
            pass
    return {"last_export_at": None}


def _save_state(supabase: Client, state: dict):
    _upload(supabase, STATE_PATH, json.dumps(state).encode())


# ── export endpoint ───────────────────────────────────────────────────────────

@router.get("/export")
async def export_legal_records(
    request: Request,
    supabase: Client = Depends(get_supabase),
):
    """
    Append new messages to each user's legal record file in Supabase Storage.
    Triggered daily at 02:00 UTC by Vercel cron.
    Training data is handled by the local export_training.py script, not here.
    """
    _verify_cron_or_admin(request)
    _ensure_bucket(supabase)

    state = _load_state(supabase)
    last_export = state.get("last_export_at")

    query = (
        supabase.table("messages")
        .select("id, conversation_id, user_id, role, content, created_at")
        .order("created_at")
    )
    if last_export:
        query = query.gt("created_at", last_export)

    messages = query.execute().data or []

    if not messages:
        return {"users_updated": 0, "message": "No new messages"}

    # Fetch companion info
    user_ids = list({m["user_id"] for m in messages})
    comp_rows = (
        supabase.table("companions")
        .select("user_id, personality_calibration, mode")
        .in_("user_id", user_ids)
        .execute()
        .data or []
    )
    companion_map = {}
    for c in comp_rows:
        cal = c.get("personality_calibration") or {}
        companion_map[c["user_id"]] = {
            "companion_id": cal.get("personality_id", ""),
            "mode": c.get("mode", "friend"),
        }

    # Group messages by user
    by_user: dict[str, list[str]] = {}
    for m in messages:
        uid = m["user_id"]
        comp = companion_map.get(uid, {"companion_id": "", "mode": "friend"})
        if uid not in by_user:
            by_user[uid] = []
        by_user[uid].append(json.dumps({
            "user_id":         uid,
            "conversation_id": m["conversation_id"],
            "companion_id":    comp["companion_id"],
            "mode":            comp["mode"],
            "role":            m["role"],
            "content":         m["content"],
            "timestamp":       m["created_at"],
        }))

    for uid, lines in by_user.items():
        existing = _download(supabase, f"{uid}.jsonl")
        appended = existing + ("\n".join(lines) + "\n").encode()
        _upload(supabase, f"{uid}.jsonl", appended)

    state["last_export_at"] = messages[-1]["created_at"]
    state["last_run"] = datetime.now(timezone.utc).isoformat()
    _save_state(supabase, state)

    return {
        "users_updated": len(by_user),
        "new_messages":  len(messages),
        "up_to":         state["last_export_at"],
    }
