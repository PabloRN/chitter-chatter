import { createApp } from 'vue';
import { initializeApp } from 'firebase/app';
import lodash from 'lodash';
import Storage from 'vue-ls';
import { VueReCaptcha } from 'vue-recaptcha-v3';
import App from './App';
import './registerServiceWorker';
import router from './router';
import pinia from './stores';
import useMainStore from './stores/main';
import vuetify from './plugins/vuetify';
import i18n from './i18n';
import analyticsService from './services/analyticsService';
// import './utils/vee-validate' // Removed for now
import './assets/scss/main.scss';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase (modular v10+)
initializeApp(firebaseConfig);

// Initialize Analytics
analyticsService.initialize().then(() => {
  analyticsService.logEvent('app_start');
  analyticsService.trackFirstVisit();
});

// Initialize Firebase compat for FirebaseUI
// Wait for Firebase compat to load, then initialize
const initFirebaseCompat = () => {
  // @ts-ignore - Accessing global Firebase compat
  const windowAny = window;
  if (typeof window !== 'undefined' && windowAny.firebase) {
    try {
      // Check if already initialized
      if (!windowAny.firebase.apps.length) {
        windowAny.firebase.initializeApp(firebaseConfig);
      }
    } catch (error) {
      console.warn('Firebase compat initialization error:', error);
    }
  } else {
    // Retry after a short delay if firebase compat isn't loaded yet
    setTimeout(initFirebaseCompat, 100);
  }
};

// Initialize compat Firebase
initFirebaseCompat();

const app = createApp(App);

// Global error handler to catch unhandled component errors
app.config.errorHandler = (err, instance, info) => {
  console.error('Global error:', err, info);
  // Prevent app crashes from non-critical errors
  if (err.message && err.message.includes('classList')) {
    console.warn('DOM element access error caught and ignored:', err.message);
    return false;
  }
  return true;
};

const storageOptions = {
  name: 'ls',
  storage: 'local',
};

app.use(pinia);
app.use(router);
app.use(vuetify);
app.use(i18n);
app.use(Storage, storageOptions);

// Configure reCAPTCHA v3
// Note: Replace with your actual reCAPTCHA site key from Google reCAPTCHA admin console
app.use(VueReCaptcha, {
  siteKey: import.meta.env.VITE_RECAPTCHA_SITE_KEY || 'YOUR_RECAPTCHA_SITE_KEY',
  loaderOptions: {
    autoHideBadge: true,
  },
});

app.config.globalProperties._ = lodash;

// Start connection monitoring after app is mounted
app.mount('#app');

// Initialize connection monitoring
const mainStore = useMainStore();
mainStore.startConnectionMonitoring();
