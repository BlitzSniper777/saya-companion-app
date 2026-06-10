from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client
from uuid import UUID
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any

from database import get_supabase
from routers.auth import get_current_user
from config import settings
from models import (
    AdminLoginRequest,
    AdminTokenResponse,
    AdminStatsResponse,
    AdminUserListResponse,
    AdminUserListItem,
    AdminUserDetailResponse,
    AdminMessageListResponse,
    AdminMessageListItem,
    AdminCrisisListResponse,
    AdminAnalyticsResponse,
    CrisisEventResponse,
    UserResponse,
    CompanionResponse,
    SubscriptionResponse,
)


router = APIRouter(prefix="/admin", tags=["admin"])


# Admin authentication - simple email/password check against settings
ADMIN_EMAIL = getattr(settings, "ADMIN_EMAIL", None)
ADMIN_PASSWORD_HASH = getattr(settings, "ADMIN_PASSWORD_HASH", None)


async def get_admin_user(
    credentials: dict = Depends(None),  # Will use custom auth
) -> dict:
    """Verify admin credentials. Uses ADMIN_EMAIL and ADMIN_PASSWORD_HASH from settings."""
    # This will be implemented in login endpoint
    pass


@router.post("/login", response_model=AdminTokenResponse)
async def admin_login(request: AdminLoginRequest):
    """Admin login - verifies against configured admin credentials."""
    if not ADMIN_EMAIL or not ADMIN_PASSWORD_HASH:
        raise HTTPException(status_code=503, detail="Admin not configured")
    
    if request.email != ADMIN_EMAIL:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password
    from auth import verify_password
    if not verify_password(request.password, ADMIN_PASSWORD_HASH):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create admin token (longer expiry)
    from auth import create_access_token
    token_data = {"sub": "admin", "email": ADMIN_EMAIL, "is_admin": True}
    access_token = create_access_token(token_data, expires_delta=timedelta(hours=24))
    
    return AdminTokenResponse(access_token=access_token)


