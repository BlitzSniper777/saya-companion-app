from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import time
from datetime import datetime, timezone

from config import settings
from database import get_supabase
from routers import auth, user, companion, conversations, chat, subscription, billing, admin, webhooks, gifts, voice, affection, coins


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print(f"[STARTUP] Saya Backend starting on port {settings.PORT}")
    print(f"[STARTUP] Supabase URL: {settings.SUPABASE_URL}")
    nous_url = getattr(settings, "NOUS_INFERENCE_URL", "https://inference-api.nousresearch.com/v1")
    print(f"[STARTUP] Nous Portal: {nous_url}")
    
    # Verify Supabase connection
    try:
        supabase = get_supabase()
        result = supabase.table("users").select("*", count="exact", head=True).execute()
        print(f"[STARTUP] Supabase connected - {result.count} users in database")
    except Exception as e:
        print(f"[STARTUP] WARNING: Supabase connection failed: {e}")
    
    # Verify Nous auth
    try:
        from nous_auth import get_nous_token
        token = get_nous_token()
        print(f"[STARTUP] Nous Portal auth verified (token length: {len(token)})")
    except Exception as e:
        print(f"[STARTUP] WARNING: Nous auth failed: {e}")
    
    # Seed default admin if none exists
    try:
        from auth import get_password_hash, verify_password
        sb = get_supabase()
        result = sb.table("admin_users").select("id").eq("email", settings.ADMIN_EMAIL).execute()
        if not result.data:
            sb.table("admin_users").insert({
                "email": settings.ADMIN_EMAIL,
                "password_hash": get_password_hash(settings.ADMIN_PASSWORD),
                "full_name": "Admin",
                "role": "superadmin"
            }).execute()
            print(f"[STARTUP] Admin seeded: {settings.ADMIN_EMAIL}")
    except Exception as e:
        print(f"[STARTUP] WARNING: Admin seed failed: {e}")
    
    yield
    
    # Shutdown
    print("[SHUTDOWN] Saya Backend shutting down")


app = FastAPI(
    title="Saya Companion API",
    description="Backend for Saya - Your genuine AI best friend",
    version="2.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Request timing middleware
@app.middleware("http")
async def add_timing_header(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = int((time.perf_counter() - start) * 1000)
    response.headers["X-Response-Time-Ms"] = str(duration_ms)
    return response


# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "2.0.3-build"
    }


# Include routers
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(companion.router)
app.include_router(conversations.router)
app.include_router(chat.router)
app.include_router(subscription.router, prefix="/subscription", tags=["Subscription"])
app.include_router(billing.router)
app.include_router(admin.router)
app.include_router(webhooks.router)
app.include_router(gifts.router)
app.include_router(voice.router)
app.include_router(affection.router)
app.include_router(coins.router)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"[ERROR] {request.method} {request.url}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc) if settings.DEBUG else "Internal server error"}
    )


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG
    )