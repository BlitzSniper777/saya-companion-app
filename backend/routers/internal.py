from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from pydantic import BaseModel
from datetime import datetime, timezone
import uuid

from database import get_supabase
from routers.auth import get_current_user
from config import settings
from companions_catalog import COMPANIONS_BY_ID
from engine.prompt_builder import build_system_prompt
from nous_auth import get_nous_token

try:
    from memory.chromadb import get_user_memories, store_conversation_turn
except Exception:
    async def get_user_memories(*a, **kw): return []
    async def store_conversation_turn(*a, **kw): pass

router = APIRouter(prefix="/internal", tags=["internal"])


class ChatDataRequest(BaseModel):
    conversation_id: str
    message: str


class SaveMessagesRequest(BaseModel):
    conversation_id: str
    user_message: str
    assistant_message: str


def _parse_dt(value):
    import re
    if isinstance(value, datetime):
        return value
    s = str(value).replace("Z", "+00:00")
    s = re.sub(r'(\.\d+)', lambda m: m.group(1).ljust(7, '0')[:7], s)
    return datetime.fromisoformat(s)


@router.post("/chat-data")
async def get_chat_data(
    request: ChatDataRequest,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    """Prepare everything needed for the Nous API call. Does NOT call Nous."""
    user_id = current_user["id"]
    conversation_id = str(request.conversation_id)

    # Subscription
    try:
        sub_result = supabase.table("subscriptions").select("*").eq("user_id", user_id).single().execute()
        subscription = sub_result.data if sub_result.data else None
    except Exception:
        subscription = None

    # Trial expiry check
    if subscription and subscription.get("plan") == "free":
        trial_end = subscription.get("current_period_end")
        if trial_end:
            try:
                trial_end_dt = _parse_dt(trial_end)
                if trial_end_dt.tzinfo is None:
                    trial_end_dt = trial_end_dt.replace(tzinfo=timezone.utc)
                if datetime.now(timezone.utc) > trial_end_dt:
                    companion_id = (current_user.get("user_preferences") or {}).get("companion_id", "")
                    companion_name = COMPANIONS_BY_ID.get(companion_id, {}).get("name", "Saya")
                    raise HTTPException(
                        status_code=403,
                        detail=f"Your 7-day free trial has ended. Choose a plan to keep chatting with {companion_name}.",
                    )
            except HTTPException:
                raise
            except Exception:
                pass

    # Conversation history (last 20 messages)
    try:
        history_result = (
            supabase.table("messages")
            .select("*")
            .eq("conversation_id", conversation_id)
            .order("created_at", desc=True)
            .limit(20)
            .execute()
        )
        history = list(reversed(history_result.data)) if history_result.data else []
    except Exception:
        history = []

    # Companion info
    try:
        comp_result = supabase.table("companions").select("*").eq("user_id", user_id).single().execute()
        companion = comp_result.data if comp_result.data else {}
    except Exception:
        companion = {}

    user_prefs = current_user.get("user_preferences") or {}

    # Memories
    try:
        memories = await get_user_memories(user_id, request.message, limit=5)
    except Exception:
        memories = []

    # Cross-session memory fallback: pull key user messages from recent OTHER conversations
    if not memories:
        try:
            other_convs = (
                supabase.table("conversations")
                .select("id, title")
                .eq("user_id", user_id)
                .neq("id", conversation_id)
                .order("last_message_at", desc=True)
                .limit(4)
                .execute()
            )
            if other_convs.data:
                for conv in other_convs.data:
                    msgs = (
                        supabase.table("messages")
                        .select("role, content")
                        .eq("conversation_id", conv["id"])
                        .order("created_at", desc=False)
                        .limit(6)
                        .execute()
                    )
                    if msgs.data:
                        for m in msgs.data:
                            if m["role"] == "user" and len(m["content"].strip()) > 20:
                                memories.append({"content": m["content"][:250]})
                    if len(memories) >= 6:
                        break
        except Exception:
            pass

    # RAG knowledge
    knowledge = []
    try:
        kb_result = supabase.rpc(
            "search_knowledge", {"query_text": request.message, "match_limit": 2}
        ).execute()
        if kb_result.data:
            knowledge = kb_result.data
    except Exception:
        pass

    # Build system prompt
    system_prompt = build_system_prompt(
        companion=companion,
        user_preferences=user_prefs,
        memories=memories,
        user_id=user_id,
        subscription=subscription,
        knowledge=knowledge,
    )

    # Nous token
    try:
        nous_token = get_nous_token()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get Nous token: {e}")

    return {
        "system_prompt": system_prompt,
        "history": [{"role": m["role"], "content": m["content"]} for m in history],
        "nous_token": nous_token,
        "model": settings.NOUS_MODEL,
        "inference_url": settings.NOUS_INFERENCE_URL,
        "companion_name": companion.get("name", "Saya"),
        "user_id": user_id,
        "is_first_message": len(history) == 0,
    }


@router.post("/save-messages")
async def save_messages(
    request: SaveMessagesRequest,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    """Save user + assistant messages after streaming completes."""
    user_id = current_user["id"]
    conversation_id = str(request.conversation_id)

    # Is this the first message? (for conversation title)
    try:
        existing = (
            supabase.table("messages")
            .select("id")
            .eq("conversation_id", conversation_id)
            .limit(1)
            .execute()
        )
        is_first = not bool(existing.data)
    except Exception:
        is_first = False

    # Save user message
    try:
        supabase.table("messages").insert({
            "conversation_id": conversation_id,
            "user_id": user_id,
            "role": "user",
            "content": request.user_message,
            "emotion_tags": [],
            "topic_tags": [],
            "token_count": len(request.user_message) // 4,
        }).execute()
    except Exception:
        pass

    # Save assistant message
    message_id = str(uuid.uuid4())
    try:
        msg_result = supabase.table("messages").insert({
            "conversation_id": conversation_id,
            "user_id": user_id,
            "role": "assistant",
            "content": request.assistant_message,
            "emotion_tags": [],
            "topic_tags": [],
            "token_count": len(request.assistant_message) // 4,
            "metadata": {"model": settings.NOUS_MODEL},
        }).execute()
        if msg_result.data:
            message_id = msg_result.data[0]["id"]
    except Exception:
        pass

    # Update conversation
    try:
        update_data: dict = {"last_message_at": datetime.now(timezone.utc).isoformat()}
        if is_first:
            update_data["title"] = request.user_message[:50]
        supabase.table("conversations").update(update_data).eq("id", conversation_id).execute()
    except Exception:
        pass

    # Crisis logging
    try:
        if any(kw in request.user_message.lower() for kw in settings.CRISIS_KEYWORDS):
            supabase.table("crisis_events").insert({
                "user_id": user_id,
                "message_content": request.user_message,
                "severity": "high",
                "resources_shown": ["Text HOME to 741741", "116 123", "1300 22 4636"],
            }).execute()
    except Exception:
        pass

    # Streak update
    try:
        from engine.conversation import update_streak
        await update_streak(user_id, supabase)
    except Exception:
        pass

    # ChromaDB memory
    try:
        comp_id = (current_user.get("user_preferences") or {}).get("companion_id", "")
        await store_conversation_turn(
            user_id, request.user_message, request.assistant_message, companion_id=comp_id
        )
    except Exception:
        pass

    return {"success": True, "message_id": message_id}
