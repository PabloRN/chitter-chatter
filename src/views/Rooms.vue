<!-- eslint-disable max-len -->
<template>
  <div class="home">
    <v-app-bar dense elevation="4" rounded shaped>
      <v-toolbar-title style="display: flex; justify-content: flex-start">
        <v-img src="/logotype_landing_page.png" class="my-3" contain width="6em" height="35"
          style="background-position: left!important;" />
      </v-toolbar-title>

      <v-spacer></v-spacer>

      <!-- Feedback button -->
      <v-btn icon class="mr-2" @click="showFeedbackDialog = true" title="Send Feedback">
        <v-icon>mdi-message-alert-outline</v-icon>
      </v-btn>

      <!-- TODO: create component -->
      <!-- Authentication buttons for non-authenticated users -->
      <div v-if="!isUserAuthenticated" class="auth-buttons mr-3">
        <v-btn text class="login-btn" @click="showAuthDialog = true">
          Login / Sign Up
        </v-btn>
      </div>

      <!-- Profile menu for authenticated users -->
      <div v-else class="profile-section mr-3">
        <v-menu offset-y z-index="99999">
          <template v-slot:activator="{ props }">
            <v-btn icon v-bind="props" class="profile-menu-btn">
              <v-avatar size="42" class="profile-avatar">
                <v-img v-if="getCurrentUser?.personalAvatar || getCurrentUser?.miniAvatar"
                  :src="getCurrentUser?.personalAvatar || getCurrentUser?.miniAvatar" />
                <v-icon v-else>mdi-account-circle</v-icon>
              </v-avatar>
            </v-btn>
          </template>

          <v-list class="profile-dropdown">
            <v-list-item prepend-icon="mdi-account" title="Profile" @click="goToProfile" />
            <v-list-item prepend-icon="mdi-bell" title="Notifications" @click="goToNotifications" />
            <v-list-item prepend-icon="mdi-heart" title="Favorites" @click="goToFavorites" />
            <v-divider></v-divider>
            <v-list-item prepend-icon="mdi-logout" title="Log Out" @click="logout" class="logout-item">
              <template #prepend>
                <v-icon color="red">mdi-logout</v-icon>
              </template>
              <template #title>
                <span class="text-red">Log Out</span>
              </template>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </v-app-bar>

    <!-- Auth Dialog for Login/Signup -->
    <v-dialog v-model="showAuthDialog" max-width="400" :persistent="!isUserAuthenticated">
      <v-card class="auth-dialog">
        <v-card-title class="text-h6 text-center">
          Welcome to ToonsTalk
        </v-card-title>
        <v-card-text class="text-center">
          <p class="mb-4">
            Join our community to save favorites, get notifications, and
            customize your profile!
          </p>
          <div id="firebaseui-auth-container"></div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeAuthDialog"> Continue as Guest </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Netflix-style Room Sections -->
    <div class="rooms-sections-container pa-4">
      <!-- My Rooms Section -->
      <div v-if="isUserAuthenticated && myRoomIds.length > 0" class="room-section">
        <h2 class="section-title">
          <!-- <v-icon class="mr-2">mdi-home-group</v-icon> -->
          My Rooms
        </h2>
        <div class="room-grid">
          <div v-for="roomId in myRoomIds" :key="`my-${roomId}`" class="room-card-item">
            <RoomThumbnail :room="getAllRooms[roomId]" :id="roomId" />
          </div>
        </div>
      </div>

      <!-- Favorite Rooms Section -->
      <div v-if="isUserAuthenticated && favoriteRoomIds.length > 0" class="room-section">
        <h2 class="section-title">
          <!-- <v-icon class="mr-2">mdi-heart</v-icon> -->
          Favorites
        </h2>
        <div class="room-grid">
          <div v-for="roomId in favoriteRoomIds" :key="`favorite-${roomId}`" class="room-card-item">
            <RoomThumbnail :room="getAllRooms[roomId]" :id="roomId" />
          </div>
        </div>
      </div>

      <!-- Popular Today Section -->
      <div v-if="popularRoomIds.length > 0" class="room-section">
        <h2 class="section-title">
          <!-- <v-icon class="mr-2">mdi-trending-up</v-icon> -->
          Popular Today
        </h2>
        <div class="room-grid">
          <div v-for="roomId in popularRoomIds" :key="`popular-${roomId}`" class="room-card-item">
            <RoomThumbnail :room="getAllRooms[roomId]" :id="roomId" />
          </div>
        </div>
      </div>

      <!-- All Rooms Section -->
      <div v-if="allRoomIds.length > 0" class="room-section">
        <h2 class="section-title">
          <!-- <v-icon class="mr-2">mdi-home-city</v-icon> -->
          All Rooms
        </h2>
        <div class="room-grid">
          <div v-for="roomId in allRoomIds" :key="`all-${roomId}`" class="room-card-item">
            <RoomThumbnail :room="getAllRooms[roomId]" :id="roomId" />
          </div>
        </div>
      </div>
    </div>

    <div style="width: 100%;display: flex; justify-content: center;align-items: center;margin-top: 20px;">
      <v-card style="width: 40%" class="themed-card">
        <v-card-text class="text-subtitle-1" style="height: 20vh">
          <p>
            This is a temporary url created especially for you, our beloved
            early tester. Please note that it will expire soon.
          </p>
          <p>
            If you find this product amazing and you want to hear more from us
            and share your experience join us on our Discord channel
            <a href="https://discord.gg/Hspt8B2u" target="_blank">discord channel</a>. We'd love to hear from you!
          </p>
        </v-card-text>
      </v-card>
    </div>

    <v-footer padless absolute class="footer">
      <v-card flat tile width="100%" class="text-center">
        <v-divider></v-divider>
        <v-card-text>
          <div class="footer-content">
            <div class="footer-copyright">
              Copyright © {{ new Date().getFullYear() }} — <strong>toonstalk</strong>
            </div>
            <div class="footer-links">
              <router-link to="/privacy" class="footer-link">Privacy Policy</router-link>
              <span class="footer-separator">•</span>
              <router-link to="/terms" class="footer-link">Terms of Service</router-link>
              <span class="footer-separator">•</span>
              <router-link to="/cookies" class="footer-link">Cookie Policy</router-link>
              <span class="footer-separator">•</span>
              <router-link to="/acceptable-use" class="footer-link">Community Guidelines</router-link>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-footer>

    <v-dialog v-if="showWelcomeDialog" v-model="showWelcomeDialog" persistent width="600"
      class="pa-5 ma-5 progress-dialog">
      <v-card style="width: 100%" class="themed-card">
        <v-card-title class="text-h6">Welcome, Early Tester! </v-card-title>
        <v-card-text class="text-subtitle-1" style="height: 20vh">
          <p>
            Thank you for being one of the selected few to try out our beta
            version. Your feedback is incredibly valuable in helping us shape
            the final product.
          </p>
          <p>
            Please remember that this is a beta version, so you may encounter
            some bugs or incomplete features. Also is only working on PC and
            tablet. We’d love to hear your thoughts on how we can improve!
          </p>
        </v-card-text>
        <v-card-actions class="text-body-2 pa-2 d-flex justify-end align-end">
          <v-btn small class="px-10" color="primary darken-1" tile @click="showWelcomeDialog = false">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Feedback Dialog -->
    <FeedbackDialog
      v-model="showFeedbackDialog"
      @success="handleFeedbackSuccess"
      @error="handleFeedbackError"
    />
  </div>
