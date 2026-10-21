import { createRoot } from 'react-dom/client';
import { App } from './App';
import { firebaseStore } from './data';
import { eventFromHash } from './model';
import type { Store } from './data';
import './styles.css';

const root = createRoot(document.getElementById('root')!);
const token = eventFromHash(location.hash);
const demo = import.meta.env.DEV && new URLSearchParams(location.search).has('demo');
let store: Store | null = null;
let issue = 'Open the full food-signup link from your invitation. It includes the key to your group’s list.';
if (demo) store = (await import('./demo')).demoStore();
else if (token) {
  try { store = firebaseStore(token); } catch { /* Invalid project configuration remains unavailable. */ }
  if (!store) issue = 'The host is still getting the food list ready. Please check back soon.';
}
root.render(<App store={store} issue={issue} />);
window.addEventListener('hashchange', () => location.reload());

// Keep local development and Hosting preview channels out of visitor counts.
// Analytics is optional and must never delay rendering or database startup.
if (import.meta.env.PROD && ['friendsgiving-dac7b.web.app', 'friendsgiving-dac7b.firebaseapp.com'].includes(location.hostname)) {
  void import('./analytics').then(({ startAnalytics }) => startAnalytics()).catch(() => {
    // Tracking blockers and unsupported browsers must not affect the invitation.
  });
}
