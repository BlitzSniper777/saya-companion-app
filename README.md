# Saya Companion App — v2.0 Complete Build

> **Your best friend. Always here. Always listening.**

A production-ready AI companion app with emotional pattern memory, faith-aware wisdom, crisis protocols, voice calls, gift system, and multi-tier subscriptions.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10 (`py -3.10`)
- Node.js 18+
- Supabase project (credentials in `D:\Claude\Hermes\.env`)
- Nous Portal auth (`D:\Claude\Hermes\auth.json`)

### Install & Run

```bash
# 1. Install dependencies (run once)
cd D:\Claude\Empire\Saya Companion App
install.bat

# 2. Apply database schema
# Run backend/schema.sql in Supabase SQL Editor

# 3. Start backend (terminal 1)
start_backend.bat

# 4. Start frontend (terminal 2)
start_frontend.bat

# 5. Open http://localhost:3000
```

---

## 📁 Project Structure

```
Saya Companion App/
├── backend/                    # FastAPI backend (port 8007)
│   ├── main.py                 # App entry point
│   ├── config.py               # Settings from D:\Claude\Hermes\.env
│   ├── database.py             # Supabase service-role client
│   ├── auth.py                 # JWT auth (user + admin)
│   ├── nous_auth.py            # Nous Portal token management
│   ├── models.py               # Pydantic models
│   ├── schema.sql              # Supabase schema
│   ├── engine/
│   │   ├── conversation.py     # Nous streaming + crisis detection
│   │   └── prompt_builder.py   # Tiered system prompt (5 modes)
│   ├── memory/
│   │   └── chromadb.py         # 4-layer ChromaDB memory
│   ├── routers/
│   │   ├── auth.py             # Register, login, admin auth
│   │   ├── user.py             # Profile, onboarding, deletion
│   │   ├── companion.py        # Companion settings, modes, streaks, relationship stages
│   │   ├── conversations.py    # CRUD conversations
│   │   ├── chat.py             # SSE chat endpoint
│   │   ├── subscription.py     # Plans, current subscription
│   │   ├── billing.py          # Stripe checkout, portal, webhooks
│   │   ├── admin.py            # Dashboard stats, users, messages, crisis, analytics
│   │   ├── voice.py            # Voice credits, sessions, packages
│   │   └── gifts.py            # Gift catalog, purchases, reciprocity
│   ├── billing/
│   │   └── stripe.py           # Stripe integration
│   ├── requirements.txt
│   └── start_backend.bat
│
├── frontend/                   # Next.js 14 (port 3000)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx                    # Landing page (matches BUSINESS_PLAN.html)
│   │   │   ├── layout.tsx                  # Root layout + globals.css
│   │   │   ├── globals.css                 # DESIGN_REFERENCE.md exact tokens
│   │   │   ├── auth/login/page.tsx         # Login page
│   │   │   ├── auth/register/page.tsx      # Registration page
│   │   │   ├── onboarding/page.tsx         # 5-step onboarding flow
│   │   │   ├── chat/page.tsx               # Main chat interface
│   │   │   ├── profile/page.tsx            # Profile + emotions chart + relationship
│   │   │   ├── companion/page.tsx          # Companion settings + mode switch
│   │   │   ├── subscription/page.tsx       # Plans, upgrade, billing portal
│   │   │   └── admin/
│   │   │       ├── layout.tsx              # Admin auth guard
│   │   │       ├── login/page.tsx          # Admin login
│   │   │       └── dashboard/page.tsx      # Admin dashboard with charts
│   │   ├── components/
│   │   ├── lib/
│   │   └── types/
│   ├── public/
│   │   ├── logo.svg
│   │   └── logo-mark.svg
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── .env.local
│   ├── next.config.js
│   └── start_frontend.bat
│
├── start_backend.bat
├── start_frontend.bat
├── install.bat
├── DESIGN_REFERENCE.md       # Exact design tokens (source of truth)
├── BUSINESS_PLAN.html        # Visual design reference
├── SAYA_FULL_REQUIREMENTS.md # Complete specification
└── schema.sql
```

