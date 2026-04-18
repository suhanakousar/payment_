import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit } from '@/lib/ratelimit';
import prisma from '@/lib/prisma';
import { signAccessToken, signRefreshToken } from '@/lib/auth';

const schema = z.object({
  uid:         z.string(),
  email:       z.string().email(),
  displayName: z.string().optional(),
  photoURL:    z.string().optional(),
  provider:    z.string().optional(),
});

const meta = () => ({
  request_id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  timestamp:  new Date().toISOString(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const rl = rateLimit(`firebase-auth:${ip}`, { windowMs: 60_000, max: 20 });
  if (!rl.ok) {
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests.' } },
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

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input' } },
      { status: 400 }
    );
  }

  const { uid, email, displayName, provider } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  try {
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { merchant: { select: { id: true, businessName: true, tier: true, kycStatus: true } } },
    });

    if (!user) {
      const merchant = await prisma.merchant.create({
        data: {
          businessName: displayName ?? normalizedEmail.split('@')[0],
          kycStatus:    'PENDING',
          tier:         'STARTER',
        },
      });

      user = await prisma.user.create({
        data: {
          merchantId:   merchant.id,
          fullName:     displayName ?? normalizedEmail.split('@')[0],
          email:        normalizedEmail,
          passwordHash: `firebase:${uid}`,
          role:         'MERCHANT_ADMIN',
          status:       'ACTIVE',
          firebaseUid:  uid,
        },
        include: { merchant: { select: { id: true, businessName: true, tier: true, kycStatus: true } } },
      });
    } else if (!user.firebaseUid) {
      user = await prisma.user.update({
        where: { id: user.id },
        data:  { firebaseUid: uid, lastLoginAt: new Date() },
        include: { merchant: { select: { id: true, businessName: true, tier: true, kycStatus: true } } },
      });
    } else {
      await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    }

    const jwtPayload = {
      userId:     user.id,
      merchantId: user.merchantId,
      email:      user.email,
      role:       user.role,
    };
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
    console.error('[firebase-auth]', err);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }, meta: meta() },
      { status: 500 }
    );
  }
}
