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
import SnackBar from './components/Snackbar.vue';
import { useLanguageSwitcherStore } from './stores/languageswitcher';
import { useUserStore } from './stores/user';

const languageSwitcherStore = useLanguageSwitcherStore();
const userStore = useUserStore();

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
    background: rgba(0, 0, 0, 0.95);
    color: white;
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

@media screen and (min-width: 769px), screen and (max-width: 768px) and (orientation: landscape) {
  .landscape-message {
    display: none;
  }
}
</style>