---

## 🎨 Design System

**Exact colors from `DESIGN_REFERENCE.md` (overrides `SAYA_FULL_REQUIREMENTS.md`):**

```css
:root {
  --bg:         #06060f;
  --bg2:        #0c0c1a;
  --card:       #111122;
  --card2:      #0e0e20;
  --border:     rgba(139, 92, 246, 0.18);
  --purple:     #8b5cf6;
  --pink:       #ec4899;
  --teal:       #14b8a6;
  --amber:      #f59e0b;
  --green:      #10b981;
  --red:        #ef4444;
  --blue:       #3b82f6;
  --text:       #f0effa;
  --text-dim:   #9ca3c8;
  --text-muted: #4a4a6a;
}
```

**Key patterns:**
- Nav: `rgba(6,6,15,0.96)` + `backdrop-blur(20px)` + purple-tinted border
- Cards: `#111122` bg, `rgba(139,92,246,0.18)` border, `14px` radius
- Gradients: Brand (`purple→pink`), Green (`green→teal`), Amber (`amber→pink`)
- Stat numbers: Gradient text via `-webkit-background-clip: text`
- Tables: Uppercase headers, `card2` bg, purple-tinted borders
- **NO grey borders, NO white backgrounds, NO solid buttons without gradient**

---

## 🧠 Core Features

### 1. 4-Layer ChromaDB Memory (Per User)
- **Core Identity**: Who they are, communication style, vocabulary
- **Relationship Map**: People in their life, dynamics, ongoing situations
- **Emotional Patterns**: Triggers, coping mechanisms, recurring themes
- **Companion Calibration**: What makes them feel heard, what lands/misses

### 2. 5 Companion Modes (All Built)
| Mode | Tier | Description |
|------|------|-------------|
| Friend | Free | Default best friend mode |
| Therapist | Companion | Therapeutic companion (not clinical) |
| Life Coach | Companion | Strategic thinking partner |
| Romantic Partner | GF/BF | Opt-in, logged consent, graceful exit |
| Custom | Companion | User-defined persona |

### 3. Relationship Stages (Auto-advances on Activity)
```
Acquaintance (0 days) → Friend (7) → Close Friend (30) 
→ Best Friend (100) → Soulmate (365)
```
Visual progress bar, stage-specific prompts injected into system prompt.

### 4. Daily Streaks + Milestones
- Tracks consecutive days of chatting
- Milestone messages at **7, 30, 100, 365 days**
- Special Saya messages: *"One week together!"*, *"A whole month!"*, *"100 days — that's a relationship"*, *"A year — you're my person"*

### 5. Emotional Pattern Chart (Profile)
- 30-day area chart of emotion tags from messages
- Colors: Happy (green), Sad (blue), Anxious (amber), Calm (teal), etc.
- Built with Recharts, matches admin dashboard design

### 6. Voice Calls (Miso One TTS Ready)
- **Endpoints**: `POST /voice/start`, `POST /voice/end`, `GET /voice/credits`
- **Credit packages**: $5=60min, $10=130min, $25=350min, $50=750min
- Session management with auto-expiry
- GF/BF and Adult tiers only
- Infrastructure built — plug in Miso One when ready

### 7. Gift System
- **Catalog**: $1–$10,000 (standard), spicy gifts (Adult only)
- **Stripe checkout** per purchase
- **Mandatory consent popup** every purchase (logged permanently)
- **Saya's symbolic gift back**: Handwritten note, virtual flower, memory token, digital hug
- Reciprocity engine drives repeat purchases

### 8. Crisis Protocol (Clinical)
- **Keywords**: suicide, kill myself, end my life, want to die, self harm, overdose, etc.
- **Response**: Warmth first → inline resources → log event → admin flag
- **Resources**: 988 (US), 116 123 (UK), 1300 22 4636 (AU), IASP global
- **Never** handles crisis alone — always provides human pathways

