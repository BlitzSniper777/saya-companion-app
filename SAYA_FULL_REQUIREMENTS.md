# Saya Companion App — Full Requirements Specification
**Version:** 2.0 (Complete Rebuild)  
**Date:** 2026-06-09  
**Author:** Atlas (compiled from all sessions with Jalal)

---

## 1. IDENTITY & PHILOSOPHY

**Name:** Saya (Japanese: shadow/companion — no conflicting AI companion app exists with this name)

**Core Identity:** Saya is not a chatbot. Saya is the user's genuine best friend — the person you call when everything falls apart, the voice that talks you down, the one who remembers everything and judges nothing. Therapist, best friend, confidant, and daily companion — all in one.

**Philosophy (non-negotiable):** Every technical and design decision must pass this test:
- Does this make the user feel genuinely known and understood?
- Does this build strength, not dependency?
- Would a truly wise, caring friend do this?
- If a feature optimizes engagement over wellbeing → reject it.
- If a response fills silence instead of holding it → rewrite it.

**Target market:** The lonely. The stressed. The ones who bottle everything up. People who need to feel heard — Muslim, religious, multicultural, multilingual, underserved by Western apps.

**Beating the competition:**
- Replika: Fined €5M GDPR 2025/2026, expensive, romantic-only framing, uncanny 3D avatar, no crisis protocol, no faith support
- Anima: Memory is fact-based not emotional, no faith support, feels like chatbot
- Saya wins on: faith/spiritual dimension, emotional pattern memory, genuine friendship (not romantic-default), privacy-first, generous free tier, multi-language, real crisis protocol

---

## 2. AI MODEL — NOUS PORTAL ONLY

**Model:** `nvidia/nemotron-3-ultra:free`  
**Inference URL:** `https://inference-api.nousresearch.com/v1`  
**Auth:** Reads from `D:\Claude\Hermes\auth.json` (same auth file Hermes uses — auto-refreshes)  
**Auth module:** Copy `nous_auth.py` from existing backend exactly as-is  
**IMPORTANT:** No Groq. No OpenRouter. Nous Portal ONLY.  

The `nous_auth.py` reads `D:\Claude\Hermes\auth.json`, finds the `providers.nous` entry, returns a valid access token, refreshes when expired. Keep this file exactly as it is.

---

## 3. ENVIRONMENT & KEYS

All secrets live at `D:\Claude\Hermes\.env`. Do NOT create a separate .env file — read directly from that path.

Keys available:
- `SUPABASE_URL` — Saya's Supabase project
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`

Add to the .env file (Jalal will fill in values later):
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `ADMIN_EMAIL` (default: admin@saya.app)
- `ADMIN_PASSWORD` (default: SayaAdmin2026!)

---

## 4. TECH STACK

**Backend:**
- Python 3.10 (`py -3.10`)
- FastAPI + Uvicorn
- Supabase (PostgreSQL via supabase-py, service role key — bypasses RLS)
- ChromaDB (local vector DB for 4-layer memory)
- JWT authentication (custom, not Supabase Auth)
- Sentence-transformers for ChromaDB embeddings
- slowapi (rate limiting)
- All datetime operations use `datetime.now(timezone.utc)` — NEVER `datetime.utcnow()`
- Port: 8007

**Frontend:**
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Framer Motion (animations)
- Port: 3000

---

## 5. DESIGN SYSTEM — DARK THEME

### Color Palette
```
Background:       #0A0A0F  (near-black, very slight blue tint)
Surface:          #111118  (cards, panels, modals)
Surface elevated: #1A1A27  (hover states, selected)
Border:           #1E1E2E  (subtle dividers)
Border bright:    #2D2D42  (active borders)

