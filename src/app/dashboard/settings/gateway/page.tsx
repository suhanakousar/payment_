'use client';

import { useEffect, useState } from 'react';
import { Zap, Eye, EyeOff, CheckCircle2, AlertTriangle, Loader2, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchWithAuth } from '@/lib/fetch-with-auth';

export default function GatewaySettingsPage() {
  const [appId,      setAppId]      = useState('');
  const [secretKey,  setSecretKey]  = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [cfEnv,      setCfEnv]      = useState<'sandbox' | 'production'>('sandbox');
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [toast,      setToast]      = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    fetchWithAuth('/api/v1/setup')
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setConfigured(d.data.cashfreeConfigured);
          setCfEnv(d.data.cashfreeEnv ?? 'sandbox');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSave = async () => {
    if (!appId.trim() || !secretKey.trim()) {
      showToast('error', 'Both App ID and Secret Key are required.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetchWithAuth('/api/v1/setup', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ cashfreeAppId: appId.trim(), cashfreeSecretKey: secretKey.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setConfigured(true);
        setAppId('');
        setSecretKey('');
        showToast('success', 'Cashfree credentials saved successfully.');
      } else {
        showToast('error', data.error?.message ?? 'Failed to save credentials.');
      }
    } catch {
      showToast('error', 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Payment Gateway</h1>
        <p className="text-slate-500 mt-1">Connect your Cashfree account to start processing real payments.</p>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Status card */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Zap size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Cashfree Payments</p>
                <p className="text-sm text-slate-500">Mode: <span className="font-medium capitalize">{cfEnv}</span></p>
              </div>
            </div>
            {loading ? (
              <Loader2 size={18} className="animate-spin text-slate-400" />
            ) : (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                configured ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${configured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                {configured ? 'Connected' : 'Not configured'}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Credentials form */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {configured ? 'Update Credentials' : 'Enter Credentials'}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Find your App ID and Secret Key in the{' '}
              <a
                href="https://merchant.cashfree.com/merchants/developers"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline inline-flex items-center gap-0.5"
              >
                Cashfree merchant dashboard <ExternalLink size={12} />
              </a>
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">App ID</label>
            <Input
              value={appId}
              onChange={e => setAppId(e.target.value)}
              placeholder={configured ? 'Enter new App ID to update' : 'e.g. 12345678901234567890'}
              autoComplete="off"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Secret Key</label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={secretKey}
                onChange={e => setSecretKey(e.target.value)}
                placeholder={configured ? 'Enter new Secret Key to update' : 'Your Cashfree secret key'}
                autoComplete="new-password"
                className="w-full rounded-lg border border-slate-200 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white text-sm text-slate-900 placeholder:text-slate-400 h-10 px-3 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowSecret(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="pt-1">
            <Button variant="primary" onClick={handleSave} loading={saving}>
              {configured ? 'Update credentials' : 'Save & connect'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Webhook info */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <h2 className="text-base font-semibold text-slate-900">Webhook URL</h2>
          <p className="text-sm text-slate-500">
            Add this URL in your Cashfree dashboard under <strong>Developers → Webhooks</strong> to receive real-time payment updates.
          </p>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
            <code className="text-sm text-slate-700 flex-1 select-all break-all">
              {typeof window !== 'undefined' ? window.location.origin : ''}/api/v1/webhooks/cashfree
            </code>
          </div>
          <p className="text-xs text-slate-400">
            Select event types: <strong>PAYMENT_SUCCESS</strong>, <strong>PAYMENT_FAILED</strong>, <strong>PAYMENT_USER_DROPPED</strong>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
