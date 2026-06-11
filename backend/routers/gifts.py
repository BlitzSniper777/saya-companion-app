from fastapi import APIRouter, Depends, HTTPException
from typing import List
import random
from datetime import datetime, timezone

from database import get_supabase
from auth import get_current_user
from models import GiftSendRequest, GiftHistoryResponse, GiftHistoryItem
from affection_system import level_from_points, build_affection_response
from routers.coins import get_or_create_coins

router = APIRouter(prefix="/gifts", tags=["Gifts"])

# ── Gift catalog ──────────────────────────────────────────────────────────────
# coin_price: coins needed to send | category gates subscription plan
GIFT_CATALOG = [
    # ── Standard: Tiny (1–20 coins) ──────────────────────────────────────────
    {"id": "rose",            "name": "Rose",           "description": "A gentle rose just for her",            "coin_price": 1,     "emoji": "🌹", "tier": "tiny",   "category": "standard"},
    {"id": "heart",           "name": "Heart",          "description": "A warm glowing heart",                  "coin_price": 1,     "emoji": "❤️", "tier": "tiny",   "category": "standard"},
    {"id": "shooting_star",   "name": "Shooting Star",  "description": "A wish sent just for her",              "coin_price": 2,     "emoji": "🌠", "tier": "tiny",   "category": "standard"},
    {"id": "virtual_hug",     "name": "Virtual Hug",    "description": "Warm arms across the screen",           "coin_price": 3,     "emoji": "🤗", "tier": "tiny",   "category": "standard"},
    {"id": "blown_kiss",      "name": "Blown Kiss",     "description": "A kiss she will never forget",          "coin_price": 5,     "emoji": "😘", "tier": "tiny",   "category": "standard"},
    {"id": "sunflower",       "name": "Sunflower",      "description": "Bright as your smile",                  "coin_price": 5,     "emoji": "🌻", "tier": "tiny",   "category": "standard"},
    {"id": "morning_coffee",  "name": "Morning Coffee", "description": "Start her day the right way",           "coin_price": 10,    "emoji": "☕", "tier": "tiny",   "category": "standard"},
    {"id": "goodnight_moon",  "name": "Goodnight Moon", "description": "Sweet dreams, always",                  "coin_price": 10,    "emoji": "🌙", "tier": "tiny",   "category": "standard"},
    {"id": "cake_slice",      "name": "Cake Slice",     "description": "A sweet treat just for her",            "coin_price": 15,    "emoji": "🍰", "tier": "tiny",   "category": "standard"},
    {"id": "love_song",       "name": "Love Song",      "description": "A melody composed for you two",         "coin_price": 20,    "emoji": "🎵", "tier": "tiny",   "category": "standard"},
    # ── Standard: Small (30–150 coins) ───────────────────────────────────────
    {"id": "teddy_bear",      "name": "Teddy Bear",     "description": "Soft and always there",                 "coin_price": 30,    "emoji": "🧸", "tier": "small",  "category": "standard"},
    {"id": "heart_balloon",   "name": "Heart Balloon",  "description": "Float away together",                   "coin_price": 50,    "emoji": "🎈", "tier": "small",  "category": "standard"},
    {"id": "flower_bouquet",  "name": "Bouquet",        "description": "A burst of colour for her",             "coin_price": 75,    "emoji": "💐", "tier": "small",  "category": "standard"},
    {"id": "love_letter",     "name": "Love Letter",    "description": "Words straight from the heart",         "coin_price": 99,    "emoji": "💌", "tier": "small",  "category": "standard"},
    {"id": "tiara",           "name": "Tiara",          "description": "Because she deserves a crown",          "coin_price": 100,   "emoji": "👑", "tier": "small",  "category": "standard"},
    {"id": "perfume_bottle",  "name": "Perfume",        "description": "Your scent she will always remember",   "coin_price": 120,   "emoji": "🌸", "tier": "small",  "category": "standard"},
    # ── Standard: Medium (200–1500 coins) ────────────────────────────────────
    {"id": "heart_explosion", "name": "Heart Explosion","description": "Hearts fill the entire screen",         "coin_price": 200,   "emoji": "💥", "tier": "medium", "category": "standard"},
    {"id": "angel_wings",     "name": "Angel Wings",    "description": "She is your guardian angel",            "coin_price": 299,   "emoji": "🕊️", "tier": "medium", "category": "standard"},
    {"id": "crystal_heart",   "name": "Crystal Heart",  "description": "Clear and pure — just like your love",  "coin_price": 499,   "emoji": "💎", "tier": "medium", "category": "standard"},
    {"id": "golden_bouquet",  "name": "Golden Bouquet", "description": "Roses dipped in gold for her",          "coin_price": 750,   "emoji": "🌷", "tier": "medium", "category": "standard"},
    {"id": "wish_lantern",    "name": "Wish Lantern",   "description": "Light up her night with a wish",        "coin_price": 999,   "emoji": "🏮", "tier": "medium", "category": "standard"},
    {"id": "enchanted_rose",  "name": "Enchanted Rose", "description": "Beauty that never fades",               "coin_price": 1200,  "emoji": "🌹", "tier": "medium", "category": "standard"},
    # ── Standard: Large (2000–9999 coins) ────────────────────────────────────
    {"id": "heart_cascade",   "name": "Heart Cascade",  "description": "A waterfall of hearts",                 "coin_price": 2000,  "emoji": "💞", "tier": "large",  "category": "standard"},
    {"id": "moonbeam",        "name": "Moonbeam",       "description": "Wrap her in soft moonlight",            "coin_price": 3000,  "emoji": "🌟", "tier": "large",  "category": "standard"},
    {"id": "diamond_dreams",  "name": "Diamond Dreams", "description": "Sparkling wishes for your future",      "coin_price": 5000,  "emoji": "✨", "tier": "large",  "category": "standard"},
    {"id": "fireworks_show",  "name": "Fireworks Show", "description": "Light up the sky just for her",         "coin_price": 7500,  "emoji": "🎆", "tier": "large",  "category": "standard"},
    # ── Standard: Epic (10000+) ───────────────────────────────────────────────
    {"id": "universe_gift",   "name": "The Universe",   "description": "Give her everything that exists",       "coin_price": 9999,  "emoji": "🌌", "tier": "epic",   "category": "standard"},
    {"id": "eternal_bond",    "name": "Eternal Bond",   "description": "A bond that transcends all time",       "coin_price": 14999, "emoji": "♾️", "tier": "epic",   "category": "standard"},
    # ── Romantic (GF/BF+) ────────────────────────────────────────────────────
    {"id": "starfall",        "name": "Starfall",       "description": "Stars rain down around her",            "coin_price": 149,   "emoji": "🌠", "tier": "small",  "category": "romantic"},
    {"id": "love_potion",     "name": "Love Potion",    "description": "One sip — completely enchanted",        "coin_price": 299,   "emoji": "🧪", "tier": "medium", "category": "romantic"},
    {"id": "heart_locket",    "name": "Heart Locket",   "description": "Keep her close, always",               "coin_price": 499,   "emoji": "🔐", "tier": "medium", "category": "romantic"},
    {"id": "midnight_kiss",   "name": "Midnight Kiss",  "description": "When the world sleeps, just you two",   "coin_price": 999,   "emoji": "💋", "tier": "medium", "category": "romantic"},
    {"id": "northern_lights", "name": "Northern Lights","description": "Dancing colours painted for you two",   "coin_price": 2499,  "emoji": "🌌", "tier": "large",  "category": "romantic"},
    {"id": "diamond_ring",    "name": "Diamond Ring",   "description": "A promise set in stone",               "coin_price": 4999,  "emoji": "💍", "tier": "large",  "category": "romantic"},
    # ── Spicy (Adult only) ────────────────────────────────────────────────────
    {"id": "fire_gift",       "name": "Fire",           "description": "You set her ablaze",                    "coin_price": 99,    "emoji": "🔥", "tier": "small",  "category": "spicy"},
    {"id": "hot_pepper",      "name": "Hot Pepper",     "description": "Turn up the heat between you",          "coin_price": 199,   "emoji": "🌶️", "tier": "small",  "category": "spicy"},
    {"id": "secret_whisper",  "name": "Secret Whisper", "description": "Only you two will ever know",           "coin_price": 499,   "emoji": "🤫", "tier": "medium", "category": "spicy"},
    {"id": "forbidden_fruit", "name": "Forbidden Fruit","description": "Sweet, dangerous, irresistible",        "coin_price": 999,   "emoji": "🍎", "tier": "medium", "category": "spicy"},
    {"id": "burning_desire",  "name": "Burning Desire", "description": "A flame no one can extinguish",         "coin_price": 2999,  "emoji": "💥", "tier": "large",  "category": "spicy"},
    {"id": "soul_storm",      "name": "Soul Storm",     "description": "The ultimate heat — beyond words",      "coin_price": 9999,  "emoji": "⚡", "tier": "epic",   "category": "spicy"},
]