</template>

<script setup>
import {
  ref, computed, watch, onMounted, onBeforeUnmount, nextTick,
} from 'vue';
import { useRouter } from 'vue-router';
import useRoomsStore from '@/stores/rooms';
import useUserStore from '@/stores/user';
import RoomThumbnail from '@/components/RoomThumbnail';
import FeedbackDialog from '@/components/FeedbackDialog';

// ✅ stores
const roomsStore = useRoomsStore();
const userStore = useUserStore();
const router = useRouter();

// ✅ state (was data)
const showWelcomeDialog = ref(false);
const showAuthDialog = ref(false);
const showFeedbackDialog = ref(false);
const usersOnline = ref(0);
const flexBasisValues = ref(['25%']);
const variant = ref('absolute');
const nickname = ref('ttalker');
const userId = ref('default_avatar_character_12345');
const avatar = ref(
  'https://firebasestorage.googleapis.com/v0/b/chitter-chatter-f762a.appspot.com/o/rooms%2Fkimetsu_1%2Favatars%2FL1%2Ftanjiro.png?alt=media&token=ebf9e68d-c0e2-4019-a201-24e6553aad0a',
);

// ✅ computed
const getAllRooms = computed(() => roomsStore.getAllRooms);
const roomList = computed(() => roomsStore.roomList);
const usersOnlineNow = computed(() => roomsStore.usersOnlineNow);
const getCurrentUser = computed(() => userStore.getCurrentUser);
const isUserAuthenticated = computed(
  () => userStore.currentUser?.userId && !userStore.currentUser?.isAnonymous,
);

