import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

const meta = () => ({
  request_id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  timestamp:  new Date().toISOString(),
});

// ── GET /api/v1/profile ──────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const payload = getAuthUser(req);
  if (!payload) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id:       true,
        email:    true,
        fullName: true,
        phone:    true,
        role:     true,
        status:   true,
        merchant: {
          select: {
            id:               true,
            businessName:     true,
            gstin:            true,
            pan:              true,
            businessCategory: true,
            address:          true,
            kycStatus:        true,
            tier:             true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: user, meta: meta() });
  } catch (err) {
    console.error('[profile GET]', err);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

// ── PATCH /api/v1/profile ────────────────────────────────────────────────────

const patchSchema = z.object({
  fullName:         z.string().min(1).optional(),
  phone:            z.string().optional(),
  businessName:     z.string().min(1).optional(),
  gstin:            z.string().optional(),
  pan:              z.string().optional(),
  businessCategory: z.string().optional(),
  address:          z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  const payload = getAuthUser(req);
  if (!payload) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    );
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_JSON', message: 'Invalid JSON body' } },
      { status: 400 }
    );
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten().fieldErrors } },
      { status: 400 }
    );
  }

  const { fullName, phone, businessName, gstin, pan, businessCategory, address } = parsed.data;

  try {
    const userUpdate: Record<string, unknown> = {};
    if (fullName !== undefined) userUpdate.fullName = fullName;
    if (phone    !== undefined) userUpdate.phone    = phone || null;

    const merchantUpdate: Record<string, unknown> = {};
    if (businessName     !== undefined) merchantUpdate.businessName     = businessName;
    if (gstin            !== undefined) merchantUpdate.gstin            = gstin || null;
    if (pan              !== undefined) merchantUpdate.pan              = pan || null;
    if (businessCategory !== undefined) merchantUpdate.businessCategory = businessCategory || null;
    if (address          !== undefined) merchantUpdate.address          = address || null;

    const [user] = await Promise.all([
      Object.keys(userUpdate).length > 0
        ? prisma.user.update({ where: { id: payload.userId }, data: userUpdate, select: { id: true, email: true, fullName: true, phone: true } })
        : prisma.user.findUnique({ where: { id: payload.userId }, select: { id: true, email: true, fullName: true, phone: true } }),
      Object.keys(merchantUpdate).length > 0 && payload.merchantId
        ? prisma.merchant.update({ where: { id: payload.merchantId }, data: merchantUpdate })
        : Promise.resolve(),
    ]);

    return NextResponse.json({ success: true, data: user, meta: meta() });
  } catch (err) {
    console.error('[profile PATCH]', err);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
