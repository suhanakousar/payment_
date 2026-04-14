import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { business_name, email, password, phone } = body;

  const missingFields: string[] = [];
  if (!business_name) missingFields.push('business_name');
  if (!email) missingFields.push('email');
  if (!password) missingFields.push('password');
  if (!phone) missingFields.push('phone');

  if (missingFields.length > 0) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Missing required fields: ${missingFields.join(', ')}`,
        },
        meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      },
      { status: 400 }
    );
  }

  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INVALID_EMAIL', message: 'Please provide a valid email address' },
        meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      },
      { status: 400 }
    );
  }

  // Password strength check (min 8 chars)
  if (password.length < 8) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters long' },
        meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      },
      { status: 400 }
    );
  }

  const merchantId = `mrc_${Math.random().toString(36).slice(2, 10)}`;
  const userId = `usr_${Math.random().toString(36).slice(2, 10)}`;

  // Mock successful registration
  return NextResponse.json(
    {
      success: true,
      data: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock_register_token',
        refresh_token: `rt_mock_refresh_${userId}`,
        user: {
          id: userId,
          email,
          phone,
          role: 'MERCHANT_ADMIN',
          merchant_id: merchantId,
          status: 'PENDING_KYC',
        },
        merchant: {
          id: merchantId,
          business_name,
          kyc_status: 'PENDING',
          tier: 'STARTER',
          created_at: new Date().toISOString(),
        },
        expires_in: 900, // 15 minutes
      },
      meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    },
    { status: 201 }
  );
}
