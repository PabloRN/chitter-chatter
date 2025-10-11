<!-- eslint-disable max-len -->
<template>
  <v-app>
    <!-- <Drawer /> -->
    <v-main>
      <router-view v-slot="{ Component }">
        <v-fade-transition mode="out-in">
          <component :is="Component" />
        </v-fade-transition>
      </router-view>
    </v-main>
    <snack-bar />
    <cookie-consent />

    <!-- Connection overlay -->
    <div v-if="!mainStore.isConnected && mainStore.connectionChecked" class="connection-overlay">
      <div class="connection-overlay-content">
        <v-icon size="64" color="red">mdi-wifi-off</v-icon>
        <h2>Connection Lost</h2>
        <p>Please check your internet connection</p>
        <v-btn color="primary" @click="mainStore.retryConnection()" class="mt-4">
          Try Again
        </v-btn>
      </div>
    </div>

    <!-- Landscape orientation message -->
    <div class="landscape-message">
      <div>
        <h2>📱 Please rotate your device</h2>
        <p>This chat room works best in landscape mode</p>
        <p>Rotate your device for the optimal experience</p>
      </div>
    </div>

    <!-- Survey Popup -->
    <survey-popup v-model="showSurveyPopup" @success="handleSurveySuccess" @dismissed="handleSurveyDismissed" />

  </v-app>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import SnackBar from './components/Snackbar';
import CookieConsent from './components/CookieConsent';
import SurveyPopup from './components/SurveyPopup';
import useLanguageSwitcherStore from './stores/languageswitcher';
import useUserStore from './stores/user';
import useMainStore from './stores/main';
import useTheme from './composables/useTheme';

const languageSwitcherStore = useLanguageSwitcherStore();
const userStore = useUserStore();
const mainStore = useMainStore();
const { initTheme } = useTheme();

const showSurveyPopup = ref(false);
const SURVEY_DELAY = 1 * 60 * 1000; // 5 minutes in milliseconds
const SURVEY_STORAGE_KEY = 'toonstalk_survey_completed';
const SURVEY_DISMISSED_KEY = 'toonstalk_survey_dismissed';
let surveyTimer = null;

function lockLandscapeOrientation() {
  if (window.screen && window.screen.orientation && window.screen.orientation.lock) {
    window.screen.orientation.lock('landscape').catch(() => {
      console.log('Screen orientation lock not supported or failed');
    });
  }
}

function leaveBrowser() {
  console.log('User leaved the browser');
}

function initSurveyTimer() {
  // Clear any existing timer
  if (surveyTimer) {
    clearTimeout(surveyTimer);
    surveyTimer = null;
  }

  // Check if survey has already been completed or dismissed
  const surveyCompleted = localStorage.getItem(SURVEY_STORAGE_KEY);
  const surveyDismissed = localStorage.getItem(SURVEY_DISMISSED_KEY);

  if (surveyCompleted || surveyDismissed) {
    console.log('Survey already completed or dismissed - skipping');
    return;
  }

  // Check if user is authenticated (not anonymous)
  const currentUser = userStore.getCurrentUser;
  if (!currentUser || currentUser.isAnonymous) {
    console.log('User is anonymous - skipping survey timer');
    return;
  }

  // Set timer to show survey after delay
  console.log(`Survey will appear in ${SURVEY_DELAY / 1000 / 60} minutes`);
  surveyTimer = setTimeout(() => {
    console.log('Survey timer fired! Checking user...');
    const user = userStore.getCurrentUser;
    if (user && !user.isAnonymous) {
      console.log('Showing survey popup now!');
      showSurveyPopup.value = true;
    } else {
      console.log('User became anonymous - not showing survey');
    }
  }, SURVEY_DELAY);
}

function handleSurveySuccess() {
  console.log('Survey submitted successfully');
  localStorage.setItem(SURVEY_STORAGE_KEY, 'true');
  mainStore.setSnackbar({
    type: 'success',
    msg: 'Thank you for your feedback! 🎉',
  });
}

function handleSurveyDismissed() {
  console.log('Survey dismissed by user');
  localStorage.setItem(SURVEY_DISMISSED_KEY, 'true');
}

// Watch for user authentication changes to start survey timer
watch(() => userStore.getCurrentUser, (newUser) => {
  if (newUser && !newUser.isAnonymous) {
    // User just authenticated (non-anonymous) - start survey timer
    initSurveyTimer();
  } else if (surveyTimer) {
    // User logged out or became anonymous - clear timer
    clearTimeout(surveyTimer);
    surveyTimer = null;
  }
}, { immediate: true });

onMounted(() => {
  lockLandscapeOrientation();
  languageSwitcherStore.SET_LANG();
  userStore.getUser();
  initTheme();
  window.addEventListener('beforeunload', leaveBrowser);
});

onUnmounted(() => {
  window.removeEventListener('beforeunload', leaveBrowser);

  // Clear survey timer on unmount
  if (surveyTimer) {
    clearTimeout(surveyTimer);
    surveyTimer = null;
  }
});
</script>

<style>
@media screen and (max-width: 768px) and (orientation: portrait) {
  .landscape-message {
    display: flex;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: var(--background-overlay-light);
    color: var(--text-light);
    align-items: center;
    justify-content: center;
    flex-direction: column;
    z-index: 10000;
    font-size: 18px;
    text-align: center;
    padding: 20px;
  }

  .landscape-message h2 {
    margin-bottom: 20px;
    font-size: 24px;
  }

  .landscape-message p {
    margin: 10px 0;
    font-size: 16px;
  }
}

@media screen and (min-width: 769px),
screen and (max-width: 768px) and (orientation: landscape) {
  .landscape-message {
    display: none;
  }
}

.connection-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--background-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: var(--backdrop-blur);
}

.connection-overlay-content {
  background: var(--background-primary);
  padding: 40px;
  border-radius: var(--border-radius);
  text-align: center;
  box-shadow: var(--shadow-heavy);
  max-width: 400px;
  margin: 20px;
}

.connection-overlay-content h2 {
  margin: 16px 0;
  color: var(--text-primary);
  font-size: 24px;
}

.connection-overlay-content p {
  margin: 16px 0;
  color: var(--text-secondary);
  font-size: 16px;
}
</style>
