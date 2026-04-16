import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { mockDisputes } from '@/lib/mock-data';
import type { Dispute } from '@/types';

const updateDisputeSchema = z.object({
  status: z.enum(['PENDING', 'UNDER_REVIEW', 'RESOLVED']),
});

let disputes: Dispute[] = [...mockDisputes];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateDisputeSchema.safeParse(body);

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

    const index = disputes.findIndex((d) => d.id === id);
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Dispute not found' } },
        { status: 404 }
      );
    }

    disputes[index] = {
      ...disputes[index],
      status: parsed.data.status,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: disputes[index],
      meta: { requestId: crypto.randomUUID(), timestamp: new Date().toISOString() },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
