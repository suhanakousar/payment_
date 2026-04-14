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

## Key Directories

- `src/app/` — Next.js App Router pages and API routes
- `src/components/` — Shared React components
- `src/lib/` — Utilities and mock data
- `src/types/` — TypeScript type definitions
- `prisma/` — Prisma schema

## Replit-Specific Configuration

- Dev server binds to `0.0.0.0:5000` for Replit preview compatibility
- `next.config.ts` sets `allowedDevOrigins: ["*"]` for proxied iframe support
- `prisma.config.ts` handles DB connection URL (Prisma 7 config format)
