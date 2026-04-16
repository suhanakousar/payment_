import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { mockChargebacks, mockDisputes } from '@/lib/mock-data';
import type { Chargeback, ChargebackStatus } from '@/types';

const createChargebackSchema = z.object({
  disputeId: z.string().min(1),
  deadlineDays: z.number().int().min(7).max(15).default(10),
});

let chargebacks: Chargeback[] = [...mockChargebacks];
const disputes = [...mockDisputes];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') as ChargebackStatus | null;
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const perPage = parseInt(searchParams.get('perPage') ?? '20', 10);

  let filtered = [...chargebacks];

  const now = new Date();
  filtered = filtered.map((cb) => {
    if (cb.status === 'PENDING' && new Date(cb.deadline) < now) {
      return { ...cb, status: 'EXPIRED' as ChargebackStatus, updatedAt: now.toISOString() };
    }
    return cb;
  });

  if (status) {
    filtered = filtered.filter((cb) => cb.status === status);
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
    const parsed = createChargebackSchema.safeParse(body);

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

    const { disputeId, deadlineDays } = parsed.data;

    const dispute = disputes.find((d) => d.id === disputeId);
    if (!dispute) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Dispute not found' } },
        { status: 404 }
      );
    }

    const existingCb = chargebacks.find((cb) => cb.disputeId === disputeId);
    if (existingCb) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_CHARGEBACK',
            message: 'A chargeback already exists for this dispute',
          },
        },
        { status: 409 }
      );
    }

    const now = new Date();
    const deadline = new Date(now);
    deadline.setDate(deadline.getDate() + deadlineDays);

    const newChargeback: Chargeback = {
      id: `cbk_${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`,
      disputeId,
      transactionId: dispute.transactionId,
      amount: dispute.amount,
      status: 'PENDING',
      deadline: deadline.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    chargebacks.unshift(newChargeback);

    return NextResponse.json(
      {
        success: true,
        data: newChargeback,
        meta: { requestId: crypto.randomUUID(), timestamp: now.toISOString() },
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
