"""
Local training data export — runs daily via Windows Task Scheduler.
Pulls new real-user conversation turns from Supabase and appends them
to saya_combined_training.jsonl alongside all simulation data.

Setup (one-time):
  schtasks /create /tn "Saya Training Export" /tr "C:\Python314\python.exe D:\Claude\Empire\Saya Companion App\training_data\export_training.py" /sc daily /st 03:00

Or run manually:
  C:\Python314\python.exe export_training.py
"""
import hashlib
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

# ── config ────────────────────────────────────────────────────────────────────

SCRIPT_DIR   = Path(__file__).parent
OUTPUT_FILE  = SCRIPT_DIR / "saya_combined_training.jsonl"
STATE_FILE   = SCRIPT_DIR / "export_state.json"

# Sim files to merge on first run (won't re-merge on subsequent runs)
SIM_FILES = [
    SCRIPT_DIR / "raw_turns.jsonl",
    SCRIPT_DIR / "saya_training.jsonl",
    SCRIPT_DIR / "sim3_raw_turns.jsonl",
    SCRIPT_DIR / "sim3_gift_reactions.jsonl",
]

# Load Supabase credentials from backend .env
ENV_PATH = SCRIPT_DIR.parent / "backend" / ".env"
if not ENV_PATH.exists():
    ENV_PATH = Path(r"D:\Claude\Hermes\.env")


def _load_env():
    env = {}
    if ENV_PATH.exists():
        for line in ENV_PATH.read_text().splitlines():
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                k, _, v = line.partition("=")
                env[k.strip()] = v.strip()
    return env


def _hash_uid(user_id: str) -> str:
    return hashlib.sha256(user_id.encode()).hexdigest()[:16]


def _load_state() -> dict:
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text())
        except Exception:
            pass
    return {"last_export_at": None, "sim_files_merged": []}


def _save_state(state: dict):
    STATE_FILE.write_text(json.dumps(state, indent=2))


def _append_lines(lines: list[str]):
    if not lines:
        return
    with OUTPUT_FILE.open("a", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")


# ── merge sim files (first run only) ─────────────────────────────────────────

def merge_sim_files(state: dict):
    already_merged = set(state.get("sim_files_merged", []))
    for sim_path in SIM_FILES:
        fname = sim_path.name
        if fname in already_merged or not sim_path.exists():
            continue
        lines = []
        with sim_path.open(encoding="utf-8") as f:
            for raw in f:
                raw = raw.strip()
                if not raw:
                    continue
                try:
                    obj = json.loads(raw)
                    if isinstance(obj, dict):
                        obj["source"] = "sim"
                    lines.append(json.dumps(obj))
                except Exception:
                    pass
        if lines:
            _append_lines(lines)
            print(f"  Merged {fname}: {len(lines)} lines")
        state.setdefault("sim_files_merged", []).append(fname)


# ── export real conversations ─────────────────────────────────────────────────

def export_real_conversations(state: dict):
    env = _load_env()
    url = env.get("SUPABASE_URL", "")
    key = env.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url or not key:
        print("ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env")
        return

    try:
        from supabase import create_client
        sb = create_client(url, key)
    except ImportError:
        print("ERROR: supabase package not installed. Run: pip install supabase")
        return

    last_export = state.get("last_export_at")

    query = (
        sb.table("messages")
        .select("id, conversation_id, user_id, role, content, created_at")
        .order("created_at")
    )
    if last_export:
        query = query.gt("created_at", last_export)

    messages = query.execute().data or []
    if not messages:
        print("  No new messages since last export.")
        return

    # Companion map
    user_ids = list({m["user_id"] for m in messages})
    comp_rows = (
        sb.table("companions")
        .select("user_id, personality_calibration, mode")
        .in_("user_id", user_ids)
        .execute()
        .data or []
    )
    companion_map = {}
    for c in comp_rows:
        cal = c.get("personality_calibration") or {}
        companion_map[c["user_id"]] = {
            "companion_id": cal.get("personality_id", ""),
            "mode": c.get("mode", "friend"),
        }

    # Group by conversation
    convs: dict = {}
    for m in messages:
        cid = m["conversation_id"]
        if cid not in convs:
            convs[cid] = {"user_id": m["user_id"], "msgs": []}
        convs[cid]["msgs"].append(m)

    training_lines = []
    for cid, conv in convs.items():
        uid = conv["user_id"]
        comp = companion_map.get(uid, {"companion_id": "", "mode": "friend"})
        msgs = conv["msgs"]
        i = 0
        while i < len(msgs) - 1:
            if msgs[i]["role"] == "user" and msgs[i + 1]["role"] == "assistant":
                training_lines.append(json.dumps({
                    "source":          "real",
                    "companion_id":    comp["companion_id"],
                    "mode":            comp["mode"],
                    "user_id_hash":    _hash_uid(uid),
                    "conversation_id": cid,
                    "user_msg":        msgs[i]["content"],
                    "saya_msg":        msgs[i + 1]["content"],
                    "timestamp":       msgs[i]["created_at"],
                }))
                i += 2
            else:
                i += 1

    if training_lines:
        _append_lines(training_lines)

    state["last_export_at"] = messages[-1]["created_at"]
    total = sum(1 for _ in OUTPUT_FILE.open(encoding="utf-8"))
    print(f"  Exported {len(training_lines)} new turns. Total in file: {total}")


# ── main ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Saya training export")

    state = _load_state()

    print("Step 1: Merge sim files (skipped if already done)...")
    merge_sim_files(state)

    print("Step 2: Export real user conversations...")
    export_real_conversations(state)

    _save_state(state)

    size_mb = OUTPUT_FILE.stat().st_size / 1024 / 1024 if OUTPUT_FILE.exists() else 0
    print(f"Done. Output: {OUTPUT_FILE} ({size_mb:.1f} MB)")
