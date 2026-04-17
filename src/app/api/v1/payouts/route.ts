import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

const meta = () => ({ request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() });

const createPayoutSchema = z.object({
  beneficiary_name: z.string().min(1, 'beneficiary_name is required'),
  account_number:   z.string().min(1, 'account_number is required'),
  ifsc_code:        z.string().min(1, 'ifsc_code is required'),
  amount:           z.number().positive('amount must be a positive number in paise'),
  mode:             z.enum(['IMPS', 'NEFT', 'RTGS', 'UPI']).default('IMPS'),
  schedule_at:      z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const page     = Math.max(1, parseInt(searchParams.get('page')     ?? '1',  10));
  const per_page = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') ?? '10', 10)));
  const status   = searchParams.get('status')?.toUpperCase();
  const mode     = searchParams.get('mode')?.toUpperCase();
  const search   = searchParams.get('search')?.toLowerCase();
  const from     = searchParams.get('from');
  const to       = searchParams.get('to');

  try {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (mode)   where.mode   = mode;
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
      if (to)   (where.createdAt as Record<string, unknown>).lte = new Date(to);
    }
    if (search) {
      where.OR = [
        { id:              { contains: search, mode: 'insensitive' } },
        { beneficiaryName: { contains: search, mode: 'insensitive' } },
        { accountNumber:   { contains: search } },
        { ifscCode:        { contains: search, mode: 'insensitive' } },
        { batchId:         { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, rows] = await Promise.all([
      prisma.payout.count({ where }),
      prisma.payout.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip:    (page - 1) * per_page,
        take:    per_page,
      }),
    ]);

    const data = rows.map((p) => ({ ...p, amount: Number(p.amount) }));

    return NextResponse.json({
      success: true,
      data,
      pagination: { page, per_page, total, pages: Math.ceil(total / per_page) },
      meta: meta(),
    });
  } catch (err) {
    console.error('[GET /payouts]', err);
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

  const parsed = createPayoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten().fieldErrors }, meta: meta() },
      { status: 400 }
    );
  }

  const { beneficiary_name, account_number, ifsc_code, amount, mode, schedule_at } = parsed.data;

  try {
    let merchantId = authUser?.merchantId ?? null;
    if (!merchantId) {
      const first = await prisma.merchant.findFirst({ orderBy: { createdAt: 'asc' } });
      merchantId = first?.id ?? null;
    }
    if (!merchantId) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_MERCHANT', message: 'No merchant found' }, meta: meta() },
        { status: 400 }
      );
    }

    const payout = await prisma.payout.create({
      data: {
        merchantId,
        gateway:         'RAZORPAY',
        beneficiaryName: beneficiary_name,
        accountNumber:   account_number,
        ifscCode:        ifsc_code,
        amount,
        mode,
        status:          'QUEUED',
        scheduledAt:     schedule_at ? new Date(schedule_at) : null,
      },
    });

    return NextResponse.json(
      { success: true, data: { ...payout, amount: Number(payout.amount) }, meta: meta() },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /payouts]', err);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }, meta: meta() },
      { status: 500 }
    );
  }
}
