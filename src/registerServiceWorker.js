/* eslint-disable no-console */

import { register } from 'register-service-worker';

if (process.env.NODE_ENV === 'production') {
  register(`${process.env.BASE_URL}service-worker.js`, {
    ready() {
      console.log(
        '✅ [SERVICE WORKER] App is being served from cache by a service worker.\n'
        + 'For more details, visit https://goo.gl/AFskqB',
      );
    },
    registered(registration) {
      console.log('✅ [SERVICE WORKER] Service worker has been registered.');
      console.log('📋 [SERVICE WORKER] Registration details:', {
        scope: registration.scope,
        updateViaCache: registration.updateViaCache,
        active: registration.active ? 'yes' : 'no',
        waiting: registration.waiting ? 'yes' : 'no',
      });
    },
    cached() {
      console.log('📦 [SERVICE WORKER] Content has been cached for offline use.');
    },
    updatefound() {
      console.log('🔄 [SERVICE WORKER] New content is downloading...');
    },
    updated(registration) {
      console.log('🆕 [SERVICE WORKER] New content is available!');
      console.log('🔄 [SERVICE WORKER] Forcing update and refresh...');
      // Force update to activate new service worker
      if (registration && registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        // Reload the page to use the new service worker
        console.log('↻ [SERVICE WORKER] Reloading page to activate new service worker...');
        window.location.reload();
      } else {
        console.warn('⚠️ [SERVICE WORKER] No waiting service worker found');
      }
    },
    offline() {
      console.log('📡 [SERVICE WORKER] No internet connection found. App is running in offline mode.');
    },
    error(error) {
      console.error('❌ [SERVICE WORKER] Error during service worker registration:', error);
    },
  });
}
