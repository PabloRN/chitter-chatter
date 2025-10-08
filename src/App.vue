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

  </v-app>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import SnackBar from './components/Snackbar';
import CookieConsent from './components/CookieConsent';
import useLanguageSwitcherStore from './stores/languageswitcher';
import useUserStore from './stores/user';
import useMainStore from './stores/main';
import useTheme from './composables/useTheme';

const languageSwitcherStore = useLanguageSwitcherStore();
const userStore = useUserStore();
const mainStore = useMainStore();
const { initTheme } = useTheme();

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

onMounted(() => {
  lockLandscapeOrientation();
  languageSwitcherStore.SET_LANG();
  userStore.getUser();
  initTheme();
  window.addEventListener('beforeunload', leaveBrowser);
});

onUnmounted(() => {
  window.removeEventListener('beforeunload', leaveBrowser);
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
