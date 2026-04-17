import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const updateChargebackSchema = z.object({
  action: z.enum(['ACCEPT', 'REJECT']),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    let body: unknown;
    try { body = await req.json(); } catch {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_JSON', message: 'Invalid JSON body' } },
        { status: 400 }
      );
    }

    const parsed = updateChargebackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'action must be ACCEPT or REJECT', details: parsed.error.flatten().fieldErrors } },
        { status: 400 }
      );
    }

    const cb = await prisma.chargeback.findUnique({ where: { id } });
    if (!cb) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Chargeback not found' } },
        { status: 404 }
      );
    }

    if (cb.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATUS', message: `Cannot ${parsed.data.action.toLowerCase()} a chargeback in status ${cb.status}` } },
        { status: 422 }
      );
    }

    if (new Date(cb.deadline) < new Date()) {
      // Mark as expired first
      await prisma.chargeback.update({ where: { id }, data: { status: 'EXPIRED' } });
      return NextResponse.json(
        { success: false, error: { code: 'DEADLINE_PASSED', message: 'Chargeback deadline has passed — marked as EXPIRED' } },
        { status: 422 }
      );
    }

    const newStatus = parsed.data.action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED';

    // If accepting, update transaction to REFUNDED (in a transaction)
    const updated = await prisma.$transaction(async (tx) => {
      const updatedCb = await tx.chargeback.update({ where: { id }, data: { status: newStatus } });

      if (parsed.data.action === 'ACCEPT') {
        await tx.transaction.update({
          where: { id: cb.transactionId },
          data:  { status: 'REFUNDED' },
        });
      }

      return updatedCb;
    });

    return NextResponse.json({
      success: true,
      data:    { ...updated, amount: Number(updated.amount) },
      meta:    { requestId: crypto.randomUUID(), timestamp: new Date().toISOString() },
    });
  } catch (err) {
    console.error('[PATCH /chargebacks/:id]', err);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
