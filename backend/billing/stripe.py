import stripe
from config import settings
from typing import Optional, Any

# Initialize Stripe
if settings.STRIPE_SECRET_KEY:
    stripe.api_key = settings.STRIPE_SECRET_KEY
    _stripe_configured = True
else:
    print("[BILLING] WARNING: STRIPE_SECRET_KEY not set - Stripe features will be graceful no-ops")
    _stripe_configured = False


def _require_stripe():
    if not _stripe_configured:
        raise RuntimeError("Stripe not configured")


# Type stubs for when stripe is not configured
if _stripe_configured:
    CheckoutSession = stripe.checkout.Session
    BillingPortalSession = stripe.billing_portal.Session
else:
    CheckoutSession = Any  # type: ignore
    BillingPortalSession = Any  # type: ignore


async def create_checkout_session(
    user_id: str,
    user_email: str,
    plan: str,
    interval: str,
    success_url: str,
    cancel_url: str,
) -> "CheckoutSession":
    """Create a Stripe Checkout session for subscription upgrade."""
    if not settings.STRIPE_SECRET_KEY:
        raise RuntimeError("Stripe not configured")

    # Map plans to price IDs (these would be created in Stripe Dashboard)
    # For now, use inline price data
    price_data = {
        "companion": {
            "monthly": {"amount": 899, "currency": "usd", "recurring": {"interval": "month"}},
            "yearly": {"amount": 7999, "currency": "usd", "recurring": {"interval": "year"}},
            "lifetime": {"amount": 29900, "currency": "usd", "recurring": None},  # One-time
        },
        "gfbf": {
            "monthly": {"amount": 1299, "currency": "usd", "recurring": {"interval": "month"}},
            "yearly": {"amount": 11999, "currency": "usd", "recurring": {"interval": "year"}},
            "lifetime": {"amount": 44999, "currency": "usd", "recurring": None},
        },
        "adult_bundle": {
            "monthly": {"amount": 1799, "currency": "usd", "recurring": {"interval": "month"}},
            "yearly": {"amount": 15999, "currency": "usd", "recurring": {"interval": "year"}},
            "lifetime": {"amount": 54999, "currency": "usd", "recurring": None},
        },
    }

    plan_prices = price_data.get(plan, {}).get(interval)
    if not plan_prices:
        raise ValueError(f"Invalid plan/interval: {plan}/{interval}")

    # Create or get Stripe customer
    from database import get_supabase
    sb = get_supabase()
    sub_result = sb.table("subscriptions").select("stripe_customer_id").eq("user_id", user_id).single().execute()
    stripe_customer_id = sub_result.data.get("stripe_customer_id") if sub_result.data else None

    if not stripe_customer_id:
        customer = stripe.Customer.create(email=user_email, metadata={"user_id": user_id})
        stripe_customer_id = customer.id
        sb.table("subscriptions").update({"stripe_customer_id": stripe_customer_id}).eq("user_id", user_id).execute()

    # Create checkout session
    session_params = {
        "customer": stripe_customer_id,
        "payment_method_types": ["card"],
        "mode": "subscription" if plan_prices["recurring"] else "payment",
        "success_url": success_url,
        "cancel_url": cancel_url,
        "metadata": {"user_id": user_id, "plan": plan, "interval": interval},
    }

    if plan_prices["recurring"]:
        session_params["line_items"] = [{
            "price_data": {
                "currency": plan_prices["currency"],
                "recurring": plan_prices["recurring"],
                "unit_amount": plan_prices["amount"],
                "product_data": {"name": f"Saya {plan.title()} Plan"},
            },
            "quantity": 1,
        }]
    else:
        # Lifetime - one-time payment
        session_params["line_items"] = [{
            "price_data": {
                "currency": plan_prices["currency"],
                "unit_amount": plan_prices["amount"],
                "product_data": {"name": f"Saya {plan.title()} Lifetime"},
            },
            "quantity": 1,
        }]

    return stripe.checkout.Session.create(**session_params)


async def create_portal_session(
    customer_id: str,
    return_url: str,
) -> "BillingPortalSession":
    """Create a Stripe Billing Portal session."""
    _require_stripe()

    return stripe.billing_portal.Session.create(
        customer=customer_id,
        return_url=return_url,
    )


async def handle_stripe_webhook(payload: bytes, sig_header: str) -> dict:
    """Handle Stripe webhook events."""
    if not settings.STRIPE_SECRET_KEY or not settings.STRIPE_WEBHOOK_SECRET:
        return {"status": "ignored", "reason": "Stripe not configured"}

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise ValueError("Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise ValueError("Invalid signature")

    from database import get_supabase
    sb = get_supabase()

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session["metadata"].get("user_id")
        plan = session["metadata"].get("plan")
        interval = session["metadata"].get("interval")
        stripe_subscription_id = session.get("subscription")
        stripe_customer_id = session.get("customer")

        if user_id and plan:
            updates = {
                "plan": plan,
                "status": "active",
                "stripe_customer_id": stripe_customer_id,
            }
            if stripe_subscription_id:
                updates["stripe_subscription_id"] = stripe_subscription_id
            if interval == "yearly":
                from datetime import datetime, timedelta, timezone
                updates["current_period_end"] = (datetime.now(timezone.utc) + timedelta(days=365)).isoformat()
            elif interval == "monthly":
                from datetime import datetime, timedelta, timezone
                updates["current_period_end"] = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()

            # Set message limits based on plan
            if plan == "free":
                updates["daily_message_limit"] = 15
            elif plan in ["companion", "gfbf", "adult_bundle"]:
                updates["daily_message_limit"] = -1  # unlimited

            sb.table("subscriptions").update(updates).eq("user_id", user_id).execute()

    elif event["type"] in ["customer.subscription.updated", "customer.subscription.deleted"]:
        subscription = event["data"]["object"]
        stripe_customer_id = subscription.get("customer")
        stripe_subscription_id = subscription.get("id")
        status = subscription.get("status")
        current_period_end = subscription.get("current_period_end")

        # Find user by stripe customer id
        sub_result = sb.table("subscriptions").select("user_id").eq("stripe_customer_id", stripe_customer_id).single().execute()
        if sub_result.data:
            user_id = sub_result.data["user_id"]
            updates = {
                "stripe_subscription_id": stripe_subscription_id,
                "status": status,
            }
            if current_period_end:
                from datetime import datetime, timezone
                updates["current_period_end"] = datetime.fromtimestamp(current_period_end, tz=timezone.utc).isoformat()

            if status in ["canceled", "incomplete_expired"]:
                updates["plan"] = "free"
                updates["daily_message_limit"] = 15

            sb.table("subscriptions").update(updates).eq("user_id", user_id).execute()

    elif event["type"] == "invoice.payment_failed":
        invoice = event["data"]["object"]
        stripe_customer_id = invoice.get("customer")

        sub_result = sb.table("subscriptions").select("user_id").eq("stripe_customer_id", stripe_customer_id).single().execute()
        if sub_result.data:
            user_id = sub_result.data["user_id"]
            sb.table("subscriptions").update({"status": "past_due"}).eq("user_id", user_id).execute()

    return {"status": "handled", "event_type": event["type"]}