import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const updateDisputeSchema = z.object({
  status: z.enum(['PENDING', 'UNDER_REVIEW', 'RESOLVED']),
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

    const parsed = updateDisputeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: parsed.error.flatten().fieldErrors } },
        { status: 400 }
      );
    }

    const existing = await prisma.dispute.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Dispute not found' } },
        { status: 404 }
      );
    }

    const updated = await prisma.dispute.update({
      where: { id },
      data:  { status: parsed.data.status },
    });

    return NextResponse.json({
      success: true,
      data:    { ...updated, amount: Number(updated.amount) },
      meta:    { requestId: crypto.randomUUID(), timestamp: new Date().toISOString() },
    });
  } catch (err) {
    console.error('[PATCH /disputes/:id]', err);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
