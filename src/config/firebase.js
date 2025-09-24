import { initializeApp } from 'firebase/app';

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

let app = null;

/**
 * Initialize Firebase app if not already initialized
 */
export const initializeFirebase = () => {
  if (!app) {
    app = initializeApp(firebaseConfig);
    console.log('🔥 Firebase initialized');
  }
  return app;
};

/**
 * Get Firebase app instance, initializing if needed
 */
export const getFirebaseApp = () => {
  if (!app) {
    return initializeFirebase();
  }
  return app;
};

export default getFirebaseApp;
