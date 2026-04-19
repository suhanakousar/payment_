'use client';

import { useState, useRef, useEffect } from 'react';
import {
  User,
  Building2,
  ShieldCheck,
  Trash2,
  Upload,
  X,
  CheckCircle2,
  AlertTriangle,
  BadgeCheck,
  Phone,
  Mail,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
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

interface UploadedDoc { name: string; size: string; }
type DangerAction = 'deactivate' | 'delete' | null;

const BUSINESS_CATEGORIES = [
  { value: '',               label: 'Select a category' },
  { value: 'retail',         label: 'Retail & E-Commerce' },
  { value: 'food',           label: 'Food & Beverage' },
  { value: 'services',       label: 'Professional Services' },
  { value: 'software',       label: 'Software & Technology' },
  { value: 'manufacturing',  label: 'Manufacturing' },
  { value: 'healthcare',     label: 'Healthcare & Pharma' },
  { value: 'education',      label: 'Education' },
  { value: 'logistics',      label: 'Logistics & Transport' },
  { value: 'other',          label: 'Other' },
];

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
        <Icon size={18} className="text-indigo-600" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function SaveToast({ visible }: { visible: boolean }) {
  return (
    <div className={cn(
      'fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-slate-900 text-white text-sm px-4 py-3 rounded-xl shadow-xl transition-all duration-300',
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none',
    )}>
      <CheckCircle2 size={16} className="text-teal-400" />
      Changes saved successfully
    </div>
  );
}

function DocRow({ label, uploaded, onUpload, onRemove }: {
  label: string; uploaded: UploadedDoc | null;
  onUpload: (doc: UploadedDoc) => void; onRemove: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onUpload({ name: file.name, size: `${(file.size / 1024).toFixed(0)} KB` });
    e.target.value = '';
  };
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {uploaded
          ? <p className="text-xs text-slate-500 mt-0.5 truncate">{uploaded.name} · {uploaded.size}</p>
          : <p className="text-xs text-slate-400 mt-0.5">No file uploaded</p>}
      </div>
      {uploaded ? (
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="success" dot>Uploaded</Badge>
          <button onClick={onRemove} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors">
            <X size={14} />
          </button>
        </div>
      ) : (
        <>
          <input ref={fileRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFile} />
          <Button size="sm" variant="secondary" leftIcon={<Upload size={13} />} onClick={() => fileRef.current?.click()}>Upload</Button>
        </>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [bizForm, setBizForm] = useState({
    businessName: '', gstin: '', pan: '', businessCategory: '', address: '',
  });
  const [personalForm, setPersonalForm] = useState({ fullName: '', email: '', phone: '' });
  const [kycStatus, setKycStatus] = useState('PENDING');
  const [docs, setDocs] = useState<Record<string, UploadedDoc | null>>({ gst: null, pan: null, inc: null });
  const [dangerAction, setDangerAction] = useState<DangerAction>(null);
  const [dangerConfirm, setDangerConfirm] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [bizSaving, setBizSaving] = useState(false);
  const [personalSaving, setPersonalSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/v1/profile', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (!d.success) { setError('Failed to load profile.'); setLoading(false); return; }
        const { fullName, email, phone, merchant } = d.data;
        setPersonalForm({ fullName: fullName ?? '', email: email ?? '', phone: phone ?? '' });
        if (merchant) {
          setBizForm({
            businessName:     merchant.businessName ?? '',
            gstin:            merchant.gstin ?? '',
            pan:              merchant.pan ?? '',
            businessCategory: merchant.businessCategory ?? '',
            address:          merchant.address ?? '',
          });
          setKycStatus(merchant.kycStatus ?? 'PENDING');
        }
        setLoading(false);
      })
      .catch(() => { setError('Failed to load profile.'); setLoading(false); });
  }, []);

  const showToast = () => {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  const handleBizSave = async () => {
    setBizSaving(true);
    const res = await fetch('/api/v1/profile', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bizForm),
    });
    setBizSaving(false);
    if (res.ok) showToast();
  };

  const handlePersonalSave = async () => {
    setPersonalSaving(true);
    const res = await fetch('/api/v1/profile', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: personalForm.fullName, phone: personalForm.phone }),
    });
    setPersonalSaving(false);
    if (res.ok) showToast();
  };

  const kycVariant = kycStatus === 'VERIFIED' ? 'success' : kycStatus === 'REJECTED' ? 'danger' : 'warning';
  const kycLabel   = kycStatus === 'VERIFIED' ? 'Verified' : kycStatus === 'REJECTED' ? 'Rejected' : 'Pending';
  const dangerLabel = dangerAction === 'deactivate' ? 'DEACTIVATE' : 'DELETE ALL DATA';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-rose-500 text-sm gap-2">
        <AlertTriangle size={16} /> {error}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Profile Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your business identity, KYC, and contact information.</p>
      </div>

      {/* Business Information */}
      <Card>
        <CardHeader className="pb-5">
          <SectionHeader icon={Building2} title="Business Information" subtitle="Legal details used for settlements and invoicing." />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={cn(
            'flex items-center justify-between p-3 rounded-lg border',
            kycStatus === 'VERIFIED' ? 'bg-teal-50 border-teal-100' : kycStatus === 'REJECTED' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100',
          )}>
            <div className={cn('flex items-center gap-2 text-sm font-medium',
              kycStatus === 'VERIFIED' ? 'text-teal-700' : kycStatus === 'REJECTED' ? 'text-rose-700' : 'text-amber-700',
            )}>
              <ShieldCheck size={16} />
              KYC Verification Status
            </div>
            <Badge variant={kycVariant} dot>{kycLabel}</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Business Name" value={bizForm.businessName}
              onChange={e => setBizForm({ ...bizForm, businessName: e.target.value })} />
            <Input label="GSTIN" value={bizForm.gstin}
              onChange={e => setBizForm({ ...bizForm, gstin: e.target.value })} className="font-mono" />
            <Input label="PAN" value={bizForm.pan}
              onChange={e => setBizForm({ ...bizForm, pan: e.target.value })} className="font-mono" />
            <Select label="Business Category" value={bizForm.businessCategory}
              options={BUSINESS_CATEGORIES}
              onChange={e => setBizForm({ ...bizForm, businessCategory: e.target.value })} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Registered Address</label>
            <textarea rows={3} value={bizForm.address}
              onChange={e => setBizForm({ ...bizForm, address: e.target.value })}
              className={cn(
                'w-full rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400',
                'px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400',
                'hover:border-slate-300 transition-all duration-150',
              )}
            />
          </div>

          <div className="flex justify-end pt-1">
            <Button variant="primary" loading={bizSaving} onClick={handleBizSave}>Save Changes</Button>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader className="pb-5">
          <SectionHeader icon={User} title="Personal Information" subtitle="Your individual contact details." />
        </CardHeader>
        <CardContent className="space-y-4">
          <Input label="Full Name" value={personalForm.fullName}
            onChange={e => setPersonalForm({ ...personalForm, fullName: e.target.value })} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Email Address</label>
              <div className="relative flex items-center">
                <Mail size={16} className="absolute left-3 text-slate-400 pointer-events-none" />
                <input type="email" value={personalForm.email} readOnly
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-500 h-10 pl-9 pr-24 cursor-not-allowed" />
                <span className="absolute right-2.5"><Badge variant="success" size="sm" dot>Verified</Badge></span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Phone Number</label>
              <div className="relative flex items-center">
                <Phone size={16} className="absolute left-3 text-slate-400 pointer-events-none" />
                <input type="tel" value={personalForm.phone}
                  onChange={e => setPersonalForm({ ...personalForm, phone: e.target.value })}
                  placeholder="+91 00000 00000"
                  className={cn(
                    'w-full rounded-lg border border-slate-200 bg-white text-sm text-slate-900 h-10 pl-9 pr-4',
                    'focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400',
                    'hover:border-slate-300 transition-all duration-150',
                  )}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button variant="primary" loading={personalSaving} onClick={handlePersonalSave}>Update</Button>
          </div>
        </CardContent>
      </Card>

      {/* KYC Documents */}
      <Card>
        <CardHeader className="pb-5">
          <SectionHeader icon={BadgeCheck} title="KYC Documents" subtitle="Upload clear, legible copies of required documents." />
        </CardHeader>
        <CardContent>
          <DocRow label="GST Certificate" uploaded={docs.gst}
            onUpload={doc => setDocs({ ...docs, gst: doc })} onRemove={() => setDocs({ ...docs, gst: null })} />
          <DocRow label="PAN Card" uploaded={docs.pan}
            onUpload={doc => setDocs({ ...docs, pan: doc })} onRemove={() => setDocs({ ...docs, pan: null })} />
          <DocRow label="Certificate of Incorporation" uploaded={docs.inc}
            onUpload={doc => setDocs({ ...docs, inc: doc })} onRemove={() => setDocs({ ...docs, inc: null })} />
          <p className="mt-4 text-xs text-slate-400">Accepted formats: PDF, JPG, PNG · Max size 5 MB per file.</p>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-2 border-rose-200">
        <CardHeader className="pb-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
              <AlertTriangle size={18} className="text-rose-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-rose-700">Danger Zone</h2>
              <p className="text-sm text-rose-400 mt-0.5">These actions are irreversible. Proceed with caution.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-rose-50/50 border border-rose-100">
            <div>
              <p className="text-sm font-semibold text-slate-800">Deactivate Account</p>
              <p className="text-xs text-slate-500 mt-0.5">Temporarily disable your account. You can reactivate by contacting support.</p>
            </div>
            <Button variant="danger" size="sm" onClick={() => { setDangerAction('deactivate'); setDangerConfirm(''); }}>Deactivate</Button>
          </div>
          <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-rose-50/50 border border-rose-100">
            <div>
              <p className="text-sm font-semibold text-slate-800">Delete All Data</p>
              <p className="text-xs text-slate-500 mt-0.5">Permanently erase all transaction records, settings, and merchant data.</p>
            </div>
            <Button variant="danger" size="sm" onClick={() => { setDangerAction('delete'); setDangerConfirm(''); }}>
              <Trash2 size={13} className="mr-1.5" /> Delete Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Modal */}
      <Modal open={dangerAction !== null} onClose={() => setDangerAction(null)} size="sm">
        <ModalHeader onClose={() => setDangerAction(null)}>
          <ModalTitle className="text-rose-700">
            {dangerAction === 'deactivate' ? 'Deactivate Account?' : 'Delete All Data?'}
          </ModalTitle>
          <ModalDescription>
            {dangerAction === 'deactivate'
              ? 'Your account will be suspended immediately. All ongoing settlements will be paused.'
              : 'All data including transactions, API keys, webhooks, and settings will be permanently deleted.'}
          </ModalDescription>
        </ModalHeader>
        <ModalBody className="space-y-4">
          <div className="flex items-start gap-2 p-3 bg-rose-50 rounded-lg border border-rose-100 text-sm text-rose-700">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            This action cannot be undone. Please type <strong className="mx-1">{dangerLabel}</strong> to confirm.
          </div>
          <Input placeholder={`Type "${dangerLabel}" to confirm`} value={dangerConfirm}
            onChange={e => setDangerConfirm(e.target.value)} />
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setDangerAction(null)}>Cancel</Button>
          <Button variant="danger" disabled={dangerConfirm !== dangerLabel}>
            {dangerAction === 'deactivate' ? 'Yes, Deactivate' : 'Yes, Delete Everything'}
          </Button>
        </ModalFooter>
      </Modal>

      <SaveToast visible={toastVisible} />
    </div>
  );
}
