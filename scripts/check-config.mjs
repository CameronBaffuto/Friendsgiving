import { loadEnv } from 'vite';
if (process.env.REQUIRE_FIREBASE_CONFIG === 'true') {
  const env = { ...loadEnv('production', process.cwd(), 'VITE_'), ...process.env };
  const missing = ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_DATABASE_URL', 'VITE_FIREBASE_APP_ID'].filter(key => !env[key]?.trim());
  if (missing.length) { console.error(`Missing configuration: ${missing.join(', ')}`); process.exit(1); }
}
