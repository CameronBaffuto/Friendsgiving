import { getApp, getApps, initializeApp } from 'firebase/app';

export function getFirebaseApp() {
  const env = import.meta.env;
  if (!env.VITE_FIREBASE_PROJECT_ID || !env.VITE_FIREBASE_DATABASE_URL || !env.VITE_FIREBASE_API_KEY || !env.VITE_FIREBASE_APP_ID) return null;
  if (getApps().some(app => app.name === '[DEFAULT]')) return getApp();
  return initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY, projectId: env.VITE_FIREBASE_PROJECT_ID,
    databaseURL: env.VITE_FIREBASE_DATABASE_URL, appId: env.VITE_FIREBASE_APP_ID,
    // Public identifier for this web app; other projects do not report to this stream.
    measurementId: env.VITE_FIREBASE_APP_ID === '1:419886550136:web:968aecb64182bbf8bdb18d'
      ? 'G-ZYHYW12T59' : undefined,
  });
}
