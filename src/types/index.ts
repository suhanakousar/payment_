// ─────────────────────────────────────────────────────────────────────────────
// User types
// ─────────────────────────────────────────────────────────────────────────────

export type UserRole =
  | 'SUPER_ADMIN'
  | 'MERCHANT_ADMIN'
  | 'OPS'
  | 'DEV'
  | 'ANALYST';

export type UserStatus =
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'PENDING_VERIFICATION';

export interface User {
  id: string;
  merchantId: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  lastLoginAt?: string;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Merchant types
// ─────────────────────────────────────────────────────────────────────────────

export type KycStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export type MerchantTier = 'STARTER' | 'GROWTH' | 'ENTERPRISE';

export type GatewayName = 'RAZORPAY' | 'CASHFREE' | 'STRIPE' | 'AUTO';

export interface Merchant {
  id: string;
  businessName: string;
  gstin?: string;
  pan?: string;
  kycStatus: KycStatus;
  tier: MerchantTier;
  dailyPayoutLimit: number;
  preferredGateway: GatewayName;
  webhookUrl?: string;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Transaction types
// ─────────────────────────────────────────────────────────────────────────────

export type TxnStatus =
  | 'PENDING'
  | 'AUTHORIZED'
  | 'CAPTURED'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'wallet';

export interface Transaction {
  id: string;
  merchantId: string;
  gateway: GatewayName;
  gatewayOrderId: string;
  gatewayPaymentId?: string;
  amount: number;           // stored in paise
  currency: string;
  status: TxnStatus;
  paymentMethod?: PaymentMethod;
  customerEmail?: string;
  customerPhone?: string;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Payout types
// ─────────────────────────────────────────────────────────────────────────────

export type PayoutMode = 'IMPS' | 'NEFT' | 'RTGS' | 'UPI';

export type PayoutStatus =
  | 'QUEUED'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'PERMANENTLY_FAILED'
  | 'CANCELLED';

export interface Payout {
  id: string;
  merchantId: string;
  batchId?: string;
  gateway: GatewayName;
  gatewayPayoutId?: string;
  beneficiaryName: string;
  accountNumber: string;
  ifscCode: string;
  amount: number;           // stored in paise
  mode: PayoutMode;
  status: PayoutStatus;
  retryCount: number;
  failureReason?: string;
  scheduledAt?: string;
  processedAt?: string;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// API Key types
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiKey {
  id: string;
  merchantId: string;
  name: string;
  keyPrefix: string;
  scope: string[];
  environment: 'live' | 'sandbox';
  isActive: boolean;
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Webhook Log
// ─────────────────────────────────────────────────────────────────────────────

export interface WebhookLog {
  id: string;
  transactionId?: string;
  payoutId?: string;
  source: string;
  eventType: string;
  eventId: string;
  signatureValid: boolean;
  processed: boolean;
  receivedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard types
// ─────────────────────────────────────────────────────────────────────────────

export interface DashboardKPI {
  totalRevenue: number;
  totalTransactions: number;
  successRate: number;
  pendingPayouts: number;
  revenueChange: number;
  transactionChange: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  payouts: number;
}

export interface GatewayHealth {
  gateway: GatewayName;
  status: 'healthy' | 'degraded' | 'down';
  successRate: number;
  avgLatency: number;
  lastChecked: string;
}

export interface PaymentMethodBreakdown {
  method: PaymentMethod;
  count: number;
  amount: number;
  percentage: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Chart / activity types
// ─────────────────────────────────────────────────────────────────────────────

export interface TransactionStatusCount {
  status: TxnStatus;
  count: number;
}

export interface RecentActivity {
  id: string;
  type: 'payment' | 'payout' | 'webhook' | 'alert' | 'kyc' | 'system';
  message: string;
  timestamp: string;
  severity?: 'info' | 'warning' | 'error' | 'success';
}

// ─────────────────────────────────────────────────────────────────────────────
// API Response types
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    requestId: string;
    timestamp: string;
  };
  pagination?: {
    page: number;
    perPage: number;
    total: number;
    pages: number;
  };
}
