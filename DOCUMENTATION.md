# PayAgg - Payment Aggregator Platform

## Complete Technical Documentation

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Prerequisites & Requirements](#3-prerequisites--requirements)
4. [Project Structure](#4-project-structure)
5. [Environment Setup](#5-environment-setup)
6. [Database Schema](#6-database-schema)
7. [Authentication Flow](#7-authentication-flow)
8. [Payment Flow](#8-payment-flow)
9. [Payout Flow](#9-payout-flow)
10. [API Reference](#10-api-reference)
11. [Dashboard Pages & Features](#11-dashboard-pages--features)
12. [Component Library](#12-component-library)
13. [Type Definitions](#13-type-definitions)
14. [Utility Functions](#14-utility-functions)
15. [Webhook System](#15-webhook-system)
16. [API Key Management](#16-api-key-management)
17. [Design System & Styling](#17-design-system--styling)
18. [Scripts & Commands](#18-scripts--commands)
19. [Architecture Diagram](#19-architecture-diagram)
20. [Current Limitations & Roadmap](#20-current-limitations--roadmap)

---

## 1. Project Overview

**PayAgg** is a SaaS-grade multi-gateway payment aggregator platform that allows merchants to accept payments and send payouts through multiple payment gateways (Razorpay, Cashfree, Stripe) from a single unified dashboard.

### What It Does

- **Accept Payments**: Create payment intents routed to the best gateway automatically
- **Send Payouts**: Disburse funds to bank accounts via IMPS/NEFT/RTGS/UPI
- **Monitor Everything**: Real-time dashboard with KPIs, charts, and analytics
- **Manage API Keys**: Generate and revoke scoped API keys for programmatic access
- **Track Webhooks**: Full audit trail of webhook events from all gateways
- **Multi-Role Access**: Role-based access for admins, ops, devs, and analysts

### Who It's For

Merchants and businesses that need to:
- Route payments across multiple gateways for better success rates
- Manage payouts/disbursements at scale
- Have a unified view of all payment operations
- Integrate payments via REST API

---

## 2. Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | Next.js | 16.2.3 | Full-stack React framework (App Router) |
| **Language** | TypeScript | 5.9.3 | Type-safe JavaScript |
| **UI Library** | React | 19.2.4 | Component-based UI |
| **Styling** | Tailwind CSS | 4.2.2 | Utility-first CSS |
| **ORM** | Prisma | 7.7.0 | Database access & migrations |
| **Database** | PostgreSQL | - | Primary data store |
| **Cache** | Redis | - | Caching & job queues |
| **Charts** | Recharts | 3.8.1 | Data visualization |
| **Tables** | TanStack Table | 8.21.3 | Advanced data tables |
| **Animations** | Framer Motion | 12.38.0 | UI animations |
| **Icons** | Lucide React | 1.8.0 | Icon library |
| **HTTP Client** | Axios | 1.15.0 | API requests |
| **Data Fetching** | SWR | 2.4.1 | Client-side data fetching with caching |
| **Validation** | Zod | 4.3.6 | Schema validation |
| **Class Utils** | CVA + clsx + tailwind-merge | - | Conditional class management |
| **Date Utils** | date-fns | 4.1.0 | Date formatting & manipulation |

---

## 3. Prerequisites & Requirements

### System Requirements

- **Node.js** >= 18.x
- **npm** or **yarn** or **pnpm**
- **PostgreSQL** >= 14.x (running on port 5432 or 5433)
- **Redis** (optional, for caching/queues)
- **Git**

### Required Accounts (for production)

| Service | Purpose | Sign Up |
|---------|---------|---------|
| **Razorpay** | Indian payment gateway | dashboard.razorpay.com |
| **Cashfree** | Indian payment gateway | merchant.cashfree.com |
| **Stripe** | International payment gateway | dashboard.stripe.com |
| **SendGrid** (optional) | Email notifications | sendgrid.com |
| **MSG91** (optional) | SMS/OTP notifications | msg91.com |
| **Sentry** (optional) | Error tracking | sentry.io |

---

## 4. Project Structure

```
payment_/
├── prisma/
│   ├── schema.prisma              # Database schema (models, enums, relations)
│   ├── prisma.config.ts           # Prisma configuration
│   └── migrations/                # Database migration history
│       └── 20260414113000_init/   # Initial migration
│
├── src/
│   ├── app/                       # Next.js App Router (pages + API)
│   │   │
│   │   ├── layout.tsx             # Root HTML layout (font, metadata)
│   │   ├── page.tsx               # Landing page (public)
│   │   ├── globals.css            # Global styles, CSS variables, Tailwind
│   │   │
│   │   ├── (auth)/                # Authentication route group
│   │   │   ├── layout.tsx         # Auth-specific layout (split-screen)
│   │   │   ├── login/
│   │   │   │   └── page.tsx       # Login page (email/phone + OTP)
│   │   │   └── register/
│   │   │       └── page.tsx       # 3-step registration wizard
│   │   │
│   │   ├── dashboard/             # Authenticated merchant dashboard
│   │   │   ├── layout.tsx         # Dashboard shell (sidebar + topbar)
│   │   │   ├── page.tsx           # Main dashboard (KPIs, charts)
│   │   │   ├── payments/
│   │   │   │   └── page.tsx       # Payment list, search, filter
│   │   │   ├── payouts/
│   │   │   │   └── page.tsx       # Payout management
│   │   │   ├── transactions/
│   │   │   │   └── page.tsx       # Transaction search & export
│   │   │   ├── analytics/
│   │   │   │   └── page.tsx       # Advanced analytics
│   │   │   └── settings/
│   │   │       ├── page.tsx       # Settings hub
│   │   │       ├── profile/
│   │   │       │   └── page.tsx   # Merchant profile
│   │   │       ├── bank/
│   │   │       │   └── page.tsx   # Bank account config
│   │   │       ├── webhooks/
│   │   │       │   └── page.tsx   # Webhook management
│   │   │       └── api-keys/
│   │   │           └── page.tsx   # API key management
│   │   │
│   │   └── api/v1/                # REST API routes
│   │       ├── auth/
│   │       │   ├── login/route.ts
│   │       │   └── register/route.ts
│   │       ├── payments/
│   │       │   ├── route.ts       # List + Create payment
│   │       │   └── [id]/route.ts  # Payment detail
│   │       ├── payouts/
│   │       │   ├── route.ts       # List + Create payout
│   │       │   └── bulk/route.ts  # Bulk payout
│   │       ├── transactions/
│   │       │   ├── route.ts       # List transactions
│   │       │   └── export/route.ts # Export CSV/Excel
│   │       ├── keys/
│   │       │   ├── route.ts       # List + Generate keys
│   │       │   └── [id]/route.ts  # Key detail + revoke
│   │       ├── webhooks/
│   │       │   └── test/route.ts  # Test webhook delivery
│   │       ├── analytics/
│   │       │   ├── revenue/route.ts
│   │       │   └── gateway-health/route.ts
│   │       └── health/route.ts    # System health check
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── sidebar.tsx        # Collapsible navigation sidebar
│   │   │   └── topbar.tsx         # Header bar with user menu
│   │   └── ui/                    # Reusable UI components
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── modal.tsx
│   │       ├── select.tsx
│   │       ├── skeleton.tsx
│   │       ├── stat-card.tsx
│   │       └── table.tsx
│   │
│   ├── lib/
│   │   ├── utils.ts               # Helper functions (formatting, etc.)
│   │   └── mock-data.ts           # Mock datasets for development
│   │
│   └── types/
│       └── index.ts               # All TypeScript interfaces & types
│
├── .env.example                   # Environment variable template
├── package.json                   # Dependencies & scripts
├── next.config.ts                 # Next.js configuration
├── tsconfig.json                  # TypeScript configuration
├── postcss.config.mjs             # PostCSS (Tailwind plugin)
├── eslint.config.mjs              # ESLint configuration
└── CLAUDE.md                      # AI assistant instructions
```

---

## 5. Environment Setup

### Step 1: Clone & Install

```bash
git clone <repo-url> payment_
cd payment_
npm install
```

### Step 2: Set Up Environment Variables

Copy the example and fill in your values:

```bash
cp .env.example .env
```

#### Required Variables

```env
# ─── Server ──────────────────────────────────────────
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5000

# ─── Database (PostgreSQL) ───────────────────────────
DATABASE_URL=postgresql://payagg_user:password@localhost:5432/payagg_dev

# ─── Cache (Redis) ──────────────────────────────────
REDIS_URL=redis://localhost:6379

# ─── Authentication ─────────────────────────────────
JWT_ACCESS_SECRET=<64-char-hex-string>
JWT_REFRESH_SECRET=<64-char-hex-string>

# ─── Encryption ─────────────────────────────────────
AES_ENCRYPTION_KEY=<32-byte-hex-key>
```

#### Payment Gateway Keys

```env
# ─── Razorpay ───────────────────────────────────────
RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=xxxx
RAZORPAY_WEBHOOK_SECRET=xxxx

# ─── Cashfree ───────────────────────────────────────
CASHFREE_APP_ID=xxxx
CASHFREE_SECRET_KEY=xxxx
CASHFREE_WEBHOOK_SECRET=xxxx

# ─── Stripe ─────────────────────────────────────────
STRIPE_SECRET_KEY=sk_test_xxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxx
```

#### Optional Services

```env
SENDGRID_API_KEY=SG.xxxx          # Email notifications
MSG91_AUTH_KEY=xxxx                # SMS/OTP
SENTRY_DSN=https://xxxx@sentry.io # Error tracking
```

### Step 3: Set Up the Database

```bash
# Generate Prisma client
npm run prisma:generate

# Push schema to database (development)
npm run db:push

# Or run migrations (production)
npm run db:migrate
```

### Step 4: Start the Dev Server

```bash
npm run dev
```

The app will be available at **http://localhost:5000**.

---

## 6. Database Schema

### Entity Relationship Overview

```
User ──────────┐
               │ belongs to
               ▼
Merchant ──────┬──── Transaction ──── WebhookLog
               │
               ├──── Payout ────────── WebhookLog
               │
               ├──── ApiKey
               │
               ├──── AuditLog
               │
               └──── MerchantConfig
```

### Models in Detail

#### User
| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| merchantId | String? | FK to Merchant |
| email | String (unique) | Login email |
| phone | String? (unique) | Login phone |
| passwordHash | String | Bcrypt hash |
| role | UserRole | SUPER_ADMIN, MERCHANT_ADMIN, OPS, DEV, ANALYST |
| status | UserStatus | ACTIVE, SUSPENDED, PENDING_VERIFICATION |
| lastLoginAt | DateTime? | Last login timestamp |
| createdAt | DateTime | Auto-set on creation |
| updatedAt | DateTime | Auto-updated |

#### Merchant
| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| businessName | String | Registered business name |
| gstin | String? | GST identification number |
| pan | String? | PAN card number |
| kycStatus | KycStatus | PENDING, VERIFIED, REJECTED |
| tier | MerchantTier | STARTER, GROWTH, ENTERPRISE |
| dailyPayoutLimit | Decimal(18,2) | Max daily payout amount |
| preferredGateway | GatewayName | Default gateway selection |
| webhookUrl | String? | Merchant's webhook endpoint |
| webhookSecret | String? | HMAC signing secret |

#### Transaction
| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| merchantId | String | FK to Merchant |
| gateway | GatewayName | Which gateway processed this |
| gatewayOrderId | String? | Gateway's order reference |
| gatewayPaymentId | String? | Gateway's payment reference |
| amount | Decimal(18,2) | Amount in paise |
| currency | String | Default: "INR" |
| status | TransactionStatus | PENDING, AUTHORIZED, CAPTURED, FAILED, REFUNDED, PARTIALLY_REFUNDED |
| paymentMethod | String? | upi, card, netbanking, wallet |
| customerEmail | String? | Customer's email |
| customerPhone | String? | Customer's phone |
| idempotencyKey | String? (unique) | Prevents duplicate transactions |
| metadata | JSON? | Custom key-value data |

#### Payout
| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| merchantId | String | FK to Merchant |
| batchId | String? | Groups batch payouts together |
| gateway | GatewayName | Processing gateway |
| beneficiaryName | String | Recipient's name |
| accountNumber | String | Bank account number |
| ifscCode | String | Bank IFSC code |
| amount | Decimal(18,2) | Amount in paise |
| mode | PayoutMode | IMPS, NEFT, RTGS, UPI |
| status | PayoutStatus | QUEUED, PROCESSING, SUCCESS, FAILED, PERMANENTLY_FAILED, CANCELLED |
| retryCount | Int | Number of retry attempts |
| failureReason | String? | Why it failed |
| scheduledAt | DateTime? | Scheduled execution time |
| processedAt | DateTime? | When it was processed |

#### ApiKey
| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| merchantId | String | FK to Merchant |
| name | String | Human-readable label |
| keyPrefix | String | Visible prefix (e.g., pk_live_xxx) |
| keyHash | String | SHA-256 hash of secret |
| scope | String[] | Permission scopes |
| environment | String | "live" or "sandbox" |
| isActive | Boolean | Can be revoked |
| expiresAt | DateTime? | Optional expiry |

#### WebhookLog
| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| transactionId | String? | FK to Transaction |
| payoutId | String? | FK to Payout |
| source | String | Gateway that sent it |
| eventType | String | e.g., payment.captured |
| eventId | String (unique) | Deduplication ID |
| payload | JSON | Full webhook body |
| signatureValid | Boolean | HMAC verification result |
| processed | Boolean | Whether it was acted upon |

#### AuditLog
| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| userId | String | Who performed the action |
| merchantId | String? | Which merchant context |
| action | String | e.g., "CREATE_PAYOUT" |
| resourceType | String | e.g., "Transaction" |
| resourceId | String? | ID of affected resource |
| ipAddress | String? | Client IP |
| userAgent | String? | Client user agent |
| details | JSON? | Additional context |

#### MerchantConfig
| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| merchantId | String (unique) | FK to Merchant |
| razorpayKeyId | String? | Per-merchant Razorpay key |
| razorpayKeySecret | String? | Per-merchant Razorpay secret |
| cashfreeAppId | String? | Per-merchant Cashfree app ID |
| cashfreeSecretKey | String? | Per-merchant Cashfree secret |
| stripeSecretKey | String? | Per-merchant Stripe key |
| gatewayWeights | JSON? | Routing weights (e.g., {"RAZORPAY": 70, "CASHFREE": 30}) |
| maxAmount | Decimal? | Per-merchant transaction limit |

### Enums

```
UserRole:          SUPER_ADMIN | MERCHANT_ADMIN | OPS | DEV | ANALYST
UserStatus:        ACTIVE | SUSPENDED | PENDING_VERIFICATION
KycStatus:         PENDING | VERIFIED | REJECTED
MerchantTier:      STARTER | GROWTH | ENTERPRISE
GatewayName:       RAZORPAY | CASHFREE | STRIPE | AUTO
TransactionStatus: PENDING | AUTHORIZED | CAPTURED | FAILED | REFUNDED | PARTIALLY_REFUNDED
PayoutMode:        IMPS | NEFT | RTGS | UPI
PayoutStatus:      QUEUED | PROCESSING | SUCCESS | FAILED | PERMANENTLY_FAILED | CANCELLED
```

---

## 7. Authentication Flow

### Registration (3-Step Wizard)

```
Step 1: Business Details          Step 2: Personal Info          Step 3: Verification
┌─────────────────────┐          ┌──────────────────────┐       ┌─────────────────────┐
│ Business Name *      │          │ Full Name *           │       │ Email OTP *          │
│ Business Type *      │   ──►   │ Email *               │  ──►  │ Phone OTP *          │
│ Website              │          │ Phone *               │       │ Accept Terms *       │
│ Monthly Volume       │          │ Password * (8+ chars) │       │                      │
└─────────────────────┘          └──────────────────────┘       └─────────────────────┘
```

**API**: `POST /api/v1/auth/register`

**Request Body**:
```json
{
  "business_name": "Arjun Retail Solutions",
  "email": "arjun@example.com",
  "password": "securepassword123",
  "phone": "+919876543210"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbG...",
    "refresh_token": "rt_mock_...",
    "user": {
      "id": "usr_8f3a9b12",
      "email": "arjun@example.com",
      "role": "MERCHANT_ADMIN",
      "merchant_id": "mrc_c4d7e2f1",
      "status": "PENDING_KYC"
    },
    "merchant": {
      "id": "mrc_c4d7e2f1",
      "business_name": "Arjun Retail Solutions",
      "kyc_status": "PENDING",
      "tier": "STARTER"
    },
    "expires_in": 900
  }
}
```

### Login

The login page supports two modes:
- **Email + Password**: Traditional login
- **Phone + OTP**: OTP-based passwordless login

**API**: `POST /api/v1/auth/login`

**Request Body**:
```json
{
  "email": "arjun@example.com",
  "password": "securepassword123"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbG...",
    "refresh_token": "rt_mock_...",
    "user": {
      "id": "usr_8f3a9b12",
      "email": "arjun@example.com",
      "role": "MERCHANT_ADMIN",
      "merchant_id": "mrc_c4d7e2f1"
    },
    "expires_in": 900
  }
}
```

### Token Lifecycle

```
Login/Register
      │
      ▼
┌─────────────┐     Expires after 15 min     ┌─────────────────┐
│ Access Token │  ────────────────────────►   │ Use Refresh Token│
│ (JWT, 15min) │                              │ to get new pair  │
└─────────────┘                              └─────────────────┘
      │                                              │
      ▼                                              ▼
  Attach to every                             POST /api/v1/auth/refresh
  API request as                              (not yet implemented)
  Authorization: Bearer <token>
```

### User Roles & Permissions

| Role | Description | Access Level |
|------|-------------|-------------|
| **SUPER_ADMIN** | Platform administrator | Full access to all merchants |
| **MERCHANT_ADMIN** | Merchant owner | Full access to own merchant |
| **OPS** | Operations team | Payments, payouts, transactions |
| **DEV** | Developer | API keys, webhooks, docs |
| **ANALYST** | Data analyst | Read-only analytics & reports |

---

## 8. Payment Flow

### End-to-End Payment Lifecycle

```
┌──────────┐     ┌──────────────┐     ┌───────────────┐     ┌──────────┐
│ Merchant  │     │   PayAgg     │     │   Gateway     │     │ Customer │
│  Server   │     │   Platform   │     │ (Razorpay/    │     │          │
│           │     │              │     │  Cashfree/    │     │          │
│           │     │              │     │  Stripe)      │     │          │
└────┬─────┘     └──────┬───────┘     └──────┬────────┘     └────┬─────┘
     │                  │                     │                   │
     │  1. Create       │                     │                   │
     │  Payment Intent  │                     │                   │
     │ ────────────────►│                     │                   │
     │                  │                     │                   │
     │  2. Return       │                     │                   │
     │  payment_url +   │                     │                   │
     │  transaction_id  │                     │                   │
     │ ◄────────────────│                     │                   │
     │                  │                     │                   │
     │  3. Redirect     │                     │                   │
     │  customer to     │                     │                   │
     │  payment_url     │                     │                   │
     │ ──────────────────────────────────────────────────────────►│
     │                  │                     │                   │
     │                  │                     │  4. Customer pays │
     │                  │                     │◄──────────────────│
     │                  │                     │                   │
     │                  │  5. Webhook:        │                   │
     │                  │  payment.captured   │                   │
     │                  │◄────────────────────│                   │
     │                  │                     │                   │
     │                  │  6. Verify HMAC     │                   │
     │                  │  signature          │                   │
     │                  │  Update txn status  │                   │
     │                  │  Log webhook        │                   │
     │                  │                     │                   │
     │  7. Webhook to   │                     │                   │
     │  merchant URL    │                     │                   │
     │◄─────────────────│                     │                   │
     │                  │                     │                   │
```

### Step-by-Step

1. **Merchant creates a payment intent** via `POST /api/v1/payments`
2. **PayAgg selects a gateway** (based on `gateway_preference` or AUTO routing)
3. **Returns a payment URL** and QR code to the merchant
4. **Customer is redirected** to the hosted payment page
5. **Customer completes payment** on the gateway's checkout
6. **Gateway sends a webhook** to PayAgg (e.g., `payment.captured`)
7. **PayAgg verifies the webhook** signature (HMAC), updates the transaction status
8. **PayAgg forwards** the event to the merchant's configured webhook URL

### Create Payment Intent

**`POST /api/v1/payments`**

```json
{
  "amount": 150000,
  "currency": "INR",
  "customer": {
    "email": "buyer@example.com",
    "phone": "+919876543210"
  },
  "gateway_preference": "RAZORPAY",
  "idempotency_key": "order_12345",
  "metadata": {
    "orderId": "ORD-2026-001",
    "plan": "premium"
  }
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "transaction_id": "txn_a1b2c3d4",
    "gateway_order_id": "order_Mock_X7Y8Z9",
    "gateway": "RAZORPAY",
    "amount": 150000,
    "currency": "INR",
    "status": "PENDING",
    "payment_url": "https://pay.mockgateway.io/checkout/txn_a1b2c3d4",
    "qr_code_url": "https://pay.mockgateway.io/qr/txn_a1b2c3d4.png",
    "expires_at": "2026-04-14T12:15:00.000Z",
    "idempotency_key": "order_12345",
    "customer": {
      "email": "buyer@example.com",
      "phone": "+919876543210"
    },
    "metadata": { "orderId": "ORD-2026-001", "plan": "premium" }
  }
}
```

### Transaction Status Flow

```
PENDING ──► AUTHORIZED ──► CAPTURED ──► REFUNDED
   │                           │
   │                           └──► PARTIALLY_REFUNDED
   │
   └──► FAILED
```

| Status | Meaning |
|--------|---------|
| **PENDING** | Payment intent created, awaiting customer action |
| **AUTHORIZED** | Payment authorized but not yet captured |
| **CAPTURED** | Payment successfully captured (money received) |
| **FAILED** | Payment failed (declined, timeout, error) |
| **REFUNDED** | Full refund processed |
| **PARTIALLY_REFUNDED** | Partial refund processed |

### Gateway Selection (AUTO mode)

When `gateway_preference` is `AUTO`, the platform selects the best gateway based on:

- **Gateway health**: Current success rate and latency
- **Gateway weights**: Configured in `MerchantConfig.gatewayWeights` (e.g., `{"RAZORPAY": 70, "CASHFREE": 30}`)
- **Payment method**: Some gateways handle certain methods better
- **Amount**: Some gateways have per-transaction limits
- **Fallback**: If the primary gateway is down, route to the next healthy one

---

## 9. Payout Flow

### End-to-End Payout Lifecycle

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌────────────┐
│ Merchant  │     │   PayAgg     │     │   Gateway    │     │ Beneficiary│
│ Dashboard │     │   Platform   │     │              │     │ Bank Acct  │
└────┬─────┘     └──────┬───────┘     └──────┬───────┘     └─────┬──────┘
     │                  │                     │                   │
     │ 1. Create Payout │                     │                   │
     │ ────────────────►│                     │                   │
     │                  │                     │                   │
     │ 2. Validate &    │                     │                   │
     │    Queue         │                     │                   │
     │ ◄────────────────│                     │                   │
     │   (status:QUEUED)│                     │                   │
     │                  │                     │                   │
     │                  │ 3. Process payout   │                   │
     │                  │ ───────────────────►│                   │
     │                  │  (status:PROCESSING)│                   │
     │                  │                     │                   │
     │                  │                     │ 4. Transfer funds │
     │                  │                     │ ─────────────────►│
     │                  │                     │                   │
     │                  │ 5. Webhook:         │                   │
     │                  │ payout.processed    │                   │
     │                  │◄────────────────────│                   │
     │                  │  (status:SUCCESS)   │                   │
     │                  │                     │                   │
     │ 6. Notify        │                     │                   │
     │ merchant         │                     │                   │
     │◄─────────────────│                     │                   │
     │                  │                     │                   │
```

### Create Payout

**`POST /api/v1/payouts`**

```json
{
  "beneficiary_name": "Rahul Sharma",
  "account_number": "1234567890123456",
  "ifsc_code": "HDFC0001234",
  "amount": 500000,
  "mode": "IMPS",
  "reference": "salary_apr_2026",
  "schedule_at": "2026-04-15T06:00:00Z"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "pay_out_a1b2c3d4",
    "merchantId": "mrc_9f2a1b3c",
    "beneficiaryName": "Rahul Sharma",
    "accountNumber": "1234567890123456",
    "ifscCode": "HDFC0001234",
    "amount": 500000,
    "mode": "IMPS",
    "status": "QUEUED",
    "retryCount": 0,
    "gateway": "RAZORPAY",
    "scheduledAt": "2026-04-15T06:00:00Z"
  }
}
```

### Payout Status Flow

```
QUEUED ──► PROCESSING ──► SUCCESS
                │
                ├──► FAILED ──► (retry up to N times) ──► PERMANENTLY_FAILED
                │
                └──► CANCELLED
```

| Status | Meaning |
|--------|---------|
| **QUEUED** | Payout created and waiting in queue |
| **PROCESSING** | Being processed by the gateway |
| **SUCCESS** | Funds transferred to beneficiary |
| **FAILED** | Transfer failed (will be retried) |
| **PERMANENTLY_FAILED** | Failed after all retries exhausted |
| **CANCELLED** | Manually cancelled before processing |

### Payout Modes

| Mode | Speed | Limit | Availability |
|------|-------|-------|-------------|
| **IMPS** | Instant (seconds) | Up to 5L per txn | 24/7 |
| **NEFT** | 30 min - 2 hours | No upper limit | Banking hours |
| **RTGS** | 30 minutes | Minimum 2L | Banking hours |
| **UPI** | Instant (seconds) | Up to 1L per txn | 24/7 |

### Bulk Payouts

**`POST /api/v1/payouts/bulk`**

Process multiple payouts in a single batch. Each payout in the batch gets a shared `batchId` for tracking.

---

## 10. API Reference

### Standard Response Format

All API responses follow this structure:

```json
{
  "success": true | false,
  "data": { ... },
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { ... }
  },
  "pagination": {
    "page": 1,
    "per_page": 10,
    "total": 150,
    "pages": 15
  },
  "meta": {
    "request_id": "req_1713100800000",
    "timestamp": "2026-04-14T12:00:00.000Z"
  }
}
```

### Error Codes

| Code | HTTP Status | Meaning |
|------|------------|---------|
| `INVALID_CREDENTIALS` | 400 | Wrong email/password |
| `VALIDATION_ERROR` | 400 | Missing or invalid fields |
| `INVALID_EMAIL` | 400 | Malformed email address |
| `WEAK_PASSWORD` | 400 | Password < 8 characters |
| `INVALID_AMOUNT` | 400 | Amount <= 0 or not a number |
| `MISSING_CUSTOMER` | 400 | No customer email or phone |
| `INVALID_MODE` | 400 | Invalid payout mode |
| `INVALID_ENVIRONMENT` | 400 | Environment not "live" or "sandbox" |
| `INVALID_SCOPE` | 400 | Unknown API key scope |
| `NOT_FOUND` | 404 | Resource not found |

### Complete Endpoint List

#### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register a new merchant account |
| POST | `/api/v1/auth/login` | Login with email + password |

#### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/payments` | List payments (paginated, filterable) |
| POST | `/api/v1/payments` | Create a payment intent |
| GET | `/api/v1/payments/:id` | Get payment detail + timeline + webhook events |

#### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/transactions` | List transactions (advanced filtering) |
| POST | `/api/v1/transactions/export` | Export as CSV or Excel |

#### Payouts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/payouts` | List payouts (paginated, filterable) |
| POST | `/api/v1/payouts` | Create a single payout |
| POST | `/api/v1/payouts/bulk` | Create bulk payouts (batch) |

#### API Keys
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/keys` | List all API keys (secrets masked) |
| POST | `/api/v1/keys` | Generate a new API key pair |
| GET | `/api/v1/keys/:id` | Get key details |
| DELETE | `/api/v1/keys/:id` | Revoke/deactivate a key |

#### Webhooks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/webhooks/test` | Send a test webhook to merchant URL |

#### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/analytics/revenue?period=30d` | Revenue data points for charting |
| GET | `/api/v1/analytics/gateway-health` | Gateway operational status |

#### System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | System health (DB, Redis, queues, gateways) |

### Query Parameters for List Endpoints

#### Payments (`GET /api/v1/payments`)

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `per_page` | number | 10 | Items per page (max 100) |
| `status` | string | - | Filter: PENDING, CAPTURED, FAILED, etc. |
| `gateway` | string | - | Filter: RAZORPAY, CASHFREE, STRIPE |
| `method` | string | - | Filter: upi, card, netbanking, wallet |
| `search` | string | - | Search by ID, email, order ID |
| `from` | date | - | Start date (ISO format) |
| `to` | date | - | End date (ISO format) |
| `min_amount` | number | - | Minimum amount (paise) |
| `max_amount` | number | - | Maximum amount (paise) |
| `sort` | string | -createdAt | Sort field (prefix `-` for descending) |

#### Payouts (`GET /api/v1/payouts`)

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `per_page` | number | 10 | Items per page (max 100) |
| `status` | string | - | Filter: QUEUED, PROCESSING, SUCCESS, FAILED |
| `mode` | string | - | Filter: IMPS, NEFT, RTGS, UPI |
| `search` | string | - | Search by ID, beneficiary, account, IFSC, batch |
| `from` | date | - | Start date |
| `to` | date | - | End date |

### API Key Scopes

| Scope | Description |
|-------|-------------|
| `payments:read` | View payment/transaction data |
| `payments:write` | Create payment intents, refunds |
| `payouts:read` | View payout data |
| `payouts:write` | Create and cancel payouts |
| `webhooks:read` | View webhook logs |
| `webhooks:write` | Configure webhook endpoints |
| `analytics:read` | View analytics and reports |

---

## 11. Dashboard Pages & Features

### Main Dashboard (`/dashboard`)

The main dashboard provides a real-time overview of payment operations:

```
┌───────────────────────────────────────────────────────────────────┐
│  Good morning, Arjun!                              [User Menu]   │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │Total Rev │  │ Total Txn│  │Success % │  │ Pending  │        │
│  │₹48.5L    │  │  1,247   │  │  96.2%   │  │Payouts:12│        │
│  │ +12.5%   │  │  +8.3%   │  │  +0.5%   │  │ ₹2.4L   │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│                                                                   │
│  ┌─────────────────────────────┐  ┌─────────────────────────┐   │
│  │     Revenue Chart           │  │   Gateway Health        │   │
│  │  [Area chart: 7d/30d/90d]  │  │  Razorpay: Healthy 99%  │   │
│  │  Revenue line + Payout line│  │  Cashfree: Healthy 97%  │   │
│  │                             │  │  Stripe:   Degraded 91% │   │
│  └─────────────────────────────┘  └─────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────┐  ┌─────────────────────────┐   │
│  │  Payment Method Breakdown   │  │  Txn Status Distribution│   │
│  │  [Donut chart]             │  │  [Bar chart]            │   │
│  │  UPI: 45% | Card: 30%     │  │  Captured: 1200         │   │
│  │  NB: 15%  | Wallet: 10%   │  │  Failed: 47             │   │
│  └─────────────────────────────┘  └─────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Recent Activity                                            │ │
│  │  [Success] Payment captured ₹12,500 via Razorpay - 2m ago │ │
│  │  [Warning] High failure rate on Stripe - 15m ago           │ │
│  │  [Info] Payout batch PAY-789 processed - 1h ago            │ │
│  │  [Error] Webhook delivery failed to merchant URL - 2h ago  │ │
│  └─────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

**Features**:
- 4 KPI stat cards with percentage change indicators
- Interactive revenue/payout area chart (switchable period: 7d, 30d, 90d)
- Gateway health status with success rate and latency
- Payment method breakdown donut chart
- Transaction status distribution bar chart
- Live recent activity feed with severity badges

### Payments Page (`/dashboard/payments`)

- **Search bar**: Search by transaction ID, email, gateway order ID
- **Status filters**: ALL, PENDING, CAPTURED, FAILED, REFUNDED
- **Gateway filters**: ALL, RAZORPAY, CASHFREE, STRIPE
- **Payment method filters**: ALL, UPI, Card, Netbanking, Wallet
- **Date range picker**: From / To dates
- **Amount range**: Min / Max amount
- **Data table**: ID, amount, status, gateway, method, customer, date
- **Actions**: View details, refund
- **Pagination**: Configurable page size

### Payouts Page (`/dashboard/payouts`)

- **Create payout form**: Beneficiary, account, IFSC, amount, mode, reference
- **Status filters**: ALL, QUEUED, PROCESSING, SUCCESS, FAILED
- **Mode filters**: ALL, IMPS, NEFT, RTGS, UPI
- **Bulk actions**: Process batch, cancel queued
- **Data table**: ID, beneficiary, amount, mode, status, retry count, date

### Transactions Page (`/dashboard/transactions`)

- **Advanced search**: Full-text search across all fields
- **Multi-filter**: Status, gateway, payment method, refund status, date range
- **Export**: CSV or Excel with selected columns
- **Summary stats**: Total amount, captured count, failed count, refund count

### Analytics Page (`/dashboard/analytics`)

- **Revenue trends**: Line/area charts with period selection
- **Gateway comparison**: Side-by-side performance metrics
- **Payment method insights**: Usage trends over time
- **Success rate tracking**: Historical success rate chart

### Settings Pages

#### Profile (`/dashboard/settings/profile`)
- Business name, GSTIN, PAN
- KYC status display
- Merchant tier info

#### Bank Account (`/dashboard/settings/bank`)
- Account holder name
- Account number (masked display)
- IFSC code with bank name lookup
- Account type (Savings/Current)

#### Webhooks (`/dashboard/settings/webhooks`)
- Webhook URL configuration
- Webhook secret management
- Event type subscriptions
- Test webhook delivery button
- Delivery log viewer

#### API Keys (`/dashboard/settings/api-keys`)
- Generate new keys with name, environment, scope, expiry
- Key list with prefix, status, last used, scopes
- Revoke/deactivate keys
- Usage visualization

---

## 12. Component Library

### Button (`components/ui/button.tsx`)

```tsx
<Button variant="primary" size="md" loading={false}>
  Pay Now
</Button>
```

| Prop | Values | Default |
|------|--------|---------|
| `variant` | primary, secondary, success, danger, ghost, amber | primary |
| `size` | sm, md, lg | md |
| `loading` | boolean | false |
| `disabled` | boolean | false |
| `fullWidth` | boolean | false |

### Input (`components/ui/input.tsx`)

```tsx
<Input label="Email" type="email" error="Invalid email" helperText="We'll never share it" />
```

### Select (`components/ui/select.tsx`)

```tsx
<Select label="Gateway" options={[{ label: "Razorpay", value: "RAZORPAY" }]} />
```

### Card (`components/ui/card.tsx`)

```tsx
<Card>
  <CardHeader><CardTitle>Revenue</CardTitle></CardHeader>
  <CardContent>...</CardContent>
</Card>
```

### Badge (`components/ui/badge.tsx`)

```tsx
<Badge variant="success">CAPTURED</Badge>
```

### Modal (`components/ui/modal.tsx`)

```tsx
<Modal isOpen={true} onClose={close} title="Confirm Refund">
  <p>Are you sure?</p>
</Modal>
```

### StatCard (`components/ui/stat-card.tsx`)

```tsx
<StatCard title="Total Revenue" value="₹48.5L" change={12.5} icon={IndianRupee} />
```

### Skeleton (`components/ui/skeleton.tsx`)

```tsx
<Skeleton className="h-4 w-[200px]" />
```

---

## 13. Type Definitions

All TypeScript types are defined in `src/types/index.ts`:

```typescript
// Core entities
User, Merchant, Transaction, Payout, ApiKey, WebhookLog

// Status/enum types
UserRole, UserStatus, KycStatus, MerchantTier,
GatewayName, TxnStatus, PaymentMethod, PayoutMode, PayoutStatus

// Dashboard types
DashboardKPI, RevenueDataPoint, GatewayHealth,
PaymentMethodBreakdown, TransactionStatusCount, RecentActivity

// API response wrapper
ApiResponse<T>
```

### Key Type Details

**Amount Convention**: All monetary values are stored in **paise** (1/100 of a Rupee). So `150000` = Rs. 1,500.00.

**Date Convention**: All dates are ISO 8601 strings (e.g., `"2026-04-14T12:00:00.000Z"`).

**ID Convention**: All IDs use prefixed random strings:
- Users: `usr_xxxxxxxx`
- Merchants: `mrc_xxxxxxxx`
- Transactions: `txn_xxxxxxxx`
- Payouts: `pay_out_xxxxxxxx`
- API Keys: `key_prod_xxxxxxxx` or `key_sand_xxxxxxxx`
- Requests: `req_timestamp`

---

## 14. Utility Functions

Located in `src/lib/utils.ts`:

| Function | Purpose | Example |
|----------|---------|---------|
| `cn(...classes)` | Merge Tailwind classes safely | `cn("p-4", condition && "bg-red")` |
| `formatCurrency(amount, currency)` | Paise to formatted INR | `formatCurrency(150000)` → `"₹1,500.00"` |
| `formatDate(date)` | Human-readable date | `"15 Jun 2024, 10:30 AM"` |
| `formatRelativeTime(date)` | Relative time | `"2 hours ago"`, `"Just now"` |
| `getStatusColor(status)` | Tailwind color classes for status | Green for CAPTURED, Red for FAILED |
| `getGatewayIcon(gateway)` | Gateway emoji + name | `"🟢 Razorpay"` |
| `generateId(prefix)` | Generate prefixed random ID | `generateId("txn")` → `"txn_a1b2c3d4"` |
| `truncateText(text, length)` | Truncate with ellipsis | `truncateText("long text", 10)` → `"long te..."` |
| `maskAccountNumber(num)` | Mask bank account | `"XXXX XXXX 7890"` |

---

## 15. Webhook System

### How Webhooks Work

```
Gateway (Razorpay/Cashfree/Stripe)
        │
        │  POST to PayAgg webhook endpoint
        │  with HMAC signature in header
        ▼
┌──────────────────┐
│  Receive webhook  │
│  Verify HMAC sig  │──► If invalid: log as signatureValid=false, reject
│  Parse event type │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Log in           │
│  WebhookLog table │
│  (eventId for     │
│   deduplication)  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Update resource  │
│  (Transaction or  │
│   Payout status)  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Forward to       │
│  merchant's       │
│  webhook URL      │
│  (with PayAgg     │
│   HMAC signature) │
└──────────────────┘
```

### Webhook Event Types

| Event | Trigger |
|-------|---------|
| `payment.created` | Payment intent created |
| `payment.authorized` | Payment authorized (pre-capture) |
| `payment.captured` | Payment successfully captured |
| `payment.failed` | Payment failed |
| `payment.refunded` | Full refund processed |
| `payment.partially_refunded` | Partial refund processed |
| `payout.queued` | Payout added to queue |
| `payout.processing` | Payout being processed |
| `payout.processed` | Payout completed successfully |
| `payout.failed` | Payout failed |
| `payout.reversed` | Payout reversed |

### Testing Webhooks

Use `POST /api/v1/webhooks/test` to send a test webhook to your configured URL:

```json
{
  "url": "https://your-server.com/webhooks/payagg",
  "event_type": "payment.captured",
  "payload": {
    "transaction_id": "txn_test123",
    "amount": 100000,
    "status": "CAPTURED"
  }
}
```

---

## 16. API Key Management

### Key Generation Flow

```
Merchant requests new key
        │
        ▼
┌──────────────────────┐
│ Choose:              │
│ - Name (label)       │
│ - Environment        │
│   (live / sandbox)   │
│ - Scopes             │
│ - Expiry (optional)  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ System generates:    │
│ - Public key:        │
│   pk_live_xxxxxxxx   │
│ - Secret key:        │
│   sk_live_xxxxxxxx   │
│   (shown ONCE)       │
│ - Key hash stored    │
│   in database        │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Merchant stores the  │
│ secret key securely  │
│ (it won't be shown   │
│  again)              │
└──────────────────────┘
```

### Key Environments

| Environment | Key Prefix | Purpose |
|------------|-----------|---------|
| **sandbox** | `pk_test_` / `sk_test_` | Testing with mock data |
| **live** | `pk_live_` / `sk_live_` | Real transactions |

### Key Expiry Options

| Option | Duration |
|--------|----------|
| Never | No expiration |
| 30 days | 30 days from creation |
| 90 days | 90 days from creation |
| 1 year | 365 days from creation |

---

## 17. Design System & Styling

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| **Primary** | `#6366F1` (Indigo) | Buttons, links, active states |
| **Accent** | `#F59E0B` (Amber) | Highlights, badges, CTAs |
| **Success** | `#10B981` (Emerald) | Captured, healthy, active |
| **Warning** | `#F59E0B` (Amber) | Degraded, pending states |
| **Error** | `#F43F5E` (Rose) | Failed, error, danger |
| **Sidebar BG** | `#0C0F1E` → `#131729` | Dark gradient sidebar |
| **Page BG** | `#F8FAFC` | Light content background |

### Typography

- **Font Family**: Inter (Google Fonts)
- **Headings**: Semibold/Bold, sizes 2xl-4xl
- **Body**: Regular, sizes sm-base
- **Monospace**: For IDs, codes, amounts

### Layout Structure

```
┌─────────────────────────────────────────┐
│              Topbar (h-16)              │
├──────────┬──────────────────────────────┤
│          │                              │
│ Sidebar  │       Main Content           │
│ (w-64)   │       (scrollable)           │
│          │                              │
│ Collaps- │                              │
│ ible to  │                              │
│ (w-20)   │                              │
│          │                              │
└──────────┴──────────────────────────────┘
```

---

## 18. Scripts & Commands

### Available npm Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on port 5000 (hot reload) |
| `npm run build` | Build for production |
| `npm start` | Start production server on port 5000 |
| `npm run lint` | Run ESLint checks |
| `npm run prisma:generate` | Generate Prisma client from schema |
| `npm run db:push` | Push schema changes to database (dev only) |
| `npm run db:migrate` | Create and run database migrations |
| `npm run db:studio` | Open Prisma Studio (visual DB browser) |

### First-Time Setup (Complete)

```bash
# 1. Install dependencies
npm install

# 2. Create .env from template
cp .env.example .env
# Edit .env with your database URL and secrets

# 3. Generate Prisma client
npm run prisma:generate

# 4. Create database tables
npm run db:push        # For development
# OR
npm run db:migrate     # For production (creates migration files)

# 5. Start the application
npm run dev

# 6. Open in browser
# http://localhost:5000
```

---

## 19. Architecture Diagram

### High-Level System Architecture

```
                    ┌─────────────────────────────────────────┐
                    │              CLIENTS                     │
                    │  ┌─────────┐  ┌─────────┐  ┌────────┐ │
                    │  │Dashboard│  │Merchant │  │Mobile  │ │
                    │  │  (Web)  │  │  API    │  │  App   │ │
                    │  └────┬────┘  └────┬────┘  └───┬────┘ │
                    └───────┼────────────┼───────────┼───────┘
                            │            │           │
                            ▼            ▼           ▼
                    ┌─────────────────────────────────────────┐
                    │         NEXT.JS APPLICATION              │
                    │         (Port 5000)                      │
                    │                                          │
                    │  ┌──────────────┐  ┌──────────────────┐ │
                    │  │  React Pages │  │  API Routes       │ │
                    │  │  (App Router)│  │  /api/v1/*        │ │
                    │  │              │  │                    │ │
                    │  │  - Dashboard │  │  - Auth            │ │
                    │  │  - Payments  │  │  - Payments        │ │
                    │  │  - Payouts   │  │  - Payouts         │ │
                    │  │  - Analytics │  │  - Transactions    │ │
                    │  │  - Settings  │  │  - Keys            │ │
                    │  │              │  │  - Webhooks         │ │
                    │  └──────┬───────┘  │  - Analytics        │ │
                    │         │          └──────────┬─────────┘ │
                    │         │  SWR/Axios          │           │
                    │         └──────────────────────┘           │
                    └─────────────────┬───────────────────────┘
                                      │
                         ┌────────────┼────────────┐
                         ▼            ▼            ▼
                   ┌──────────┐ ┌──────────┐ ┌──────────┐
                   │PostgreSQL│ │  Redis   │ │ Payment  │
                   │          │ │ (Cache/  │ │ Gateways │
                   │ - Users  │ │  Queue)  │ │          │
                   │ - Merch  │ │          │ │ Razorpay │
                   │ - Txns   │ └──────────┘ │ Cashfree │
                   │ - Payouts│              │ Stripe   │
                   │ - Keys   │              │          │
                   │ - Logs   │              └──────────┘
                   └──────────┘
```

### Request Flow

```
Browser/API Client
       │
       ▼
  Next.js Server (Port 5000)
       │
       ├── Static pages → Served directly (SSR/SSG)
       │
       ├── Dashboard pages → React components + SWR data fetching
       │       │
       │       └── fetch("/api/v1/...") → API Route handlers
       │
       └── API Routes (/api/v1/*)
               │
               ├── Validate request (Zod schemas)
               ├── Authenticate (JWT in Authorization header)
               ├── Business logic
               ├── Database operations (Prisma ORM)
               └── Return JSON response
```

---

## 20. Current Limitations & Roadmap

### Current State (v0.1.0)

The application is in **development/MVP** state with the following characteristics:

| Area | Status | Notes |
|------|--------|-------|
| **UI/Frontend** | Fully built | All pages, components, and charts working |
| **API Routes** | Mock data | Returns realistic mock data, not connected to DB |
| **Authentication** | Mock | Returns mock tokens, no real JWT validation |
| **Database Schema** | Complete | Prisma schema with migrations ready |
| **Prisma Client** | Generated | Not yet used in API routes |
| **Gateway Integration** | Not started | Razorpay/Cashfree/Stripe SDKs not integrated |
| **Webhook Processing** | Not started | No real webhook verification/processing |
| **Middleware** | Not started | No auth guards, rate limiting, or CORS middleware |
| **Email/SMS** | Not started | SendGrid/MSG91 not integrated |
| **Error Tracking** | Not started | Sentry not integrated |

### What Needs to Be Done for Production

1. **Connect API routes to Prisma** - Replace mock data with real database queries
2. **Implement JWT authentication** - Real token generation, validation, refresh
3. **Add middleware** - Auth guards on protected routes, rate limiting, request logging
4. **Integrate payment gateways** - Razorpay, Cashfree, and Stripe SDKs
5. **Build webhook processing** - HMAC verification, event handling, forwarding
6. **Add smart routing** - AUTO gateway selection based on health/weights/rules
7. **Implement payout processing** - Job queue for batch payout execution
8. **Set up email/SMS** - OTP delivery, transaction notifications
9. **Add error tracking** - Sentry integration for production monitoring
10. **Security hardening** - Input sanitization, SQL injection prevention, XSS protection
11. **Testing** - Unit tests, integration tests, E2E tests
12. **CI/CD** - Build pipeline, automated testing, deployment

---

## Appendix: Quick Reference

### Important Amounts

- All amounts are in **paise** (100 paise = 1 INR)
- `150000` paise = Rs. 1,500.00
- Use `formatCurrency()` to display formatted amounts

### Important URLs (Development)

| URL | Page |
|-----|------|
| `http://localhost:5000` | Landing page |
| `http://localhost:5000/login` | Login |
| `http://localhost:5000/register` | Registration |
| `http://localhost:5000/dashboard` | Dashboard |
| `http://localhost:5000/dashboard/payments` | Payments |
| `http://localhost:5000/dashboard/payouts` | Payouts |
| `http://localhost:5000/dashboard/transactions` | Transactions |
| `http://localhost:5000/dashboard/analytics` | Analytics |
| `http://localhost:5000/dashboard/settings` | Settings |

### File Quick Reference

| What | Where |
|------|-------|
| Database schema | `prisma/schema.prisma` |
| Type definitions | `src/types/index.ts` |
| Mock data | `src/lib/mock-data.ts` |
| Utility functions | `src/lib/utils.ts` |
| Global styles | `src/app/globals.css` |
| Environment template | `.env.example` |
| API routes | `src/app/api/v1/` |
| Dashboard pages | `src/app/dashboard/` |
| UI components | `src/components/ui/` |
