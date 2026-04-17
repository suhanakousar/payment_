/**
 * In-memory rate limiter (per IP, per route).
 * For production, swap this with Redis / Upstash.
 */

interface Window {
  count: number;
  resetAt: number;
}

const store = new Map<string, Window>();

export interface RateLimitOptions {
  windowMs: number;  // rolling window in ms
  max:      number;  // max requests per window
}

export function rateLimit(
  key: string,
  options: RateLimitOptions = { windowMs: 60_000, max: 30 }
): { ok: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || now > existing.resetAt) {
    const resetAt = now + options.windowMs;
    store.set(key, { count: 1, resetAt });
    return { ok: true, remaining: options.max - 1, resetAt };
  }

  existing.count += 1;
  const remaining = Math.max(0, options.max - existing.count);
  const ok = existing.count <= options.max;
  return { ok, remaining, resetAt: existing.resetAt };
}

// Clean up stale entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, win] of store.entries()) {
      if (now > win.resetAt) store.delete(key);
    }
  }, 5 * 60_000);
}
