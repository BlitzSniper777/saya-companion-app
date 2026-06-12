import os
from pathlib import Path
from dotenv import load_dotenv

# Load local .env if present, then fall back to Hermes .env (dev machine only)
_local_env = Path(__file__).parent / ".env"
if _local_env.exists():
    load_dotenv(_local_env)
else:
    _hermes_env = Path(os.getenv("HERMES_ENV_PATH", r"D:\Claude\Hermes\.env"))
    if _hermes_env.exists():
        load_dotenv(_hermes_env)


class Settings:
    # Supabase
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    # JWT
    JWT_SECRET: str = os.getenv("JWT_SECRET", "")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_MINUTES: int = 60 * 24 * 7  # 7 days

    # Admin JWT (separate secret)
    ADMIN_JWT_SECRET: str = os.getenv("ADMIN_JWT_SECRET", "")
    ADMIN_JWT_EXPIRY_MINUTES: int = 60 * 2  # 2 hours

    # Stripe
    STRIPE_SECRET_KEY: str = os.getenv("STRIPE_SECRET_KEY", "")
    STRIPE_WEBHOOK_SECRET: str = os.getenv("STRIPE_WEBHOOK_SECRET", "")

    # Admin credentials
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "")

    # Vercel cron secret (set in Vercel env vars, auto-sent with cron requests)
    CRON_SECRET: str = os.getenv("CRON_SECRET", "")

    # Nous Portal — auth.json path (local dev) or raw token (production)
    NOUS_AUTH_PATH: str = os.getenv("NOUS_AUTH_PATH", "")
    NOUS_TOKEN: str = os.getenv("NOUS_TOKEN", "")  # production: set this directly
    NOUS_INFERENCE_URL: str = "https://inference-api.nousresearch.com/v1"
    NOUS_MODEL: str = "nvidia/nemotron-3-ultra:free"

    # Backend
    PORT: int = int(os.getenv("PORT", "8007"))
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    # CORS — comma-separated list in production
    CORS_ORIGINS: list = [
        o.strip()
        for o in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:3000,http://localhost:3001"
        ).split(",")
        if o.strip()
    ]

    # Rate limits
    RATE_LIMIT_REGISTER: str = "5/minute"
    RATE_LIMIT_LOGIN: str = "10/minute"
    RATE_LIMIT_CHAT: str = "60/minute"

    # ChromaDB — default to ./data/chroma relative to this file
    CHROMA_PATH: str = os.getenv(
        "CHROMA_PATH",
        str(Path(__file__).parent / "data" / "chroma")
    )

    # Crisis keywords
    CRISIS_KEYWORDS: list = [
        "suicide", "kill myself", "end my life", "want to die", "self harm",
        "hurt myself", "cut myself", "overdose", "suicidal", "no reason to live",
        "better off dead", "want to disappear", "can't go on", "end it all",
        "don't want to be here", "dont want to be here"
    ]


settings = Settings()