"""
Training data export — all sources feed one master file.

Sources:
  1. GET  /admin/export      — daily cron, appends real user conversations
  2. POST /admin/export/ingest — sim runner calls this after each sim run
  3. POST /admin/export/ingest-file — one-shot upload of an existing JSONL file

Storage layout (both buckets are private):
  saya-training-data/
    saya_combined_training.jsonl  — ALL training data (sims + real users)
    state.json                    — tracks last_export_at for real-user cursor
  saya-legal-records/
    {user_id}.jsonl               — full message log per user, append-only
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
TRAINING_PATH   = "saya_combined_training.jsonl"
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
            pass  # already exists


def _download(supabase: Client, bucket: str, path: str) -> bytes:
    try:
        data = supabase.storage.from_(bucket).download(path)
        return data if isinstance(data, bytes) else bytes(data)
    except Exception:
        return b""


def _upload(supabase: Client, bucket: str, path: str, data: bytes):
    # Try upsert, fall back to update, then remove+upload
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


# ── export endpoint ───────────────────────────────────────────────────────────

@router.get("/export")
async def export_conversations(
    request: Request,
    supabase: Client = Depends(get_supabase),
):
    _verify_cron_or_admin(request)
    _ensure_buckets(supabase)

    state = _load_state(supabase)
    last_export = state.get("last_export_at")

    # Fetch all messages since last export, ordered oldest-first
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

    # Fetch companion info for every affected user
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

    # Group messages by conversation
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

        # Legal record — every raw message, full user_id kept
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

        # Training pairs — consecutive user → assistant turns, user_id hashed
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

    # Append to combined training file
    if training_lines:
        existing = _download(supabase, TRAINING_BUCKET, TRAINING_PATH)
        appended = existing + ("\n".join(training_lines) + "\n").encode()
        _upload(supabase, TRAINING_BUCKET, TRAINING_PATH, appended)

    # Append to each user's legal file
    for uid, lines in legal_by_user.items():
        existing = _download(supabase, LEGAL_BUCKET, f"{uid}.jsonl")
        appended = existing + ("\n".join(lines) + "\n").encode()
        _upload(supabase, LEGAL_BUCKET, f"{uid}.jsonl", appended)

    # Advance the cursor
    state["last_export_at"] = messages[-1]["created_at"]
    state["last_run"] = datetime.now(timezone.utc).isoformat()
    _save_state(supabase, state)

    return {
        "exported_turns": len(training_lines),
        "users_updated":  len(legal_by_user),
        "new_messages":   len(messages),
        "up_to":          state["last_export_at"],
    }


# ── sim ingest endpoints ──────────────────────────────────────────────────────

class IngestRequest(BaseModel):
    turns: List[Any]  # list of dicts — sim turn objects
    source: str = "sim"


@router.post("/export/ingest")
async def ingest_sim_turns(
    request: Request,
    body: IngestRequest,
    supabase: Client = Depends(get_supabase),
):
    """
    Append sim turns to the master training file.
    Called by the sim runner after each simulation completes.
    Each item in `turns` is any dict — it gets written as one JSONL line.
    The `source` field is injected/overwritten so the origin is always tagged.
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

    existing = _download(supabase, TRAINING_BUCKET, TRAINING_PATH)
    appended = existing + ("\n".join(lines) + "\n").encode()
    _upload(supabase, TRAINING_BUCKET, TRAINING_PATH, appended)

    return {"ingested": len(lines), "source": body.source}


@router.post("/export/ingest-file")
async def ingest_sim_file(
    request: Request,
    file: UploadFile = File(...),
    source: str = "sim",
    supabase: Client = Depends(get_supabase),
):
    """
    Upload a .jsonl file and append its lines to the master training file.
    Use this to upload existing sim output files (raw_turns.jsonl, sim3_raw_turns.jsonl, etc.).
    Call once per file — lines are appended, never duplicated automatically.
    """
    _verify_cron_or_admin(request)
    _ensure_buckets(supabase)

    raw = await file.read()
    lines_in = [l.strip() for l in raw.decode("utf-8").splitlines() if l.strip()]

    lines_out = []
    for line in lines_in:
        try:
            obj = json.loads(line)
            if isinstance(obj, dict):
                obj["source"] = source
            lines_out.append(json.dumps(obj))
        except Exception:
            pass  # skip malformed lines

    if not lines_out:
        return {"ingested": 0, "message": "No valid JSONL lines found"}

    existing = _download(supabase, TRAINING_BUCKET, TRAINING_PATH)
    appended = existing + ("\n".join(lines_out) + "\n").encode()
    _upload(supabase, TRAINING_BUCKET, TRAINING_PATH, appended)

    return {"ingested": len(lines_out), "source": source, "filename": file.filename}
