import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

// ─── GET /api/v1/setup/seed ───────────────────────────────────────────────────
// One-time seed: creates default merchant + admin user + sample data.
// Safe to call multiple times (idempotent — checks before creating).
export async function GET() {
  try {
    const adminEmail = 'admin@payagg.io';
    const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } });

    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: 'Database already seeded.',
        credentials: { email: adminEmail, note: 'User already exists — use your original password.' },
      });
    }

    const password = 'admin123456';
    const passwordHash = await hashPassword(password);

    // Create merchant
    const merchant = await prisma.merchant.create({
      data: {
        businessName:     'PayAgg Demo Merchant',
        gstin:            '27AAPCA1234F1Z5',
        pan:              'AAPCA1234F',
        kycStatus:        'VERIFIED',
        tier:             'GROWTH',
        dailyPayoutLimit: 5_000_000, // ₹50,000
        preferredGateway: 'RAZORPAY',
        webhookUrl:       null,
      },
    });

    // Create admin user
    const user = await prisma.user.create({
      data: {
        merchantId:   merchant.id,
        email:        adminEmail,
        phone:        '+919876543210',
        passwordHash,
        role:         'MERCHANT_ADMIN',
        status:       'ACTIVE',
      },
    });

    // Seed sample transactions
    const txnData = [
      { gateway: 'RAZORPAY' as const, amount: 49900,  status: 'CAPTURED'   as const, customerEmail: 'rahul@example.com',  customerPhone: '+919876543210', paymentMethod: 'upi' },
      { gateway: 'RAZORPAY' as const, amount: 199900, status: 'CAPTURED'   as const, customerEmail: 'priya@example.com',  customerPhone: '+919876543211', paymentMethod: 'card' },
      { gateway: 'CASHFREE' as const, amount: 99900,  status: 'FAILED'     as const, customerEmail: 'amit@example.com',   customerPhone: '+919876543212', paymentMethod: 'netbanking' },
      { gateway: 'RAZORPAY' as const, amount: 299900, status: 'PENDING'    as const, customerEmail: 'sneha@example.com',  customerPhone: '+919876543213', paymentMethod: 'upi' },
      { gateway: 'STRIPE'   as const, amount: 499900, status: 'CAPTURED'   as const, customerEmail: 'vijay@example.com',  customerPhone: '+919876543214', paymentMethod: 'card' },
      { gateway: 'RAZORPAY' as const, amount: 149900, status: 'REFUNDED'   as const, customerEmail: 'anita@example.com',  customerPhone: '+919876543215', paymentMethod: 'wallet' },
      { gateway: 'CASHFREE' as const, amount: 79900,  status: 'CAPTURED'   as const, customerEmail: 'rohan@example.com',  customerPhone: '+919876543216', paymentMethod: 'upi' },
      { gateway: 'RAZORPAY' as const, amount: 349900, status: 'AUTHORIZED' as const, customerEmail: 'meera@example.com',  customerPhone: '+919876543217', paymentMethod: 'card' },
    ];

    const transactions = [];
    for (const d of txnData) {
      const createdAgo = new Date(Date.now() - Math.random() * 30 * 86400 * 1000);
      const t = await prisma.transaction.create({
        data: {
          merchantId:    merchant.id,
          gateway:       d.gateway,
          gatewayOrderId: `order_${Math.random().toString(36).slice(2, 12).toUpperCase()}`,
          amount:        d.amount,
          currency:      'INR',
          status:        d.status,
          paymentMethod: d.paymentMethod,
          customerEmail: d.customerEmail,
          customerPhone: d.customerPhone,
          createdAt:     createdAgo,
        },
      });
      transactions.push(t);
    }

    // Seed disputes (on failed + refunded transactions)
    const failedTxn   = transactions.find((t) => t.status === 'FAILED');
    const refundedTxn = transactions.find((t) => t.status === 'REFUNDED');

    const disputeRecords = [];
    if (failedTxn) {
      const d = await prisma.dispute.create({
        data: { transactionId: failedTxn.id, amount: failedTxn.amount, reason: 'FAILED_PAYMENT', description: 'Payment deducted but not confirmed', status: 'PENDING' },
      });
      disputeRecords.push(d);
    }
    if (refundedTxn) {
      const d = await prisma.dispute.create({
        data: { transactionId: refundedTxn.id, amount: refundedTxn.amount, reason: 'RETURN', description: 'Product returned — refund requested', status: 'UNDER_REVIEW' },
      });
      disputeRecords.push(d);

      // Seed one chargeback from the refund dispute
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 10);
      await prisma.chargeback.create({
        data: {
          disputeId:     d.id,
          transactionId: refundedTxn.id,
          amount:        refundedTxn.amount,
          status:        'PENDING',
          deadline,
        },
      });
    }

    // Seed payouts
    await prisma.payout.createMany({
      data: [
        { merchantId: merchant.id, gateway: 'RAZORPAY', beneficiaryName: 'Arjun Sharma', accountNumber: '123456789012', ifscCode: 'SBIN0001234', amount: 500000,  mode: 'IMPS', status: 'SUCCESS' },
        { merchantId: merchant.id, gateway: 'RAZORPAY', beneficiaryName: 'Priya Patel',  accountNumber: '987654321098', ifscCode: 'HDFC0002345', amount: 1500000, mode: 'NEFT', status: 'QUEUED' },
      ],
    });

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully!',
      credentials: {
        email:    adminEmail,
        password: password,
        note:     'Change this password after first login.',
      },
      seeded: {
        merchant:    { id: merchant.id, name: merchant.businessName },
        user:        { id: user.id, email: user.email, role: user.role },
        transactions: transactions.length,
        disputes:    disputeRecords.length,
      },
    });
  } catch (err) {
    console.error('[seed]', err);
    return NextResponse.json(
      { success: false, error: { code: 'SEED_FAILED', message: String(err) } },
      { status: 500 }
    );
  }
}
