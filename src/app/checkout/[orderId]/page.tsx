'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2, ShieldCheck } from 'lucide-react';

type PageState = 'loading' | 'redirecting' | 'success' | 'failed' | 'invalid';

export default function CheckoutPage() {
  const params       = useParams();
  const searchParams = useSearchParams();
  const orderId      = params.orderId as string;
  const status       = searchParams.get('status');

  const [state, setState] = useState<PageState>(status === 'success' ? 'success' : 'loading');

  useEffect(() => {
    if (status === 'success') { setState('success'); return; }
    if (status === 'failed')  { setState('failed');  return; }

    // If this is a real Cashfree order, look it up to get the payment_session_id and redirect
    if (!orderId || orderId.startsWith('sim_')) {
      setState('invalid');
      return;
    }

    // Fetch the transaction to get payment_session_id from metadata
    fetch(`/api/v1/payments?search=${encodeURIComponent(orderId)}&per_page=1`, {
      credentials: 'include',
    })
      .then(r => r.json())
      .then(d => {
        const txn = d?.data?.[0];
        const sessionId = (txn?.metadata as Record<string, string>)?.payment_session_id;
        if (sessionId) {
          setState('redirecting');
          const env = process.env.NEXT_PUBLIC_CASHFREE_ENV ?? 'sandbox';
          const base = env === 'production'
            ? 'https://payments.cashfree.com/order'
            : 'https://payments-test.cashfree.com/order';
          window.location.href = `${base}/#${sessionId}`;
        } else {
          setState('invalid');
        }
      })
      .catch(() => setState('invalid'));
  }, [orderId, status]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 max-w-sm w-full text-center space-y-4">
        {state === 'loading' || state === 'redirecting' ? (
          <>
            <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center mx-auto">
              <Loader2 size={28} className="text-indigo-600 animate-spin" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                {state === 'redirecting' ? 'Redirecting to payment…' : 'Loading…'}
              </h1>
              <p className="text-sm text-slate-500 mt-1">Please wait, do not close this tab.</p>
            </div>
          </>
        ) : state === 'success' ? (
          <>
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} className="text-emerald-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Payment Successful</h1>
              <p className="text-sm text-slate-500 mt-1">Your payment has been processed successfully.</p>
              <p className="text-xs text-slate-400 mt-2 font-mono break-all">Order: {orderId}</p>
            </div>
          </>
        ) : state === 'failed' ? (
          <>
            <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mx-auto">
              <XCircle size={28} className="text-rose-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Payment Failed</h1>
              <p className="text-sm text-slate-500 mt-1">Your payment could not be processed. Please try again.</p>
            </div>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center mx-auto">
              <ShieldCheck size={28} className="text-slate-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Order Not Found</h1>
              <p className="text-sm text-slate-500 mt-1">This payment link is invalid or has expired.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
