import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password } = body;

  // Simulate auth - in production, validate against DB
  if (!email || !password) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Email and password are required' },
        meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      },
      { status: 400 }
    );
  }

  // Mock successful login
  return NextResponse.json({
    success: true,
    data: {
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock_token',
      refresh_token: 'rt_mock_refresh_token',
      user: {
        id: 'usr_8f3a9b12',
        email,
        role: 'MERCHANT_ADMIN',
        merchant_id: 'mrc_c4d7e2f1',
      },
      expires_in: 900, // 15 minutes
    },
    meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() },
  });
}
