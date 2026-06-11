-- Saya Companion App v2.0 Database Schema
-- Apply to Supabase: https://mzqixtdbjlngdgbqsjlv.supabase.co
-- Run this entire file to create all tables fresh

-- Drop existing tables (in reverse dependency order)
DROP TABLE IF EXISTS api_metrics CASCADE;
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS consent_logs CASCADE;
DROP TABLE IF EXISTS crisis_events CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS companions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'UTC',
    user_preferences JSONB DEFAULT '{}',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Companions
CREATE TABLE companions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name TEXT DEFAULT 'Saya',
    personality_calibration JSONB DEFAULT '{}',
    mode TEXT DEFAULT 'friend' CHECK (mode IN ('friend', 'romantic', 'adult')),
    relationship_length_days INT DEFAULT 0,
    language TEXT DEFAULT 'en',
    companion_birthday DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations (KEY DIFFERENCE FROM V1: conversations table exists)
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT,
    summary TEXT,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    emotion_tags TEXT[] DEFAULT '{}',
    topic_tags TEXT[] DEFAULT '{}',
    token_count INT DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'companion', 'gfbf', 'adult_bundle')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    daily_message_count INT DEFAULT 0,
    daily_message_limit INT DEFAULT 15,
    daily_message_reset_at TIMESTAMPTZ DEFAULT NOW(),
    current_period_end TIMESTAMPTZ,
    voice_credits INT DEFAULT 0,
    streak_count INT DEFAULT 0,
    last_chat_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin Users
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'moderator' CHECK (role IN ('superadmin', 'moderator')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crisis Events
CREATE TABLE crisis_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    message_content TEXT,
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    resources_shown TEXT[],
    admin_reviewed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Consent Logs (INSERT-only, never UPDATE or DELETE)
CREATE TABLE consent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    consent_type TEXT NOT NULL,
    consent_given BOOLEAN NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics Events
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    event_data JSONB DEFAULT '{}',
    session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Metrics
CREATE TABLE api_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint TEXT,
    method TEXT,
    status_code INT,
    duration_ms INT,
    user_id UUID,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_user ON messages(user_id, created_at DESC);
CREATE INDEX idx_conversations_user ON conversations(user_id, last_message_at DESC);
CREATE INDEX idx_crisis_events_user ON crisis_events(user_id, created_at DESC);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type, created_at DESC);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_consent_logs_user ON consent_logs(user_id, created_at DESC);

-- RLS: Enable on all tables, but backend uses service role key so RLS is bypassed
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_metrics ENABLE ROW LEVEL SECURITY;

-- Seed admin user (password: SayaAdmin2026!)
INSERT INTO admin_users (email, password_hash, full_name, role)
VALUES (
    'admin@saya.app',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LoP2pG7H1KF8Y5q2W',  -- bcrypt of 'SayaAdmin2026!'
    'System Admin',
    'superadmin'
)
ON CONFLICT (email) DO NOTHING;