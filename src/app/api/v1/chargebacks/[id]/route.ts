import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { mockChargebacks } from '@/lib/mock-data';
import type { Chargeback } from '@/types';

const updateChargebackSchema = z.object({
  action: z.enum(['ACCEPT', 'REJECT']),
});

let chargebacks: Chargeback[] = [...mockChargebacks];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateChargebackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'action must be ACCEPT or REJECT',
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const index = chargebacks.findIndex((cb) => cb.id === id);
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Chargeback not found' } },
        { status: 404 }
      );
    }

    const cb = chargebacks[index];

    if (cb.status !== 'PENDING') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Cannot ${parsed.data.action.toLowerCase()} a chargeback in status ${cb.status}`,
          },
        },
        { status: 422 }
      );
    }

    if (new Date(cb.deadline) < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'DEADLINE_PASSED', message: 'Chargeback deadline has passed' },
        },
        { status: 422 }
      );
    }

    const newStatus = parsed.data.action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED';
    const now = new Date().toISOString();

    chargebacks[index] = { ...cb, status: newStatus, updatedAt: now };

    return NextResponse.json({
      success: true,
      data: chargebacks[index],
      meta: { requestId: crypto.randomUUID(), timestamp: now },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
