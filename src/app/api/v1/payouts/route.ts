import { NextRequest, NextResponse } from 'next/server';
import { mockPayouts } from '@/lib/mock-data';
import type { Payout } from '@/types';

// ─── GET /api/v1/payouts ─────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const page     = Math.max(1, parseInt(searchParams.get('page')     ?? '1',  10));
  const per_page = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') ?? '10', 10)));
  const status   = searchParams.get('status')?.toUpperCase();
  const mode     = searchParams.get('mode')?.toUpperCase();
  const search   = searchParams.get('search')?.toLowerCase();
  const from     = searchParams.get('from');
  const to       = searchParams.get('to');

  let filtered: Payout[] = [...mockPayouts];

  if (status)  filtered = filtered.filter(p => p.status === status);
  if (mode)    filtered = filtered.filter(p => p.mode === mode);
  if (from)    filtered = filtered.filter(p => new Date(p.createdAt) >= new Date(from));
  if (to)      filtered = filtered.filter(p => new Date(p.createdAt) <= new Date(to));
  if (search) {
    filtered = filtered.filter(p =>
      p.id.toLowerCase().includes(search) ||
      p.beneficiaryName.toLowerCase().includes(search) ||
      p.accountNumber.includes(search) ||
      p.ifscCode.toLowerCase().includes(search) ||
      p.batchId?.toLowerCase().includes(search)
    );
  }

  // Default sort: newest first
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total  = filtered.length;
  const pages  = Math.ceil(total / per_page);
  const offset = (page - 1) * per_page;
  const data   = filtered.slice(offset, offset + per_page);

  return NextResponse.json({
    success: true,
    data,
    pagination: { page, per_page, total, pages },
    meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() },
  });
}

// ─── POST /api/v1/payouts ────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json();

  const {
    beneficiary_name,
    account_number,
    ifsc_code,
    amount,
    mode = 'IMPS',
    reference,
    schedule_at,
  } = body;

  // Validate required fields
  const missingFields: string[] = [];
  if (!beneficiary_name) missingFields.push('beneficiary_name');
  if (!account_number)   missingFields.push('account_number');
  if (!ifsc_code)        missingFields.push('ifsc_code');
  if (!amount)           missingFields.push('amount');

  if (missingFields.length > 0) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Missing required fields: ${missingFields.join(', ')}`,
        },
        meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      },
      { status: 400 }
    );
  }

  if (typeof amount !== 'number' || amount <= 0) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INVALID_AMOUNT', message: 'amount must be a positive number (in paise)' },
        meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      },
      { status: 400 }
    );
  }

  const VALID_MODES = ['IMPS', 'NEFT', 'RTGS', 'UPI'];
  if (!VALID_MODES.includes(mode.toUpperCase())) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_MODE',
          message: `mode must be one of: ${VALID_MODES.join(', ')}`,
        },
        meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      },
      { status: 400 }
    );
  }

  const payoutId  = `pay_out_${Math.random().toString(36).slice(2, 10)}`;
  const now       = new Date().toISOString();

  const newPayout: Payout = {
    id:              payoutId,
    merchantId:      'mrc_9f2a1b3c',
    beneficiaryName: beneficiary_name,
    accountNumber:   account_number,
    ifscCode:        ifsc_code,
    amount,
    mode:            mode.toUpperCase() as Payout['mode'],
    status:          'QUEUED',
    retryCount:      0,
    gateway:         'RAZORPAY',
    ...(schedule_at ? { scheduledAt: schedule_at } : {}),
    ...(reference   ? { metadata: { reference }  } : {}),
    createdAt:       now,
  };

  return NextResponse.json(
    {
      success: true,
      data: newPayout,
      meta: { request_id: `req_${Date.now()}`, timestamp: now },
    },
    { status: 201 }
  );
}