// Netflix-style room sections - simplified approach with just IDs
const myRoomIds = computed(() => {
  if (!isUserAuthenticated.value) return [];
  return (roomsStore.getOwnedRooms || []).map((room) => room.id);
});

const favoriteRoomIds = computed(() => {
  if (!isUserAuthenticated.value) return [];
  const userFavoriteIds = userStore.currentUser?.favoriteRooms || [];
  const rooms = getAllRooms.value;
  // Filter to only include rooms that exist
  return userFavoriteIds.filter((roomId) => rooms && rooms[roomId]);
});

const popularRoomIds = computed(() => {
  const rooms = getAllRooms.value;
  if (!rooms) return [];
  // Get sorted room IDs by popularity
  return Object.entries(rooms)
    .filter(([id, room]) => (room.usersOnline || 0) > 0 && !room.isPrivate) // Only show rooms with active users
    .sort(([aId, aRoom], [bId, bRoom]) => (bRoom.usersOnline || 0) - (aRoom.usersOnline || 0))
    .slice(0, 10)
    .map(([id, room]) => id); // Return only the IDs
});

const allRoomIds = computed(() => {
  const rooms = getAllRooms.value;
  if (!rooms) return [];
  console.log('rooms', rooms);
  return Object.entries(rooms).filter(([id, room]) => !room.isPrivate).map(([id, room]) => id);
});

// ✅ methods
function getRandomFlexBasis() {
  const randomFlexBasis = flexBasisValues.value[
    Math.floor(Math.random() * flexBasisValues.value.length)
  ];
  return { flexBasis: randomFlexBasis };
}

function goToProfile() {
  router.push({ name: 'profile' });
}

function goToNotifications() {
  console.log('Navigate to notifications');
}

function goToFavorites() {
  console.log('Navigate to favorites');
}

async function logout() {
  try {
    await userStore.userSignOut();
  } catch (error) {
    console.error('Logout error:', error);
  }
}

function closeAuthDialog() {
  showAuthDialog.value = false;
}

function checkAuthenticationStatus() {
  if (isUserAuthenticated.value && showAuthDialog.value) {
    showAuthDialog.value = false;
  }
}

function handleFeedbackSuccess() {
  console.log('Feedback submitted successfully');
  // You can add a success snackbar notification here
}

function handleFeedbackError(error) {
  console.error('Feedback submission error:', error);
  // You can add an error snackbar notification here
}

// ✅ lifecycle
let authCheckInterval = null;

onMounted(() => {
  roomsStore.getRooms();

  // Fetch owned rooms if user is authenticated
  if (isUserAuthenticated.value) {
    roomsStore.fetchOwnedRooms(userStore.currentUser.userId);
  }

  if (!localStorage.getItem('hasVisited')) {
    showWelcomeDialog.value = true;
    localStorage.setItem('hasVisited', 'true');
  }

  authCheckInterval = setInterval(() => {
    checkAuthenticationStatus();
  }, 1000);
});

onBeforeUnmount(() => {
  if (authCheckInterval) {
    clearInterval(authCheckInterval);
  }
});

// ✅ watchers
watch(showAuthDialog, (newVal) => {
  if (newVal) {
    nextTick(() => {
      userStore.setFirebaseUiInstance('rooms');
    });
  }
});

watch(
  () => userStore.currentUser?.isAnonymous,
  (newVal, oldVal) => {
    if (oldVal === true && newVal === false) {
      showAuthDialog.value = false;
    }
  },
);

watch(
  () => userStore.currentUser?.userId,
  (newVal, oldVal) => {
    if (!oldVal && newVal && !userStore.currentUser?.isAnonymous) {
      showAuthDialog.value = false;
    }
  },
);

watch(
  () => userStore.signingInUpgraded,
  (newVal) => {
    if (newVal) {
      showAuthDialog.value = false;
    }
  },
);

// Fetch owned rooms when user authentication changes
watch(isUserAuthenticated, (newVal) => {
  if (newVal) {
    roomsStore.fetchOwnedRooms(userStore.currentUser.userId);
  } else {
    roomsStore.clearOwnedRooms();
  }
});
</script>

<style>
/* Netflix-style Room Sections */
.rooms-sections-container {
  max-width: 1400px;
  margin: 0 auto;
}

.room-section {
  margin-bottom: 40px;
}

.section-title {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-weight: 700;
  font-size: 1.5rem;
  color: var(--text-primary);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
}

