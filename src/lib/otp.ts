import crypto from 'node:crypto';
import { OtpPurpose, Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

const OTP_LENGTH = 6;
const OTP_TTL_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;
const OTP_SECRET = process.env.OTP_SECRET || process.env.JWT_SECRET || 'payagg_otp_dev_secret';

function hashOtp(email: string, purpose: OtpPurpose, otp: string) {
  return crypto
    .createHash('sha256')
    .update(`${email.toLowerCase().trim()}:${purpose}:${otp}:${OTP_SECRET}`)
    .digest('hex');
}

export function generateOtp() {
  return crypto.randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, '0');
}

export async function createOtp(email: string, purpose: OtpPurpose) {
  const normalizedEmail = email.toLowerCase().trim();
  const otp = generateOtp();
  const codeHash = hashOtp(normalizedEmail, purpose, otp);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000);

  await prisma.verificationCode.deleteMany({
    where: {
      email: normalizedEmail,
      purpose,
    },
  });

  await prisma.verificationCode.create({
    data: {
      email: normalizedEmail,
      codeHash,
      purpose,
      expiresAt,
    },
  });

  return {
    otp,
    expiresAt,
  };
}

export async function verifyOtp(
  tx: Prisma.TransactionClient,
  email: string,
  purpose: OtpPurpose,
  otp: string
) {
  const normalizedEmail = email.toLowerCase().trim();
  const record = await tx.verificationCode.findFirst({
    where: {
      email: normalizedEmail,
      purpose,
      consumedAt: null,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!record) {
    return { ok: false as const, code: 'OTP_NOT_FOUND' };
  }

  if (record.expiresAt.getTime() < Date.now()) {
    await tx.verificationCode.delete({ where: { id: record.id } });
    return { ok: false as const, code: 'OTP_EXPIRED' };
  }

  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    await tx.verificationCode.delete({ where: { id: record.id } });
    return { ok: false as const, code: 'OTP_TOO_MANY_ATTEMPTS' };
  }

  const expectedHash = hashOtp(normalizedEmail, purpose, otp);
  if (record.codeHash !== expectedHash) {
    await tx.verificationCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false as const, code: 'OTP_INVALID' };
  }

  await tx.verificationCode.update({
    where: { id: record.id },
    data: {
      consumedAt: new Date(),
    },
  });

  return { ok: true as const };
}

export function getOtpExpiryMinutes() {
  return OTP_TTL_MINUTES;
}
