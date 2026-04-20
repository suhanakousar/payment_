import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { fetchWithAuth } from '@/lib/fetch-with-auth';

void fetchWithAuth; // used on client side only — suppress lint

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

  const [config, merchant] = await Promise.all([
    prisma.merchantConfig.findUnique({
      where: { merchantId: payload.merchantId ?? '' },
      select: {
        cashfreeAppId:     true,
        cashfreeSecretKey: true,
      },
    }).catch(() => null),
    payload.merchantId
      ? prisma.merchant.findUnique({
          where: { id: payload.merchantId },
          select: {
            bankAccountNumber:  true,
            bankAccountName:    true,
            bankIfscCode:       true,
            bankName:           true,
            bankBranch:         true,
            settlementSchedule: true,
            webhookUrl:         true,
            webhookSecret:      true,
          },
        }).catch(() => null)
      : null,
  ]);

  return NextResponse.json({
    success: true,
    data: {
      cashfreeAppId:      config?.cashfreeAppId     ? '••••' + config.cashfreeAppId.slice(-4)     : null,
      cashfreeSecretKey:  config?.cashfreeSecretKey ? '••••' + config.cashfreeSecretKey.slice(-4) : null,
      cashfreeConfigured: !!(config?.cashfreeAppId && config?.cashfreeSecretKey),
      cashfreeEnv:        process.env.CASHFREE_ENV ?? 'sandbox',
      bank: {
        accountNumber:  merchant?.bankAccountNumber  ?? null,
        accountName:    merchant?.bankAccountName    ?? null,
        ifscCode:       merchant?.bankIfscCode       ?? null,
        bankName:       merchant?.bankName           ?? null,
        branch:         merchant?.bankBranch         ?? null,
        settlement:     merchant?.settlementSchedule ?? 'T+1',
        configured:     !!(merchant?.bankAccountNumber && merchant?.bankIfscCode),
      },
      webhook: {
        url:    merchant?.webhookUrl    ?? '',
        secret: merchant?.webhookSecret ? '••••' + merchant.webhookSecret.slice(-4) : null,
      },
    },
    meta: meta(),
  });
}

const patchSchema = z.object({
  cashfreeAppId:      z.string().min(1).optional(),
  cashfreeSecretKey:  z.string().min(1).optional(),
  bankAccountNumber:  z.string().optional(),
  bankAccountName:    z.string().optional(),
  bankIfscCode:       z.string().optional(),
  bankName:           z.string().optional(),
  bankBranch:         z.string().optional(),
  settlementSchedule: z.string().optional(),
  webhookUrl:         z.string().url().optional().or(z.literal('')),
  webhookSecret:      z.string().optional(),
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

  const {
    cashfreeAppId, cashfreeSecretKey,
    bankAccountNumber, bankAccountName, bankIfscCode, bankName, bankBranch, settlementSchedule,
    webhookUrl, webhookSecret,
  } = parsed.data;

  const cfUpdate: Record<string, unknown> = {};
  if (cashfreeAppId)     cfUpdate.cashfreeAppId     = cashfreeAppId;
  if (cashfreeSecretKey) cfUpdate.cashfreeSecretKey = cashfreeSecretKey;

  const merchantUpdate: Record<string, unknown> = {};
  if (bankAccountNumber  !== undefined) merchantUpdate.bankAccountNumber  = bankAccountNumber  || null;
  if (bankAccountName    !== undefined) merchantUpdate.bankAccountName    = bankAccountName    || null;
  if (bankIfscCode       !== undefined) merchantUpdate.bankIfscCode       = bankIfscCode       || null;
  if (bankName           !== undefined) merchantUpdate.bankName           = bankName           || null;
  if (bankBranch         !== undefined) merchantUpdate.bankBranch         = bankBranch         || null;
  if (settlementSchedule !== undefined) merchantUpdate.settlementSchedule = settlementSchedule || 'T+1';
  if (webhookUrl         !== undefined) merchantUpdate.webhookUrl         = webhookUrl         || null;
  if (webhookSecret      !== undefined) merchantUpdate.webhookSecret      = webhookSecret      || null;

  await Promise.all([
    Object.keys(cfUpdate).length > 0
      ? prisma.merchantConfig.upsert({
          where:  { merchantId: payload.merchantId },
          update: cfUpdate,
          create: { merchantId: payload.merchantId, ...cfUpdate },
        })
      : Promise.resolve(),
    Object.keys(merchantUpdate).length > 0
      ? prisma.merchant.update({ where: { id: payload.merchantId }, data: merchantUpdate })
      : Promise.resolve(),
  ]);

  return NextResponse.json({ success: true, data: { updated: true }, meta: meta() });
}
