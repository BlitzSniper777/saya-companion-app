from supabase import create_client, Client
from config import settings

_supabase_client: Client | None = None


def get_supabase() -> Client:
    """Get Supabase client with service role key (bypasses RLS)."""
    global _supabase_client
    if _supabase_client is None:
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
            raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")
        _supabase_client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY
        )
    return _supabase_client


def get_supabase_anon() -> Client:
    """Get Supabase client with anon key (for frontend direct calls if needed)."""
    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        raise RuntimeError("SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env")
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)