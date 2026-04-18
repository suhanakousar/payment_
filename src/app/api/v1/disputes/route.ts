import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const meta = () => ({ requestId: crypto.randomUUID(), timestamp: new Date().toISOString() });

const createDisputeSchema = z.object({
  transactionId: z.string().min(1, 'transactionId is required'),
  amount:        z.number().positive('amount must be positive'),
  reason:        z.enum(['FAILED_PAYMENT', 'RETURN', 'COMPLAINT']),
  description:   z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status  = searchParams.get('status')?.toUpperCase();
  const page    = Math.max(1, parseInt(searchParams.get('page')    ?? '1',  10));
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('perPage') ?? '20', 10)));

  try {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [total, rows] = await Promise.all([
      prisma.dispute.count({ where }),
      prisma.dispute.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip:    (page - 1) * perPage,
        take:    perPage,
        include: { transaction: { select: { id: true, gateway: true, currency: true, customerEmail: true } } },
      }),
    ]);

    const data = rows.map((d) => ({ ...d, amount: Number(d.amount) }));

    return NextResponse.json({
      success: true, data, meta: meta(),
      pagination: { page, perPage, total, pages: Math.ceil(total / perPage) },
    });
  } catch (err) {
    console.error('[GET /disputes]', err);
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

  const parsed = createDisputeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: parsed.error.flatten().fieldErrors } },
      { status: 400 }
    );
  }

  const { transactionId, amount, reason, description } = parsed.data;

  try {
    const txn = await prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!txn) {
      return NextResponse.json(
        { success: false, error: { code: 'TRANSACTION_NOT_FOUND', message: 'Transaction not found' } },
        { status: 404 }
      );
    }

    const existing = await prisma.dispute.findFirst({ where: { transactionId } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE_DISPUTE', message: 'A dispute already exists for this transaction' } },
        { status: 409 }
      );
    }

    const dispute = await prisma.dispute.create({
      data: { transactionId, amount, reason, description: description ?? null, status: 'PENDING' },
    });

    return NextResponse.json(
      { success: true, data: { ...dispute, amount: Number(dispute.amount) }, meta: meta() },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /disputes]', err);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
