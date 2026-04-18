import { NextRequest, NextResponse } from 'next/server';
import { OtpPurpose } from '@prisma/client';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { sendOtpEmail } from '@/lib/mailer';
import { createOtp, getOtpExpiryMinutes } from '@/lib/otp';
import { rateLimit } from '@/lib/ratelimit';

const requestSchema = z.object({
  business_name: z.string().min(2, 'Business name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
});

const meta = () => ({
  request_id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  timestamp: new Date().toISOString(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const rl = rateLimit(`register:request-otp:${ip}`, { windowMs: 60_000, max: 5 });
  if (!rl.ok) {
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMITED', message: 'Too many OTP requests. Please wait a minute.' } },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_JSON', message: 'Invalid JSON body' } },
      { status: 400 }
    );
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        meta: meta(),
      },
      { status: 400 }
    );
  }

  const { email, business_name } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'EMAIL_TAKEN', message: 'An account with this email already exists.' }, meta: meta() },
        { status: 409 }
      );
    }

    const { otp, expiresAt } = await createOtp(normalizedEmail, OtpPurpose.REGISTER);
    await sendOtpEmail({
      email: normalizedEmail,
      otp,
      businessName: business_name,
      expiresInMinutes: getOtpExpiryMinutes(),
    });

    return NextResponse.json({
      success: true,
      data: {
        email: normalizedEmail,
        expires_at: expiresAt.toISOString(),
      },
      meta: meta(),
    });
  } catch (err) {
    console.error('[auth/register/request-otp]', err);

    if (err instanceof Error && err.message.startsWith('Missing required mail configuration:')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MAIL_NOT_CONFIGURED',
            message: 'Email delivery is not configured yet. Add SMTP settings to your environment first.',
          },
          meta: meta(),
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }, meta: meta() },
      { status: 500 }
    );
  }
}
