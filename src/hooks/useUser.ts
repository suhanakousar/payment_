'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export interface UserProfile {
  id:         string;
  email:      string;
  fullName:   string | null;
  role:       string;
  status:     string;
  merchantId: string | null;
  merchant: {
    id:           string;
    businessName: string;
    tier:         string;
    kycStatus:    string;
  } | null;
}

const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then(r => r.json()).then(d => d.data ?? null);

export function useUser() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setFirebaseUser);
    return unsub;
  }, []);

  const { data, error, isLoading, mutate } = useSWR<UserProfile | null>(
    '/api/v1/auth/me',
    fetcher,
    { revalidateOnFocus: false }
  );

  const rawName = data?.fullName
    || firebaseUser?.displayName
    || data?.email?.split('@')[0]
    || firebaseUser?.email?.split('@')[0]
    || 'Merchant Admin';

  const displayName = rawName;

  const initials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'MA';

  const tierLabel = data?.merchant?.tier
    ? data.merchant.tier.charAt(0) + data.merchant.tier.slice(1).toLowerCase() + ' Tier'
    : 'Starter Tier';

  const email = data?.email || firebaseUser?.email || '';

  return { user: data, displayName, initials, tierLabel, email, isLoading, error, mutate };
}