.room-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}

.room-card-item {
  transition: transform 0.3s ease;
  position: relative;
}

.room-card-item:hover {
  /* transform: scale(1.05) translateY(-4px); */
  /* z-index: 2; */
}

.room-card-item:hover::after {
  content: '';
  position: absolute;
  inset: -4px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 16px;
  z-index: -1;
}

/* Responsive Design */
@media (max-width: 768px) {
  .rooms-sections-container {
    padding: 0 16px !important;
  }

  .section-title {
    font-size: 1.25rem;
  }

  .room-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }
}

@media (max-width: 480px) {
  .room-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 12px;
  }
}

/* Legacy styles for fallback */
.panel-container {
  flex-wrap: wrap;
  gap: 0.5vmin;
  width: 100%;
  height: fit-content;
  overflow: visible;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 0.5vmin;
}

.panel {
  background-color: var(--card-background);
  border: solid var(--border-width) var(--card-border);
  box-shadow: var(--shadow-medium);
  display: inline-block;
  height: 200px;
  margin: 0.5vmin;
  overflow: visible;
  position: relative;
  flex: 1 1 auto;
  transition: all 0.3s ease;
}

.panel:hover {
  background-color: var(--card-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-heavy);
}

div#default_avatar_character_12345 .avatar-image {
  z-index: 1000 !important;
  width: 200px !important;
  height: 500px !important;
}

.panelcolor {
  width: 300px;
  /* Adjust size as needed */
  height: 400px;
  /* Adjust size as needed */
  background-image:
    /* linear-gradient(to bottom, rgba(250, 250, 248, 0.9), rgba(230, 192, 70, 0)), */
    url("../assets/Screenshot 2024-07-04 at 22.05.41.png");
  background-size: cover, cover;
  background-repeat: no-repeat, no-repeat;
  position: relative;
  overflow: hidden;
}

.themed-card {
  background-color: var(--card-background) !important;
  color: var(--text-primary) !important;
  border: 1px solid var(--card-border) !important;
}

.themed-card .v-card-title {
  color: var(--text-primary) !important;
}

.themed-card .v-card-text {
  color: var(--text-secondary) !important;
}

.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  /* background-color: #333; */
  color: #fff;
  padding: 10px;
  text-align: center;
}

/* Authentication and Profile Styles */
.auth-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.login-btn {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  font-weight: 500 !important;
  text-transform: none !important;
  border-radius: 20px !important;
  padding: 0 16px !important;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  color: white !important;
  border: none !important;
  transition: all 0.3s ease !important;
}

.login-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.profile-section {
  display: flex;
  align-items: center;
}

.profile-menu-btn {
  transition: transform 0.2s ease;
}

.profile-menu-btn:hover {
  transform: scale(1.05);
}

.profile-avatar {
  border: 2px solid rgba(255, 255, 255, 0.2);
  transition: border-color 0.2s ease;
}

.profile-avatar:hover {
  border-color: rgba(255, 255, 255, 0.5);
}

.profile-dropdown {
  min-width: 200px;
  border-radius: 12px !important;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
  background: var(--card-background) !important;
  z-index: 99999 !important;
}

/* Ensure Vuetify menu has proper z-index */
.v-menu__content {
  z-index: 99999 !important;
}

.profile-dropdown .v-list-item {
  border-radius: 8px;
  margin: 4px 8px;
  transition: all 0.2s ease;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.profile-dropdown .v-list-item:hover {
  background: var(--card-hover) !important;
  transform: translateX(4px);
}

.profile-dropdown .v-list-item-icon {
  margin-right: 12px !important;
}

.logout-item:hover {
  background: rgba(244, 67, 54, 0.1) !important;
}

.auth-dialog {
  border-radius: 16px !important;
  background: var(--card-background) !important;
  color: var(--text-primary) !important;
}

.auth-dialog .v-card-title {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.auth-dialog .v-card-text p {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: var(--text-secondary);
  line-height: 1.5;
}

.footer-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.footer-copyright {
  font-size: 14px;
}

.footer-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  align-items: center;
}

.footer-link {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 13px;
  transition: color 0.2s;
}

.footer-link:hover {
  color: var(--primary-color);
  text-decoration: underline;
}

.footer-separator {
  color: var(--text-secondary);
  font-size: 13px;
}

@media (max-width: 768px) {
  .footer-links {
    flex-direction: column;
    gap: 4px;
  }

  .footer-separator {
    display: none;
  }
}
</style>
