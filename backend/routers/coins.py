from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from database import get_supabase
from routers.auth import get_current_user

router = APIRouter(prefix="/coins", tags=["Coins"])

COIN_PACKS = [
    {"id": "starter", "coins": 100,   "price_cents": 99,    "label": "Starter",  "bonus_coins": 0,    "popular": False},
    {"id": "basic",   "coins": 550,   "price_cents": 499,   "label": "Basic",    "bonus_coins": 50,   "popular": False},
    {"id": "popular", "coins": 1200,  "price_cents": 999,   "label": "Popular",  "bonus_coins": 200,  "popular": True},
    {"id": "value",   "coins": 2600,  "price_cents": 1999,  "label": "Value",    "bonus_coins": 600,  "popular": False},
    {"id": "super",   "coins": 7000,  "price_cents": 4999,  "label": "Super",    "bonus_coins": 2000, "popular": False},
    {"id": "mega",    "coins": 15000, "price_cents": 9999,  "label": "Mega",     "bonus_coins": 5000, "popular": False},
]


def get_or_create_coins(supabase, user_id: str) -> dict:
    r = supabase.table("user_coins").select("*").eq("user_id", user_id).execute()
    if r.data:
        return r.data[0]
    row = {"user_id": user_id, "balance": 0, "total_purchased": 0}
    supabase.table("user_coins").insert(row).execute()
    return row


@router.get("")
async def get_coins(
    current_user: dict = Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    row = get_or_create_coins(supabase, current_user["id"])
    return {
        "balance": row["balance"],
        "total_purchased": row["total_purchased"],
        "packs": COIN_PACKS,
    }


class TopUpRequest(BaseModel):
    pack_id: str


@router.post("/topup")
async def top_up(
    req: TopUpRequest,
    current_user: dict = Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    pack = next((p for p in COIN_PACKS if p["id"] == req.pack_id), None)
    if not pack:
        raise HTTPException(status_code=400, detail="Invalid pack")

    uid = current_user["id"]
    row = get_or_create_coins(supabase, uid)
    new_balance = row["balance"] + pack["coins"]
    new_total = row["total_purchased"] + pack["coins"]

    supabase.table("user_coins").upsert({
        "user_id": uid,
        "balance": new_balance,
        "total_purchased": new_total,
    }).execute()

    supabase.table("coin_transactions").insert({
        "user_id": uid,
        "amount": pack["coins"],
        "type": "topup",
        "reference_id": req.pack_id,
        "note": f"{pack['label']} Pack — {pack['coins']} coins",
    }).execute()

    return {"success": True, "balance": new_balance, "coins_added": pack["coins"], "pack": pack}
