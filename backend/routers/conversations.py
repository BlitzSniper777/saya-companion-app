from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client
from datetime import datetime, timezone
from uuid import UUID
from typing import List, Optional

from database import get_supabase
from routers.auth import get_current_user
from models import (
    ConversationListResponse, ConversationCreate, ConversationResponse,
    MessageListResponse, MessageResponse
)

router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.get("", response_model=List[ConversationListResponse])
async def list_conversations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    user_id = current_user["id"]
    offset = (page - 1) * page_size
    
    # Get conversations with message count and last message preview
    result = supabase.table("conversations").select(
        "*, messages:messages(count), last_message:messages(content, created_at, role)"
    ).eq("user_id", user_id).order("last_message_at", desc=True).range(offset, offset + page_size - 1).execute()
    
    conversations = []
    for conv in result.data:
        # Get last message preview
        last_msg = None
        msg_result = supabase.table("messages").select("content, role").eq("conversation_id", conv["id"]).order("created_at", desc=True).limit(1).execute()
        if msg_result.data:
            last_msg = msg_result.data[0]["content"][:100]
            if msg_result.data[0]["role"] == "user":
                last_msg = f"You: {last_msg}"
            else:
                last_msg = f"Saya: {last_msg}"
        
        msg_count_result = supabase.table("messages").select("id", count="exact").eq("conversation_id", conv["id"]).execute()
        
        conversations.append(ConversationListResponse(
            **conv,
            message_count=msg_count_result.count or 0,
            last_message_preview=last_msg
        ))
    
    return conversations


@router.post("", response_model=ConversationResponse)
async def create_conversation(
    request: ConversationCreate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    conv_data = {
        "user_id": current_user["id"],
        "title": request.title or "New Conversation",
    }
    result = supabase.table("conversations").insert(conv_data).execute()
    conversation = result.data[0]
    
    return ConversationResponse(**conversation, messages=[])


@router.get("/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: UUID,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    # Verify ownership
    try:
        conv_result = supabase.table("conversations").select("*").eq("id", str(conversation_id)).eq("user_id", current_user["id"]).single().execute()
        if not conv_result.data:
            raise HTTPException(status_code=404, detail="Conversation not found")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Get messages
    msg_result = supabase.table("messages").select("*").eq("conversation_id", str(conversation_id)).order("created_at", desc=False).execute()

    messages = [MessageResponse(**msg) for msg in msg_result.data]

    return ConversationResponse(**conv_result.data, messages=messages)


@router.get("/{conversation_id}/messages", response_model=MessageListResponse)
async def get_conversation_messages(
    conversation_id: UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    # Verify ownership
    conv_result = supabase.table("conversations").select("id").eq("id", str(conversation_id)).eq("user_id", current_user["id"]).single().execute()
    if not conv_result.data:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    offset = (page - 1) * page_size
    result = supabase.table("messages").select("*").eq("conversation_id", str(conversation_id)).order("created_at", desc=True).range(offset, offset + page_size - 1).execute()
    
    messages = [MessageResponse(**msg) for msg in result.data]
    # Reverse to chronological order
    messages.reverse()
    
    return MessageListResponse(messages=messages, has_more=len(messages) == page_size)


@router.delete("/{conversation_id}")
async def delete_conversation(
    conversation_id: UUID,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    # Verify ownership
    conv_result = supabase.table("conversations").select("id").eq("id", str(conversation_id)).eq("user_id", current_user["id"]).single().execute()
    if not conv_result.data:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Delete (cascades to messages)
    supabase.table("conversations").delete().eq("id", str(conversation_id)).execute()
    
    return {"success": True, "message": "Conversation deleted"}