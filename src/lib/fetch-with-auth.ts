import { auth } from '@/lib/firebase';

async function tryRefreshToken(): Promise<boolean> {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) return false;
  try {
    const res = await fetch('/api/v1/auth/firebase', {
      method:      'POST',
      headers:     { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        uid:         firebaseUser.uid,
        email:       firebaseUser.email,
        displayName: firebaseUser.displayName ?? undefined,
        provider:    'firebase',
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchWithAuth(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const opts: RequestInit = { credentials: 'include', ...init };
  const res = await fetch(input, opts);

  if (res.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      return fetch(input, opts);
    }
  }

  return res;
}
