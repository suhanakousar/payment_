# PayAgg — Payment Aggregator Platform

A SaaS-grade multi-gateway payment infrastructure dashboard built with Next.js 16, Prisma 7 (pg adapter), and PostgreSQL. Fully production-wired with real auth, Cashfree production integration, webhooks, cron jobs, and a live dashboard — no mock data.

## Architecture

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Database**: PostgreSQL via Replit's built-in DB, managed with Prisma 7 + `@prisma/adapter-pg`
- **Auth**: bcryptjs password hashing + JWT (jsonwebtoken) access/refresh tokens, httpOnly cookies (7-day TTL), auto-refresh via `fetchWithAuth`
- **Payments**: Cashfree production gateway (`src/lib/cashfree.ts`) + Razorpay fallback; dynamic routing
- **Webhooks**: Cashfree HMAC-SHA256 + Razorpay signature verification
- **Cron**: node-cron (instrumentation.ts) — expires overdue chargebacks every 5 minutes
- **Proxy (auth guard)**: `src/proxy.ts` — Next.js 16 edge proxy using `jose` for JWT verification
- **Styling**: Tailwind CSS v4, Obsidian dark theme
- **UI**: Lucide React, Framer Motion, Recharts, TanStack Table

## Running the App

The app runs on port 5000 via the "Start application" workflow using `npm run dev`.

## Database

Replit's built-in PostgreSQL is used. The `DATABASE_URL` environment variable is automatically set.
- Schema: `prisma/schema.prisma`
- Prisma config: `prisma.config.ts`
- Prisma singleton with pg adapter: `src/lib/prisma.ts`
- Push schema: `npm run db:push`
- Generate client: `npx prisma generate`

### Merchant Model — Bank & Webhook Fields
The `Merchant` model includes: `bankAccountNumber`, `bankAccountName`, `bankIfscCode`, `bankName`, `bankBranch`, `settlementSchedule`, `webhookUrl`, `webhookSecret`.

### First-time seed

Hit `GET /api/v1/setup/seed` once to create:
- User: `admin@payagg.io` / `admin123456`
- Demo merchant + 8 sample transactions + disputes/chargebacks/payouts

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Auto-set | PostgreSQL connection string (Replit provides this) |
| `JWT_SECRET` | Recommended | Signs access tokens |
| `JWT_REFRESH_SECRET` | Recommended | Signs refresh tokens |
| `CASHFREE_ENV` | Required | `production` or `sandbox` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Optional | Firebase (if used for auth) |
| `RAZORPAY_KEY_ID` | Optional | Razorpay API key (falls back to simulated orders if absent) |
| `RAZORPAY_KEY_SECRET` | Optional | Razorpay secret |
| `RAZORPAY_WEBHOOK_SECRET` | Optional | Razorpay webhook HMAC verification |

## API Routes (v1)

### Auth
- `POST /api/v1/auth/login` — bcrypt verify + JWT cookie
- `POST /api/v1/auth/register` — hash password + create User + Merchant
- `GET  /api/v1/setup/seed` — seed default admin user (idempotent)

### Setup / Configuration
- `GET  /api/v1/setup` — fetch Cashfree config, bank account details, webhook URL/secret
- `PATCH /api/v1/setup` — update Cashfree keys, bank fields, webhook URL/secret

### Payments
- `POST /api/v1/payments` — create Cashfree/Razorpay order, persist Transaction
- `POST /api/v1/webhooks/cashfree` — verify HMAC-SHA256 sig, update Transaction, log WebhookLog
- `POST /api/v1/webhooks/razorpay` — verify HMAC-SHA256 sig, update Transaction

### Transactions
- `GET  /api/v1/transactions` — list with filters + pagination
- `GET  /api/v1/transactions/:id` — single transaction

### Disputes
- `POST /api/v1/disputes` — create (no duplicate per transaction)
- `GET  /api/v1/disputes` — list, filterable by status
- `PATCH /api/v1/disputes/:id` — update status