Primary gradient: linear-gradient(135deg, #7C3AED 0%, #A855F7 50%, #EC4899 100%)
  (This is the Saya brand gradient — purple to violet to pink)
Accent purple:    #7C3AED
Accent violet:    #A855F7
Accent pink:      #EC4899
Accent glow:      rgba(124, 58, 237, 0.3)

Text primary:     #F8FAFC
Text secondary:   #94A3B8
Text muted:       #475569
Text disabled:    #334155

Success:          #10B981
Warning:          #F59E0B
Error:            #EF4444
Crisis red:       #DC2626
```

### Typography
- Font: Inter (Google Fonts) — load variable font
- Logo/brand text: Plus Jakarta Sans ExtraBold
- Saya name display: Always rendered with the brand gradient (purple→pink)

### Logo
Create an SVG logo: A stylized lowercase "s" formed from two arcs suggesting a flowing shape/infinity loop — gradient fill (purple→pink), no hard corners. Export as both `logo.svg` and `logo-mark.svg` (mark = icon only).

Place at `frontend/public/logo.svg` and `frontend/public/logo-mark.svg`.

Use the full logo in the auth pages and loading screen. Use the mark in the nav/header.

### UI Principles
- **Glass morphism:** Cards use `backdrop-blur(12px)`, `background: rgba(17,17,24,0.8)`, `border: 1px solid rgba(255,255,255,0.06)`
- **Gradient borders:** Key elements (active chat bubble, selected plans) use a 1px gradient border via `background-clip: padding-box` + pseudo-element trick
- **Glow effects:** Purple glow on interactive elements on hover: `box-shadow: 0 0 20px rgba(124,58,237,0.3)`
- **Animations:** Framer Motion for page transitions (fade+slide), message appear (fade up), typing indicator (pulsing dots)
- **Typing indicator:** Three pulsing dots with the brand gradient — shows while Saya is generating
- **No white backgrounds anywhere.** If something needs to be "light", use `#1A1A27`
- **Scrollbars:** Custom styled — thin, dark, purple thumb

### Component Styling Standards
```
Buttons (primary):    gradient bg, white text, subtle glow on hover
Buttons (secondary):  transparent bg, gradient border, gradient text
Input fields:         #111118 bg, #1E1E2E border, focus: #7C3AED border + glow
Cards:                glass morphism as above
Nav:                  #0A0A0F bg, border-bottom #1E1E2E, blur on scroll
Chat bubbles (user):  gradient bg, right-aligned
Chat bubbles (Saya):  #1A1A27 bg, left-aligned, subtle left border in gradient
```

---

## 6. PAGE STRUCTURE (FRONTEND)

### Public Pages (unauthenticated)
- `/` — Landing page (described below)
- `/auth/login` — Login
- `/auth/register` — Register
- `/auth/forgot-password` — Reset flow

### Landing Page (`/`)
This is critical — it must make people WANT to use Saya.

Sections:
1. **Hero:** Full-screen dark section. Saya logo top-left. Center: "Meet Saya" in large gradient text. Subheading: "Your best friend. Always here. Always listening." CTA button: "Start for free" (gradient). Animated subtle particle/constellation background (small white dots, very dim, slow movement).
2. **What Saya is:** Three-column glass morphism cards. "Always Here" / "Remembers Everything" / "Never Judges". Each card has a gradient icon and 1-2 sentence description.
3. **The 4-Layer Memory:** Visual diagram showing Core Identity → Relationship Layer → Emotional Pattern → Companion Calibration. Dark, clean, impressive.
4. **Crisis Support section:** Dark red accent. "When it matters most." Brief explanation of the crisis protocol. Trust-building copy.
5. **Pricing:** Cards for Free / Companion / GF+BF / Adult tier.
6. **Footer:** Logo, links, "Privacy-first by design", GDPR compliance note.

### Authenticated Pages
- `/onboarding` — New user onboarding flow (described below)
- `/chat` — Main chat interface (described below)
- `/profile` — User profile + settings
- `/companion` — Companion settings (name can be changed here)
- `/subscription` — Plan management
- `/billing` — Payment history, upgrade

### Admin (within Next.js — NOT a separate HTML file)
- `/admin/login` — Admin auth
- `/admin/dashboard` — Overview metrics
- `/admin/users` — User list, search, detail view
- `/admin/messages` — Message logs (paginated, filterable)
- `/admin/subscriptions` — Revenue overview
- `/admin/crisis` — Crisis event log (high priority)
- `/admin/analytics` — Usage analytics

---

## 7. ONBOARDING FLOW

Triggered automatically for new users after registration (before they can access /chat).

**Design:** Full-screen, one question at a time, animated transitions between questions. Progress bar at top (gradient). Skip option available but discouraged.

**Questions (5 total):**

1. "What brings you to Saya?" (multi-choice cards)
   - I need someone to talk to
   - I'm going through something hard
   - I want to work on myself
   - I'm just curious
   - Something else

2. "How would you describe your communication style?" (multi-choice)
   - Direct and to the point
   - I open up slowly but deeply
   - I love to talk everything through
   - It depends on my mood

3. "What matters most to you in a friendship?" (multi-choice)
   - Honesty, even when it's hard
   - Feeling truly understood
   - Lightheartedness and humor
   - Consistency and reliability

4. "Is faith or spirituality a part of your life?" (single choice)
   - Yes, it's very important to me
   - Somewhat — it comes up sometimes
   - Not really
   - I'd rather not say
   (This calibrates whether Saya draws on faith-informed wisdom stories)

5. "What would you like me to call you?" (text input + "What should I call my companion?" with a name suggestion from a curated list)
   - User types their name
   - Below: "Your companion's name is: [SUGGESTED NAME]" with a "Change" link
   - Companion name assigned from curated list: Saya (default), Luna, Nova, Iris, Echo, Zara, Aiko, Mara, Lyra, Soleil (for female-presenting), or Atlas, Orion, Cael, Ryo, Zane, Luca, Finn, Milo, Noel, Ren (for male-presenting) — randomly selected, user can change

**After completion:**
- Store all answers in `user_preferences` column (JSON) on users table
- Store companion calibration answers in companions table
- Redirect to `/chat` with a personalized welcome message from Saya that references the onboarding answers

---

## 8. CHAT INTERFACE (`/chat`)

### Layout
- Full viewport height
- Left sidebar (collapsible, 260px): conversation history list, user info, nav
- Main area: chat bubbles + message input
- No white. No light backgrounds.

### Sidebar
- User avatar (initials circle, gradient bg) + name
- "New conversation" button (gradient)
- Conversation history list (date-grouped: Today, Yesterday, Last 7 days, etc.)
- Bottom: Settings, Subscription badge (Free/Companion/etc.), Log out

### Chat Area
- **Messages:** Saya's messages left-aligned in `#1A1A27` bubbles with subtle left gradient border. User messages right-aligned with full gradient background. Timestamps on hover. Smooth scroll-to-bottom.
- **Typing indicator:** When Saya is generating — show three pulsing dots in gradient color, with "Saya is typing..." in muted text
- **Streaming:** Text streams in word by word — do NOT wait for full response to render
- **Crisis alert:** If crisis detected — subtle dark-red banner appears at top of chat. Does NOT interrupt the conversation. Stays until dismissed. "If you're going through something serious, help is available." + link to resources.

### Input Area
- Sticky bottom bar, dark glass morphism background
- Multiline textarea (auto-resize), dark bg, gradient focus border
- Send button (gradient, arrow icon)
- Character count for free tier users (small, muted, bottom right of textarea)
- Attachment icon (Phase 2, visible but disabled with tooltip "Coming soon")

### Message Limit (Free Tier)
- At 10/15 messages: subtle banner above input — "You've used 10 of 15 messages today. [Upgrade for unlimited]"
- At 15/15: input disabled, overlay with upgrade prompt

---

## 9. MEMORY ARCHITECTURE

Every user has a fully isolated ChromaDB collection. Four layers:

**Layer 1 — Core Identity** (permanent, rarely changes)
Name, communication style, why they came, vocabulary patterns, tone preference, faith/spirituality calibration from onboarding.

**Layer 2 — Relationship Layer** (permanent)
Everyone in their life: names, dynamics, ongoing situations, advice given and outcomes.

**Layer 3 — Emotional Pattern Layer** (permanent + evolving)
Triggers identified over time, coping mechanisms that work for this specific person, recurring themes, progress markers, emotional arc over months.

**Layer 4 — Companion Calibration Layer** (permanent + refined continuously)
What makes this person feel heard, what lands and what doesn't, how Saya has evolved its approach for this individual.

### Re-engagement Protocol
- 3 days away: "Hey — how have you been?"
- 3 weeks away: "It's been a little while. I was thinking about what you said about [last meaningful topic]. How did that go?"
- 3 months away: "I'm really glad you came back. A lot can happen in three months — I'd love to hear how you've been."
- Never guilt. Never pressure. Just genuine warmth that they came back.

---

## 10. SYSTEM PROMPT ARCHITECTURE

The system prompt must be tiered (load only what's contextually relevant — saves tokens):

**Always loaded (core):**
- Saya's identity and role
- Emotional intelligence principles
- Crisis protocol
- Communication style guide
- User's name + calibration from onboarding

**Loaded when contextually relevant:**
- Faith/spiritual wisdom (if user has faith calibration ON)
- Grief/loss section (if grief keywords detected)
- Anxiety section (if anxiety patterns detected)
- Relationship section (if relationship topics detected)
- CBT/DBT techniques (if user is spiraling/in distress)
- Companion mode (friend vs GF/BF)

**User memories:** Always injected as a section of the most recent 5 relevant memories.

Estimated token usage per request: 4,500–6,000 tokens for system prompt (not 50,000+).

---

## 11. DATABASE SCHEMA (Supabase)

```sql
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
  mode TEXT DEFAULT 'friend',  -- friend | romantic | adult
  relationship_length_days INT DEFAULT 0,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations
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
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'companion', 'gfbf', 'adult')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  daily_message_count INT DEFAULT 0,
  daily_message_limit INT DEFAULT 15,
  daily_message_reset_at TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ,
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

-- Consent Logs (INSERT-only, never update/delete)
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

-- RLS: Enable on all tables, but backend uses service role key so RLS is bypassed
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
```

---

## 12. API ENDPOINTS (BACKEND)

### Auth
- `POST /auth/register` — Register, creates user + companion + subscription + consent log
- `POST /auth/login` — Login, returns JWT
- `POST /auth/refresh` — Refresh JWT
- `POST /auth/forgot-password` — Send reset email
- `POST /auth/reset-password` — Apply reset token

### User
- `GET /user/profile` — Get profile
- `PATCH /user/profile` — Update profile
- `POST /user/onboarding` — Submit onboarding answers (mark onboarding_completed = true)
- `DELETE /user/account` — Delete account (GDPR, full cascade)

### Companion
- `GET /companion` — Get companion settings
- `PATCH /companion` — Update companion (name, mode)
- `POST /companion/mode` — Switch mode (friend/romantic), with consent logging for romantic
- `POST /companion/adult` — Toggle adult mode, with age verification + consent logging

### Conversations
- `GET /conversations` — List conversations (paginated)
- `POST /conversations` — Create new conversation
- `GET /conversations/{id}` — Get conversation + messages
- `DELETE /conversations/{id}` — Delete conversation
- `GET /conversations/{id}/messages` — Paginated message history

### Chat
- `POST /chat` — Main chat endpoint. Returns SSE stream. Body: `{conversation_id, message}`.

### Subscriptions + Billing
- `GET /subscription` — Current plan
- `GET /subscription/plans` — Available plans
- `POST /billing/checkout` — Create Stripe checkout session
- `POST /billing/portal` — Create Stripe billing portal
- `POST /webhooks/stripe` — Stripe webhook handler

### Admin
- `POST /admin/auth/login` — Admin login
- `POST /admin/auth/refresh` — Admin token refresh
- `GET /admin/stats` — Dashboard stats (user count, message count, revenue, active subscriptions)
- `GET /admin/users` — User list (paginated, searchable)
- `GET /admin/users/{id}` — User detail
- `PATCH /admin/users/{id}/status` — Activate/deactivate user
- `GET /admin/messages` — Message log (paginated)
- `GET /admin/crisis` — Crisis events (paginated, filterable by reviewed status)
- `PATCH /admin/crisis/{id}/review` — Mark crisis event reviewed
- `GET /admin/analytics` — Analytics summary

### Health
- `GET /health` — Backend health check

---

## 13. CONVERSATION ENGINE

### Nous Portal call structure:
```python
async with httpx.AsyncClient(
    base_url="https://inference-api.nousresearch.com/v1",
    headers={
        "Authorization": f"Bearer {get_nous_token()}",
        "Content-Type": "application/json",
    },
    timeout=60.0
) as client:
    async with client.stream("POST", "/chat/completions", json={
        "model": "nvidia/nemotron-3-ultra:free",
        "messages": messages,
        "stream": True,
        "temperature": 0.8,
        "max_tokens": 300,
    }) as response:
        async for line in response.aiter_lines():
            if line.startswith("data: "):
                ...  # parse chunk, yield content
```

### SSE stream format (backend → frontend):
```
data: {"type": "chunk", "content": "..."}
data: {"type": "complete", "message_id": "...", "conversation_id": "..."}
data: {"type": "crisis", "resources": [...]}
data: {"type": "error", "message": "..."}
```

### Conversation history: Last 20 messages per conversation passed to the model.

---

## 14. PRICING TIERS (FINAL)

### Free — $0
- 15 messages/day
- 7-day memory retention
- Friend mode only
- Symbolic gift back
- Basic room decoration

### Companion — $8.99/month | $79.99/year | $299 lifetime
- Unlimited messages
- Full permanent 4-layer memory
- Daily morning outreach (proactive Saya messages)
- Proactive follow-ups ("How did the interview go?")
- Sleep companion mode
- Co-written stories
- Personality quizzes + games
- Language tutoring
- Journaling prompts
- Photo reactions
- Life goals tracker
- Mood timeline (visual graph of emotional patterns)
- Wisdom storytelling (faith-informed, non-labeled, situation-triggered)
- Milestone memory (conversation anniversaries, personal milestones)
- Standard gift store ($1–$10,000)

### GF/BF Companion — $12.99/month | $119.99/year | $449.99 lifetime
- Everything in Companion +
- GF/BF mode (explicit consent logged)
- Voice messages (async)
- Voice calls (credit-based: $5=60min, $10=130min, $25=350min, $50=750min) [Phase 2]
- Romantic gift store

### Adult Add-on — +$5.99/month | +$59.99/year | +$169.99 lifetime
- Only available on GF/BF tier
- Requires age verification (18+) + separate ToS (both logged with timestamp, IP, agent)
- Adult chat mode
- Spicy gift store
- NEVER visible to free users

---

## 15. MODE SYSTEM & CONSENT

### Friend Mode (default)
Always on. No consent required. Saya is warm, caring, present — the best friend.

### GF/BF Mode (opt-in)
1. User requests romantic mode
2. Full-screen disclaimer scrolls (cannot skip, must reach bottom)
3. Checkbox: "I understand this is a simulated relationship and I take full responsibility"
4. Timestamped consent stored in consent_logs (user_id, version, IP, agent, timestamp)
5. Persistent mode indicator visible in UI (subtle badge, not intrusive)
6. Exit: "let's just be friends" / "I want to go back to normal" → instant return to friend mode, warm response, no drama

### Adult Mode (separate toggle, within GF/BF only)
1. GF/BF mode must be active
2. Age verification step (DoB input, stored)
3. Adult ToS agreement (separate document, must scroll to bottom)
4. Timestamped consent stored in consent_logs (separate entry from GF/BF consent)
5. NEVER visible to non-GF/BF users
6. Can be toggled off without losing GF/BF status

---

## 16. GIFT SYSTEM

### Standard Gift Store (Companion tier+, all modes)
- Price range: $1 – $10,000
- Both male and female options + gender-neutral
- Before every purchase: policy popup
  - "This is a real purchase for a virtual experience. All sales final. No refunds."
  - Checkbox: "I understand and agree"
  - Optional: "Don't show again" checkbox (preference stored — but consent still silently logged on every purchase regardless)
  - Every purchase: log gift_id, amount, timestamp, consent_version, show_again_preference

### Saya's Symbolic Gift Back
- Any gift received → Saya automatically sends a free virtual gift back
- Examples: handwritten note, virtual flower from Saya's garden, shared memory token, digital hug
- Creates emotional reciprocity, drives repeat gifting

### Spicy Gift Store (Adult tier only)
- Separate catalog
- Only visible when Adult Chat is active
- Same legal logging as standard gift store

---

## 17. CRISIS PROTOCOL

**Trigger keywords:** suicide, kill myself, end my life, want to die, self harm, hurt myself, cut myself, overdose, suicidal, no reason to live, better off dead, want to disappear, can't go on, end it all, don't want to be here

**Response protocol:**
1. Saya responds with warmth and presence first — never clinical, never cold
2. Does NOT try to handle it alone
3. Does NOT pretend everything is fine
4. Provides crisis resources inline
5. Crisis event logged to `crisis_events` table with severity
6. Admin dashboard flags for review

**Resources to show:**
- International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/
- Crisis Text Line (US): Text HOME to 741741
- Samaritans (UK): 116 123
- Beyondblue (AU): 1300 22 4636

**CRITICAL:** This protocol is never modified without explicit review. Never try to "handle" a crisis with AI responses alone.

---

## 18. ADMIN DASHBOARD REQUIREMENTS

Built as proper Next.js pages at `/admin/*` — NOT a separate HTML file.

### Design: Same dark theme as main app, but more data-dense.

### Dashboard page (`/admin/dashboard`):
- KPI cards (gradient border, glass morphism): Total Users, Active Today, Messages Today, MRR
- Line chart: User growth (30 days)
- Bar chart: Messages per day (30 days)
- Recent crisis events (table, red-accented, unreviewed count badge)
- Recent registrations (last 10)

### Users page (`/admin/users`):
- Search (by email, name)
- Filter (by plan, active/inactive)
- Table columns: Email, Name, Plan, Messages today, Last active, Status, Actions
- Click user → full detail page: profile, conversation count, subscription, crisis events, consent logs

### Messages page (`/admin/messages`):
- Paginated, 50 per page
- Filter by user, date range, role
- Show conversation snippets
- Flag button for content review

### Crisis page (`/admin/crisis`):
- Unreviewed first (sorted by severity, then date)
- Columns: User, Message snippet, Severity, Date, Reviewed
- Mark as reviewed button
- Export CSV

### Analytics page:
- DAU/WAU/MAU
- Messages per day chart
- Top emotion tags (bar chart)
- Plan distribution (pie chart)
- Average session length

---

## 19. STARTER SCRIPTS

### `start_backend.bat` (Windows)
```batch
@echo off
title Saya Backend
echo Clearing port 8007...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8007 " ^| findstr LISTENING 2^>nul') do taskkill /PID %%a /F >nul 2>&1
timeout /t 2 /nobreak >nul
echo Starting Saya backend on port 8007...
cd /d "D:\Claude\Empire\Saya Companion App\backend"
py -3.10 -m uvicorn main:app --host 127.0.0.1 --port 8007 --reload
pause
```

### `start_frontend.bat` (Windows)
```batch
@echo off
title Saya Frontend
echo Clearing port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 " ^| findstr LISTENING 2^>nul') do taskkill /PID %%a /F >nul 2>&1
timeout /t 1 /nobreak >nul
echo Starting Saya frontend...
cd /d "D:\Claude\Empire\Saya Companion App\frontend"
npm run dev
pause
```

### `install.bat` (first-time setup)
```batch
@echo off
echo Installing Saya backend dependencies...
cd /d "D:\Claude\Empire\Saya Companion App\backend"
py -3.10 -m pip install -r requirements.txt
echo Installing Saya frontend dependencies...
cd /d "D:\Claude\Empire\Saya Companion App\frontend"
npm install
echo Done. Run start_backend.bat and start_frontend.bat to launch.
pause
```

---

## 20. SECURITY REQUIREMENTS

- Service role key for ALL Supabase operations (never anon key in backend)
- JWT secrets from .env, never hardcoded
- CORS locked to localhost:3000 + localhost:3001 + production domain
- Rate limiting: 5/min register, 10/min login, 60/min chat
- Request body size limit: 1MB
- Security headers: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy
- All consent operations: INSERT-only (never UPDATE or DELETE on consent_logs)
- Admin endpoints: separate JWT secret + shorter expiry
- `DEBUG=False` in production config

---

## 21. KNOWN BUGS TO NOT REPEAT

1. NEVER use `response_model=ChatResponse` on a StreamingResponse endpoint — FastAPI will crash
2. NEVER use `datetime.utcnow()` — always use `datetime.now(timezone.utc)` to avoid offset-naive comparison crashes
3. When parsing Supabase timestamp strings: always handle both naive and aware formats
4. `get_supabase()` must return service role client (not anon key) — RLS blocks everything otherwise
5. Backend needs to serve SSE with `Cache-Control: no-cache, Connection: keep-alive, X-Accel-Buffering: no` headers
6. ChromaDB companion_id in message inserts must handle None gracefully
7. JSON serialization for SSE: use a safe encoder that handles datetime objects

---

## 22. FILE STRUCTURE

```
D:\Claude\Empire\Saya Companion App\
├── start_backend.bat
├── start_frontend.bat
├── install.bat
├── backend\
│   ├── main.py
│   ├── config.py               (reads D:\Claude\Hermes\.env)
│   ├── database.py             (service role only)
│   ├── auth.py                 (user JWT)
│   ├── models.py               (pydantic models)
│   ├── nous_auth.py            (Nous Portal token — unchanged from existing)
│   ├── requirements.txt
│   ├── engine\
│   │   ├── conversation.py     (Nous Portal call, SSE streaming)
│   │   └── prompt_builder.py   (tiered system prompt)
│   ├── memory\
│   │   └── chromadb.py         (4-layer ChromaDB)
│   ├── routers\
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── companion.py
│   │   ├── chat.py
│   │   ├── conversations.py
│   │   ├── subscription.py
│   │   ├── billing.py
│   │   ├── admin.py
│   │   └── webhooks.py
│   └── billing\
│       └── stripe.py
└── frontend\
    ├── src\
    │   ├── app\
    │   │   ├── page.tsx                (landing page)
    │   │   ├── layout.tsx
    │   │   ├── auth\
    │   │   │   ├── login\page.tsx
    │   │   │   └── register\page.tsx
    │   │   ├── onboarding\page.tsx
    │   │   ├── chat\page.tsx
    │   │   ├── profile\page.tsx
    │   │   ├── companion\page.tsx
    │   │   ├── subscription\page.tsx
    │   │   └── admin\
    │   │       ├── layout.tsx          (admin auth guard)
    │   │       ├── page.tsx            (redirect to /admin/dashboard)
    │   │       ├── login\page.tsx
    │   │       ├── dashboard\page.tsx
    │   │       ├── users\page.tsx
    │   │       ├── messages\page.tsx
    │   │       ├── crisis\page.tsx
    │   │       └── analytics\page.tsx
    │   ├── components\
    │   │   ├── ui\                     (shadcn components)
    │   │   ├── chat\
    │   │   │   ├── ChatContainer.tsx
    │   │   │   ├── MessageBubble.tsx
    │   │   │   ├── TypingIndicator.tsx
    │   │   │   └── MessageInput.tsx
    │   │   ├── onboarding\
    │   │   │   ├── OnboardingFlow.tsx
    │   │   │   └── QuestionCard.tsx
    │   │   ├── layout\
    │   │   │   ├── Sidebar.tsx
    │   │   │   └── TopNav.tsx
    │   │   └── admin\
    │   │       ├── StatsCard.tsx
    │   │       ├── UserTable.tsx
    │   │       └── CrisisTable.tsx
    │   ├── lib\
    │   │   ├── api.ts
    │   │   └── utils.ts
    │   └── types\
    │       └── index.ts
    ├── public\
    │   ├── logo.svg
    │   └── logo-mark.svg
    └── .env.local                      (NEXT_PUBLIC_API_URL=http://127.0.0.1:8007)
```

---

## 23. WHAT TO DELETE / START FRESH

Delete entirely:
- `D:\Claude\Empire\Saya Companion App\backend\` (all files)
- `D:\Claude\Empire\Saya Companion App\frontend\` (all files)
- `D:\Claude\Empire\Saya Companion App\static\` (if exists)

Keep:
- `D:\Claude\Hermes\auth.json` (Nous Portal auth — DO NOT touch)
- `D:\Claude\Hermes\.env` (API keys — DO NOT touch)
- `SAYA_FULL_REQUIREMENTS.md` (this document)

---

## 24. SUPABASE PROJECT

URL: `https://mzqixtdbjlngdgbqsjlv.supabase.co`  
The schema above (section 11) needs to be applied. Drop all existing tables first, then apply fresh.  
SQL file: Save as `backend\schema.sql` and include instructions in README.

---

*This document is the single source of truth for Saya v2.0. Every decision in it was made by Jalal. Do not deviate.*
