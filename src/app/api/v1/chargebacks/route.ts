import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const meta = () => ({ requestId: crypto.randomUUID(), timestamp: new Date().toISOString() });

const createChargebackSchema = z.object({
  disputeId:    z.string().min(1, 'disputeId is required'),
  deadlineDays: z.number().int().min(7).max(15).default(10),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status  = searchParams.get('status')?.toUpperCase();
  const page    = Math.max(1, parseInt(searchParams.get('page')    ?? '1',  10));
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('perPage') ?? '20', 10)));

  try {
    // Auto-expire overdue PENDING chargebacks before returning results
    await prisma.chargeback.updateMany({
      where: { status: 'PENDING', deadline: { lt: new Date() } },
      data:  { status: 'EXPIRED' },
    });

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [total, rows] = await Promise.all([
      prisma.chargeback.count({ where }),
      prisma.chargeback.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip:    (page - 1) * perPage,
        take:    perPage,
        include: { dispute: { select: { id: true, reason: true, transactionId: true } } },
      }),
    ]);

    const data = rows.map((cb) => ({ ...cb, amount: Number(cb.amount) }));

    return NextResponse.json({
      success: true, data, meta: meta(),
      pagination: { page, perPage, total, pages: Math.ceil(total / perPage) },
    });
  } catch (err) {
    console.error('[GET /chargebacks]', err);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_JSON', message: 'Invalid JSON body' } },
      { status: 400 }
    );
  }

  const parsed = createChargebackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: parsed.error.flatten().fieldErrors } },
      { status: 400 }
    );
  }

  const { disputeId, deadlineDays } = parsed.data;

  try {
    const dispute = await prisma.dispute.findUnique({ where: { id: disputeId } });
    if (!dispute) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Dispute not found' } },
        { status: 404 }
      );
    }

    const existingCb = await prisma.chargeback.findUnique({ where: { disputeId } });
    if (existingCb) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE_CHARGEBACK', message: 'A chargeback already exists for this dispute' } },
        { status: 409 }
      );
    }

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + deadlineDays);

    const chargeback = await prisma.chargeback.create({
      data: {
        disputeId,
        transactionId: dispute.transactionId,
        amount:        dispute.amount,
        status:        'PENDING',
        deadline,
      },
    });

    return NextResponse.json(
      { success: true, data: { ...chargeback, amount: Number(chargeback.amount) }, meta: meta() },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /chargebacks]', err);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
