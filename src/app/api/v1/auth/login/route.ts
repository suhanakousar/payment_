import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { verifyPassword, signAccessToken, signRefreshToken } from '@/lib/auth';
import { rateLimit } from '@/lib/ratelimit';

const loginSchema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const meta = () => ({ request_id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, timestamp: new Date().toISOString() });

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const rl = rateLimit(`login:${ip}`, { windowMs: 60_000, max: 10 });
  if (!rl.ok) {
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Please wait a minute.' } },
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

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten().fieldErrors }, meta: meta() },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        merchant: { select: { id: true, businessName: true, tier: true, kycStatus: true } },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }, meta: meta() },
        { status: 401 }
      );
    }

    if (user.status === 'SUSPENDED') {
      return NextResponse.json(
        { success: false, error: { code: 'ACCOUNT_SUSPENDED', message: 'Your account has been suspended. Contact support.' }, meta: meta() },
        { status: 403 }
      );
    }

    const passwordOk = await verifyPassword(password, user.passwordHash);
    if (!passwordOk) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }, meta: meta() },
        { status: 401 }
      );
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date(), status: 'ACTIVE' } });

    const jwtPayload = { userId: user.id, merchantId: user.merchantId, email: user.email, role: user.role };
    const accessToken  = signAccessToken(jwtPayload);
    const refreshToken = signRefreshToken(jwtPayload);

    const response = NextResponse.json({
      success: true,
      data: {
        access_token:  accessToken,
        refresh_token: refreshToken,
        expires_in:    900,
        user: {
          id:          user.id,
          email:       user.email,
          role:        user.role,
          status:      user.status,
          merchant_id: user.merchantId,
          merchant:    user.merchant,
        },
      },
      meta: meta(),
    });

    response.cookies.set('auth_token', accessToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path:     '/',
      maxAge:   900,
    });
    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path:     '/',
      maxAge:   7 * 24 * 3600,
    });

    return response;
  } catch (err) {
    console.error('[auth/login]', err);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }, meta: meta() },
      { status: 500 }
    );
  }
}
