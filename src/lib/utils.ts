import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ─────────────────────────────────────────────────────────────────────────────
// Class name merger (clsx + tailwind-merge)
// ─────────────────────────────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ─────────────────────────────────────────────────────────────────────────────
// Currency formatting  (paise → ₹ Indian numbering system)
// ─────────────────────────────────────────────────────────────────────────────

export function formatCurrency(amount: number, currency: string = 'INR'): string {
  const rupees = amount / 100;

  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(rupees);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

// ─────────────────────────────────────────────────────────────────────────────
// Date formatting  →  "15 Jun 2024, 10:30 AM"
// ─────────────────────────────────────────────────────────────────────────────

export function formatDate(date: string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

// ─────────────────────────────────────────────────────────────────────────────
// Relative time  →  "2 hours ago", "Just now", etc.
// ─────────────────────────────────────────────────────────────────────────────

export function formatRelativeTime(date: string): string {
  const now = Date.now();
  const past = new Date(date).getTime();
  const diffMs = now - past;

  const seconds = Math.floor(diffMs / 1_000);
  const minutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(diffMs / 86_400_000);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (seconds < 10) return 'Just now';
  if (seconds < 60) return `${seconds} seconds ago`;
  if (minutes === 1) return '1 minute ago';
  if (minutes < 60) return `${minutes} minutes ago`;
  if (hours === 1) return '1 hour ago';
  if (hours < 24) return `${hours} hours ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (weeks === 1) return '1 week ago';
  if (weeks < 4) return `${weeks} weeks ago`;
  if (months === 1) return '1 month ago';
  return `${months} months ago`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Status colour  →  Tailwind class strings
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  // Transaction statuses
  CAPTURED:           'bg-emerald-100 text-emerald-700 border-emerald-200',
  PENDING:            'bg-amber-100   text-amber-700   border-amber-200',
  AUTHORIZED:         'bg-blue-100    text-blue-700    border-blue-200',
  FAILED:             'bg-red-100     text-red-700     border-red-200',
  REFUNDED:           'bg-purple-100  text-purple-700  border-purple-200',
  PARTIALLY_REFUNDED: 'bg-indigo-100  text-indigo-700  border-indigo-200',

  // Payout statuses
  QUEUED:             'bg-slate-100   text-slate-600   border-slate-200',
  PROCESSING:         'bg-cyan-100    text-cyan-700    border-cyan-200',
  SUCCESS:            'bg-emerald-100 text-emerald-700 border-emerald-200',
  PERMANENTLY_FAILED: 'bg-red-200     text-red-800     border-red-300',
  CANCELLED:          'bg-gray-100    text-gray-600    border-gray-200',

  // KYC statuses
  VERIFIED:           'bg-emerald-100 text-emerald-700 border-emerald-200',
  REJECTED:           'bg-red-100     text-red-700     border-red-200',

  // User statuses
  ACTIVE:               'bg-emerald-100 text-emerald-700 border-emerald-200',
  SUSPENDED:            'bg-red-100     text-red-700     border-red-200',
  PENDING_VERIFICATION: 'bg-amber-100   text-amber-700   border-amber-200',

  // Gateway health
  healthy:  'bg-emerald-100 text-emerald-700 border-emerald-200',
  degraded: 'bg-amber-100   text-amber-700   border-amber-200',
  down:     'bg-red-100     text-red-700     border-red-200',
};

export function getStatusColor(status: string): string {
  return STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600 border-gray-200';
}

// ─────────────────────────────────────────────────────────────────────────────
// Gateway display helper
// ─────────────────────────────────────────────────────────────────────────────

const GATEWAY_ICONS: Record<string, string> = {
  RAZORPAY: '⚡ Razorpay',
  CASHFREE: '💳 Cashfree',
  STRIPE:   '🔵 Stripe',
  AUTO:     '🔄 Auto',
};

export function getGatewayIcon(gateway: string): string {
  return GATEWAY_ICONS[gateway] ?? gateway;
}

// ─────────────────────────────────────────────────────────────────────────────
// ID generator  →  "txn_a1b2c3d4"
// ─────────────────────────────────────────────────────────────────────────────

export function generateId(prefix: string): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const random = Array.from({ length: 8 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
  return `${prefix}_${random}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Text helpers
// ─────────────────────────────────────────────────────────────────────────────

export function truncateText(text: string, length: number): string {
  if (text.length <= length) return text;
  return `${text.slice(0, length)}…`;
}

/**
 * Masks all but the last 4 digits of an account number.
 * e.g. "123456787890" → "XXXX XXXX 7890"
 */
export function maskAccountNumber(accountNumber: string): string {
  const cleaned = accountNumber.replace(/\s+/g, '');
  if (cleaned.length < 4) return '****';
  const visible = cleaned.slice(-4);
  const maskedLen = Math.min(cleaned.length - 4, 12);
  // Build masked portion in groups of 4
  const groups = Math.ceil(maskedLen / 4);
  const maskedGroups = Array.from({ length: groups }, (_, i) => {
    const groupSize = Math.min(4, maskedLen - i * 4);
    return 'X'.repeat(groupSize);
  });
  return `${maskedGroups.join(' ')} ${visible}`;
}
