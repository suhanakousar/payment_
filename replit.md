# Payment Aggregator Platform

A SaaS-grade multi-gateway payment infrastructure dashboard built with Next.js 16, Prisma 7, and PostgreSQL.

## Architecture

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Database**: PostgreSQL via Replit's built-in DB, managed with Prisma 7
- **Styling**: Tailwind CSS v4
- **UI**: Lucide React, Framer Motion, Recharts, TanStack Table
- **HTTP Client**: Axios + SWR

## Running the App

The app runs on port 5000 via the "Start application" workflow using `npm run dev`.

## Database

Replit's built-in PostgreSQL is used. The `DATABASE_URL` environment variable is automatically set.
- Schema managed by Prisma: `prisma/schema.prisma`
- Prisma config (connection URL): `prisma.config.ts`
- To push schema changes: `npm run db:push`
- To generate client after schema changes: `npm run prisma:generate`

## Features

- **White-label gateway**: No third-party gateway names exposed in UI; backend routes internally through multiple providers
- **Dispute system**: Full dispute lifecycle (PENDING → UNDER_REVIEW → RESOLVED) with reason tracking (FAILED_PAYMENT, RETURN, COMPLAINT)
- **Chargeback system**: Final refund decision stage linked to disputes (PENDING → ACCEPTED/REJECTED/COMPLETED/EXPIRED) with deadline tracking and auto-expiry
- **Dashboard**: Dispute/chargeback stats row, System Performance metrics (replacing Gateway Health), no gateway names in recent transactions

## API Routes (v1)

- `POST /api/v1/disputes` — Create dispute (validates no duplicate per transaction)
- `GET /api/v1/disputes` — List disputes (filterable by status)
- `PATCH /api/v1/disputes/:id` — Update dispute status
- `POST /api/v1/chargebacks` — Create chargeback from dispute (prevents duplicate per dispute)
- `GET /api/v1/chargebacks` — List chargebacks (auto-expires passed deadlines)
- `PATCH /api/v1/chargebacks/:id` — Accept or reject a pending chargeback

## Key Directories

- `src/app/` — Next.js App Router pages and API routes
- `src/app/dashboard/disputes/` — Disputes management page
- `src/app/dashboard/chargebacks/` — Chargebacks management page
- `src/app/api/v1/disputes/` — Dispute API routes
- `src/app/api/v1/chargebacks/` — Chargeback API routes
- `src/components/` — Shared React components
- `src/lib/` — Utilities and mock data
- `src/types/` — TypeScript type definitions
- `prisma/` — Prisma schema (includes Dispute and Chargeback models)

## UI Design System

- **Color palette**: EEF2FF page background, dark navy sidebar (#0C0F1E), indigo/violet primary accent
- **Cards**: `rounded-2xl` with indigo-tinted shadows, glass morphism utilities
- **Sidebar**: Collapsible, animated logo with glow, active state gradient, MAIN MENU section label
- **Topbar**: Glass morphism, search bar, AI badge, animated notification bell, user profile with tier display
- **Dashboard**: Rich gradient indigo welcome banner with Live badge and quick-stat pills
- **Auth pages**: Split-panel layout — form card on left, deep indigo promo panel on right with stats grid and testimonial
- **Animations**: float, glow-pulse, ping-slow, shimmer skeleton, pulse-gentle defined in globals.css
- **Buttons**: `rounded-xl`, gradient primary, shadow-lift on hover

## Replit-Specific Configuration

- Dev server binds to `0.0.0.0:5000` for Replit preview compatibility
- `next.config.ts` sets `allowedDevOrigins: ["*"]` for proxied iframe support
- `prisma.config.ts` handles DB connection URL (Prisma 7 config format)
- Hydration-sensitive elements (date/greeting) use `suppressHydrationWarning`
