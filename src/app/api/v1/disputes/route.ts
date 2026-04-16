import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { mockDisputes } from '@/lib/mock-data';
import type { Dispute, DisputeStatus } from '@/types';

const createDisputeSchema = z.object({
  transactionId: z.string().min(1),
  amount: z.number().positive(),
  reason: z.enum(['FAILED_PAYMENT', 'RETURN', 'COMPLAINT']),
  description: z.string().optional(),
});

let disputes: Dispute[] = [...mockDisputes];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') as DisputeStatus | null;
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const perPage = parseInt(searchParams.get('perPage') ?? '20', 10);

  let filtered = [...disputes];
  if (status) {
    filtered = filtered.filter((d) => d.status === status);
  }

  filtered.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const total = filtered.length;
  const pages = Math.ceil(total / perPage);
  const data = filtered.slice((page - 1) * perPage, page * perPage);

  return NextResponse.json({
    success: true,
    data,
    meta: { requestId: crypto.randomUUID(), timestamp: new Date().toISOString() },
    pagination: { page, perPage, total, pages },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createDisputeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { transactionId, amount, reason, description } = parsed.data;

    const existing = disputes.find((d) => d.transactionId === transactionId);
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_DISPUTE',
            message: 'A dispute already exists for this transaction',
          },
        },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const newDispute: Dispute = {
      id: `dsp_${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`,
      transactionId,
      amount,
      reason,
      description,
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
    };

    disputes.unshift(newDispute);

    return NextResponse.json(
      {
        success: true,
        data: newDispute,
        meta: { requestId: crypto.randomUUID(), timestamp: now },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
