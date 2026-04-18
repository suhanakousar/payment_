import type {
  Merchant,
  User,
  DashboardKPI,
  RevenueDataPoint,
  Transaction,
  Payout,
  ApiKey,
  WebhookLog,
  GatewayHealth,
  PaymentMethodBreakdown,
  TransactionStatusCount,
  RecentActivity,
  Dispute,
  Chargeback,
  SystemPerformance,
} from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// Merchant
// ─────────────────────────────────────────────────────────────────────────────

export const mockMerchant: Merchant = {
  id: 'mrc_9f2a1b3c',
  businessName: 'Arjun Retail Solutions Pvt. Ltd.',
  gstin: '27AAPCA1234F1Z5',
  pan: 'AAPCA1234F',
  kycStatus: 'VERIFIED',
  tier: 'GROWTH',
  dailyPayoutLimit: 50_000_00, // ₹5,00,000 in paise
  preferredGateway: 'AUTO',
  webhookUrl: 'https://api.arjunretail.in/webhooks/payment',
  createdAt: '2023-08-15T09:30:00.000Z',
};

// ─────────────────────────────────────────────────────────────────────────────
// Logged-in user
// ─────────────────────────────────────────────────────────────────────────────

export const mockUser: User = {
  id: 'usr_4d7e9c2a',
  merchantId: 'mrc_9f2a1b3c',
  email: 'arjun.sharma@arjunretail.in',
  phone: '+91 98765 43210',
  role: 'MERCHANT_ADMIN',
  status: 'ACTIVE',
  lastLoginAt: '2026-04-14T07:12:45.000Z',
  createdAt: '2023-08-15T09:35:00.000Z',
};

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard KPIs
// ─────────────────────────────────────────────────────────────────────────────

export const mockDashboardKPI: DashboardKPI = {
  totalRevenue: 124_589_00,    // ₹12,45,890 in paise
  totalTransactions: 1_247,
  successRate: 94.2,
  pendingPayouts: 34_500_00,   // ₹3,45,000 in paise
  revenueChange: 12.5,
  transactionChange: 8.3,
};

// ─────────────────────────────────────────────────────────────────────────────
// 30-day revenue data
// ─────────────────────────────────────────────────────────────────────────────

const revenueSeeds: Array<[number, number]> = [
  [4_820_00, 2_310_00], [5_140_00, 2_580_00], [3_890_00, 1_920_00],
  [6_270_00, 3_100_00], [5_560_00, 2_750_00], [4_430_00, 2_200_00],
  [7_120_00, 3_560_00], [6_340_00, 3_170_00], [5_230_00, 2_610_00],
  [4_980_00, 2_490_00], [6_780_00, 3_390_00], [7_450_00, 3_720_00],
  [5_670_00, 2_835_00], [4_320_00, 2_160_00], [5_890_00, 2_940_00],
  [6_910_00, 3_455_00], [7_230_00, 3_610_00], [5_040_00, 2_520_00],
  [4_670_00, 2_330_00], [6_100_00, 3_050_00], [5_380_00, 2_690_00],
  [7_890_00, 3_940_00], [6_520_00, 3_260_00], [5_760_00, 2_880_00],
  [4_150_00, 2_070_00], [6_840_00, 3_420_00], [7_130_00, 3_560_00],
  [5_490_00, 2_740_00], [6_270_00, 3_130_00], [5_820_00, 2_910_00],
];

