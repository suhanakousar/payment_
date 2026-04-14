'use client';

import { useState } from 'react';
import {
  KeyRound,
  Plus,
  AlertTriangle,
  Copy,
  Check,
  Eye,
  EyeOff,
  Trash2,
  ChevronDown,
  ChevronRight,
  Globe,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelativeTime, formatDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from '@/components/ui/modal';
import { mockApiKeys } from '@/lib/mock-data';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiKeyRow {
  id: string;
  name: string;
  keyPrefix: string;
  scope: string[];
  environment: 'live' | 'sandbox';
  isActive: boolean;
  lastUsedAt: string | null;
  expiresAt?: string;
  createdAt: string;
}

interface GeneratedKey {
  publicKey: string;
  secretKey: string;
}

type ExpirationOption = 'never' | '30d' | '90d' | '1y';

// ─── Constants ────────────────────────────────────────────────────────────────

const SCOPES = ['Payments', 'Payouts', 'Transactions', 'Analytics'];

const SCOPE_COLORS: Record<string, string> = {
  'payments:read':  'bg-indigo-50 text-indigo-700',
  'payments:write': 'bg-indigo-100 text-indigo-800',
  'payouts:read':   'bg-violet-50 text-violet-700',
  'payouts:write':  'bg-violet-100 text-violet-800',
  'analytics:read': 'bg-amber-50 text-amber-700',
  'webhooks:read':  'bg-slate-100 text-slate-600',
};

const EXPIRY_OPTIONS: { value: ExpirationOption; label: string }[] = [
  { value: 'never', label: 'Never' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: '1y', label: '1 year' },
];

// ─── CopyButton ───────────────────────────────────────────────────────────────

function CopyButton({ text, size = 14 }: { text: string; size?: number }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
      title="Copy"
    >
      {copied ? <Check size={size} className="text-teal-500" /> : <Copy size={size} />}
    </button>
  );
}

// ─── Scope badge ─────────────────────────────────────────────────────────────

function ScopeBadge({ scope }: { scope: string }) {
  return (
    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', SCOPE_COLORS[scope] ?? 'bg-slate-100 text-slate-600')}>
      {scope}
    </span>
  );
}

// ─── Mini usage chart (sparkline bars) ───────────────────────────────────────

