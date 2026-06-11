import stripe
from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID
from datetime import datetime, timezone
from typing import Optional

from database import get_supabase
from auth import get_current_user
from config import settings
from models import (
    UserResponse, SubscriptionResponse, PlanInfo, CheckoutRequest, PortalRequest,
    PlanEnum, SubscriptionStatusEnum
)

router = APIRouter()


PLANS = {
    PlanEnum.free: PlanInfo(
        id="free",
        name="Free",
        price_monthly=0,
        price_yearly=0,
        features=[
            "15 messages per day",
            "7-day memory window",
            "Friend mode only",
            "Crisis support always on",
            "Symbolic gift back",
            "Basic room decoration",
        ],
        message_limit=15,
        memory_days=7,
        modes=["friend"],
    ),
    PlanEnum.companion: PlanInfo(
        id="companion",
        name="Companion",
        price_monthly=9.99,
        price_yearly=84.99,
        price_lifetime=299,
        features=[
            "Unlimited messages",
            "Permanent 4-layer memory",
            "Daily morning outreach from Saya",
            "Proactive follow-ups",
            "Sleep companion mode",
            "Co-written stories",
            "Personality quizzes + games",
            "Language tutoring",
            "Journaling prompts",
            "Photo reactions",
            "Life goals tracker",
            "Mood timeline (emotional pattern chart)",
            "Wisdom storytelling",
            "Milestone memory",
            "Standard gift store ($1–$10,000)",
        ],
        message_limit=-1,
        memory_days=-1,
        modes=["friend", "therapist", "life_coach", "custom"],
    ),
    PlanEnum.gfbf: PlanInfo(
        id="gfbf",
        name="GF/BF Companion",
        price_monthly=12.99,
        price_yearly=119.99,
        price_lifetime=449.99,
        features=[
            "Everything in Companion tier",
            "Romantic companion mode (logged consent)",
            "Voice messages (async)",
            "Voice calls (credit-based)",
            "Romantic gift store",
        ],
        message_limit=-1,
        memory_days=-1,
        modes=["friend", "therapist", "life_coach", "romantic_partner", "custom"],
        voice_calls=True,
    ),
    PlanEnum.adult: PlanInfo(
        id="adult",
        name="Adult Add-on",
        price_monthly=5.99,
        price_yearly=53.99,
        price_lifetime=169.99,
        features=[
            "Add-on for GF/BF tier only",
            "Requires age verification (18+)",
            "Separate ToS (timestamped)",
            "Adult chat mode",
            "Spicy gift store",
        ],
        message_limit=-1,
        memory_days=-1,
        modes=["friend", "therapist", "life_coach", "romantic_partner", "custom", "adult"],
        adult_content=True,
    ),
    PlanEnum.adult_bundle: PlanInfo(
        id="adult_bundle",
        name="Adult Bundle",
        price_monthly=17.99,
        price_yearly=159.99,
        price_lifetime=549.99,
        features=[
            "Everything in GF/BF Companion",
            "Adult chat mode — no add-on required",
            "Requires age verification (18+)",
            "Separate ToS (timestamped)",
            "Voice messages (async)",
            "Voice calls (credit-based)",
            "Full romantic + spicy gift store",
        ],
        message_limit=-1,
        memory_days=-1,
        modes=["friend", "therapist", "life_coach", "romantic_partner", "custom", "adult"],
        voice_calls=True,
        adult_content=True,
    ),
}


@router.get("", response_model=SubscriptionResponse)
async def get_subscription(user: UserResponse = Depends(get_current_user)):
    sb = get_supabase()
    result = sb.table("subscriptions").select("*").eq("user_id", str(user["id"])).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return SubscriptionResponse(**result.data)


@router.get("/plans")
async def get_plans():
    return {"plans": [plan.model_dump() for plan in PLANS.values()]}


@router.post("/upgrade")
async def upgrade_subscription(data: CheckoutRequest, user: UserResponse = Depends(get_current_user)):
    """Create Stripe checkout session for subscription upgrade."""
    from billing.stripe import create_checkout_session
    
    plan_info = PLANS.get(data.plan)
    if not plan_info:
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    if data.plan == PlanEnum.free:
        raise HTTPException(status_code=400, detail="Cannot upgrade to free plan")
    
    session = await create_checkout_session(
        user_id=user["id"],
        user_email=user["email"],
        plan=data.plan,
        interval=data.interval,
        success_url=data.success_url or f"{settings.FRONTEND_URL}/subscription?success=true",
        cancel_url=data.cancel_url or f"{settings.FRONTEND_URL}/subscription?canceled=true",
    )
    
    return {"checkout_url": session.url, "session_id": session.id}


@router.post("/portal")
async def billing_portal(data: PortalRequest, user: UserResponse = Depends(get_current_user)):
    """Create Stripe billing portal session."""
    from billing.stripe import create_portal_session
    
    sb = get_supabase()
    sub = sb.table("subscriptions").select("*").eq("user_id", str(user["id"])).single().execute()
    
    if not sub.data or not sub.data["stripe_customer_id"]:
        raise HTTPException(status_code=400, detail="No Stripe customer found")
    
    session = await create_portal_session(
        customer_id=sub.data["stripe_customer_id"],
        return_url=data.return_url or f"{settings.FRONTEND_URL}/subscription",
    )
    
    return {"portal_url": session.url}


# Import here to avoid circular import
from models import UserResponse