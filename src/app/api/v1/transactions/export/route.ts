import { NextRequest, NextResponse } from 'next/server';

type ExportFormat = 'csv' | 'excel';

interface ExportFilters {
  status?:     string;
  gateway?:    string;
  method?:     string;
  from?:       string;
  to?:         string;
  min_amount?: number;
  max_amount?: number;
  search?:     string;
}

// ─── POST /api/v1/transactions/export ────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json();

  const {
    format = 'csv',
    filters = {} as ExportFilters,
    columns,
    notify_email,
  } = body as {
    format?:       ExportFormat;
    filters?:      ExportFilters;
    columns?:      string[];
    notify_email?: string;
  };

  const VALID_FORMATS: ExportFormat[] = ['csv', 'excel'];
  if (!VALID_FORMATS.includes(format as ExportFormat)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_FORMAT',
          message: `format must be one of: ${VALID_FORMATS.join(', ')}`,
        },
        meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      },
      { status: 400 }
    );
  }

  // In production: enqueue export job, return job ID
  // Mock: return a presigned download URL expiring in 10 minutes
  const exportId   = `exp_${Math.random().toString(36).slice(2, 10)}`;
  const expiresAt  = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const extension  = format === 'excel' ? 'xlsx' : 'csv';
  const now        = new Date().toISOString();

  // Build a summary of the applied filters for transparency
  const appliedFilters = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );

  return NextResponse.json({
    success: true,
    data: {
      export_id:    exportId,
      status:       'READY',          // In production could be 'PROCESSING' for large exports
      format,
      download_url: `https://exports.mockpayments.io/${exportId}/transactions.${extension}`,
      expires_at:   expiresAt,
      record_count: 20,               // Mock total matching records
      file_size_kb: format === 'excel' ? 48 : 24,
      columns:      columns ?? [
        'id', 'status', 'gateway', 'amount', 'currency',
        'paymentMethod', 'customerEmail', 'customerPhone',
        'gatewayOrderId', 'createdAt', 'updatedAt',
      ],
      applied_filters: appliedFilters,
      ...(notify_email ? { notification_sent_to: notify_email } : {}),
      created_at: now,
    },
    meta: { request_id: `req_${Date.now()}`, timestamp: now },
  });
}