PLAN_CATEGORIES = {
    "free":         [],
    "companion":    ["standard"],
    "gfbf":         ["standard", "romantic"],
    "adult_bundle": ["standard", "romantic", "spicy"],
}

SAYA_GIFTS_BACK = [
    "A warm hug from Saya",
    "A flower from Saya's secret garden",
    "A memory only we share",
    "Saya's words, written just for you",
    "A star Saya saved just for you",
]


def get_user_plan(supabase, user_id: str) -> str:
    result = supabase.table("subscriptions").select("plan").eq("user_id", user_id).single().execute()
    return result.data["plan"] if result.data else "free"


@router.get("/catalog")
async def get_gift_catalog(
    current_user: dict = Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    plan = get_user_plan(supabase, current_user["id"])
    allowed_cats = PLAN_CATEGORIES.get(plan, [])
    gifts = [g for g in GIFT_CATALOG if g["category"] in allowed_cats]
    return {"gifts": gifts, "plan": plan}


@router.post("/send")
async def send_gift(
    request: GiftSendRequest,
    current_user: dict = Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    uid = current_user["id"]
    gift = next((g for g in GIFT_CATALOG if g["id"] == request.gift_id), None)
    if not gift:
        raise HTTPException(status_code=404, detail="Gift not found")

    # Check plan allows this category
    plan = get_user_plan(supabase, uid)
    if gift["category"] not in PLAN_CATEGORIES.get(plan, []):
        raise HTTPException(status_code=403, detail=f"Your plan does not include {gift['category']} gifts")

    # Check coin balance
    coins_row = get_or_create_coins(supabase, uid)
    if coins_row["balance"] < gift["coin_price"]:
        raise HTTPException(
            status_code=402,
            detail=f"Not enough coins. Need {gift['coin_price']}, have {coins_row['balance']}."
        )

    # Deduct coins
    new_balance = coins_row["balance"] - gift["coin_price"]
    supabase.table("user_coins").upsert({"user_id": uid, "balance": new_balance}).execute()
    supabase.table("coin_transactions").insert({
        "user_id": uid,
        "amount": -gift["coin_price"],
        "type": "gift_send",
        "reference_id": gift["id"],
        "note": f"Sent gift: {gift['name']}",
    }).execute()

    # Record gift transaction
    saya_reply = random.choice(SAYA_GIFTS_BACK)
    conv_id = str(request.conversation_id)
    try:
        supabase.table("gift_transactions").insert({
            "user_id": uid,
            "conversation_id": conv_id,
            "gift_id": gift["id"],
            "gift_name": gift["name"],
            "amount_cents": gift["coin_price"],  # stored as coin_price for reference
            "saya_gift_back_id": "saya_reply",
        }).execute()
    except Exception:
        pass

    # Saya's reply message in conversation
    try:
        supabase.table("messages").insert({
            "conversation_id": conv_id,
            "user_id": uid,
            "role": "assistant",
            "content": f"✨ {gift['emoji']} You sent me **{gift['name']}**! {gift['description']}... {saya_reply}",
            "emotion_tags": ["joy", "gift"],
            "topic_tags": ["gift"],
            "token_count": 25,
            "metadata": {"gift_event": True, "gift_id": gift["id"]},
        }).execute()
    except Exception:
        pass

    # Award affection points (1 coin = 1 point)
    affection_data = None
    try:
        row = supabase.table("user_affection").select("points").eq("user_id", uid).execute()
        old_pts = row.data[0]["points"] if row.data else 0
        new_pts = old_pts + gift["coin_price"]
        new_level, _, _ = level_from_points(new_pts)
        if row.data:
            supabase.table("user_affection").update({"points": new_pts, "level": new_level}).eq("user_id", uid).execute()
        else:
            supabase.table("user_affection").insert({"user_id": uid, "points": new_pts, "level": new_level}).execute()
        affection_data = build_affection_response(new_pts)
    except Exception:
        pass

    return {
        "success": True,
        "coins_spent": gift["coin_price"],
        "coin_balance": new_balance,
        "gift_sent": gift,
        "saya_reply": saya_reply,
        "affection": affection_data,
    }


@router.get("/history")
async def get_gift_history(
    current_user: dict = Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    uid = current_user["id"]
    try:
        result = supabase.table("gift_transactions").select("*").eq("user_id", uid).order("created_at", desc=True).execute()
    except Exception as e:
        if "relation" in str(e).lower() or "does not exist" in str(e).lower():
            return {"gifts": []}
        raise
    return {"gifts": result.data or []}
