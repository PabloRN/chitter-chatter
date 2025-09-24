import { createApp } from 'vue';
import { initializeApp } from 'firebase/app';
import lodash from 'lodash';
import Storage from 'vue-ls';
import App from './App';
import './registerServiceWorker';
import router from './router';
import pinia from './stores';
import useMainStore from './stores/main';
import vuetify from './plugins/vuetify';
import i18n from './i18n';
// import './utils/vee-validate' // Removed for now
import './assets/scss/main.scss';

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyAcSF4KWLbqqfc3EJDOBgJrHBbUR4D-5hg',
  authDomain: 'toonstalk.com',
  databaseURL: 'https://chitter-chatter-f762a.firebaseio.com',
  projectId: 'chitter-chatter-f762a',
  storageBucket: 'chitter-chatter-f762a.appspot.com',
  messagingSenderId: '63563490823',
  appId: '1:63563490823:web:a6b6dc9011861f6d0d2ca2',
  measurementId: 'G-JCDBMEBPZZ',
};

// Initialize Firebase (modular v10+)
// Note: Firebase is now initialized via src/config/firebase.js to avoid conflicts
initializeApp(firebaseConfig);

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
        console.log('🔥 Firebase compat initialized for FirebaseUI');
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

app.config.globalProperties._ = lodash;

// Start connection monitoring after app is mounted
app.mount('#app');

// Initialize connection monitoring
const mainStore = useMainStore();
mainStore.startConnectionMonitoring();
