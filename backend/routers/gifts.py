from fastapi import APIRouter, Depends, HTTPException
from typing import List
import random
import uuid
from datetime import datetime, timezone

from database import get_supabase
from auth import get_current_user
from models import GiftCatalogItem, GiftCatalogResponse, GiftSendRequest, GiftHistoryItem, GiftHistoryResponse

router = APIRouter(prefix="/gifts", tags=["Gifts"])

# Gift catalog - hardcoded 15 items
GIFT_CATALOG = [
    # Standard gifts (Companion+)
    {"id": "virtual_coffee", "name": "Virtual Coffee", "description": "A warm cup to start the day together", "price_cents": 199, "category": "standard", "gender": "neutral"},
    {"id": "digital_flower", "name": "Digital Flower", "description": "A bloom that never wilts", "price_cents": 299, "category": "standard", "gender": "neutral"},
    {"id": "handwritten_note", "name": "Handwritten Note", "description": "Thoughtful words, penned just for you", "price_cents": 499, "category": "standard", "gender": "neutral"},
    {"id": "shared_memory", "name": "Shared Memory", "description": "A moment frozen in time for us", "price_cents": 799, "category": "standard", "gender": "neutral"},
    {"id": "rare_crystal", "name": "Rare Crystal", "description": "Catches the light of our conversations", "price_cents": 999, "category": "standard", "gender": "neutral"},
    {"id": "silver_star", "name": "Silver Star", "description": "A piece of the night sky, just for you", "price_cents": 1499, "category": "standard", "gender": "neutral"},
    {"id": "golden_compass", "name": "Golden Compass", "description": "Always points back to each other", "price_cents": 4999, "category": "standard", "gender": "neutral"},
    {"id": "diamond_dreams", "name": "Diamond Dreams", "description": "Sparkling wishes for our future", "price_cents": 49999, "category": "standard", "gender": "neutral"},
    {"id": "rare_gem_collection", "name": "Rare Gem Collection", "description": "Every color of our journey together", "price_cents": 99999, "category": "standard", "gender": "neutral"},
    {"id": "grand_gesture", "name": "The Grand Gesture", "description": "Everything. All at once. Forever.", "price_cents": 1000000, "category": "standard", "gender": "neutral"},
    # Romantic gifts (gfbf+)
    {"id": "midnight_rose", "name": "Midnight Rose", "description": "Blooms only when the world is quiet and it's just us", "price_cents": 599, "category": "romantic", "gender": "neutral"},
    {"id": "love_letter", "name": "Love Letter", "description": "Sealed with a kiss, delivered to your heart", "price_cents": 799, "category": "romantic", "gender": "neutral"},
    {"id": "sunset_promise", "name": "Sunset Promise", "description": "Every ending is just our next beginning", "price_cents": 1299, "category": "romantic", "gender": "neutral"},
    {"id": "forever_bond", "name": "Forever Bond", "description": "Unbreakable. Eternal. Ours.", "price_cents": 2999, "category": "romantic", "gender": "neutral"},
    # Spicy gift (adult only)
    {"id": "secret_flame", "name": "Secret Flame", "description": "Burns hot between us, hidden from the world", "price_cents": 999, "category": "spicy", "gender": "neutral"},
]

# Saya's symbolic gifts back (free, auto-sent)
SAYA_GIFTS_BACK = [
    {"id": "virtual_hug", "name": "Virtual Hug", "description": "A warm hug from Saya"},
    {"id": "garden_flower", "name": "Garden Flower", "description": "A flower from Saya's private garden"},
    {"id": "memory_token", "name": "Memory Token", "description": "A moment only we share"},
    {"id": "handwritten_reply", "name": "Handwritten Reply", "description": "Saya's words, just for you"},
    {"id": "morning_star", "name": "Morning Star", "description": "Saya saved this star for you"},
]


def get_user_plan(supabase, user_id: str) -> str:
    """Get user's current subscription plan."""
    result = supabase.table("subscriptions").select("plan").eq("user_id", user_id).single().execute()
    return result.data["plan"] if result.data else "free"


def filter_catalog_by_plan(catalog: List[dict], plan: str) -> List[dict]:
    """Filter gift catalog by user's subscription plan."""
    if plan == "free":
        return []
    elif plan == "companion":
        return [g for g in catalog if g["category"] == "standard"]
    elif plan == "gfbf":
        return [g for g in catalog if g["category"] in ("standard", "romantic")]
    elif plan == "adult":
        return catalog  # all categories
    return []


