from fastapi import APIRouter, Depends
from database import get_supabase
from auth import get_current_user
from affection_system import build_affection_response

router = APIRouter(prefix="/affection", tags=["Affection"])


def get_or_create_affection(supabase, user_id: str) -> dict:
    result = supabase.table("user_affection").select("*").eq("user_id", user_id).execute()
    if result.data:
        return result.data[0]
    supabase.table("user_affection").insert({"user_id": user_id, "points": 0, "level": 1}).execute()
    return {"user_id": user_id, "points": 0, "level": 1}


@router.get("")
async def get_affection(
    current_user: dict = Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    row = get_or_create_affection(supabase, current_user["id"])
    return build_affection_response(row["points"])


@router.get("/leaderboard")
async def get_leaderboard(
    current_user: dict = Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    result = supabase.table("user_affection").select("user_id, points, level").order("points", desc=True).limit(10).execute()
    entries = []
    for i, row in enumerate(result.data or []):
        user_result = supabase.table("users").select("full_name, email").eq("id", row["user_id"]).execute()
        user = user_result.data[0] if user_result.data else {}
        name = user.get("full_name") or user.get("email", "Unknown")[:12]
        from affection_system import BADGES
        badge = None
        for lvl in sorted(BADGES.keys(), reverse=True):
            if row["level"] >= lvl:
                badge = BADGES[lvl]
                break
        entries.append({
            "rank": i + 1,
            "name": name,
            "level": row["level"],
            "points": row["points"],
            "badge": badge,
            "is_me": row["user_id"] == current_user["id"],
        })
    return {"leaderboard": entries}
