# Saya Admin Dashboard Documentation

## Overview

The Saya Admin Dashboard is a comprehensive admin interface for the Saya Companion App, providing full visibility into user management, subscriptions, analytics, conversations, and system health.

## Access

**URL:** `http://localhost:8000/admin` (or your production domain)

**Default Credentials:**
- Email: `admin@saya.app`
- Password: `SayaAdmin2026!`

> **Important:** Change the default password immediately after first login in production.

## Features

### 1. Overview Dashboard
Real-time key metrics at a glance:
- Total users, active today/this week
- Monthly Recurring Revenue (MRR)
- New signups (today, week, month)
- Active subscriptions by tier (Free/Premium/Ultra)
- Crisis protocol triggers (last 24h)
- System status indicators (API, Database, ChromaDB, Stripe, Model)

### 2. Users Management
- **Paginated table** with search and filters
- **Search** by email or display name
- **Filter** by tier (Free/Premium/Ultra) and status (Active/Suspended/Deleted)
- **User Detail Modal** with:
  - Full profile and subscription history
  - Message count, session count, average session length
  - Top 5 emotions from ChromaDB memories
  - Crisis events count
- **Actions**: Suspend/Activate, Delete (soft), Upgrade tier
- **Bulk Actions**: Export CSV, Suspend selected users

### 3. Subscriptions
- **Live Metrics**: MRR, ARPU, 30-day churn rate, LTV estimates
- **Revenue Charts**: Monthly revenue (12 months), Revenue by tier
- **Active Subscriptions Table**: User, plan, amount, dates, status
- **Stripe Webhook Events**: Last 50 events with payloads
- **Failed Payments**: List with retry status

### 4. Analytics (Full)
Comprehensive metrics across 6 categories:

#### User Growth
- Daily signups line chart (30 days)
- Weekly signups bar chart (12 weeks)
- Cohort retention table (Week 1/2/4 retention by signup cohort)

#### Engagement
- DAU/WAU/MAU with stickiness ratio
- Avg messages per user per day
- Avg session length
- Sessions per user per week
- Peak usage heatmap (hour × day of week)

#### Revenue
- MRR growth line chart (12 months)
- New MRR vs Churned MRR vs Expansion MRR (stacked)
- Revenue by tier (pie chart)
- Churn rate trend
- LTV by tier

#### Emotional Intelligence
- Top 10 emotions (aggregate, anonymized)
- Mood trend chart (30 days)
- Most common conversation topics
- Faith/spiritual conversation percentage

#### Crisis & Safety
- Crisis triggers per day (30 days)
- Avg response time for crisis messages
- Resolution rate
- Geographic distribution (country-level)

#### Model Performance
- API response times (p50, p95, p99) - last 7 days
- Error rate trend
- Token usage per day (cost tracking)

### 5. Conversations
- **Recent conversations table** with anonymized user IDs
- **Filters**: Flagged only, Crisis only, Date range, User tier
- **Conversation Detail Modal** with:
  - Full message history with timestamps
  - Crisis protocol events marked
  - Flagged messages highlighted
  - User emotion timeline sidebar
- **Actions**: Flag/unflag messages, Export as JSON

### 6. System Health
- **Real-time status cards**: API, Database, ChromaDB, Stripe, Model
- **Response time chart** (last 24 hours)
- **Error log** (last 100 errors with stack traces)
- **ChromaDB stats**: Total embeddings, avg/max memories per user, index size
- **Active sessions** count

## Architecture

### Backend Structure
```
backend/
├── app/
│   ├── auth/
│   │   └── admin.py          # Admin JWT auth, role management
│   ├── routers/
│   │   └── admin.py          # All admin API endpoints
│   ├── services/
│   │   └── analytics.py      # Aggregation service with caching
│   └── __init__.py
├── static/
│   └── admin/
│       ├── index.html        # SPA entry point
│       ├── admin.css         # Dark-themed responsive styles
│       └── admin.js          # Dashboard logic + Chart.js
├── main.py                   # FastAPI app with admin integration
├── models.py                 # Extended with Admin models
├── schema.sql                # Extended with admin tables
└── config.py                 # Extended with admin JWT settings
```

### Database Schema Extensions

New tables added:
- `admin_users` - Admin accounts with roles (superadmin/moderator)
- `api_metrics` - API performance tracking (endpoint, duration, status)
- `crisis_events` - Crisis protocol events for safety monitoring

### Authentication

- **Separate JWT secret** (`ADMIN_JWT_SECRET`) from user auth
- **Longer expiry**: 8 hours access, 30 days refresh
- **Role-based access**:
  - `superadmin`: Full access (user management, admin creation, bulk actions)
  - `moderator`: View + flag only (no destructive actions)
- **Middleware** protects all `/admin/*` routes

## Configuration

### Environment Variables

Add to your `.env` file:

