import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { hashPassword, signAccessToken, signRefreshToken } from '@/lib/auth';
import { rateLimit } from '@/lib/ratelimit';

const registerSchema = z.object({
  business_name: z.string().min(2, 'Business name must be at least 2 characters'),
  email:         z.string().email('Invalid email address'),
  password:      z.string().min(8, 'Password must be at least 8 characters'),
  phone:         z.string().min(10, 'Invalid phone number').optional(),
});

const meta = () => ({ request_id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, timestamp: new Date().toISOString() });

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const rl = rateLimit(`register:${ip}`, { windowMs: 60_000, max: 5 });
  if (!rl.ok) {
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMITED', message: 'Too many registration attempts.' } },
      { status: 429 }
    );
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_JSON', message: 'Invalid JSON body' } },
      { status: 400 }
    );
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten().fieldErrors }, meta: meta() },
      { status: 400 }
    );
  }

  const { business_name, email, password, phone } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'EMAIL_TAKEN', message: 'An account with this email already exists' }, meta: meta() },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const result = await prisma.$transaction(async (tx) => {
      const merchant = await tx.merchant.create({
        data: { businessName: business_name, kycStatus: 'PENDING', tier: 'STARTER' },
      });

      const user = await tx.user.create({
        data: {
          merchantId:   merchant.id,
          email:        email.toLowerCase().trim(),
          phone:        phone ?? null,
          passwordHash,
          role:         'MERCHANT_ADMIN',
          status:       'PENDING_VERIFICATION',
        },
      });

      return { user, merchant };
    });

    const jwtPayload = { userId: result.user.id, merchantId: result.merchant.id, email: result.user.email, role: result.user.role };
    const accessToken  = signAccessToken(jwtPayload);
    const refreshToken = signRefreshToken(jwtPayload);

    const response = NextResponse.json(
      {
        success: true,
        data: {
          access_token:  accessToken,
          refresh_token: refreshToken,
          expires_in:    900,
          user: {
            id:          result.user.id,
            email:       result.user.email,
            phone:       result.user.phone,
            role:        result.user.role,
            merchant_id: result.merchant.id,
            status:      result.user.status,
          },
          merchant: {
            id:            result.merchant.id,
            business_name: result.merchant.businessName,
            kyc_status:    result.merchant.kycStatus,
            tier:          result.merchant.tier,
            created_at:    result.merchant.createdAt.toISOString(),
          },
        },
        meta: meta(),
      },
      { status: 201 }
    );

    response.cookies.set('auth_token', accessToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path:     '/',
      maxAge:   900,
    });

    return response;
  } catch (err) {
    console.error('[auth/register]', err);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }, meta: meta() },
      { status: 500 }
    );
  }
}
