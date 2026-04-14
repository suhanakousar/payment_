import { NextRequest, NextResponse } from 'next/server';
import { mockApiKeys } from '@/lib/mock-data';

// ─── GET /api/v1/keys ────────────────────────────────────────────────────────
// Returns all API keys for the merchant — secrets are never returned here.
export async function GET(_req: NextRequest) {
  // Strip any secret material (the mock data has none, but this mirrors production behavior)
  const safeKeys = mockApiKeys.map(({ ...key }) => ({
    id:          key.id,
    name:        key.name,
    key_prefix:  key.keyPrefix,
    environment: key.environment,
    scope:       key.scope,
    is_active:   key.isActive,
    last_used_at: key.lastUsedAt ?? null,
    expires_at:  key.expiresAt ?? null,
    created_at:  key.createdAt,
  }));

  return NextResponse.json({
    success: true,
    data:    safeKeys,
    meta:    { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() },
  });
}

// ─── POST /api/v1/keys ───────────────────────────────────────────────────────
// Generate a new API key pair. Secret is returned ONCE — store it securely.
export async function POST(req: NextRequest) {
  const body = await req.json();

  const {
    name,
    environment = 'sandbox',
    scope       = ['payments:read'],
    expires_in_days,
  } = body as {
    name:             string;
    environment?:     'live' | 'sandbox';
    scope?:           string[];
    expires_in_days?: number;
  };

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'name is required' },
        meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      },
      { status: 400 }
    );
  }

  const VALID_ENVS = ['live', 'sandbox'];
  if (!VALID_ENVS.includes(environment)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_ENVIRONMENT',
          message: `environment must be one of: ${VALID_ENVS.join(', ')}`,
        },
        meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      },
      { status: 400 }
    );
  }

  const VALID_SCOPES = [
    'payments:read', 'payments:write',
    'payouts:read',  'payouts:write',
    'webhooks:read', 'webhooks:write',
    'analytics:read',
  ];
  const invalidScopes = (scope as string[]).filter(s => !VALID_SCOPES.includes(s));
  if (invalidScopes.length > 0) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_SCOPE',
          message: `Invalid scopes: ${invalidScopes.join(', ')}. Valid scopes: ${VALID_SCOPES.join(', ')}`,
        },
        meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      },
      { status: 400 }
    );
  }

  const prefix     = environment === 'live' ? 'pk_live' : 'pk_test';
  const randomPart = Math.random().toString(36).slice(2, 10);
  const keyId      = `key_${environment === 'live' ? 'prod' : 'sand'}_${randomPart}`;
  const publicKey  = `${prefix}_${randomPart}`;
  const secretKey  = `sk_${environment === 'live' ? 'live' : 'test'}_${Array.from(
    { length: 32 },
    () => Math.random().toString(36)[2]
  ).join('')}`;

  const now       = new Date();
  const expiresAt = expires_in_days
    ? new Date(now.getTime() + expires_in_days * 86400 * 1000).toISOString()
    : null;

  return NextResponse.json(
    {
      success: true,
      data: {
        id:          keyId,
        name:        name.trim(),
        public_key:  publicKey,
        secret_key:  secretKey,   // Shown ONCE — not stored in plain text after this
        key_prefix:  publicKey,
        environment,
        scope,
        is_active:   true,
        expires_at:  expiresAt,
        created_at:  now.toISOString(),
        warning:
          'Store your secret_key securely. It will not be shown again.',
      },
      meta: { request_id: `req_${Date.now()}`, timestamp: now.toISOString() },
    },
    { status: 201 }
  );
}