```env
# Admin JWT (separate from user JWT)
ADMIN_JWT_SECRET=your-super-secret-admin-key-change-in-production
ADMIN_JWT_EXPIRE_MINUTES=480
ADMIN_JWT_REFRESH_EXPIRE_DAYS=30

# Existing settings...
JWT_SECRET=your-user-jwt-secret
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-service-role-key
```

### Default Admin Seeding

On startup, the system automatically creates the default admin account if it doesn't exist:
- Email: `admin@saya.app`
- Password: `SayaAdmin2026!`
- Role: `superadmin`

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/login` | Admin login, returns JWT tokens |
| POST | `/admin/refresh` | Refresh access token |
| GET | `/admin/me` | Get current admin profile |

### Overview
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/overview` | Dashboard metrics |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/users` | Paginated users with filters |
| GET | `/admin/users/export` | Export users as CSV (superadmin) |
| GET | `/admin/users/{user_id}` | User detail with profile, subscription, emotions |
| POST | `/admin/users/{user_id}/action` | Suspend, activate, delete, upgrade (superadmin) |
| POST | `/admin/users/bulk-action` | Bulk suspend or export (superadmin) |

### Subscriptions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/subscriptions` | All subscription metrics and tables |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/analytics` | Full analytics data |
| POST | `/admin/analytics/refresh` | Clear cache and refresh (superadmin) |

### Conversations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/conversations` | Paginated conversations with filters |
| GET | `/admin/conversations/{user_id}/{start_time}` | Full conversation detail |
| GET | `/admin/conversations/{user_id}/{start_time}/export` | Export as JSON |
| POST | `/admin/conversations/messages/flag` | Flag/unflag message (superadmin) |

### System Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/health` | System health metrics |

### Admin Management (Superadmin Only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/admins` | Create new admin |
| GET | `/admin/admins` | List all admins |
| PATCH | `/admin/admins/{admin_id}` | Update admin (role, active status) |
| DELETE | `/admin/admins/{admin_id}` | Delete admin |
| POST | `/admin/seed` | Seed default admin |

## Frontend Technology

- **Vanilla JavaScript** (ES6+) - No build step required
- **Chart.js v4** - All charts (loaded from CDN)
- **Pico.css** - Minimal CSS framework (loaded from CDN)
- **CSS Custom Properties** - Dark theme with Saya brand colors
- **Responsive Design** - Mobile-first, collapsible sidebar
- **Auto-refresh** - Overview page refreshes every 30 seconds

## Deployment Notes

### Production Checklist

1. **Change default credentials** immediately
2. **Set strong `ADMIN_JWT_SECRET`** in environment
3. **Configure CORS** for your admin domain
4. **Enable HTTPS** - Admin dashboard requires secure context
5. **Set up monitoring** for `/admin/health` endpoint
6. **Configure log aggregation** for API metrics and errors
7. **Backup database** regularly (admin_users, api_metrics, crisis_events)

### Database Migrations

Run the updated `schema.sql` in your Supabase SQL Editor to create:
- `admin_users` table with RLS policies
- `api_metrics` table with indexes
- `crisis_events` table with indexes
- Updated triggers and RLS policies

### Performance

- Analytics aggregations cached for **5 minutes** (configurable in `analytics.py`)
- Heavy queries use Supabase server-side filtering
- Charts render client-side from JSON data
- Pagination limits default to 20 items per page

## Extending the Dashboard

### Adding New Metrics

1. Add aggregation function in `app/services/analytics.py`
2. Add cache key and TTL
3. Expose via new endpoint in `app/routers/admin.py`
4. Add chart/table in `static/admin/index.html`
5. Add rendering logic in `static/admin/admin.js`

### Adding New Pages

1. Add `<section id="page-newpage" class="page">` in HTML
2. Add navigation item in sidebar
3. Add `case 'newpage':` in `loadPage()` function
4. Implement data loading and rendering functions

## Troubleshooting

### Common Issues

**"Invalid or expired admin token"**
- Check `ADMIN_JWT_SECRET` matches in config and .env
- Token may have expired (8 hours) - refresh or re-login

**Charts not rendering**
- Verify Chart.js CDN is accessible
- Check browser console for JavaScript errors
- Ensure canvas elements have IDs matching chart code

**Admin login fails**
- Verify default admin was seeded: check `admin_users` table
- Check Supabase connection and RLS policies
- Verify password hashing works (bcrypt)

**Slow analytics loading**
- First load populates cache (5 min TTL)
- Check Supabase query performance
- Consider adding database indexes for heavy queries

### Logs

Admin actions and API metrics are logged to:
- `api_metrics` table (all requests with duration)
- `analytics_events` table (custom events)
- Standard application logs (FastAPI/Uvicorn)

## Security

- All admin routes protected by JWT middleware
- Role-based access control (RBAC) via RLS policies
- Separate JWT secret from user authentication
- Passwords bcrypt-hashed
- CORS configured for production domains
- Rate limiting recommended at reverse proxy level

## Support

For issues or feature requests, check the main project documentation or create an issue in the repository.