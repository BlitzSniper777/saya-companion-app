from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import EmailStr
from typing import Optional
from datetime import datetime, timezone

from database import get_supabase
from routers.auth import get_current_user
from config import settings
from models import (
    CheckoutRequest, PortalRequest, SubscriptionResponse, PlanInfo,
    PlanEnum, SubscriptionStatusEnum
)
from billing.stripe import create_checkout_session, create_portal_session, handle_stripe_webhook

router = APIRouter(prefix="/billing", tags=["billing"])

# Plans config (matching subscription.py)
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
            "Standard gift store ($1\u2013$10,000)",
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


@router.post("/checkout")
async def billing_checkout(
    request: CheckoutRequest,
    current_user: dict = Depends(get_current_user),
):
    """Create Stripe checkout session for subscription upgrade."""
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=503, detail="Billing not configured")

    plan_info = PLANS.get(request.plan)
    if not plan_info:
        raise HTTPException(status_code=400, detail="Invalid plan")

    if request.plan == PlanEnum.free:
        raise HTTPException(status_code=400, detail="Cannot upgrade to free plan")

    # Adult add-on requires existing GF/BF plan; adult_bundle is standalone
    if request.plan == PlanEnum.adult:
        from database import get_supabase
        sb = get_supabase()
        sub = sb.table("subscriptions").select("plan").eq("user_id", current_user["id"]).single().execute()
        if not sub.data or sub.data["plan"] not in ("gfbf",):
            raise HTTPException(status_code=403, detail="Adult add-on requires GF/BF plan")

    try:
        session = await create_checkout_session(
            user_id=current_user["id"],
            user_email=current_user["email"],
            plan=request.plan,
            interval=request.interval,
            success_url=request.success_url or f"{settings.FRONTEND_URL}/subscription?success=true",
            cancel_url=request.cancel_url or f"{settings.FRONTEND_URL}/subscription?canceled=true",
        )
        return {"checkout_url": session.url, "session_id": session.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Checkout failed: {str(e)}")


@router.post("/portal")
async def billing_portal(
    request: PortalRequest,
    current_user: dict = Depends(get_current_user),
):
    """Create Stripe billing portal session."""
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=503, detail="Billing not configured")

    from database import get_supabase
    sb = get_supabase()
    sub = sb.table("subscriptions").select("*").eq("user_id", current_user["id"]).single().execute()

    if not sub.data or not sub.data["stripe_customer_id"]:
        raise HTTPException(status_code=400, detail="No Stripe customer found")

    try:
        session = await create_portal_session(
            customer_id=sub.data["stripe_customer_id"],
            return_url=request.return_url or f"{settings.FRONTEND_URL}/subscription",
        )
        return {"portal_url": session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Portal failed: {str(e)}")


@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks."""
    if not settings.STRIPE_SECRET_KEY or not settings.STRIPE_WEBHOOK_SECRET:
        return {"status": "ignored", "reason": "Stripe not configured"}

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing stripe-signature header")

    try:
        result = await handle_stripe_webhook(payload, sig_header)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Webhook handling failed: {str(e)}")