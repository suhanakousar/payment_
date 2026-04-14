import { NextRequest, NextResponse } from 'next/server';

interface BulkPayoutEntry {
  beneficiary_name: string;
  account_number:   string;
  ifsc_code:        string;
  amount:           number;
  mode?:            string;
  reference?:       string;
}

interface BulkValidationError {
  row:     number;
  field:   string;
  message: string;
}

// ─── POST /api/v1/payouts/bulk ───────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json();

  const { payouts, schedule_at } = body as {
    payouts:      BulkPayoutEntry[];
    schedule_at?: string;
  };

  if (!Array.isArray(payouts) || payouts.length === 0) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_PAYLOAD',
          message: 'payouts must be a non-empty array',
        },
        meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      },
      { status: 400 }
    );
  }

  if (payouts.length > 1000) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'BATCH_TOO_LARGE',
          message: 'Maximum 1000 payouts allowed per batch',
        },
        meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      },
      { status: 400 }
    );
  }

  const VALID_MODES  = ['IMPS', 'NEFT', 'RTGS', 'UPI'];
  const validationErrors: BulkValidationError[] = [];
  let totalAmount    = 0;
  let validCount     = 0;

  payouts.forEach((entry, idx) => {
    const row = idx + 1;
    let rowValid = true;

    if (!entry.beneficiary_name) {
      validationErrors.push({ row, field: 'beneficiary_name', message: 'Required' });
      rowValid = false;
    }
    if (!entry.account_number) {
      validationErrors.push({ row, field: 'account_number', message: 'Required' });
      rowValid = false;
    }
    if (!entry.ifsc_code) {
      validationErrors.push({ row, field: 'ifsc_code', message: 'Required' });
      rowValid = false;
    }
    if (!entry.amount || typeof entry.amount !== 'number' || entry.amount <= 0) {
      validationErrors.push({ row, field: 'amount', message: 'Must be a positive number (in paise)' });
      rowValid = false;
    }
    if (entry.mode && !VALID_MODES.includes(entry.mode.toUpperCase())) {
      validationErrors.push({
        row,
        field: 'mode',
        message: `Must be one of: ${VALID_MODES.join(', ')}`,
      });
      rowValid = false;
    }

    if (rowValid) {
      validCount++;
      totalAmount += entry.amount;
    }
  });

  const batchId    = `BP-${Math.floor(2848 + Math.random() * 100)}`;
  const errorCount = payouts.length - validCount;
  const now        = new Date().toISOString();

  return NextResponse.json(
    {
      success: true,
      data: {
        batch_id:     batchId,
        status:       errorCount === payouts.length ? 'REJECTED' : 'QUEUED',
        total_count:  payouts.length,
        valid_count:  validCount,
        error_count:  errorCount,
        total_amount: totalAmount,
        schedule_at:  schedule_at ?? null,
        estimated_completion: schedule_at
          ? new Date(new Date(schedule_at).getTime() + 30 * 60 * 1000).toISOString()
          : new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        validation_errors: validationErrors.length > 0 ? validationErrors : undefined,
        created_at: now,
      },
      meta: { request_id: `req_${Date.now()}`, timestamp: now },
    },
    { status: 201 }
  );
}
