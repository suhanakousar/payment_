import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'payagg_dev_secret_change_in_production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'payagg_refresh_dev_secret';
const ACCESS_TOKEN_TTL  = '7d';
const REFRESH_TOKEN_TTL = '30d';

export interface JwtPayload {
  userId:     string;
  merchantId: string | null;
  email:      string;
  role:       string;
  iat?:       number;
  exp?:       number;
}

// ── Bcrypt ────────────────────────────────────────────────────────────────────

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ── JWT ───────────────────────────────────────────────────────────────────────

export function signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}

export function signRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_TTL });
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

// ── Request helpers ───────────────────────────────────────────────────────────

export function extractToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return req.cookies.get('auth_token')?.value ?? null;
}

export function getAuthUser(req: NextRequest): JwtPayload | null {
  const token = extractToken(req);
  if (!token) return null;
  return verifyAccessToken(token);
}

// ── Dev bypass ────────────────────────────────────────────────────────────────
// In development, if no auth header/cookie is present, allow with a system user.
export function isDevBypass(req: NextRequest): boolean {
  return (
    process.env.NODE_ENV === 'development' &&
    !extractToken(req)
  );
}