### Chargebacks
- `POST /api/v1/chargebacks` — create from dispute
- `GET  /api/v1/chargebacks` — list (auto-expires passed deadlines)
- `PATCH /api/v1/chargebacks/:id` — accept (triggers REFUND) or reject

### Payouts
- `GET  /api/v1/payouts` — list payouts
- `POST /api/v1/payouts` — create payout

### API Keys
- `GET  /api/v1/keys` — list keys (masked)
- `POST /api/v1/keys` — create + hash key
- `DELETE /api/v1/keys/:id` — revoke

### Analytics
- `GET /api/v1/analytics/dashboard` — KPIs: revenue, success rate, disputes, chargebacks, txn status distribution
- `GET /api/v1/analytics/revenue?period=7d|30d|90d` — daily revenue buckets for chart
- `GET /api/v1/analytics/gateway-health` — per-gateway success rate, avg latency, uptime from real transactions

### Profile
- `GET  /api/v1/profile` — fetch user + merchant details
- `PATCH /api/v1/profile` — update profile fields

### Webhooks Log
- `GET /api/v1/webhooks` — list WebhookLog entries

## Dashboard Pages — All Wired to Real APIs (No Mock Data)

| Page | API(s) Used |
|---|---|
| Dashboard Overview | `/api/v1/analytics/dashboard` |
| Transactions | `/api/v1/transactions` |
| Analytics | `/api/v1/analytics/dashboard`, `/api/v1/analytics/revenue`, `/api/v1/analytics/gateway-health` |
| Disputes | `/api/v1/disputes` |
| Chargebacks | `/api/v1/chargebacks` |
| Payouts | `/api/v1/payouts` |
| Settings → Gateway | `/api/v1/setup` |
| Settings → API Keys | `/api/v1/keys` |
| Settings → Webhooks | `/api/v1/setup`, `/api/v1/webhooks` |
| Settings → Bank | `/api/v1/setup` |
| Profile | `/api/v1/profile` |

## Key Files

- `src/lib/prisma.ts` — Prisma singleton with pg adapter
- `src/lib/auth.ts` — bcryptjs + jsonwebtoken helpers
- `src/lib/cashfree.ts` — Cashfree order creation + HMAC webhook verification
- `src/lib/fetch-with-auth.ts` — authenticated fetch with auto JWT refresh on 401
- `src/lib/ratelimit.ts` — in-memory rate limiter (100 req / 15 min per IP)
- `src/proxy.ts` — Next.js 16 edge proxy: JWT auth guard on `/dashboard/*`
- `src/instrumentation.ts` — node-cron: expires overdue chargebacks every 5 min
- `src/app/api/v1/setup/route.ts` — unified config GET/PATCH (Cashfree + bank + webhook)

## UI Design System

- **Theme**: Obsidian dark (`#0A0E1A` base, `#0D1526` cards, cyan/violet accents)
- **Sidebar**: Collapsible, animated logo, active gradient, MAIN MENU section label
- **Topbar**: Glass morphism, search, AI badge, notification bell, user profile with tier
- **Dashboard**: Gradient welcome banner with live KPI pills; 4 stat cards; dispute/chargeback row; Recharts line + donut + bar charts; recent transactions table
- **Auth**: Split-panel — form on left, indigo promo panel on right
- **Checkout**: `/checkout/[orderId]` — Cashfree JS SDK order payment page
- **Animations**: float, glow-pulse, ping-slow, shimmer skeleton, pulse-gentle in globals.css

## Replit-Specific Configuration

- Dev server binds to `0.0.0.0:5000` for Replit preview compatibility
- `next.config.ts`: `allowedDevOrigins: ["*"]` for proxied iframe support
- `prisma.config.ts`: Prisma 7 config format for DB connection
- Hydration-sensitive elements use `suppressHydrationWarning`
