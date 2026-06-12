"""
Training data export — all sources feed one private bucket.

Storage layout:
  saya-training-data/
    real/YYYY-MM-DD.jsonl         — one file per day, real user turns (hashed IDs)
    sims/sim_YYYYMMDD_HHMMSS.jsonl — one file per sim run (future sims)
    sims/sim2_*.jsonl              — historical sim2 data (already uploaded)
    sims/sim3_*.jsonl              — historical sim3 data (already uploaded)
    state.json                     — tracks last_export_at cursor

  saya-legal-records/
    {user_id}.jsonl                — full message log per user, append-only

To get the full training set for fine-tuning:
  GET /admin/export/manifest  — lists all files in the bucket with download URLs
  Then concatenate all real/* and sims/* files.

Sources:
  1. GET  /admin/export          — Vercel cron at 02:00 UTC, appends real turns
  2. POST /admin/export/ingest   — sim runner calls after each run
"""
import hashlib
import json
from datetime import datetime, timezone
from typing import List, Any
from fastapi import APIRouter, Request, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from supabase import Client

from config import settings
from database import get_supabase

router = APIRouter(prefix="/admin", tags=["export"])

TRAINING_BUCKET = "saya-training-data"
LEGAL_BUCKET    = "saya-legal-records"
STATE_PATH      = "state.json"


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

def _ensure_buckets(supabase: Client):
    for bucket in (TRAINING_BUCKET, LEGAL_BUCKET):
        try:
            supabase.storage.create_bucket(bucket, {"public": False})
        except Exception:
            pass


def _download(supabase: Client, bucket: str, path: str) -> bytes:
    try:
        data = supabase.storage.from_(bucket).download(path)
        return data if isinstance(data, bytes) else bytes(data)
    except Exception:
        return b""


def _upload(supabase: Client, bucket: str, path: str, data: bytes):
    try:
        supabase.storage.from_(bucket).upload(path, data, {"upsert": "true"})
        return
    except Exception:
        pass
    try:
        supabase.storage.from_(bucket).update(path, data)
        return
    except Exception:
        pass
    try:
        supabase.storage.from_(bucket).remove([path])
    except Exception:
        pass
    supabase.storage.from_(bucket).upload(path, data)


def _load_state(supabase: Client) -> dict:
    raw = _download(supabase, TRAINING_BUCKET, STATE_PATH)
    if raw:
        try:
            return json.loads(raw)
        except Exception:
            pass
    return {"last_export_at": None}


def _save_state(supabase: Client, state: dict):
    _upload(supabase, TRAINING_BUCKET, STATE_PATH, json.dumps(state).encode())


def _hash_uid(user_id: str) -> str:
    return hashlib.sha256(user_id.encode()).hexdigest()[:16]


# ── daily real-user export ────────────────────────────────────────────────────

