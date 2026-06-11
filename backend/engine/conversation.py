import json
import uuid
import re
from datetime import datetime, timezone
from typing import List, Dict, Any, AsyncGenerator
from supabase import Client

from config import settings
from database import get_supabase
from models import ChatRequest, ChatChunk
try:
    from memory.chromadb import get_user_memories, store_conversation_turn
except Exception:
    async def get_user_memories(*a, **kw): return []
    async def store_conversation_turn(*a, **kw): pass
from engine.prompt_builder import build_system_prompt
from nous_auth import get_nous_token
import httpx

router = None  # Will be set in main.py


def _parse_dt(value) -> datetime:
    """Parse a datetime string from Supabase, tolerating any microsecond precision."""
    if isinstance(value, datetime):
        return value
    s = str(value).replace("Z", "+00:00")
    # Normalise fractional seconds to exactly 6 digits so Python 3.10 fromisoformat works
    s = re.sub(r'(\.\d+)', lambda m: m.group(1).ljust(7, '0')[:7], s)
    return datetime.fromisoformat(s)


async def handle_chat_stream(
    request: ChatRequest,
    current_user: dict,
    supabase: Client
) -> AsyncGenerator[str, None]:
    """Handle the chat SSE stream."""
    try:
        user_id = current_user["id"]
        conversation_id = request.conversation_id

        # Check message limit for free tier
        try:
            sub_result = supabase.table("subscriptions").select("*").eq("user_id", user_id).single().execute()
            subscription = sub_result.data if sub_result.data else None
        except Exception:
            subscription = None

        if subscription and subscription["plan"] == "free":
            # Check if daily reset needed
            reset_at = subscription.get("daily_message_reset_at")
            if reset_at:
                try:
                    reset_at = _parse_dt(reset_at)
                    if reset_at.tzinfo is None:
                        reset_at = reset_at.replace(tzinfo=timezone.utc)
                except Exception:
                    reset_at = None
            if reset_at and reset_at < datetime.now(timezone.utc):
                    subscription["daily_message_count"] = 0
                    supabase.table("subscriptions").update({
                        "daily_message_count": 0,
                        "daily_message_reset_at": datetime.now(timezone.utc).isoformat()
                    }).eq("user_id", user_id).execute()

            if subscription["daily_message_count"] >= subscription["daily_message_limit"]:
                yield f"data: {json.dumps({'type': 'error', 'error': 'Daily message limit reached. Upgrade for unlimited messages.'})}\n\n"
                return

        # Get conversation history (last 20 messages)
        try:
            history_result = supabase.table("messages").select("*").eq("conversation_id", str(conversation_id)).order("created_at", desc=True).limit(20).execute()
            history = list(reversed(history_result.data)) if history_result.data else []
        except Exception:
            history = []

        # Get companion info
        try:
            comp_result = supabase.table("companions").select("*").eq("user_id", user_id).single().execute()
            companion = comp_result.data if comp_result.data else {}
        except Exception:
            companion = {}

        # Get user preferences
        user_prefs = current_user.get("user_preferences", {})

        # Retrieve relevant memories (top 5)
        try:
            memories = await get_user_memories(user_id, request.message, limit=5)
        except Exception:
            memories = []

        # Build system prompt — pass subscription so tier-specific persona is applied
        system_prompt = build_system_prompt(
            companion=companion,
            user_preferences=user_prefs,
            memories=memories,
            user_id=user_id,
            subscription=subscription,
        )

        # Build messages for Nous Portal
        messages = [{"role": "system", "content": system_prompt}]

        # Add history
        for msg in history:
            messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })

        # Add current user message
        messages.append({"role": "user", "content": request.message})

        # Call Nous Portal
        message_id = str(uuid.uuid4())
        full_response = ""

    except Exception as setup_err:
        yield f"data: {json.dumps({'type': 'error', 'error': f'Setup error: {setup_err}'})}\n\n"
        return

    try:
        token = get_nous_token()
        async with httpx.AsyncClient(
            base_url=settings.NOUS_INFERENCE_URL,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            timeout=60.0
        ) as client:
            async with client.stream(
                "POST",
                "/chat/completions",
                json={
                    "model": settings.NOUS_MODEL,
                    "messages": messages,
                    "stream": True,
                    "temperature": 0.8,
                    "max_tokens": 600,
                }
            ) as response:
                if response.status_code != 200:
                    error_text = await response.aread()
                    yield f"data: {json.dumps({'type': 'error', 'error': f'Nous API error: {error_text.decode()}'})}\n\n"
                    return
                
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:]
                        if data_str.strip() == "[DONE]":
                            break
                        try:
                            chunk = json.loads(data_str)
                            if "choices" in chunk and chunk["choices"]:
                                delta = chunk["choices"][0].get("delta", {})
                                content = delta.get("content", "")
                                if content:
                                    full_response += content
                                    yield f"data: {json.dumps({'type': 'chunk', 'content': content})}\n\n"
                        except json.JSONDecodeError:
                            continue
    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
        return
    
    # Check for crisis keywords
    crisis_keywords = settings.CRISIS_KEYWORDS
    user_message_lower = request.message.lower()
    assistant_response_lower = full_response.lower()
    
    crisis_detected = any(kw in user_message_lower for kw in crisis_keywords)
    
    if crisis_detected:
        severity = "high"
        resources = [
            {"name": "Crisis Text Line (US)", "contact": "Text HOME to 741741", "url": "https://www.crisistextline.org/"},
            {"name": "Samaritans (UK)", "contact": "116 123", "url": "https://www.samaritans.org/"},
            {"name": "Beyond Blue (AU)", "contact": "1300 22 4636", "url": "https://www.beyondblue.org.au/"},
            {"name": "International Suicide Prevention", "contact": "https://www.iasp.info/resources/Crisis_Centres/", "url": "https://www.iasp.info/resources/Crisis_Centres/"},
        ]
        
        # Log crisis event
        crisis_data = {
            "user_id": user_id,
            "message_content": request.message,
            "severity": severity,
            "resources_shown": [r["contact"] for r in resources],
        }
        supabase.table("crisis_events").insert(crisis_data).execute()
        
        yield f"data: {json.dumps({'type': 'crisis', 'resources': resources})}\n\n"
    
    # Save user message
    user_msg_data = {
        "conversation_id": str(conversation_id),
        "user_id": user_id,
        "role": "user",
        "content": request.message,
        "emotion_tags": [],  # TODO: extract emotion
        "topic_tags": [],    # TODO: extract topics
        "token_count": len(request.message) // 4,
    }
    supabase.table("messages").insert(user_msg_data).execute()
    
    # Save assistant message
    assistant_msg_data = {
        "conversation_id": str(conversation_id),
        "user_id": user_id,
        "role": "assistant",
        "content": full_response,
        "emotion_tags": [],
        "topic_tags": [],
        "token_count": len(full_response) // 4,
        "metadata": {"model": settings.NOUS_MODEL},
    }
    msg_result = supabase.table("messages").insert(assistant_msg_data).execute()
    saved_msg_id = msg_result.data[0]["id"] if msg_result.data else message_id
    
    # Update conversation last_message_at and title if first message
    supabase.table("conversations").update({
        "last_message_at": datetime.now(timezone.utc).isoformat(),
        "title": request.message[:50] if not history else None
    }).eq("id", str(conversation_id)).execute()
    
    # Update subscription message count
    if subscription and subscription["plan"] == "free":
        supabase.table("subscriptions").update({
            "daily_message_count": subscription["daily_message_count"] + 1
        }).eq("user_id", user_id).execute()
    
    # Update streak
    await update_streak(user_id, supabase)
    
    # Store in ChromaDB memory
    await store_conversation_turn(user_id, request.message, full_response)
    
    # Yield complete
    yield f"data: {json.dumps({'type': 'complete', 'message_id': saved_msg_id, 'conversation_id': str(conversation_id)})}\n\n"


async def update_streak(user_id: str, supabase: Client):
    """Update user's conversation streak."""
    sub_result = supabase.table("subscriptions").select("streak_count, last_chat_at").eq("user_id", user_id).single().execute()
    if not sub_result.data:
        return
    
    sub = sub_result.data
    streak = sub.get("streak_count", 0)
    last_chat = sub.get("last_chat_at")
    
    now = datetime.now(timezone.utc)
    today = now.date()
    
    if last_chat:
        try:
            last_chat = _parse_dt(last_chat)
            if last_chat.tzinfo is None:
                last_chat = last_chat.replace(tzinfo=timezone.utc)
        except Exception:
            last_chat = None
    if last_chat:
        last_date = last_chat.date()
        
        if last_date == today:
            return  # Already counted today
        elif (today - last_date).days == 1:
            streak += 1
        else:
            streak = 1
    else:
        streak = 1
    
    supabase.table("subscriptions").update({
        "streak_count": streak,
        "last_chat_at": now.isoformat()
    }).eq("user_id", user_id).execute()