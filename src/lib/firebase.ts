import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        'payagree.firebaseapp.com',
  projectId:         'payagree',
  storageBucket:     'payagree.firebasestorage.app',
  messagingSenderId: '533561833134',
  appId:             '1:533561833134:web:6cc9ded75276fb3ab45f3f',
  measurementId:     'G-RMJNR5ZE2B',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export default app;