export const mockRevenueData: RevenueDataPoint[] = revenueSeeds.map(
  ([revenue, payouts], idx) => {
    const d = new Date('2026-03-16');
    d.setDate(d.getDate() + idx);
    return {
      date: d.toISOString().slice(0, 10),
      revenue,
      payouts,
    };
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Transactions  (amounts in paise)
// ─────────────────────────────────────────────────────────────────────────────

export const mockTransactions: Transaction[] = [
  {
    id: 'txn_r8k2m1p9',
    merchantId: 'mrc_9f2a1b3c',
    gateway: 'RAZORPAY',
    gatewayOrderId: 'order_RzrPy8Xk2M1p9',
    gatewayPaymentId: 'pay_RzrPy9Lm3N2q0',
    amount: 49_990_0,           // ₹4,999.00
    currency: 'INR',
    status: 'CAPTURED',
    paymentMethod: 'upi',
    customerEmail: 'priya.mehta@gmail.com',
    customerPhone: '+91 99001 23456',
    idempotencyKey: 'idem_pr01_20260414',
    metadata: { orderId: 'ORD-10042', product: 'Electronics' },
    createdAt: '2026-04-14T06:42:10.000Z',
    updatedAt: '2026-04-14T06:42:28.000Z',
  },
  {
    id: 'txn_c5n7a3d1',
    merchantId: 'mrc_9f2a1b3c',
    gateway: 'CASHFREE',
    gatewayOrderId: 'order_CshFr5N7a3d1',
    gatewayPaymentId: 'pay_CshFr6O8b4e2',
    amount: 12_99_00,           // ₹1,299.00
    currency: 'INR',
    status: 'CAPTURED',
    paymentMethod: 'card',
    customerEmail: 'rohan.verma@outlook.com',
    customerPhone: '+91 87654 32109',
    idempotencyKey: 'idem_rv02_20260414',
    metadata: { orderId: 'ORD-10043', product: 'Fashion' },
    createdAt: '2026-04-14T06:58:33.000Z',
    updatedAt: '2026-04-14T06:58:51.000Z',
  },
  {
    id: 'txn_f2j9b6e4',
    merchantId: 'mrc_9f2a1b3c',
    gateway: 'RAZORPAY',
    gatewayOrderId: 'order_RzrPyF2J9b6',
    amount: 99_900,             // ₹999.00
    currency: 'INR',
    status: 'FAILED',
    paymentMethod: 'netbanking',
    customerEmail: 'sunita.rao@yahoo.co.in',
    customerPhone: '+91 76543 21098',
    idempotencyKey: 'idem_sr03_20260414',
    metadata: { orderId: 'ORD-10044', failureCode: 'BANK_DECLINED' },
    createdAt: '2026-04-14T07:05:17.000Z',
    updatedAt: '2026-04-14T07:05:22.000Z',
  },
  {
    id: 'txn_h4l1c8f6',
    merchantId: 'mrc_9f2a1b3c',
    gateway: 'STRIPE',
    gatewayOrderId: 'order_StripeH4L1c8',
    gatewayPaymentId: 'pay_StripeI5M2d9',
    amount: 2_49_900,           // ₹2,499.00
    currency: 'INR',
    status: 'CAPTURED',
    paymentMethod: 'card',
    customerEmail: 'aditya.kumar@gmail.com',
    customerPhone: '+91 98112 34567',
    idempotencyKey: 'idem_ak04_20260414',
    metadata: { orderId: 'ORD-10045', product: 'SaaS Subscription' },
    createdAt: '2026-04-14T07:14:05.000Z',
    updatedAt: '2026-04-14T07:14:19.000Z',
  },
  {
    id: 'txn_m7q4d2g8',
    merchantId: 'mrc_9f2a1b3c',
    gateway: 'RAZORPAY',
    gatewayOrderId: 'order_RzrPyM7Q4d2',
    amount: 59_900,             // ₹599.00
    currency: 'INR',
    status: 'PENDING',
    paymentMethod: 'upi',
    customerEmail: 'kavitha.nair@hotmail.com',
    customerPhone: '+91 90123 45678',
    idempotencyKey: 'idem_kn05_20260414',
    metadata: { orderId: 'ORD-10046', product: 'Grocery' },
    createdAt: '2026-04-14T07:22:48.000Z',
    updatedAt: '2026-04-14T07:22:48.000Z',
  },
  {
    id: 'txn_p3s6e9j2',
    merchantId: 'mrc_9f2a1b3c',
    gateway: 'CASHFREE',
    gatewayOrderId: 'order_CshFrP3S6e9',
    gatewayPaymentId: 'pay_CshFrQ4T7f0',
    amount: 7_99_900,           // ₹7,999.00
    currency: 'INR',
    status: 'CAPTURED',
    paymentMethod: 'card',
    customerEmail: 'rajan.pillai@gmail.com',
    customerPhone: '+91 91234 56789',
    idempotencyKey: 'idem_rp06_20260413',
    metadata: { orderId: 'ORD-10037', product: 'Home Appliance' },
    createdAt: '2026-04-13T18:30:10.000Z',
    updatedAt: '2026-04-13T18:30:29.000Z',
  },
  {
    id: 'txn_b9w2f5k7',
    merchantId: 'mrc_9f2a1b3c',
    gateway: 'RAZORPAY',
    gatewayOrderId: 'order_RzrPyB9W2f5',
    gatewayPaymentId: 'pay_RzrPyC0X3g6',
    amount: 3_49_900,           // ₹3,499.00
    currency: 'INR',
    status: 'REFUNDED',
    paymentMethod: 'upi',
    customerEmail: 'deepa.subramaniam@gmail.com',
    customerPhone: '+91 88990 12345',
    idempotencyKey: 'idem_ds07_20260413',
    metadata: { orderId: 'ORD-10031', refundReason: 'Customer request' },
    createdAt: '2026-04-13T15:10:22.000Z',
    updatedAt: '2026-04-13T17:45:00.000Z',
  },
  {
    id: 'txn_x1v8h3n5',
    merchantId: 'mrc_9f2a1b3c',
    gateway: 'CASHFREE',
    gatewayOrderId: 'order_CshFrX1V8h3',
    amount: 19_900,             // ₹199.00
    currency: 'INR',
    status: 'FAILED',
    paymentMethod: 'wallet',
    customerEmail: 'manish.goyal@rediffmail.com',
    customerPhone: '+91 77889 90011',
    idempotencyKey: 'idem_mg08_20260413',
    metadata: { orderId: 'ORD-10035', failureCode: 'INSUFFICIENT_BALANCE' },
    createdAt: '2026-04-13T14:22:37.000Z',
    updatedAt: '2026-04-13T14:22:40.000Z',
  },
  {
    id: 'txn_z6t9i1o3',
    merchantId: 'mrc_9f2a1b3c',
    gateway: 'RAZORPAY',
    gatewayOrderId: 'order_RzrPyZ6T9i1',
    gatewayPaymentId: 'pay_RzrPyA7U0j2',
    amount: 14_999_00,          // ₹14,999.00
    currency: 'INR',
    status: 'CAPTURED',
    paymentMethod: 'card',
    customerEmail: 'vikram.bose@gmail.com',
    customerPhone: '+91 96001 23456',
    idempotencyKey: 'idem_vb09_20260413',
    metadata: { orderId: 'ORD-10029', product: 'Laptop Accessory' },
    createdAt: '2026-04-13T11:55:14.000Z',
    updatedAt: '2026-04-13T11:55:31.000Z',
  },
  {
    id: 'txn_e4u7j0p2',
    merchantId: 'mrc_9f2a1b3c',
    gateway: 'STRIPE',
    gatewayOrderId: 'order_StripeE4U7j0',
    gatewayPaymentId: 'pay_StripeF5V8k1',
    amount: 49_900,             // ₹499.00
    currency: 'INR',
    status: 'CAPTURED',
    paymentMethod: 'card',
    customerEmail: 'ananya.iyer@gmail.com',
    customerPhone: '+91 85001 56789',
    idempotencyKey: 'idem_ai10_20260413',
    metadata: { orderId: 'ORD-10027', product: 'Digital Download' },
    createdAt: '2026-04-13T10:30:08.000Z',
    updatedAt: '2026-04-13T10:30:19.000Z',
  },
  {
    id: 'txn_g2q5m8r1',
    merchantId: 'mrc_9f2a1b3c',
    gateway: 'RAZORPAY',
    gatewayOrderId: 'order_RzrPyG2Q5m8',
    gatewayPaymentId: 'pay_RzrPyH3R6n9',
    amount: 2_99_900,           // ₹2,999.00
    currency: 'INR',
    status: 'AUTHORIZED',
    paymentMethod: 'netbanking',
    customerEmail: 'suresh.joshi@yahoo.com',
    customerPhone: '+91 94521 67890',
    idempotencyKey: 'idem_sj11_20260412',
    metadata: { orderId: 'ORD-10021', product: 'Books Bundle' },
    createdAt: '2026-04-12T22:18:43.000Z',
    updatedAt: '2026-04-12T22:18:43.000Z',
  },
  {
    id: 'txn_l8d3k6q4',
    merchantId: 'mrc_9f2a1b3c',
    gateway: 'CASHFREE',
    gatewayOrderId: 'order_CshFrL8D3k6',
    gatewayPaymentId: 'pay_CshFrM9E4l7',
    amount: 89_900,             // ₹899.00
    currency: 'INR',
    status: 'CAPTURED',
    paymentMethod: 'upi',
    customerEmail: 'nidhi.chaudhary@gmail.com',
    customerPhone: '+91 78901 23456',
    idempotencyKey: 'idem_nc12_20260412',
    metadata: { orderId: 'ORD-10018', product: 'Skincare' },
    createdAt: '2026-04-12T19:44:52.000Z',
    updatedAt: '2026-04-12T19:45:05.000Z',
  },
  {
    id: 'txn_n9f1p4s7',
    merchantId: 'mrc_9f2a1b3c',
    gateway: 'RAZORPAY',
    gatewayOrderId: 'order_RzrPyN9F1p4',
    amount: 1_49_900,           // ₹1,499.00
    currency: 'INR',
    status: 'FAILED',
    paymentMethod: 'card',
    customerEmail: 'tarun.saxena@outlook.com',
    customerPhone: '+91 80011 34567',
    idempotencyKey: 'idem_ts13_20260412',
    metadata: { orderId: 'ORD-10015', failureCode: 'CARD_EXPIRED' },
    createdAt: '2026-04-12T17:02:31.000Z',
    updatedAt: '2026-04-12T17:02:35.000Z',
  },
  {
    id: 'txn_k5a8c2v0',
    merchantId: 'mrc_9f2a1b3c',
    gateway: 'RAZORPAY',
    gatewayOrderId: 'order_RzrPyK5A8c2',
    gatewayPaymentId: 'pay_RzrPyL6B9d3',
    amount: 9_99_900,           // ₹9,999.00
    currency: 'INR',
    status: 'PARTIALLY_REFUNDED',
    paymentMethod: 'card',
    customerEmail: 'meena.krishnan@gmail.com',
    customerPhone: '+91 91100 23456',
    idempotencyKey: 'idem_mk14_20260412',
    metadata: { orderId: 'ORD-10010', refundAmount: 4_99_900 },
    createdAt: '2026-04-12T14:30:19.000Z',
    updatedAt: '2026-04-12T16:20:00.000Z',
  },
  {
    id: 'txn_r7h0j3e6',
    merchantId: 'mrc_9f2a1b3c',
    gateway: 'CASHFREE',
    gatewayOrderId: 'order_CshFrR7H0j3',
    gatewayPaymentId: 'pay_CshFrS8I1k4',
    amount: 39_900,             // ₹399.00
    currency: 'INR',
    status: 'CAPTURED',
    paymentMethod: 'wallet',
    customerEmail: 'aarav.pandey@gmail.com',
    customerPhone: '+91 82200 45678',
    idempotencyKey: 'idem_ap15_20260411',
    metadata: { orderId: 'ORD-10005', product: 'Mobile Recharge' },
    createdAt: '2026-04-11T21:11:07.000Z',
    updatedAt: '2026-04-11T21:11:18.000Z',
  },
  {
    id: 'txn_w3o6b9t2',
    merchantId: 'mrc_9f2a1b3c',
    gateway: 'STRIPE',
    gatewayOrderId: 'order_StripeW3O6b9',
    gatewayPaymentId: 'pay_StripeX4P7c0',
    amount: 4_99_900,           // ₹4,999.00
    currency: 'INR',
    status: 'CAPTURED',
    paymentMethod: 'card',
    customerEmail: 'shalini.mishra@yahoo.co.in',
    customerPhone: '+91 93300 56789',
    idempotencyKey: 'idem_sm16_20260411',
    metadata: { orderId: 'ORD-10003', product: 'Annual Plan' },
    createdAt: '2026-04-11T18:05:44.000Z',
    updatedAt: '2026-04-11T18:05:58.000Z',
  },
  {
    id: 'txn_y1i4m7u9',
    merchantId: 'mrc_9f2a1b3c',
    gateway: 'RAZORPAY',
    gatewayOrderId: 'order_RzrPyY1I4m7',
    amount: 29_900,             // ₹299.00
    currency: 'INR',
    status: 'PENDING',
    paymentMethod: 'upi',
    customerEmail: 'gaurav.tiwari@gmail.com',
    customerPhone: '+91 84400 67890',
    idempotencyKey: 'idem_gt17_20260411',
    metadata: { orderId: 'ORD-09998', product: 'Food Delivery' },
    createdAt: '2026-04-11T13:47:22.000Z',
    updatedAt: '2026-04-11T13:47:22.000Z',
  },
  {
    id: 'txn_d8u1n5x4',
    merchantId: 'mrc_9f2a1b3c',
    gateway: 'CASHFREE',
    gatewayOrderId: 'order_CshFrD8U1n5',
    gatewayPaymentId: 'pay_CshFrE9V2o6',
    amount: 6_99_900,           // ₹6,999.00
    currency: 'INR',
    status: 'CAPTURED',
    paymentMethod: 'netbanking',
    customerEmail: 'pooja.gupta@gmail.com',
    customerPhone: '+91 95500 78901',
    idempotencyKey: 'idem_pg18_20260410',
    metadata: { orderId: 'ORD-09990', product: 'Furniture' },
    createdAt: '2026-04-10T09:23:11.000Z',
    updatedAt: '2026-04-10T09:23:29.000Z',
  },
  {
    id: 'txn_v5c2k8r3',
    merchantId: 'mrc_9f2a1b3c',
    gateway: 'RAZORPAY',
    gatewayOrderId: 'order_RzrPyV5C2k8',
    amount: 79_900,             // ₹799.00
    currency: 'INR',
    status: 'FAILED',
    paymentMethod: 'upi',
    customerEmail: 'rahul.singh@gmail.com',
    customerPhone: '+91 86600 89012',
    idempotencyKey: 'idem_rs19_20260410',
    metadata: { orderId: 'ORD-09985', failureCode: 'UPI_TIMEOUT' },
    createdAt: '2026-04-10T08:15:55.000Z',
    updatedAt: '2026-04-10T08:16:00.000Z',
  },
  {
    id: 'txn_j0e7q1w6',
    merchantId: 'mrc_9f2a1b3c',
    gateway: 'CASHFREE',
    gatewayOrderId: 'order_CshFrJ0E7q1',
    gatewayPaymentId: 'pay_CshFrK1F8r2',
    amount: 19_99_900,          // ₹19,999.00
    currency: 'INR',
    status: 'CAPTURED',
    paymentMethod: 'card',
    customerEmail: 'shreya.desai@gmail.com',
    customerPhone: '+91 97700 90123',
    idempotencyKey: 'idem_sd20_20260409',
    metadata: { orderId: 'ORD-09975', product: 'Smartphone' },
    createdAt: '2026-04-09T20:50:33.000Z',
    updatedAt: '2026-04-09T20:50:47.000Z',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Payouts  (amounts in paise)
// ─────────────────────────────────────────────────────────────────────────────

export const mockPayouts: Payout[] = [
  {
    id: 'pay_out_a1b2c3d4',
    merchantId: 'mrc_9f2a1b3c',
    batchId: 'BP-2847',
    gateway: 'RAZORPAY',
    gatewayPayoutId: 'razorpay_pout_Hk9Lm3N2q0',
    beneficiaryName: 'Suresh Kumar Traders',
    accountNumber: '3501234567890',
    ifscCode: 'HDFC0001234',
    amount: 45_000_00,          // ₹45,000
    mode: 'IMPS',
    status: 'SUCCESS',
    retryCount: 0,
    processedAt: '2026-04-14T04:30:00.000Z',
    createdAt: '2026-04-14T04:00:00.000Z',
  },
  {
    id: 'pay_out_e5f6g7h8',
    merchantId: 'mrc_9f2a1b3c',
    batchId: 'BP-2847',
    gateway: 'CASHFREE',
    beneficiaryName: 'Laxmi Enterprise',
    accountNumber: '6501987654321',
    ifscCode: 'ICIC0002345',
    amount: 28_500_00,          // ₹28,500
    mode: 'NEFT',
    status: 'PROCESSING',
    retryCount: 0,
    scheduledAt: '2026-04-14T10:00:00.000Z',
    createdAt: '2026-04-14T03:45:00.000Z',
  },
  {
    id: 'pay_out_i9j0k1l2',
    merchantId: 'mrc_9f2a1b3c',
    batchId: 'BP-2847',
    gateway: 'RAZORPAY',
    beneficiaryName: 'Pradeep Auto Parts',
    accountNumber: '2001123456789',
    ifscCode: 'SBIN0003456',
    amount: 12_750_00,          // ₹12,750
    mode: 'IMPS',
    status: 'QUEUED',
    retryCount: 0,
    scheduledAt: '2026-04-14T11:00:00.000Z',
    createdAt: '2026-04-14T03:30:00.000Z',
  },
  {
    id: 'pay_out_m3n4o5p6',
    merchantId: 'mrc_9f2a1b3c',
    gateway: 'CASHFREE',
    gatewayPayoutId: 'cashfree_pout_Jl0Mn4O5p6',
    beneficiaryName: 'Ananya Fashion House',
    accountNumber: '9181234567890',
    ifscCode: 'UTIB0004567',
    amount: 67_000_00,          // ₹67,000
    mode: 'RTGS',
    status: 'SUCCESS',
    retryCount: 0,
    processedAt: '2026-04-13T16:00:00.000Z',
    createdAt: '2026-04-13T14:00:00.000Z',
  },
  {
    id: 'pay_out_q7r8s9t0',
    merchantId: 'mrc_9f2a1b3c',
    gateway: 'RAZORPAY',
    beneficiaryName: 'Rajesh Wholesale Distributors',
    accountNumber: '4401987654320',
    ifscCode: 'PUNB0005678',
    amount: 9_800_00,           // ₹9,800
    mode: 'UPI',
    status: 'FAILED',
    retryCount: 2,
    failureReason: 'Invalid VPA — UPI handle not found',
    scheduledAt: '2026-04-13T12:00:00.000Z',
    createdAt: '2026-04-13T11:30:00.000Z',
  },
  {
    id: 'pay_out_u1v2w3x4',
    merchantId: 'mrc_9f2a1b3c',
    batchId: 'BP-2831',
    gateway: 'CASHFREE',
    gatewayPayoutId: 'cashfree_pout_Kp1Qr5S6t7',
    beneficiaryName: 'Meenakshi Silk Sarees',
    accountNumber: '0501234509876',
    ifscCode: 'KARB0006789',
    amount: 33_250_00,          // ₹33,250
    mode: 'NEFT',
    status: 'SUCCESS',
    retryCount: 0,
    processedAt: '2026-04-12T14:00:00.000Z',
    createdAt: '2026-04-12T12:00:00.000Z',
  },
  {
    id: 'pay_out_y5z6a7b8',
    merchantId: 'mrc_9f2a1b3c',
    gateway: 'RAZORPAY',
    beneficiaryName: 'Vikram Logistics Pvt. Ltd.',
    accountNumber: '7251234567891',
    ifscCode: 'HDFC0007890',
    amount: 1_00_000_00,        // ₹1,00,000
    mode: 'RTGS',
    status: 'PERMANENTLY_FAILED',
    retryCount: 3,
    failureReason: 'Account frozen by bank — contact beneficiary',
    scheduledAt: '2026-04-12T10:00:00.000Z',
    createdAt: '2026-04-12T09:00:00.000Z',
  },
  {
    id: 'pay_out_c9d0e1f2',
    merchantId: 'mrc_9f2a1b3c',
    batchId: 'BP-2831',
    gateway: 'CASHFREE',
    gatewayPayoutId: 'cashfree_pout_Rs2Tu6V7w8',
    beneficiaryName: 'Sunflower Agro Products',
    accountNumber: '5611234567892',
    ifscCode: 'ICIC0008901',
    amount: 18_500_00,          // ₹18,500
    mode: 'IMPS',
    status: 'SUCCESS',
    retryCount: 0,
    processedAt: '2026-04-11T20:00:00.000Z',
    createdAt: '2026-04-11T18:00:00.000Z',
  },
  {
    id: 'pay_out_g3h4i5j6',
    merchantId: 'mrc_9f2a1b3c',
    gateway: 'RAZORPAY',
    beneficiaryName: 'Kavya Handicrafts',
    accountNumber: '0121987654322',
    ifscCode: 'SBIN0009012',
    amount: 7_200_00,           // ₹7,200
    mode: 'UPI',
    status: 'QUEUED',
    retryCount: 0,
    scheduledAt: '2026-04-15T09:00:00.000Z',
    createdAt: '2026-04-14T08:00:00.000Z',
  },
  {
    id: 'pay_out_k7l8m9n0',
    merchantId: 'mrc_9f2a1b3c',
    batchId: 'BP-2821',
    gateway: 'CASHFREE',
    gatewayPayoutId: 'cashfree_pout_St3Uv7W8x9',
    beneficiaryName: 'Bharat Steel Works',
    accountNumber: '8331234567893',
    ifscCode: 'UTIB0000123',
    amount: 2_40_000_00,        // ₹2,40,000
    mode: 'RTGS',
    status: 'SUCCESS',
    retryCount: 0,
    processedAt: '2026-04-10T13:00:00.000Z',
    createdAt: '2026-04-10T10:00:00.000Z',
  },
  {
    id: 'pay_out_o1p2q3r4',
    merchantId: 'mrc_9f2a1b3c',
    gateway: 'RAZORPAY',
    beneficiaryName: 'Nirmala Textiles',
    accountNumber: '1221987654323',
    ifscCode: 'CNRB0001234',
    amount: 14_000_00,          // ₹14,000
    mode: 'IMPS',
    status: 'CANCELLED',
    retryCount: 0,
    failureReason: 'Cancelled by merchant before processing',
    createdAt: '2026-04-10T08:00:00.000Z',
  },
  {
    id: 'pay_out_s5t6u7v8',
    merchantId: 'mrc_9f2a1b3c',
    batchId: 'BP-2821',
    gateway: 'CASHFREE',
    gatewayPayoutId: 'cashfree_pout_Tu4Vw8X9y0',
    beneficiaryName: 'Ganesh Electronics Wholesale',
    accountNumber: '9441234567894',
    ifscCode: 'HDFC0002345',
    amount: 55_500_00,          // ₹55,500
    mode: 'NEFT',
    status: 'SUCCESS',
    retryCount: 0,
    processedAt: '2026-04-09T15:00:00.000Z',
    createdAt: '2026-04-09T12:00:00.000Z',
  },
  {
    id: 'pay_out_w9x0y1z2',
    merchantId: 'mrc_9f2a1b3c',
    gateway: 'RAZORPAY',
    beneficiaryName: 'Shri Ram Seeds & Fertilizers',
    accountNumber: '3331987654324',
    ifscCode: 'BKID0003456',
    amount: 22_000_00,          // ₹22,000
    mode: 'IMPS',
    status: 'PROCESSING',
    retryCount: 1,
    scheduledAt: '2026-04-14T06:00:00.000Z',
    createdAt: '2026-04-14T05:30:00.000Z',
  },
  {
    id: 'pay_out_a3b4c5d6',
    merchantId: 'mrc_9f2a1b3c',
    batchId: 'BP-2847',
    gateway: 'CASHFREE',
    beneficiaryName: 'Parvathi Jewellery Works',
    accountNumber: '4441234567895',
    ifscCode: 'ICIC0004567',
    amount: 3_75_000_00,        // ₹3,75,000
    mode: 'RTGS',
    status: 'QUEUED',
    retryCount: 0,
    scheduledAt: '2026-04-14T14:00:00.000Z',
    createdAt: '2026-04-14T08:30:00.000Z',
  },
  {
    id: 'pay_out_e7f8g9h0',
    merchantId: 'mrc_9f2a1b3c',
    batchId: 'BP-2815',
    gateway: 'RAZORPAY',
    gatewayPayoutId: 'razorpay_pout_Uv5Wx9Y0z1',
    beneficiaryName: 'Coastal Seafood Exports',
    accountNumber: '6651987654325',
    ifscCode: 'SBIN0005678',
    amount: 80_000_00,          // ₹80,000
    mode: 'NEFT',
    status: 'SUCCESS',
    retryCount: 0,
    processedAt: '2026-04-08T14:00:00.000Z',
    createdAt: '2026-04-08T11:00:00.000Z',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// API Keys
// ─────────────────────────────────────────────────────────────────────────────

export const mockApiKeys: ApiKey[] = [
  {
    id: 'key_prod_9a2b3c4d',
    merchantId: 'mrc_9f2a1b3c',
    name: 'Production Key',
    keyPrefix: 'pk_live_9a2b3c',
    scope: ['payments:read', 'payments:write', 'payouts:read', 'payouts:write', 'webhooks:read'],
    environment: 'live',
    isActive: true,
    lastUsedAt: '2026-04-14T07:10:00.000Z',
    expiresAt: '2027-04-14T00:00:00.000Z',
    createdAt: '2023-08-15T10:00:00.000Z',
  },
  {
    id: 'key_sand_5e6f7g8h',
    merchantId: 'mrc_9f2a1b3c',
    name: 'Sandbox Testing',
    keyPrefix: 'pk_test_5e6f7g',
    scope: ['payments:read', 'payments:write', 'payouts:read'],
    environment: 'sandbox',
    isActive: true,
    lastUsedAt: '2026-04-13T22:45:00.000Z',
    createdAt: '2023-08-15T10:05:00.000Z',
  },
  {
    id: 'key_dev_1i2j3k4l',
    merchantId: 'mrc_9f2a1b3c',
    name: 'Dev Read-Only',
    keyPrefix: 'pk_test_1i2j3k',
    scope: ['payments:read', 'payouts:read', 'analytics:read'],
    environment: 'sandbox',
    isActive: false,
    lastUsedAt: '2026-03-20T14:30:00.000Z',
    expiresAt: '2026-06-01T00:00:00.000Z',
    createdAt: '2024-01-10T09:00:00.000Z',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Webhook Logs
// ─────────────────────────────────────────────────────────────────────────────

export const mockWebhookLogs: WebhookLog[] = [
  {
    id: 'wh_a1b2c3d4',
    transactionId: 'txn_r8k2m1p9',
    source: 'RAZORPAY',
    eventType: 'payment.captured',
    eventId: 'evt_RzrPy_Xk2M1p9Lm3',
    signatureValid: true,
    processed: true,
    receivedAt: '2026-04-14T06:42:30.000Z',
  },
  {
    id: 'wh_e5f6g7h8',
    payoutId: 'pay_out_a1b2c3d4',
    source: 'RAZORPAY',
    eventType: 'payout.processed',
    eventId: 'evt_RzrPy_Po1Qr5S6t7',
    signatureValid: true,
    processed: true,
    receivedAt: '2026-04-14T04:31:00.000Z',
  },
  {
    id: 'wh_i9j0k1l2',
    transactionId: 'txn_c5n7a3d1',
    source: 'CASHFREE',
    eventType: 'payment.captured',
    eventId: 'evt_CshFr_N7a3d1O8b4',
    signatureValid: true,
    processed: true,
    receivedAt: '2026-04-14T06:58:55.000Z',
  },
  {
    id: 'wh_m3n4o5p6',
    transactionId: 'txn_f2j9b6e4',
    source: 'RAZORPAY',
    eventType: 'payment.failed',
    eventId: 'evt_RzrPy_J9b6e4K0c5',
    signatureValid: true,
    processed: true,
    receivedAt: '2026-04-14T07:05:25.000Z',
  },
  {
    id: 'wh_q7r8s9t0',
    transactionId: 'txn_h4l1c8f6',
    source: 'STRIPE',
    eventType: 'payment_intent.succeeded',
    eventId: 'evt_Stripe_L1c8f6M2d9',
    signatureValid: true,
    processed: true,
    receivedAt: '2026-04-14T07:14:22.000Z',
  },
  {
    id: 'wh_u1v2w3x4',
    payoutId: 'pay_out_q7r8s9t0',
    source: 'RAZORPAY',
    eventType: 'payout.failed',
    eventId: 'evt_RzrPy_S9t0T0u1V2',
    signatureValid: true,
    processed: true,
    receivedAt: '2026-04-13T12:35:00.000Z',
  },
  {
    id: 'wh_y5z6a7b8',
    transactionId: 'txn_b9w2f5k7',
    source: 'RAZORPAY',
    eventType: 'refund.processed',
    eventId: 'evt_RzrPy_W2f5k7X3g6',
    signatureValid: true,
    processed: true,
    receivedAt: '2026-04-13T17:45:10.000Z',
  },
  {
    id: 'wh_c9d0e1f2',
    transactionId: 'txn_x1v8h3n5',
    source: 'CASHFREE',
    eventType: 'payment.failed',
    eventId: 'evt_CshFr_V8h3n5W9i4',
    signatureValid: false,
    processed: false,
    receivedAt: '2026-04-13T14:22:42.000Z',
  },
  {
    id: 'wh_g3h4i5j6',
    payoutId: 'pay_out_m3n4o5p6',
    source: 'CASHFREE',
    eventType: 'payout.processed',
    eventId: 'evt_CshFr_O5p6P6q7R8',
    signatureValid: true,
    processed: true,
    receivedAt: '2026-04-13T16:01:00.000Z',
  },
  {
    id: 'wh_k7l8m9n0',
    transactionId: 'txn_z6t9i1o3',
    source: 'RAZORPAY',
    eventType: 'payment.captured',
    eventId: 'evt_RzrPy_T9i1o3U0j2',
    signatureValid: true,
    processed: true,
    receivedAt: '2026-04-13T11:55:35.000Z',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Gateway Health
// ─────────────────────────────────────────────────────────────────────────────

export const mockGatewayHealth: GatewayHealth[] = [
  {
    gateway: 'RAZORPAY',
    status: 'healthy',
    successRate: 98.5,
    avgLatency: 312,
    lastChecked: '2026-04-14T07:30:00.000Z',
  },
  {
    gateway: 'CASHFREE',
    status: 'healthy',
    successRate: 97.2,
    avgLatency: 278,
    lastChecked: '2026-04-14T07:30:00.000Z',
  },
  {
    gateway: 'STRIPE',
    status: 'degraded',
    successRate: 89.1,
    avgLatency: 890,
    lastChecked: '2026-04-14T07:30:00.000Z',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Payment Method Breakdown
// ─────────────────────────────────────────────────────────────────────────────

export const mockPaymentMethodBreakdown: PaymentMethodBreakdown[] = [
  {
    method: 'upi',
    count: 561,
    amount: 4_12_34_500,   // ₹41,23,450 in paise
    percentage: 45,
  },
  {
    method: 'card',
    count: 374,
    amount: 2_74_89_600,   // ₹27,48,960 in paise
    percentage: 30,
  },
  {
    method: 'netbanking',
    count: 224,
    amount: 1_64_93_760,   // ₹16,49,376 in paise
    percentage: 18,
  },
  {
    method: 'wallet',
    count: 88,
    amount: 64_75_200,     // ₹6,47,520 in paise
    percentage: 7,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Transaction Status Breakdown  (for donut / pie chart)
// ─────────────────────────────────────────────────────────────────────────────

export const mockTransactionStatusData: TransactionStatusCount[] = [
  { status: 'CAPTURED',           count: 892 },
  { status: 'FAILED',             count: 67  },
  { status: 'PENDING',            count: 45  },
  { status: 'REFUNDED',           count: 23  },
  { status: 'PARTIALLY_REFUNDED', count: 12  },
  { status: 'AUTHORIZED',         count: 8   },
];

// ─────────────────────────────────────────────────────────────────────────────
// Recent Activity Feed
// ─────────────────────────────────────────────────────────────────────────────

export const mockRecentActivity: RecentActivity[] = [
  {
    id: 'act_001',
    type: 'payment',
    message: 'Payment of ₹4,999 captured — Priya Mehta (UPI)',
    timestamp: '2026-04-14T06:42:28.000Z',
    severity: 'success',
  },
  {
    id: 'act_002',
    type: 'payout',
    message: 'Bulk payout batch #BP-2847 is now processing — 4 beneficiaries, ₹5,00,250 total',
    timestamp: '2026-04-14T04:31:00.000Z',
    severity: 'info',
  },
  {
    id: 'act_003',
    type: 'payment',
    message: 'Payment of ₹2,499 captured — Aditya Kumar (Card)',
    timestamp: '2026-04-14T07:14:19.000Z',
    severity: 'success',
  },
  {
    id: 'act_004',
    type: 'alert',
    message: 'Processing latency elevated — success rate 89.1%, avg latency 890ms. Monitoring in progress.',
    timestamp: '2026-04-14T07:00:00.000Z',
    severity: 'warning',
  },
  {
    id: 'act_005',
    type: 'payment',
    message: 'Payment of ₹999 failed — Sunita Rao (Net Banking: BANK_DECLINED)',
    timestamp: '2026-04-14T07:05:22.000Z',
    severity: 'error',
  },
  {
    id: 'act_006',
    type: 'payout',
    message: 'Payout of ₹45,000 to Suresh Kumar Traders processed successfully via IMPS',
    timestamp: '2026-04-14T04:30:00.000Z',
    severity: 'success',
  },
  {
    id: 'act_007',
    type: 'webhook',
    message: 'Webhook signature validation failed — event evt_V8h3n5W9i4 ignored',
    timestamp: '2026-04-13T14:22:42.000Z',
    severity: 'warning',
  },
  {
    id: 'act_008',
    type: 'payout',
    message: 'Payout of ₹1,00,000 to Vikram Logistics permanently failed — account frozen',
    timestamp: '2026-04-12T09:30:00.000Z',
    severity: 'error',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// System Performance
// ─────────────────────────────────────────────────────────────────────────────

export const mockSystemPerformance: SystemPerformance = {
  successRate: 94.2,
  failedTransactions: 67,
  avgProcessingTimeMs: 348,
  lastUpdated: '2026-04-14T07:30:00.000Z',
};

// ─────────────────────────────────────────────────────────────────────────────
// Disputes
// ─────────────────────────────────────────────────────────────────────────────

export const mockDisputes: Dispute[] = [
  {
    id: 'dsp_a1b2c3d4',
    transactionId: 'txn_f2j9b6e4',
    amount: 99_900,
    reason: 'FAILED_PAYMENT',
    description: 'Amount deducted but payment failed. Customer reported money not returned.',
    status: 'PENDING',
    createdAt: '2026-04-14T08:00:00.000Z',
    updatedAt: '2026-04-14T08:00:00.000Z',
  },
  {
    id: 'dsp_e5f6g7h8',
    transactionId: 'txn_b9w2f5k7',
    amount: 3_49_900,
    reason: 'RETURN',
    description: 'Customer returned the product and requests full refund.',
    status: 'UNDER_REVIEW',
    createdAt: '2026-04-13T16:00:00.000Z',
    updatedAt: '2026-04-13T18:00:00.000Z',
  },
  {
    id: 'dsp_i9j0k1l2',
    transactionId: 'txn_x1v8h3n5',
    amount: 19_900,
    reason: 'FAILED_PAYMENT',
    description: 'Wallet balance deducted, payment not processed.',
    status: 'RESOLVED',
    createdAt: '2026-04-13T15:00:00.000Z',
    updatedAt: '2026-04-13T20:00:00.000Z',
  },
  {
    id: 'dsp_m3n4o5p6',
    transactionId: 'txn_n9f1p4s7',
    amount: 1_49_900,
    reason: 'COMPLAINT',
    description: 'Customer claims card was charged but service was not delivered.',
    status: 'PENDING',
    createdAt: '2026-04-12T18:00:00.000Z',
    updatedAt: '2026-04-12T18:00:00.000Z',
  },
  {
    id: 'dsp_q7r8s9t0',
    transactionId: 'txn_v5c2k8r3',
    amount: 79_900,
    reason: 'FAILED_PAYMENT',
    description: 'UPI timeout — amount deducted from customer account.',
    status: 'UNDER_REVIEW',
    createdAt: '2026-04-10T09:00:00.000Z',
    updatedAt: '2026-04-10T11:00:00.000Z',
  },
  {
    id: 'dsp_u1v2w3x4',
    transactionId: 'txn_k5a8c2v0',
    amount: 4_99_900,
    reason: 'RETURN',
    description: 'Partial return — customer only used part of the service.',
    status: 'RESOLVED',
    createdAt: '2026-04-12T17:00:00.000Z',
    updatedAt: '2026-04-13T10:00:00.000Z',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Chargebacks
// ─────────────────────────────────────────────────────────────────────────────

export const mockChargebacks: Chargeback[] = [
  {
    id: 'cbk_a1b2c3d4',
    disputeId: 'dsp_e5f6g7h8',
    transactionId: 'txn_b9w2f5k7',
    amount: 3_49_900,
    status: 'PENDING',
    deadline: '2026-04-28T00:00:00.000Z',
    createdAt: '2026-04-13T18:00:00.000Z',
    updatedAt: '2026-04-13T18:00:00.000Z',
  },
  {
    id: 'cbk_e5f6g7h8',
    disputeId: 'dsp_i9j0k1l2',
    transactionId: 'txn_x1v8h3n5',
    amount: 19_900,
    status: 'ACCEPTED',
    deadline: '2026-04-20T00:00:00.000Z',
    createdAt: '2026-04-13T20:00:00.000Z',
    updatedAt: '2026-04-14T09:00:00.000Z',
  },
  {
    id: 'cbk_i9j0k1l2',
    disputeId: 'dsp_u1v2w3x4',
    transactionId: 'txn_k5a8c2v0',
    amount: 4_99_900,
    status: 'COMPLETED',
    deadline: '2026-04-26T00:00:00.000Z',
    createdAt: '2026-04-13T10:00:00.000Z',
    updatedAt: '2026-04-14T10:00:00.000Z',
  },
  {
    id: 'cbk_m3n4o5p6',
    disputeId: 'dsp_q7r8s9t0',
    transactionId: 'txn_v5c2k8r3',
    amount: 79_900,
    status: 'PENDING',
    deadline: '2026-04-25T00:00:00.000Z',
    createdAt: '2026-04-10T11:00:00.000Z',
    updatedAt: '2026-04-10T11:00:00.000Z',
  },
];
