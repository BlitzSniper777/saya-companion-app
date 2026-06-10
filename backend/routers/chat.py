from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from supabase import Client
from uuid import UUID
import json

from database import get_supabase
from routers.auth import get_current_user
from models import ChatRequest
from engine.conversation import handle_chat_stream

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_class=StreamingResponse)
async def chat(
    request: ChatRequest,
    http_request: Request,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    # Verify conversation ownership
    conv_result = supabase.table("conversations").select("id").eq("id", str(request.conversation_id)).eq("user_id", current_user["id"]).single().execute()
    if not conv_result.data:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    async def event_generator():
        async for chunk in handle_chat_stream(request, current_user, supabase):
            yield chunk
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )