'use client';

import { useState } from 'react';
import {
  Webhook,
  Shield,
  Bell,
  History,
  Eye,
  EyeOff,
  RefreshCw,
  Send,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Copy,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from '@/components/ui/modal';
import { mockWebhookLogs } from '@/lib/mock-data';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TestResult {
  success: boolean;
  statusCode: number;
  latency: number;
}

interface WebhookRow {
  id: string;
  eventType: string;
  status: 'Delivered' | 'Failed';
  responseCode: number;
  latency: number;
  timestamp: string;
  requestSnippet: string;
  responseSnippet: string;
}

// ─── Mock delivery history from webhook logs ───────────────────────────────

const DELIVERY_HISTORY: WebhookRow[] = mockWebhookLogs.slice(0, 8).map((log, i) => ({
  id: log.id,
  eventType: log.eventType,
  status: log.processed ? 'Delivered' : 'Failed',
  responseCode: log.processed ? 200 : 500,
  latency: 120 + i * 37,
  timestamp: log.receivedAt,
  requestSnippet: JSON.stringify(
    { event: log.eventType, id: log.eventId, timestamp: log.receivedAt },
    null,
    2,
  ),
  responseSnippet: log.processed
    ? JSON.stringify({ received: true }, null, 2)
    : JSON.stringify({ error: 'Internal Server Error' }, null, 2),
}));

// ─── Event groups ─────────────────────────────────────────────────────────────

const EVENT_GROUPS = [
  {
    label: 'Payments',
    events: ['payment.created', 'payment.captured', 'payment.failed', 'payment.refunded'],
  },
  {
    label: 'Payouts',
    events: ['payout.queued', 'payout.success', 'payout.failed'],
  },
  {
    label: 'Account',
    events: ['api_key.created', 'settlement.completed'],
  },
];

// ─── HMAC code snippet ────────────────────────────────────────────────────────

const HMAC_SNIPPET = `import hmac, hashlib

def verify_webhook(payload: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(
        secret.encode(), payload, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)`;

// ─── CopyButton ───────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
      title="Copy"
    >
      {copied ? <Check size={13} className="text-teal-500" /> : <Copy size={13} />}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WebhooksPage() {
  // Webhook URL
  const [webhookUrl, setWebhookUrl] = useState('https://api.merchant.com/webhooks/payagg');
  const [urlSaving, setUrlSaving] = useState(false);
  const [urlSaved, setUrlSaved] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testing, setTesting] = useState(false);

  // Secret
  const [showSecret, setShowSecret] = useState(false);
  const [regenerateModal, setRegenerateModal] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [secretSuffix, setSecretSuffix] = useState('a9f2');

  // Events
  const [subscribedEvents, setSubscribedEvents] = useState<Set<string>>(
    new Set(['payment.created', 'payment.captured', 'payment.failed', 'payout.success', 'settlement.completed']),
  );
  const [eventSaving, setEventSaving] = useState(false);
  const [eventSaved, setEventSaved] = useState(false);

  // Expanded rows
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // --- Handlers ---

  const handleTestWebhook = async () => {
    setTesting(true);
    setTestResult(null);
    await new Promise((r) => setTimeout(r, 1400));
    setTestResult({ success: true, statusCode: 200, latency: 143 });
    setTesting(false);
  };

  const handleSaveUrl = async () => {
    setUrlSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setUrlSaving(false);
    setUrlSaved(true);
    setTimeout(() => setUrlSaved(false), 3000);
  };

  const handleRegenerateSecret = async () => {
    setRegenerating(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSecretSuffix(Math.random().toString(36).slice(2, 6));
    setRegenerating(false);
    setRegenerateModal(false);
  };

  const handleSaveEvents = async () => {
    setEventSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    setEventSaving(false);
    setEventSaved(true);
    setTimeout(() => setEventSaved(false), 3000);
  };

  const toggleEvent = (evt: string) => {
    const next = new Set(subscribedEvents);
    if (next.has(evt)) next.delete(evt);
    else next.add(evt);
    setSubscribedEvents(next);
  };

  const maskedSecret = showSecret
    ? `wh_sec_4k8m2n9p3q7r1s5t6u0v_${secretSuffix}`
    : `wh_sec_****...****${secretSuffix}`;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Webhooks</h1>
        <p className="mt-1 text-sm text-slate-500">Configure event notifications and monitor delivery status.</p>
      </div>

      {/* ── Webhook URL ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Webhook size={18} className="text-indigo-600" />
            </div>
            <div>
              <CardTitle>Webhook Endpoint</CardTitle>
              <p className="text-sm text-slate-500 mt-0.5">Events will be sent as POST requests to this URL.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="mt-5 space-y-4">
          <Input
            label="Endpoint URL"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://example.com/webhooks"
          />

          {/* Test result */}
          {testResult && (
            <div className={cn(
              'flex items-center gap-2.5 p-3 rounded-lg border text-sm font-medium',
              testResult.success
                ? 'bg-teal-50 border-teal-100 text-teal-700'
                : 'bg-rose-50 border-rose-100 text-rose-700',
            )}>
              {testResult.success
                ? <CheckCircle2 size={15} />
                : <XCircle size={15} />}
              {testResult.success ? 'Webhook delivered successfully' : 'Delivery failed'}
              <span className="ml-auto text-xs font-mono text-slate-500">
                {testResult.statusCode} · {testResult.latency}ms
              </span>
            </div>
          )}

          <div className="flex items-center gap-3 justify-end">
            {urlSaved && (
              <span className="text-sm text-teal-600 flex items-center gap-1">
                <CheckCircle2 size={13} /> Saved
              </span>
            )}
            <Button variant="secondary" loading={testing} leftIcon={<Send size={14} />} onClick={handleTestWebhook}>
              Test Webhook
            </Button>
            <Button variant="primary" loading={urlSaving} onClick={handleSaveUrl}>
              Save URL
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Webhook Secret ────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
              <Shield size={18} className="text-violet-600" />
            </div>
            <div>
              <CardTitle>Webhook Secret</CardTitle>
              <p className="text-sm text-slate-500 mt-0.5">Use this to verify webhook signatures via HMAC-SHA256.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="mt-5 space-y-4">
          {/* Secret display */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg h-10 px-3">
              <code className="text-sm font-mono text-slate-700 flex-1 truncate">{maskedSecret}</code>
              <CopyButton text={maskedSecret} />
            </div>
            <Button
              size="sm"
              variant="secondary"
              leftIcon={showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
              onClick={() => setShowSecret(!showSecret)}
            >
              {showSecret ? 'Hide' : 'Show'}
            </Button>
          </div>

          {/* Regenerate button */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Rotate your secret periodically to keep your integration secure.
            </p>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw size={13} />}
              onClick={() => setRegenerateModal(true)}
            >
              Regenerate
            </Button>
          </div>

          {/* HMAC code block */}
          <div className="rounded-xl bg-slate-900 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Python · HMAC Verification</span>
              <CopyButton text={HMAC_SNIPPET} />
            </div>
            <pre className="p-4 text-xs text-emerald-400 overflow-x-auto leading-relaxed">
              {HMAC_SNIPPET}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* ── Subscribed Events ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
              <Bell size={18} className="text-amber-600" />
            </div>
            <CardTitle>Subscribed Events</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="mt-5 space-y-5">
          {EVENT_GROUPS.map(({ label, events }) => (
            <div key={label}>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">{label}</p>
              <div className="space-y-2">
                {events.map((evt) => (
                  <label
                    key={evt}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <div
                      className={cn(
                        'w-4.5 h-4.5 rounded border-2 flex items-center justify-center transition-all duration-150 shrink-0',
                        subscribedEvents.has(evt)
                          ? 'bg-indigo-500 border-indigo-500'
                          : 'border-slate-300 group-hover:border-indigo-400',
                      )}
                      style={{ width: 18, height: 18 }}
                    >
                      {subscribedEvents.has(evt) && (
                        <Check size={10} className="text-white stroke-[3]" />
                      )}
                    </div>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={subscribedEvents.has(evt)}
                      onChange={() => toggleEvent(evt)}
                    />
                    <span className="text-sm text-slate-700 font-mono">{evt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            {eventSaved && (
              <span className="text-sm text-teal-600 flex items-center gap-1">
                <CheckCircle2 size={13} /> Preferences saved
              </span>
            )}
            <div className="ml-auto">
              <Button variant="primary" loading={eventSaving} onClick={handleSaveEvents}>
                Save Preferences
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Delivery History ──────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
              <History size={18} className="text-slate-600" />
            </div>
            <CardTitle>Delivery History</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="mt-5 p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {['Event Type', 'Status', 'Code', 'Latency', 'Time', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DELIVERY_HISTORY.map((row) => (
                  <>
                    <tr
                      key={row.id}
                      className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors cursor-pointer"
                      onClick={() => setExpandedRow(expandedRow === row.id ? null : row.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {expandedRow === row.id
                            ? <ChevronDown size={13} className="text-slate-400" />
                            : <ChevronRight size={13} className="text-slate-400" />}
                          <span className="font-mono text-xs text-slate-700">{row.eventType}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={row.status === 'Delivered' ? 'success' : 'error'}
                          dot
                          size="sm"
                        >
                          {row.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'text-xs font-mono font-semibold',
                          row.responseCode === 200 ? 'text-teal-600' : 'text-rose-600',
                        )}>
                          {row.responseCode}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 font-mono">{row.latency}ms</td>
                      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                        {formatRelativeTime(row.timestamp)}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="ghost" leftIcon={<RotateCcw size={12} />}>
                          Retry
                        </Button>
                      </td>
                    </tr>

                    {/* Expanded row */}
                    {expandedRow === row.id && (
                      <tr key={`${row.id}-expand`} className="bg-slate-50/80">
                        <td colSpan={6} className="px-4 py-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Request Payload</p>
                              <pre className="bg-slate-900 text-emerald-400 text-xs rounded-lg p-3 overflow-x-auto leading-relaxed">{row.requestSnippet}</pre>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Response</p>
                              <pre className={cn(
                                'text-xs rounded-lg p-3 overflow-x-auto leading-relaxed',
                                row.status === 'Delivered'
                                  ? 'bg-teal-950 text-teal-300'
                                  : 'bg-rose-950 text-rose-300',
                              )}>{row.responseSnippet}</pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Regenerate Secret Modal ───────────────────────────────────── */}
      <Modal open={regenerateModal} onClose={() => setRegenerateModal(false)} size="sm">
        <ModalHeader onClose={() => setRegenerateModal(false)}>
          <ModalTitle>Regenerate Webhook Secret?</ModalTitle>
          <ModalDescription>
            Your existing secret will be immediately invalidated. All webhook verifications using the old secret will fail.
          </ModalDescription>
        </ModalHeader>
        <ModalBody>
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-700">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            Update your server-side verification logic with the new secret before proceeding.
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setRegenerateModal(false)}>Cancel</Button>
          <Button variant="danger" loading={regenerating} onClick={handleRegenerateSecret}>
            Regenerate Secret
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
