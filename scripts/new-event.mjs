import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';

const origin = process.argv[2];
if (!origin || !/^https:\/\/[^\s/#?]+\/?$/.test(origin)) {
  console.error('Usage: npm run new-event -- https://YOUR_PROJECT_ID.web.app');
  process.exit(1);
}
const token = randomBytes(24).toString('base64url');
await mkdir('.private', { recursive: true, mode: 0o700 });
const file = `.private/event-${new Date().getFullYear()}-${Date.now()}.json`;
await writeFile(file, JSON.stringify({ token, link: `${origin.replace(/\/$/, '')}/#event=${token}` }, null, 2), { mode: 0o600 });
console.log(`Private link: ${origin.replace(/\/$/, '')}/#event=${token}`);
console.log(`Saved to ${file} (ignored by git).`);
console.log(`Enable this event in Realtime Database by setting /access/${token} to boolean true.`);
console.log('Or run locally after firebase login:');
console.log(`npx firebase database:set /access/${token} --data true --project YOUR_PROJECT_ID --force`);
console.log('Setting that access value to false revokes the link. Never commit this token.');
