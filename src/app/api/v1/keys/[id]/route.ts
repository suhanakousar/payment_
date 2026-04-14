import { NextRequest, NextResponse } from 'next/server';
import { mockApiKeys } from '@/lib/mock-data';

// ─── DELETE /api/v1/keys/:id ─────────────────────────────────────────────────
// Revoke (permanently deactivate) an API key.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const key = mockApiKeys.find(k => k.id === id);

  if (!key) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'NOT_FOUND', message: `API key '${id}' not found` },
        meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      },
      { status: 404 }
    );
  }

  if (!key.isActive) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'KEY_ALREADY_REVOKED',
          message: `API key '${id}' is already revoked`,
        },
        meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      },
      { status: 409 }
    );
  }

  const now = new Date().toISOString();

  // In production: mark key as inactive in DB
  // Mock: return confirmation of revocation
  return NextResponse.json({
    success: true,
    data: {
      id:          key.id,
      name:        key.name,
      key_prefix:  key.keyPrefix,
      environment: key.environment,
      is_active:   false,
      revoked_at:  now,
      message:     `API key '${key.name}' has been revoked. All requests using this key will be rejected immediately.`,
    },
    meta: { request_id: `req_${Date.now()}`, timestamp: now },
  });
}

// ─── GET /api/v1/keys/:id ─────────────────────────────────────────────────────
// Fetch metadata for a specific API key (no secret).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const key = mockApiKeys.find(k => k.id === id);

  if (!key) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'NOT_FOUND', message: `API key '${id}' not found` },
        meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      id:           key.id,
      name:         key.name,
      key_prefix:   key.keyPrefix,
      environment:  key.environment,
      scope:        key.scope,
      is_active:    key.isActive,
      last_used_at: key.lastUsedAt ?? null,
      expires_at:   key.expiresAt ?? null,
      created_at:   key.createdAt,
    },
    meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() },
  });
}