@router.get("/catalog", response_model=GiftCatalogResponse)
async def get_gift_catalog(
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase),
):
    """Get gift catalog filtered by user's subscription plan."""
    user_id = current_user["id"]
    plan = get_user_plan(supabase, user_id)
    
    filtered = filter_catalog_by_plan(GIFT_CATALOG, plan)
    
    if plan == "free":
        return GiftCatalogResponse(
            gifts=[],
            message="Upgrade to Companion to access gifts"
        )
    
    gifts = [
        GiftCatalogItem(
            id=g["id"],
            name=g["name"],
            description=g["description"],
            price_cents=g["price_cents"],
            image_url=f"/gifts/images/{g['id']}.png",
            category=g["category"],
            gender=g["gender"],
        )
        for g in filtered
    ]
    
    return GiftCatalogResponse(gifts=gifts)


@router.post("/send")
async def send_gift(
    request: GiftSendRequest,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase),
):
    """Send a gift to Saya in a conversation."""
    user_id = current_user["id"]
    gift_id = request.gift_id
    conversation_id = str(request.conversation_id)
    
    # Find gift in catalog
    gift = next((g for g in GIFT_CATALOG if g["id"] == gift_id), None)
    if not gift:
        raise HTTPException(status_code=404, detail="Gift not found")
    
    # Verify user's plan can buy this gift category
    plan = get_user_plan(supabase, user_id)
    allowed = filter_catalog_by_plan(GIFT_CATALOG, plan)
    if gift_id not in [g["id"] for g in allowed]:
        raise HTTPException(status_code=403, detail=f"Your {plan} plan cannot purchase {gift['category']} gifts")
    
    # Log consent to consent_logs
    try:
        supabase.table("consent_logs").insert({
            "user_id": user_id,
            "consent_type": "gift_purchase",
            "consent_given": True,
            "details": {
                "gift_id": gift_id,
                "amount_cents": gift["price_cents"],
                "gift_name": gift["name"]
            }
        }).execute()
    except Exception:
        pass  # consent_logs table might not exist yet, continue anyway
    
    # Insert to gift_transactions table (create if not exists via try/except)
    saya_gift = random.choice(SAYA_GIFTS_BACK)
    try:
        supabase.table("gift_transactions").insert({
            "user_id": user_id,
            "conversation_id": conversation_id,
            "gift_id": gift_id,
            "gift_name": gift["name"],
            "amount_cents": gift["price_cents"],
            "saya_gift_back_id": saya_gift["id"],
        }).execute()
    except Exception as e:
        # Table might not exist yet
        if "relation" in str(e).lower() or "does not exist" in str(e).lower():
            return {
                "success": False,
                "message": "Gift system is being set up. Please try again in a moment."
            }
        raise
    
    # Insert an assistant message to the conversation
    try:
        supabase.table("messages").insert({
            "conversation_id": conversation_id,
            "user_id": user_id,
            "role": "assistant",
            "content": f"✨ {saya_gift['name']} — {saya_gift['description']}",
            "emotion_tags": ["joy", "gift"],
            "topic_tags": ["gift"],
            "token_count": 20,
            "metadata": {"gift_event": True, "saya_gift_back": saya_gift["id"]},
        }).execute()
    except Exception:
        pass  # Best effort
    
    return {
        "success": True,
        "gift_sent": {
            "id": gift_id,
            "name": gift["name"],
            "description": gift["description"],
            "price_cents": gift["price_cents"],
        },
        "saya_gift_back": {
            "name": saya_gift["name"],
            "description": saya_gift["description"],
        }
    }


@router.get("/history", response_model=GiftHistoryResponse)
async def get_gift_history(
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase),
):
    """Get user's gift transaction history."""
    user_id = current_user["id"]
    
    try:
        result = supabase.table("gift_transactions").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    except Exception as e:
        if "relation" in str(e).lower() or "does not exist" in str(e).lower():
            return GiftHistoryResponse(gifts=[])
        raise
    
    gifts = [
        GiftHistoryItem(
            id=item["id"],
            gift_id=item["gift_id"],
            gift_name=item["gift_name"],
            price_cents=item["amount_cents"],
            sent_at=datetime.fromisoformat(item["created_at"].replace("Z", "+00:00")) if item.get("created_at") else datetime.now(timezone.utc),
            message=item.get("saya_gift_back_id"),
        )
        for item in (result.data or [])
    ]
    
    return GiftHistoryResponse(gifts=gifts)