function UsageMiniChart() {
  const bars = [45, 62, 38, 78, 55, 90, 48, 72, 60, 85, 40, 95, 58, 70];
  return (
    <div className="flex items-end gap-0.5 h-8">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-2 rounded-t bg-indigo-200 hover:bg-indigo-500 transition-colors cursor-pointer"
          style={{ height: `${h}%` }}
          title={`${h} requests`}
        />
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ApiKeysPage() {
  // Keys state (extend mock with toggle ability)
  const [keys, setKeys] = useState<ApiKeyRow[]>(
    mockApiKeys.map((k) => ({
      ...k,
      lastUsedAt: k.lastUsedAt ?? null,
    })),
  );

  // Expanded row
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  // Generate modal
  const [generateModal, setGenerateModal] = useState(false);
  const [genStep, setGenStep] = useState<'form' | 'success'>('form');
  const [genForm, setGenForm] = useState({
    name: '',
    scopes: new Set<string>(),
    environment: 'live' as 'live' | 'sandbox',
    expiration: 'never' as ExpirationOption,
    ipWhitelist: '',
  });
  const [generating, setGenerating] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<GeneratedKey | null>(null);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [savedConfirmed, setSavedConfirmed] = useState(false);

  // Revoke modal
  const [revokeModal, setRevokeModal] = useState<ApiKeyRow | null>(null);
  const [revokeConfirm, setRevokeConfirm] = useState('');
  const [revoking, setRevoking] = useState(false);

  // --- Handlers ---

  const toggleKeyActive = (id: string) => {
    setKeys((prev) => prev.map((k) => k.id === id ? { ...k, isActive: !k.isActive } : k));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 1200));
    const prefix = genForm.environment === 'live' ? 'pk_live' : 'pk_test';
    const skPrefix = genForm.environment === 'live' ? 'sk_live' : 'sk_test';
    const rand = () => Math.random().toString(36).slice(2, 10);
    setGeneratedKey({ publicKey: `${prefix}_${rand()}${rand()}`, secretKey: `${skPrefix}_${rand()}${rand()}` });
    setGenStep('success');
    setGenerating(false);
  };

  const handleRevokeConfirm = async () => {
    if (!revokeModal) return;
    setRevoking(true);
    await new Promise((r) => setTimeout(r, 900));
    setKeys((prev) => prev.filter((k) => k.id !== revokeModal.id));
    setRevoking(false);
    setRevokeModal(null);
    setRevokeConfirm('');
  };

  const resetGenerateModal = () => {
    setGenerateModal(false);
    setGenStep('form');
    setGenForm({ name: '', scopes: new Set(), environment: 'live', expiration: 'never', ipWhitelist: '' });
    setGeneratedKey(null);
    setShowSecretKey(false);
    setSavedConfirmed(false);
  };

  const toggleScope = (s: string) => {
    const next = new Set(genForm.scopes);
    if (next.has(s)) next.delete(s);
    else next.add(s);
    setGenForm({ ...genForm, scopes: next });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">API Keys</h1>
          <p className="mt-1 text-sm text-slate-500">Manage authentication keys for Live and Sandbox environments.</p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus size={16} />}
          onClick={() => { setGenerateModal(true); setGenStep('form'); }}
        >
          Generate New Key
        </Button>
      </div>

      {/* ── Notice card ──────────────────────────────────────────────── */}
      <Card className="border-2 border-amber-200 bg-amber-50/50">
        <CardContent className="flex items-start gap-3 py-4">
          <ShieldAlert size={18} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Secret keys are shown only once at creation.</p>
            <p className="text-sm text-amber-700 mt-0.5">
              Store them securely in a password manager or secrets vault. We cannot recover lost secret keys.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Keys Table ───────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
              <KeyRound size={18} className="text-indigo-600" />
            </div>
            <CardTitle>Active API Keys</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="mt-4 p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {['', 'Name', 'Key Prefix', 'Scope', 'Environment', 'Status', 'Last Used', 'Created', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {keys.map((key) => (
                  <>
                    <tr
                      key={key.id}
                      className={cn(
                        'border-b border-slate-100 transition-colors cursor-pointer',
                        expandedKey === key.id ? 'bg-indigo-50/40' : 'hover:bg-slate-50/50',
                      )}
                      onClick={() => setExpandedKey(expandedKey === key.id ? null : key.id)}
                    >
                      {/* Expand toggle */}
                      <td className="px-3 py-3">
                        {expandedKey === key.id
                          ? <ChevronDown size={14} className="text-slate-400" />
                          : <ChevronRight size={14} className="text-slate-400" />}
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-800">{key.name}</span>
                      </td>

                      {/* Key prefix */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <code className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                            {key.keyPrefix}
                          </code>
                          <span onClick={(e) => e.stopPropagation()}>
                            <CopyButton text={key.keyPrefix} size={12} />
                          </span>
                        </div>
                      </td>

                      {/* Scope */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-48">
                          {key.scope.slice(0, 2).map((s) => <ScopeBadge key={s} scope={s} />)}
                          {key.scope.length > 2 && (
                            <span className="text-xs text-slate-400">+{key.scope.length - 2} more</span>
                          )}
                        </div>
                      </td>

                      {/* Environment */}
                      <td className="px-4 py-3">
                        <Badge
                          variant={key.environment === 'live' ? 'success' : 'warning'}
                          dot
                          size="sm"
                        >
                          {key.environment === 'live' ? 'Live' : 'Sandbox'}
                        </Badge>
                      </td>

                      {/* Status toggle */}
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleKeyActive(key.id)}
                          className={cn(
                            'relative w-9 h-5 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30',
                            key.isActive ? 'bg-indigo-500' : 'bg-slate-300',
                          )}
                          aria-label={key.isActive ? 'Deactivate key' : 'Activate key'}
                        >
                          <div className={cn(
                            'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200',
                            key.isActive && 'translate-x-4',
                          )} />
                        </button>
                      </td>

                      {/* Last used */}
                      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                        {key.lastUsedAt ? formatRelativeTime(key.lastUsedAt) : 'Never'}
                      </td>

                      {/* Created */}
                      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                        {formatDate(key.createdAt).split(',')[0]}
                      </td>

                      {/* Revoke */}
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                          leftIcon={<Trash2 size={13} />}
                          onClick={() => { setRevokeModal(key); setRevokeConfirm(''); }}
                        >
                          Revoke
                        </Button>
                      </td>
                    </tr>

                    {/* Expanded details */}
                    {expandedKey === key.id && (
                      <tr key={`${key.id}-expand`} className="bg-indigo-50/30">
                        <td colSpan={9} className="px-6 py-5">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            {/* Usage mini chart */}
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">API Requests (14d)</p>
                              <UsageMiniChart />
                              <p className="text-xs text-slate-400">~1,247 requests in last 14 days</p>
                            </div>

                            {/* Rate limits */}
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Rate Limits</p>
                              <div className="space-y-1 text-xs text-slate-600">
                                <div className="flex justify-between">
                                  <span>Requests / minute</span><span className="font-semibold">300</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Requests / day</span><span className="font-semibold">1,00,000</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                                  <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: '42%' }} />
                                </div>
                                <p className="text-slate-400">42% of daily quota used</p>
                              </div>
                            </div>

                            {/* IP & Expiry */}
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Restrictions</p>
                              <div className="space-y-1 text-xs text-slate-600">
                                <div className="flex items-center gap-1.5">
                                  <Globe size={12} className="text-slate-400" />
                                  <span>IP Whitelist: <span className="text-slate-400 italic">None</span></span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <KeyRound size={12} className="text-slate-400" />
                                  <span>
                                    Expires:{' '}
                                    {key.expiresAt
                                      ? formatDate(key.expiresAt).split(',')[0]
                                      : <span className="text-slate-400 italic">Never</span>}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {key.scope.map((s) => <ScopeBadge key={s} scope={s} />)}
                              </div>
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

      {/* ── API Docs Quick Reference ──────────────────────────────────── */}
      <Card className="border border-indigo-100 bg-gradient-to-br from-indigo-50/40 to-violet-50/30">
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Globe size={18} className="text-indigo-600" />
            </div>
            <CardTitle>API Quick Reference</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="mt-4 space-y-4">
          {/* Base URL */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Base URL</p>
            <div className="flex items-center gap-2 bg-slate-900 rounded-lg px-4 py-2.5">
              <code className="text-sm font-mono text-emerald-400 flex-1">https://api.payagg.com/v1</code>
              <CopyButton text="https://api.payagg.com/v1" />
            </div>
          </div>

          {/* Auth header */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Authentication Header</p>
            <div className="flex items-start gap-2 bg-slate-900 rounded-lg px-4 py-3">
              <code className="text-xs font-mono text-slate-300 flex-1 leading-relaxed whitespace-pre">{`Authorization: Bearer <your_secret_key>
Content-Type: application/json`}</code>
              <CopyButton text="Authorization: Bearer <your_secret_key>" />
            </div>
          </div>

          {/* Quick links */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Documentation</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {['Payment API', 'Payout API', 'Transaction API'].map((link) => (
                <a
                  key={link}
                  href="#"
                  className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-indigo-100 bg-white hover:border-indigo-300 hover:bg-indigo-50 transition-all text-sm font-medium text-indigo-700 group"
                  onClick={(e) => e.preventDefault()}
                >
                  {link}
                  <ExternalLink size={13} className="text-indigo-400 group-hover:text-indigo-600" />
                </a>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Generate Key Modal ────────────────────────────────────────── */}
      <Modal
        open={generateModal}
        onClose={genStep === 'success' ? resetGenerateModal : () => setGenerateModal(false)}
        size="md"
        closeOnBackdrop={genStep !== 'success'}
      >
        {/* Step 1: Form */}
        {genStep === 'form' && (
          <>
            <ModalHeader onClose={() => setGenerateModal(false)}>
              <ModalTitle>Generate New API Key</ModalTitle>
              <ModalDescription>Configure scope, environment, and expiration for the new key.</ModalDescription>
            </ModalHeader>
            <ModalBody className="space-y-5">
              <Input
                label="Key Name"
                placeholder="e.g. Production Server, Mobile App"
                value={genForm.name}
                onChange={(e) => setGenForm({ ...genForm, name: e.target.value })}
              />

              {/* Scope */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">Scopes</p>
                <div className="grid grid-cols-2 gap-2">
                  {SCOPES.map((s) => (
                    <label key={s} className="flex items-center gap-2.5 cursor-pointer group">
                      <div
                        className={cn(
                          'w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-150 shrink-0',
                          genForm.scopes.has(s)
                            ? 'bg-indigo-500 border-indigo-500'
                            : 'border-slate-300 group-hover:border-indigo-400',
                        )}
                      >
                        {genForm.scopes.has(s) && <Check size={9} className="text-white stroke-[3]" />}
                      </div>
                      <input type="checkbox" className="sr-only" checked={genForm.scopes.has(s)} onChange={() => toggleScope(s)} />
                      <span className="text-sm text-slate-700">{s}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Environment */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">Environment</p>
                <div className="flex gap-3">
                  {(['live', 'sandbox'] as const).map((env) => (
                    <button
                      key={env}
                      onClick={() => setGenForm({ ...genForm, environment: env })}
                      className={cn(
                        'flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all duration-150 capitalize',
                        genForm.environment === env
                          ? env === 'live'
                            ? 'border-teal-500 bg-teal-50 text-teal-700'
                            : 'border-amber-500 bg-amber-50 text-amber-700'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300',
                      )}
                    >
                      {env === 'live' ? 'Live' : 'Sandbox'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Expiration */}
              <Select
                label="Expiration"
                value={genForm.expiration}
                options={EXPIRY_OPTIONS}
                onChange={(e) => setGenForm({ ...genForm, expiration: e.target.value as ExpirationOption })}
              />

              {/* IP Whitelist */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">
                  IP Whitelist <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="192.168.1.1, 10.0.0.0/24"
                  value={genForm.ipWhitelist}
                  onChange={(e) => setGenForm({ ...genForm, ipWhitelist: e.target.value })}
                  className={cn(
                    'w-full rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400',
                    'px-3 py-2 resize-none',
                    'focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400',
                    'hover:border-slate-300 transition-all duration-150',
                  )}
                />
                <p className="text-xs text-slate-400">Comma-separated IPs or CIDR ranges. Leave blank to allow all.</p>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onClick={() => setGenerateModal(false)}>Cancel</Button>
              <Button
                variant="primary"
                loading={generating}
                disabled={!genForm.name.trim() || genForm.scopes.size === 0}
                onClick={handleGenerate}
              >
                Generate Key
              </Button>
            </ModalFooter>
          </>
        )}

        {/* Step 2: Success – show keys */}
        {genStep === 'success' && generatedKey && (
          <>
            <ModalHeader>
              <ModalTitle className="text-teal-700">API Key Generated!</ModalTitle>
              <ModalDescription>
                Copy both keys now. The secret key will never be shown again.
              </ModalDescription>
            </ModalHeader>
            <ModalBody className="space-y-4">
              {/* Public key */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Public Key</p>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 h-10">
                  <code className="text-sm font-mono text-slate-700 flex-1 truncate">{generatedKey.publicKey}</code>
                  <CopyButton text={generatedKey.publicKey} />
                </div>
              </div>

              {/* Secret key */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Secret Key</p>
                <div className="flex items-center gap-2 bg-slate-50 border border-amber-200 rounded-lg px-3 h-10">
                  <code className="text-sm font-mono text-slate-700 flex-1 truncate">
                    {showSecretKey ? generatedKey.secretKey : '•'.repeat(generatedKey.secretKey.length)}
                  </code>
                  <button
                    onClick={() => setShowSecretKey(!showSecretKey)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    {showSecretKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <CopyButton text={generatedKey.secretKey} />
                </div>
              </div>

              {/* Warning banner */}
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold">This secret key will only be shown once!</span>
                  <br />
                  Store it in a secure location such as a password manager or environment variable.
                </div>
              </div>

              {/* Confirm checkbox */}
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div
                  className={cn(
                    'w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-150 shrink-0',
                    savedConfirmed ? 'bg-teal-500 border-teal-500' : 'border-slate-300',
                  )}
                >
                  {savedConfirmed && <Check size={9} className="text-white stroke-[3]" />}
                </div>
                <input type="checkbox" className="sr-only" checked={savedConfirmed} onChange={() => setSavedConfirmed(!savedConfirmed)} />
                <span className="text-sm text-slate-700">I have copied and securely stored my API keys.</span>
              </label>
            </ModalBody>
            <ModalFooter>
              <Button variant="primary" fullWidth disabled={!savedConfirmed} onClick={resetGenerateModal}>
                Done – I&apos;ve saved my keys
              </Button>
            </ModalFooter>
          </>
        )}
      </Modal>

      {/* ── Revoke Confirmation Modal ─────────────────────────────────── */}
      <Modal open={revokeModal !== null} onClose={() => { setRevokeModal(null); setRevokeConfirm(''); }} size="sm">
        {revokeModal && (
          <>
            <ModalHeader onClose={() => { setRevokeModal(null); setRevokeConfirm(''); }}>
              <ModalTitle className="text-rose-700">Revoke API Key?</ModalTitle>
              <ModalDescription>
                This action is permanent. Any integrations using <strong>{revokeModal.name}</strong> will stop working immediately.
              </ModalDescription>
            </ModalHeader>
            <ModalBody className="space-y-4">
              <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 rounded-lg text-sm text-rose-700">
                <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                This cannot be undone. Type the key name to confirm.
              </div>
              <Input
                placeholder={`Type "${revokeModal.name}" to confirm`}
                value={revokeConfirm}
                onChange={(e) => setRevokeConfirm(e.target.value)}
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onClick={() => { setRevokeModal(null); setRevokeConfirm(''); }}>Cancel</Button>
              <Button
                variant="danger"
                loading={revoking}
                disabled={revokeConfirm !== revokeModal.name}
                onClick={handleRevokeConfirm}
              >
                Revoke Key
              </Button>
            </ModalFooter>
          </>
        )}
      </Modal>
    </div>
  );
}
