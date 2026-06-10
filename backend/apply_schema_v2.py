#!/usr/bin/env python3
"""Apply Supabase schema from schema.sql using PostgREST RPC"""
import os
import sys
import httpx
from pathlib import Path

# Read env directly
from dotenv import load_dotenv
load_dotenv(Path(r"D:\Claude\Hermes\.env"))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("ERROR: Supabase credentials not configured in .env")
    sys.exit(1)

print(f"Supabase URL: {SUPABASE_URL}")

# Read schema file
schema_path = Path(__file__).parent / "schema.sql"
with open(schema_path, "r") as f:
    schema_sql = f.read()

print(f"Applying schema from {schema_path}...")

# Headers for PostgREST
headers = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

# First, try to create exec_sql function via direct SQL execution
# We'll use the fact that we can run a simple query to test
# Actually, let's try to execute SQL directly via the REST API
# Supabase doesn't support arbitrary SQL execution via REST by default
# But we can try to create a function and then call it

# Create exec_sql function
exec_sql_fn = """
CREATE OR REPLACE FUNCTION exec_sql(sql text) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    EXECUTE sql;
END;
$$;
"""

# Try to create the function via the REST API
# We can do this by inserting into a table that has a trigger... 
# Actually, the simplest way is to use the Supabase Management API
# But that requires a different token.

# Alternative: Use the SQL Editor API if available
# Or: Just print the SQL and ask user to run in dashboard

print("\n" + "="*60)
print("Supabase schema application requires manual step")
print("="*60)
print("\nThe Supabase REST API does not support arbitrary DDL execution.")
print("You need to run the schema SQL in the Supabase Dashboard SQL Editor.\n")
print("Steps:")
print("1. Go to: https://supabase.com/dashboard/project/mzqixtdbjlngdgbqsjlv/sql/new")
print("2. Copy the contents of backend/schema.sql")
print("3. Paste into the SQL Editor and click 'Run'")
print("\nThe schema includes:")
print("- 10 tables: users, companions, conversations, messages, subscriptions")
print("            admin_users, crisis_events, consent_logs, analytics_events, api_metrics")
print("- All indexes, RLS policies, triggers")
print("- Admin user seed (admin@saya.app / SayaAdmin2026!)")
print("="*60)

# Also save the schema to a clean file for copy-paste
output_path = Path(__file__).parent / "schema_for_supabase.sql"
with open(output_path, "w") as f:
    f.write(schema_sql)
print(f"\nSchema saved to: {output_path}")
print("You can copy from this file and paste into Supabase Dashboard.")

# Try to verify connection
print("\nTesting Supabase REST API connection...")
import httpx
try:
    resp = httpx.get(
        f"{SUPABASE_URL}/rest/v1/users?select=count&limit=1",
        headers=headers,
        timeout=10
    )
    if resp.status_code == 200:
        print("✓ REST API connection works")
    elif resp.status_code == 404:
        print("⚠ Tables don't exist yet (404) - need to apply schema first")
    else:
        print(f"⚠ REST API returned {resp.status_code}: {resp.text[:100]}")
except Exception as e:
    print(f"✗ REST API connection failed: {e}")

# Try to test after schema is applied
print("\nAfter applying schema in dashboard, run this script again to verify.")