# Admin auth dependency - checks if current user is admin
async def get_admin_current_user(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Verify the current user has admin privileges."""
    # Check if user is admin via email or role
    if current_user.get("email") != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    current_user: dict = Depends(get_admin_current_user),
    supabase: Client = Depends(get_supabase),
):
    """Get platform-wide statistics."""
    
    # Total users
    total_users = supabase.table("users").select("id", count="exact").execute().count or 0
    
    # Active today (users with messages in last 24h)
    from datetime import timedelta
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    active_today = supabase.table("messages").select("user_id", count="exact").gte("created_at", yesterday).execute().count or 0
    
    # Messages today
    messages_today = supabase.table("messages").select("id", count="exact").gte("created_at", yesterday).execute().count or 0
    
    # MRR from subscriptions
    subs_result = supabase.table("subscriptions").select("plan, status").eq("status", "active").execute()
    plan_prices = {
        "companion": 8.99,
        "gfbf": 12.99,
        "adult": 5.99,
    }
    mrr = sum(plan_prices.get(s["plan"], 0) for s in (subs_result.data or []) if s["status"] == "active")
    
    # Subscriptions by plan
    subs_by_plan: Dict[str, int] = {}
    for sub in (subs_result.data or []):
        subs_by_plan[sub["plan"]] = subs_by_plan.get(sub["plan"], 0) + 1
    
    return AdminStatsResponse(
        total_users=total_users,
        active_today=active_today,
        messages_today=messages_today,
        mrr=round(mrr, 2),
        subscriptions_by_plan=subs_by_plan,
    )


@router.get("/users", response_model=AdminUserListResponse)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    plan: Optional[str] = Query(None),
    current_user: dict = Depends(get_admin_current_user),
    supabase: Client = Depends(get_supabase),
):
    """List all users with pagination and filters."""
    offset = (page - 1) * page_size
    
    query = supabase.table("users").select(
        "id, email, full_name, created_at, last_login_at, is_active",
        count="exact"
    )
    
    if search:
        query = query.or_(f"email.ilike.%{search}%,full_name.ilike.%{search}%")
    
    # Get subscriptions for plan filter
    if plan:
        sub_ids = supabase.table("subscriptions").select("user_id").eq("plan", plan).execute()
        user_ids = [s["user_id"] for s in (sub_ids.data or [])]
        if user_ids:
            query = query.in_("id", user_ids)
        else:
            return AdminUserListResponse(users=[], total=0, page=page, page_size=page_size)
    
    query = query.order("created_at", desc=True).range(offset, offset + page_size - 1)
    result = query.execute()
    
    # Get message counts and plan for each user
    users = []
    for user in result.data:
        # Get today's message count
        msg_count = supabase.table("messages").select("id", count="exact").eq("user_id", user["id"]).gte("created_at", yesterday).execute().count or 0
        
        # Get current plan
        sub = supabase.table("subscriptions").select("plan").eq("user_id", user["id"]).single().execute()
        user_plan = sub.data["plan"] if sub.data else "free"
        
        users.append(AdminUserListItem(
            id=user["id"],
            email=user["email"],
            full_name=user.get("full_name"),
            plan=user_plan,
            messages_today=msg_count,
            last_active=user.get("last_login_at"),
            is_active=user.get("is_active", True),
            created_at=datetime.fromisoformat(user["created_at"].replace("Z", "+00:00")) if user.get("created_at") else datetime.now(timezone.utc),
        ))
    
    return AdminUserListResponse(
        users=users,
        total=result.count or 0,
        page=page,
        page_size=page_size,
    )


@router.get("/users/{user_id}", response_model=AdminUserDetailResponse)
async def get_user_detail(
    user_id: UUID,
    current_user: dict = Depends(get_admin_current_user),
    supabase: Client = Depends(get_supabase),
):
    """Get detailed user information for admin."""
    
    # Get user
    user_result = supabase.table("users").select("*").eq("id", str(user_id)).single().execute()
    if not user_result.data:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get companion
    comp_result = supabase.table("companions").select("*").eq("user_id", str(user_id)).single().execute()
    
    # Get subscription
    sub_result = supabase.table("subscriptions").select("*").eq("user_id", str(user_id)).single().execute()
    
    # Get conversation count
    conv_count = supabase.table("conversations").select("id", count="exact").eq("user_id", str(user_id)).execute().count or 0
    
    # Get crisis events
    crisis_result = supabase.table("crisis_events").select("*").eq("user_id", str(user_id)).order("created_at", desc=True).execute()
    crises = [CrisisEventResponse(**c) for c in (crisis_result.data or [])]
    
    # Get consent logs
    consent_result = supabase.table("consent_logs").select("*").eq("user_id", str(user_id)).order("created_at", desc=True).execute()
    consents = consent_result.data or []
    
    return AdminUserDetailResponse(
        user=UserResponse(**user_result.data),
        companion=CompanionResponse(**comp_result.data) if comp_result.data else None,
        subscription=SubscriptionResponse(**sub_result.data) if sub_result.data else None,
        conversation_count=conv_count,
        crisis_events=crises,
        consent_logs=consents,
    )


@router.get("/messages", response_model=AdminMessageListResponse)
async def list_all_messages(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    user_id: Optional[UUID] = Query(None),
    current_user: dict = Depends(get_admin_current_user),
    supabase: Client = Depends(get_supabase),
):
    """List all messages across platform (admin view)."""
    offset = (page - 1) * page_size
    
    query = supabase.table("messages").select(
        "id, conversation_id, user_id, role, content, emotion_tags, created_at",
        count="exact"
    )
    
    if user_id:
        query = query.eq("user_id", str(user_id))
    
    query = query.order("created_at", desc=True).range(offset, offset + page_size - 1)
    result = query.execute()
    
    # Enrich with user email
    messages = []
    for msg in result.data:
        user = supabase.table("users").select("email").eq("id", msg["user_id"]).single().execute()
        messages.append(AdminMessageListItem(
            id=msg["id"],
            conversation_id=msg["conversation_id"],
            user_email=user.data["email"] if user.data else "unknown",
            role=msg["role"],
            content=msg["content"][:500],
            emotion_tags=msg.get("emotion_tags", []),
            created_at=datetime.fromisoformat(msg["created_at"].replace("Z", "+00:00")) if msg.get("created_at") else datetime.now(timezone.utc),
        ))
    
    return AdminMessageListResponse(
        messages=messages,
        total=result.count or 0,
        page=page,
        page_size=page_size,
    )


@router.get("/crises", response_model=AdminCrisisListResponse)
async def list_crises(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    reviewed: Optional[bool] = Query(None),
    current_user: dict = Depends(get_admin_current_user),
    supabase: Client = Depends(get_supabase),
):
    """List all crisis events for admin review."""
    offset = (page - 1) * page_size
    
    query = supabase.table("crisis_events").select("*", count="exact")
    
    if reviewed is not None:
        query = query.eq("admin_reviewed", reviewed)
    
    query = query.order("created_at", desc=True).range(offset, offset + page_size - 1)
    result = query.execute()
    
    crises = [CrisisEventResponse(**c) for c in (result.data or [])]
    
    return AdminCrisisListResponse(
        crises=crises,
        total=result.count or 0,
        page=page,
        page_size=page_size,
    )


@router.post("/crises/{crisis_id}/review")
async def review_crisis(
    crisis_id: UUID,
    reviewed: bool = True,
    current_user: dict = Depends(get_admin_current_user),
    supabase: Client = Depends(get_supabase),
):
    """Mark crisis event as reviewed by admin."""
    result = supabase.table("crisis_events").update({
        "admin_reviewed": reviewed,
        "reviewed_at": datetime.now(timezone.utc).isoformat(),
        "reviewed_by": current_user.get("email", "admin"),
    }).eq("id", str(crisis_id)).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Crisis event not found")
    
    return {"success": True, "message": "Crisis event reviewed"}


@router.get("/analytics", response_model=AdminAnalyticsResponse)
async def get_analytics(
    days: int = Query(30, ge=1, le=365),
    current_user: dict = Depends(get_admin_current_user),
    supabase: Client = Depends(get_supabase),
):
    """Get platform analytics for admin dashboard."""
    from datetime import timedelta
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    start_iso = start_date.isoformat()
    
    # DAU (daily active users)
    dau_result = supabase.rpc("get_dau", {"start_date": start_iso, "end_days": days}).execute()
    dau = dau_result.data or []
    
    # WAU, MAU - simplified for now
    wau = []
    mau = []
    
    # Messages per day
    msg_result = supabase.table("messages").select("created_at").gte("created_at", start_iso).execute()
    msg_by_day: Dict[str, int] = {}
    for msg in (msg_result.data or []):
        day = msg["created_at"][:10]
        msg_by_day[day] = msg_by_day.get(day, 0) + 1
    messages_per_day = [{"date": k, "count": v} for k, v in sorted(msg_by_day.items())]
    
    # Emotion tags distribution
    emo_result = supabase.table("messages").select("emotion_tags").gte("created_at", start_iso).execute()
    emo_counts: Dict[str, int] = {}
    for msg in (emo_result.data or []):
        for tag in (msg.get("emotion_tags") or []):
            emo_counts[tag] = emo_counts.get(tag, 0) + 1
    emotion_tags = [{"tag": k, "count": v} for k, v in sorted(emo_counts.items(), key=lambda x: -x[1])]
    
    # Plan distribution
    sub_result = supabase.table("subscriptions").select("plan").execute()
    plan_dist: Dict[str, int] = {}
    for sub in (sub_result.data or []):
        plan_dist[sub["plan"]] = plan_dist.get(sub["plan"], 0) + 1
    plan_distribution = [{"plan": k, "count": v} for k, v in plan_dist.items()]
    
    # Avg session length (simplified - messages per conversation per day)
    conv_result = supabase.table("conversations").select("id, created_at").gte("created_at", start_iso).execute()
    total_convs = len(conv_result.data or [])
    total_msgs = len(msg_result.data or [])
    avg_session = total_msgs / total_convs if total_convs > 0 else 0
    
    return AdminAnalyticsResponse(
        dau=dau,
        wau=wau,
        mau=mau,
        messages_per_day=messages_per_day,
        emotion_tags=emotion_tags,
        plan_distribution=plan_distribution,
        avg_session_length=round(avg_session, 1),
    )