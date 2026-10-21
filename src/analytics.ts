import { initializeAnalytics, isSupported } from 'firebase/analytics';
import { getFirebaseApp } from './firebase';

export async function startAnalytics() {
  const app = getFirebaseApp();
  if (!app?.options.measurementId || !(await isSupported())) return;

  // Override URLs before the first automatic page view. Never send the invitation
  // fragment or query parameters, including on subsequent automatic events.
  let referrer = '';
  try {
    const url = new URL(document.referrer);
    referrer = url.origin + url.pathname;
  } catch { /* Direct visits have no referrer. */ }
  initializeAnalytics(app, {
    config: {
      page_location: location.origin + location.pathname,
      page_referrer: referrer,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    },
  });
}
