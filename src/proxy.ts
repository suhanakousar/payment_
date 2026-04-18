import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/firebase',
  '/api/v1/setup/seed',
  '/api/v1/webhooks/razorpay',
  '/api/health',
];

function getSecret() {
  const secret = process.env.JWT_SECRET ?? 'payagg_dev_secret_change_in_production';
  return new TextEncoder().encode(secret);
}

async function verifyToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();

  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname === '/') {
    return NextResponse.next();
  }

  if (process.env.NODE_ENV === 'development' && !pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/dashboard')) {
    const token = req.cookies.get('auth_token')?.value;
    if (!token || !(await verifyToken(token))) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
