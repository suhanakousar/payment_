import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

const meta = () => ({ request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() });

const createKeySchema = z.object({
  name:            z.string().min(1, 'name is required'),
  environment:     z.enum(['live', 'sandbox']).default('sandbox'),
  scope:           z.array(z.string()).default(['payments:read']),
  expires_in_days: z.number().int().positive().optional(),
});

const VALID_SCOPES = [
  'payments:read', 'payments:write',
  'payouts:read',  'payouts:write',
  'webhooks:read', 'webhooks:write',
  'analytics:read',
];

export async function GET(req: NextRequest) {
  const authUser = getAuthUser(req);

  try {
    const merchantId = authUser?.merchantId
      ?? (await prisma.merchant.findFirst({ orderBy: { createdAt: 'asc' } }))?.id;

    if (!merchantId) {
      return NextResponse.json({ success: true, data: [], meta: meta() });
    }

    const keys = await prisma.apiKey.findMany({
      where:   { merchantId },
      orderBy: { createdAt: 'desc' },
    });

    const safeKeys = keys.map((k) => ({
      id:           k.id,
      name:         k.name,
      key_prefix:   k.keyPrefix,
      environment:  k.environment,
      scope:        k.scope,
      is_active:    k.isActive,
      last_used_at: k.lastUsedAt?.toISOString() ?? null,
      expires_at:   k.expiresAt?.toISOString()  ?? null,
      created_at:   k.createdAt.toISOString(),
    }));

    return NextResponse.json({ success: true, data: safeKeys, meta: meta() });
  } catch (err) {
    console.error('[GET /keys]', err);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authUser = getAuthUser(req);

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_JSON', message: 'Invalid JSON body' }, meta: meta() },
      { status: 400 }
    );
  }

  const parsed = createKeySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten().fieldErrors }, meta: meta() },
      { status: 400 }
    );
  }

  const { name, environment, scope, expires_in_days } = parsed.data;

  const invalidScopes = scope.filter((s) => !VALID_SCOPES.includes(s));
  if (invalidScopes.length > 0) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_SCOPE', message: `Invalid scopes: ${invalidScopes.join(', ')}` }, meta: meta() },
      { status: 400 }
    );
  }

  try {
    const merchantId = authUser?.merchantId
      ?? (await prisma.merchant.findFirst({ orderBy: { createdAt: 'asc' } }))?.id;

    if (!merchantId) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_MERCHANT', message: 'No merchant found' }, meta: meta() },
        { status: 400 }
      );
    }

    const prefix     = environment === 'live' ? 'pk_live' : 'pk_test';
    const randomPart = crypto.randomBytes(8).toString('hex');
    const publicKey  = `${prefix}_${randomPart}`;
    const secretKey  = `sk_${environment === 'live' ? 'live' : 'test'}_${crypto.randomBytes(20).toString('hex')}`;
    const keyHash    = crypto.createHash('sha256').update(secretKey).digest('hex');

    const expiresAt = expires_in_days
      ? new Date(Date.now() + expires_in_days * 86400 * 1000)
      : null;

    const key = await prisma.apiKey.create({
      data: {
        merchantId,
        name:       name.trim(),
        keyPrefix:  publicKey,
        keyHash,
        scope,
        environment,
        isActive:   true,
        expiresAt,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id:          key.id,
          name:        key.name,
          public_key:  publicKey,
          secret_key:  secretKey,
          key_prefix:  publicKey,
          environment: key.environment,
          scope:       key.scope,
          is_active:   key.isActive,
          expires_at:  key.expiresAt?.toISOString() ?? null,
          created_at:  key.createdAt.toISOString(),
          warning:     'Store your secret_key securely. It will not be shown again.',
        },
        meta: meta(),
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /keys]', err);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