@router.get("/export")
async def export_conversations(
    request: Request,
    supabase: Client = Depends(get_supabase),
):
    """
    Export new conversations since last run.
    Appends to real/YYYY-MM-DD.jsonl in the training bucket.
    Appends to per-user JSONL files in the legal records bucket.
    Triggered daily at 02:00 UTC by Vercel cron.
    """
    _verify_cron_or_admin(request)
    _ensure_buckets(supabase)

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
        return {"exported_turns": 0, "users_updated": 0, "message": "No new messages"}

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

    convs: dict = {}
    for m in messages:
        cid = m["conversation_id"]
        if cid not in convs:
            convs[cid] = {"user_id": m["user_id"], "msgs": []}
        convs[cid]["msgs"].append(m)

    training_lines: list[str] = []
    legal_by_user: dict[str, list[str]] = {}

    for cid, conv in convs.items():
        uid = conv["user_id"]
        comp = companion_map.get(uid, {"companion_id": "", "mode": "friend"})
        msgs = conv["msgs"]

        if uid not in legal_by_user:
            legal_by_user[uid] = []
        for m in msgs:
            legal_by_user[uid].append(json.dumps({
                "user_id":         uid,
                "conversation_id": cid,
                "companion_id":    comp["companion_id"],
                "mode":            comp["mode"],
                "role":            m["role"],
                "content":         m["content"],
                "timestamp":       m["created_at"],
            }))

        i = 0
        while i < len(msgs) - 1:
            if msgs[i]["role"] == "user" and msgs[i + 1]["role"] == "assistant":
                training_lines.append(json.dumps({
                    "source":          "real",
                    "companion_id":    comp["companion_id"],
                    "mode":            comp["mode"],
                    "user_id_hash":    _hash_uid(uid),
                    "conversation_id": cid,
                    "user_msg":        msgs[i]["content"],
                    "saya_msg":        msgs[i + 1]["content"],
                    "timestamp":       msgs[i]["created_at"],
                }))
                i += 2
            else:
                i += 1

    # Write to today's dated file (append if it already exists from a manual run)
    if training_lines:
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        day_path = f"real/{today}.jsonl"
        existing = _download(supabase, TRAINING_BUCKET, day_path)
        appended = existing + ("\n".join(training_lines) + "\n").encode()
        _upload(supabase, TRAINING_BUCKET, day_path, appended)

    for uid, lines in legal_by_user.items():
        existing = _download(supabase, LEGAL_BUCKET, f"{uid}.jsonl")
        appended = existing + ("\n".join(lines) + "\n").encode()
        _upload(supabase, LEGAL_BUCKET, f"{uid}.jsonl", appended)

    state["last_export_at"] = messages[-1]["created_at"]
    state["last_run"] = datetime.now(timezone.utc).isoformat()
    _save_state(supabase, state)

    return {
        "exported_turns": len(training_lines),
        "users_updated":  len(legal_by_user),
        "new_messages":   len(messages),
        "up_to":          state["last_export_at"],
    }


# ── sim ingest ────────────────────────────────────────────────────────────────

class IngestRequest(BaseModel):
    turns: List[Any]
    source: str = "sim"


@router.post("/export/ingest")
async def ingest_sim_turns(
    request: Request,
    body: IngestRequest,
    supabase: Client = Depends(get_supabase),
):
    """
    Ingest sim turns into the training bucket.
    Each sim run gets its own timestamped file under sims/.
    Called by the sim runner when a simulation completes.
    """
    _verify_cron_or_admin(request)

    if not body.turns:
        return {"ingested": 0}

    _ensure_buckets(supabase)

    lines = []
    for turn in body.turns:
        if isinstance(turn, dict):
            turn["source"] = body.source
        lines.append(json.dumps(turn))

    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    sim_path = f"sims/sim_{ts}.jsonl"
    _upload(supabase, TRAINING_BUCKET, sim_path, ("\n".join(lines) + "\n").encode())

    return {"ingested": len(lines), "source": body.source, "path": sim_path}


# ── manifest (download all for fine-tuning) ───────────────────────────────────

@router.get("/export/manifest")
async def export_manifest(
    request: Request,
    supabase: Client = Depends(get_supabase),
):
    """
    List all training files in the bucket with signed download URLs.
    Use this before a fine-tune run to get the full dataset.
    """
    _verify_cron_or_admin(request)

    files = []
    for prefix in ("real/", "sims/"):
        try:
            items = supabase.storage.from_(TRAINING_BUCKET).list(prefix.rstrip("/"))
            for item in (items or []):
                path = f"{prefix}{item['name']}"
                try:
                    url = supabase.storage.from_(TRAINING_BUCKET).create_signed_url(path, 3600)
                    files.append({
                        "path": path,
                        "size_bytes": item.get("metadata", {}).get("size", 0),
                        "updated_at": item.get("updated_at"),
                        "url": url.get("signedURL") or url.get("signedUrl", ""),
                    })
                except Exception:
                    files.append({"path": path})
        except Exception:
            pass

    total_lines_est = sum(
        f.get("size_bytes", 0) // 200  # rough estimate: ~200 bytes/line
        for f in files
    )

    return {
        "files": files,
        "total_files": len(files),
        "estimated_total_turns": total_lines_est,
    }
