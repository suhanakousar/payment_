import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

const meta = () => ({
  request_id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  timestamp:  new Date().toISOString(),
});

// ── GET /api/v1/setup ─────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const payload = getAuthUser(req);
  if (!payload) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    );
  }

  const config = await prisma.merchantConfig.findUnique({
    where: { merchantId: payload.merchantId ?? '' },
    select: {
      cashfreeAppId:     true,
      cashfreeSecretKey: true,
      gatewayWeights:    true,
      maxAmount:         true,
    },
  }).catch(() => null);

  return NextResponse.json({
    success: true,
    data: {
      cashfreeAppId:        config?.cashfreeAppId     ? '••••' + config.cashfreeAppId.slice(-4)     : null,
      cashfreeSecretKey:    config?.cashfreeSecretKey ? '••••' + config.cashfreeSecretKey.slice(-4) : null,
      cashfreeConfigured:   !!(config?.cashfreeAppId && config?.cashfreeSecretKey),
      cashfreeEnv:          process.env.CASHFREE_ENV ?? 'sandbox',
    },
    meta: meta(),
  });
}

const patchSchema = z.object({
  cashfreeAppId:     z.string().min(1).optional(),
  cashfreeSecretKey: z.string().min(1).optional(),
});

// ── PATCH /api/v1/setup ───────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const payload = getAuthUser(req);
  if (!payload) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    );
  }
  if (!payload.merchantId) {
    return NextResponse.json(
      { success: false, error: { code: 'NO_MERCHANT', message: 'No merchant found' } },
      { status: 400 }
    );
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_JSON', message: 'Invalid JSON' } },
      { status: 400 }
    );
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input' } },
      { status: 400 }
    );
  }

  const { cashfreeAppId, cashfreeSecretKey } = parsed.data;
  const updateData: Record<string, unknown> = {};
  if (cashfreeAppId)     updateData.cashfreeAppId     = cashfreeAppId;
  if (cashfreeSecretKey) updateData.cashfreeSecretKey = cashfreeSecretKey;

  await prisma.merchantConfig.upsert({
    where:  { merchantId: payload.merchantId },
    update: updateData,
    create: { merchantId: payload.merchantId, ...updateData },
  });

  return NextResponse.json({ success: true, data: { cashfreeConfigured: true }, meta: meta() });
}
