import json
import os
import time
import httpx
from pathlib import Path
from config import settings

_token_cache = {"token": None, "expires_at": 0}


def _parse_expires_at(raw) -> float:
    if isinstance(raw, str):
        from datetime import datetime
        try:
            dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
            return dt.timestamp()
        except ValueError:
            return 0.0
    return float(raw) if raw else 0.0


def _persist_refresh_token(token: str):
    """Save a rotated refresh token back to Railway env vars so it survives restarts."""
    railway_token = os.environ.get("RAILWAY_API_TOKEN", "")
    if not railway_token:
        return
    project_id = os.environ.get("RAILWAY_PROJECT_ID", "")
    env_id = os.environ.get("RAILWAY_ENVIRONMENT_ID", "")
    service_id = os.environ.get("RAILWAY_SERVICE_ID", "")
    if not all([project_id, env_id, service_id]):
        return
    try:
        httpx.post(
            "https://backboard.railway.app/graphql/v2",
            headers={"Authorization": f"Bearer {railway_token}", "Content-Type": "application/json"},
            json={
                "query": (
                    'mutation { variableUpsert(input: { '
                    f'projectId: "{project_id}", '
                    f'environmentId: "{env_id}", '
                    f'serviceId: "{service_id}", '
                    f'name: "NOUS_REFRESH_TOKEN", '
                    f'value: "{token}" '
                    '}) }'
                )
            },
            timeout=10.0,
        )
    except Exception:
        pass


def _try_refresh(refresh_token: str, portal: str, client_id: str):
    """Exchange a refresh token for a new access token. Returns (access_token, new_refresh, ttl) or None."""
    try:
        resp = httpx.post(
            f"{portal}/api/oauth/token",
            headers={"x-nous-refresh-token": refresh_token, "Accept": "application/json"},
            data={"grant_type": "refresh_token", "client_id": client_id},
            timeout=15.0,
        )
        if resp.status_code == 200:
            payload = resp.json()
            new_access = payload.get("access_token")
            if new_access:
                new_refresh = payload.get("refresh_token", refresh_token)
                ttl = float(payload.get("expires_in", 900))
                return new_access, new_refresh, ttl
    except Exception:
        pass
    return None


def get_nous_token() -> str:
    global _token_cache

    # Return cached token if still valid (with 60s buffer)
    if _token_cache["token"] and _token_cache["expires_at"] > time.time() + 60:
        return _token_cache["token"]

    portal = os.environ.get("NOUS_PORTAL_URL", "https://portal.nousresearch.com").rstrip("/")
    client_id = os.environ.get("NOUS_CLIENT_ID", "hermes-cli")

    # 1. Try env var refresh token (Railway persists the latest rotated value)
    nous_refresh = os.environ.get("NOUS_REFRESH_TOKEN", "")
    if nous_refresh:
        result = _try_refresh(nous_refresh, portal, client_id)
        if result:
            new_access, new_refresh, ttl = result
            _token_cache["token"] = new_access
            _token_cache["expires_at"] = time.time() + ttl
            # Persist the rotated refresh token back to Railway for future restarts
            if new_refresh != nous_refresh:
                _persist_refresh_token(new_refresh)
            return new_access

    # 2. Static NOUS_TOKEN (long-lived token set directly)
    if settings.NOUS_TOKEN:
        _token_cache["token"] = settings.NOUS_TOKEN
        _token_cache["expires_at"] = time.time() + 86400
        return settings.NOUS_TOKEN

    # 3. File-based auth (local dev only)
    auth_path = Path(settings.NOUS_AUTH_PATH) if settings.NOUS_AUTH_PATH else None
    if not auth_path or not auth_path.exists():
        raise RuntimeError(
            "Nous auth not configured. Set NOUS_REFRESH_TOKEN, NOUS_TOKEN, or NOUS_AUTH_PATH."
        )

    with open(auth_path, "r") as f:
        auth_data = json.load(f)

    nous = auth_data.get("providers", {}).get("nous")
    if not nous:
        raise RuntimeError("Nous provider config not found in auth.json")

    access_token = nous.get("access_token", "")
    expires_at = _parse_expires_at(nous.get("expires_at", 0))

    if access_token and expires_at > time.time() + 60:
        _token_cache["token"] = access_token
        _token_cache["expires_at"] = expires_at
        return access_token

    # Try agent_key as fallback
    agent_key = nous.get("agent_key", "")
    agent_expires = _parse_expires_at(nous.get("agent_key_expires_at", 0))
    if agent_key and agent_expires > time.time() + 60:
        _token_cache["token"] = agent_key
        _token_cache["expires_at"] = agent_expires
        return agent_key

    # Refresh using file-based refresh token
    refresh_token = nous.get("refresh_token", "")
    if refresh_token:
        file_portal = nous.get("portal_base_url", portal).rstrip("/")
        file_client_id = nous.get("client_id", client_id)
        result = _try_refresh(refresh_token, file_portal, file_client_id)
        if result:
            new_access, new_refresh, ttl = result
            now = time.time()
            nous["access_token"] = new_access
            nous["refresh_token"] = new_refresh
            nous["expires_at"] = time.strftime("%Y-%m-%dT%H:%M:%S+00:00", time.gmtime(now + ttl))
            with open(auth_path, "w") as f:
                json.dump(auth_data, f, indent=2)
            _token_cache["token"] = new_access
            _token_cache["expires_at"] = now + ttl
            return new_access

    # Last resort: return expired token with 5-min grace
    if access_token:
        _token_cache["token"] = access_token
        _token_cache["expires_at"] = time.time() + 300
        return access_token

    raise RuntimeError("Failed to obtain a valid Nous token")