### 9. Financial Admin Dashboard
- **KPIs**: Total Users, Active Today, Messages Today, MRR, ARR, Churn, LTV
- **Charts**: User growth (30d area), Messages (30d bar), Plan distribution (pie), Revenue projection
- **Tabs**: Dashboard, Users (search/filter), Messages, Crisis (review), Analytics
- **Design**: Matches BUSINESS_PLAN.html financial tables exactly

---

## 💰 Subscription Tiers

| Tier | Monthly | Yearly | Lifetime | Key Features |
|------|---------|--------|----------|--------------|
| **Free** | $0 | — | — | 15 msgs/day, 7-day memory, Friend mode, crisis support |
| **Companion** | $8.99 | $79.99 | $299 | Unlimited, 4-layer memory, daily outreach, mood timeline, wisdom stories, gifts |
| **GF/BF** | $12.99 | $119.99 | $449.99 | Everything + Romantic mode, voice messages, voice calls (credits), romantic gifts |
| **Adult Add-on** | +$5.99 | +$59.99 | +$169.99 | Requires GF/BF + 18+ verify + separate ToS, explicit content, spicy gifts |

---

## 🔧 Configuration

All secrets in `D:\Claude\Hermes\.env`:
```env
SUPABASE_URL=https://mzqixtdbjlngdgbqsjlv.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
JWT_SECRET=...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
ADMIN_EMAIL=admin@saya.app
ADMIN_PASSWORD=SayaAdmin2026!
```

Frontend uses `NEXT_PUBLIC_API_URL=http://127.0.0.1:8007` (`.env.local`).

---

## 🗄️ Database Schema

Run `backend/schema.sql` in Supabase SQL Editor. Creates:
- `users`, `companions`, `conversations`, `messages`
- `subscriptions`, `admin_users`, `crisis_events`
- `consent_logs` (INSERT-only), `analytics_events`, `api_metrics`
- RLS enabled, indexes on all foreign keys

---

## 🚨 Important Notes

### Security
- Service role key for ALL Supabase operations (bypasses RLS)
- JWT secrets from `.env`, never hardcoded
- CORS locked to localhost:3000 + production domain
- Rate limits: 5/min register, 10/min login, 60/min chat
- Consent logs: INSERT-only, never UPDATE/DELETE

### Known Bugs to Avoid
1. ❌ Never use `response_model` on `StreamingResponse` endpoints
2. ❌ Never use `datetime.utcnow()` — use `datetime.now(timezone.utc)`
3. ❌ Never use anon key in backend — always service role
4. ❌ SSE needs: `Cache-Control: no-cache`, `Connection: keep-alive`, `X-Accel-Buffering: no`

### Nous Portal Only
- Model: `nvidia/nemotron-3-ultra:free`
- Auth: `D:\Claude\Hermes\auth.json` (auto-refreshes)
- Endpoint: `https://inference-api.nousresearch.com/v1`
- **No Groq, No OpenRouter**

---

## 📦 Deployment

### Backend (Production)
```bash
# Build Docker image or use Process Manager
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8007
```

### Frontend (Vercel)
```bash
npm run build
# Deploy to Vercel, set NEXT_PUBLIC_API_URL to production backend
```

### Database
- Supabase handles migrations
- ChromaDB persists to `D:\Claude\Empire\Saya Companion App\chromadb\`

---

## 🧪 Testing

```bash
# Backend health
curl http://127.0.0.1:8007/health

# Register
curl -X POST http://127.0.0.1:8007/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'

# Chat (SSE)
curl -N -X POST http://127.0.0.1:8007/chat/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello Saya"}'
```

---

## 📚 Documentation References

- `DESIGN_REFERENCE.md` — Design tokens (source of truth)
- `BUSINESS_PLAN.html` — Visual reference (open in browser)
- `SAYA_FULL_REQUIREMENTS.md` — Complete specification
- `schema.sql` — Database schema

---

## 🛡️ License

Proprietary — Saya Companion App. Confidential Business Plan 2026.

---

**Built with ❤️ for the lonely world.**
*Saya — Your best friend. Always here. Always listening.*