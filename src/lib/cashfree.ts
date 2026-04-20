import crypto from 'crypto';

export type CashfreeEnv = 'sandbox' | 'production';

const BASE_URL = {
  sandbox:    'https://sandbox.cashfree.com/pg',
  production: 'https://api.cashfree.com/pg',
};

export interface CashfreeOrderRequest {
  order_id:       string;
  order_amount:   number;
  order_currency: string;
  customer_details: {
    customer_id:    string;
    customer_email?: string;
    customer_phone?: string;
    customer_name?:  string;
  };
  order_meta?: {
    return_url?:    string;
    notify_url?:    string;
  };
  order_note?: string;
}

export interface CashfreeOrder {
  cf_order_id:        string;
  order_id:           string;
  order_status:       string;
  payment_session_id: string;
  order_amount:       number;
  order_currency:     string;
}

export function getCashfreeEnv(): CashfreeEnv {
  return (process.env.CASHFREE_ENV ?? 'sandbox') as CashfreeEnv;
}

export async function createCashfreeOrder(
  appId:     string,
  secretKey: string,
  payload:   CashfreeOrderRequest,
  env:       CashfreeEnv = getCashfreeEnv()
): Promise<CashfreeOrder> {
  const url = `${BASE_URL[env]}/orders`;
  const res = await fetch(url, {
    method:  'POST',
    headers: {
      'Content-Type':    'application/json',
      'x-api-version':  '2023-08-01',
      'x-client-id':    appId,
      'x-client-secret': secretKey,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message ?? `Cashfree order creation failed: ${res.status}`);
  }
  return data as CashfreeOrder;
}

export function verifyCashfreeWebhookSignature(
  rawBody:   string,
  timestamp: string,
  signature: string,
  secretKey: string
): boolean {
  try {
    const message  = `${timestamp}${rawBody}`;
    const expected = crypto
      .createHmac('sha256', secretKey)
      .update(message)
      .digest('base64');
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}

export function cashfreeCheckoutUrl(
  paymentSessionId: string,
  env: CashfreeEnv = getCashfreeEnv()
): string {
  const base = env === 'production'
    ? 'https://payments.cashfree.com/order'
    : 'https://payments-test.cashfree.com/order';
  return `${base}/#${paymentSessionId}`;
}
