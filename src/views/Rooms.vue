<!-- eslint-disable max-len -->
<template>
  <div class="home">
    <v-app-bar dense elevation="4" rounded shaped>
      <v-toolbar-title style="display: flex; justify-content: flex-start">
        <v-img src="/logotype_landing_page.png" class="my-3" contain width="6em" height="35"
          style="background-position: left!important;" />
      </v-toolbar-title>

      <v-spacer></v-spacer>

      <!-- Authentication buttons for non-authenticated users -->
      <div v-if="!isUserAuthenticated" class="auth-buttons">
        <v-btn text class="login-btn" @click="showAuthDialog = true">
          Login / Sign Up
        </v-btn>
      </div>

      <!-- Profile menu for authenticated users -->
      <div v-else class="profile-section">
        <v-menu offset-y z-index="99999">
          <template v-slot:activator="{ props }">
            <v-btn icon v-bind="props" class="profile-menu-btn">
              <v-avatar size="32" class="profile-avatar">
                <v-img v-if="getCurrentUser?.avatar || getCurrentUser?.miniAvatar"
                  :src="getCurrentUser?.miniAvatar || getCurrentUser?.avatar" />
                <v-icon v-else>mdi-account-circle</v-icon>
              </v-avatar>
            </v-btn>
          </template>

          <v-list class="profile-dropdown">
            <v-list-item @click="goToProfile">
              <v-list-item-icon>
                <v-icon>mdi-account</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>Profile</v-list-item-title>
              </v-list-item-content>
            </v-list-item>

            <v-list-item @click="goToNotifications">
              <v-list-item-icon>
                <v-icon>mdi-bell</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>Notifications</v-list-item-title>
              </v-list-item-content>
            </v-list-item>

            <v-list-item @click="goToFavorites">
              <v-list-item-icon>
                <v-icon>mdi-heart</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>Favorites</v-list-item-title>
              </v-list-item-content>
            </v-list-item>

            <v-divider></v-divider>

            <v-list-item @click="logout" class="logout-item">
              <v-list-item-icon>
                <v-icon color="red">mdi-logout</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title class="red--text">Log Out</v-list-item-title>
              </v-list-item-content>
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
          <p class="mb-4">Join our community to save favorites, get notifications, and customize your profile!</p>
          <div id="firebaseui-auth-container"></div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeAuthDialog">
            Continue as Guest
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <div class="d-flex flex-nowrap flex-direction-row pa-2">
      <div class="panel-container">
        <div class="panel" v-for="(room, key) in getAllRooms" :key="key" :style="getRandomFlexBasis()">
          <RoomThumbnail :room="room" :id="key" :key="key" />
        </div>
      </div>
      <!-- <div class="panel" style="width: 25%; height: 85vh;display: flex;justify-content: center;align-items: center">

      </div> -->
    </div>
    <div style="width: 100%;display: flex; justify-content: center;align-items: center;margin-top: 20px;">
      <v-card style="width: 40%" class="themed-card">
        <v-card-text class="text-subtitle-1" style="height: 20vh">
          <p>This is a temporary url created especially for you, our beloved early tester. Please note that it will
            expire soon.</p>
          <p>If you find this product amazing and you want to hear more from us and share your experience join us on our
            Discord channel <a href="https://discord.gg/Hspt8B2u" target="_blank">discord channel</a>. We'd love to hear
            from you! </p>
        </v-card-text>
      </v-card>
    </div>

    <v-footer padless absolute class="footer">
      <v-card flat tile width="100%" class="text-center">
        <v-divider></v-divider>
        <v-card-text>
          Copyright © {{ new Date().getFullYear() }} — <strong>toonstalk</strong>
        </v-card-text>
      </v-card>
    </v-footer>
    <v-dialog v-if="showWelcomeDialog" v-model="showWelcomeDialog" persistent width="600"
      class="pa-5 ma-5 progress-dialog">
      <v-card style="width: 100%" class="themed-card">
        <v-card-title class="text-h6">Welcome, Early Tester! </v-card-title>
        <v-card-text class="text-subtitle-1" style="height: 20vh">
          <p>Thank you for being one of the selected few to try out our beta version. Your feedback is incredibly
            valuable in helping us shape the final product.</p>
          <p>Please remember that this is a beta version, so you may encounter some bugs or incomplete features. Also is
            only working on PC and tablet. We’d love to hear your thoughts on how we can improve!</p>
        </v-card-text>
        <v-card-actions class="text-body-2 pa-2 d-flex justify-end align-end">
          <v-btn small class="px-10" color="primary darken-1" tile @click="
            showWelcomeDialog = false;
          ">
            Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
// @ is an alias to /src
import useRoomsStore from '@/stores/rooms';
import useUserStore from '@/stores/user';
import RoomThumbnail from '@/components/RoomThumbnail';

export default {
  name: 'RoomsComponent',
  components: { RoomThumbnail },
  setup() {
    const roomsStore = useRoomsStore();
    const userStore = useUserStore();

    return {
      roomsStore,
      userStore,
    };
  },
  data: () => ({
    showWelcomeDialog: false,
    showAuthDialog: false,
    usersOnline: 0,
    flexBasisValues: ['25%'],
    variant: 'absolute',
    nickname: 'ttalker',
    userId: 'default_avatar_character_12345',
    avatar: 'https://firebasestorage.googleapis.com/v0/b/chitter-chatter-f762a.appspot.com/o/rooms%2Fkimetsu_1%2Favatars%2FL1%2Ftanjiro.png?alt=media&token=ebf9e68d-c0e2-4019-a201-24e6553aad0a',
  }),
  computed: {
    getAllRooms() {
      return this.roomsStore.getAllRooms;
    },
    roomList() {
      return this.roomsStore.roomList;
    },
    usersOnlineNow() {
      return this.roomsStore.usersOnlineNow;
    },
    getCurrentUser() {
      return this.userStore.getCurrentUser;
    },
    isUserAuthenticated() {
      return this.userStore.currentUser?.userId && !this.userStore.currentUser?.isAnonymous;
    },
  },
  methods: {
    getRandomFlexBasis() {
      const randomFlexBasis = this.flexBasisValues[Math.floor(Math.random()
        * this.flexBasisValues.length)];
      return { flexBasis: randomFlexBasis };
    },
    goToProfile() {
      this.$router.push({ name: 'profile' });
    },
    goToNotifications() {
      // TODO: Implement notifications view
      console.log('Navigate to notifications');
    },
    goToFavorites() {
      // TODO: Implement favorites view
      console.log('Navigate to favorites');
    },
    async logout() {
      try {
        await this.userStore.userSignOut();
      } catch (error) {
        console.error('Logout error:', error);
      }
    },
    closeAuthDialog() {
      this.showAuthDialog = false;
    },
    checkAuthenticationStatus() {
      // Check if user just became authenticated and close dialog
      if (this.isUserAuthenticated && this.showAuthDialog) {
        this.showAuthDialog = false;
      }
    },
  },
  created() {
    this.roomsStore.getRooms();
  },
  mounted() {
    if (!localStorage.getItem('hasVisited')) {
      this.showWelcomeDialog = true;
      localStorage.setItem('hasVisited', 'true');
    }

    // Set up interval to check auth status periodically
    this.authCheckInterval = setInterval(() => {
      this.checkAuthenticationStatus();
    }, 1000);
  },
  beforeUnmount() {
    if (this.authCheckInterval) {
      clearInterval(this.authCheckInterval);
    }
  },
  watch: {
    showAuthDialog(newVal) {
      if (newVal) {
        // Initialize Firebase UI when dialog opens
        this.$nextTick(() => {
          this.userStore.setFirebaseUiInstance('rooms');
        });
      }
    },
    // Watch for authentication state changes
    'userStore.currentUser.isAnonymous': function (newVal, oldVal) {
      // Close auth dialog when user becomes authenticated
      if (oldVal === true && newVal === false) {
        this.showAuthDialog = false;
      }
    },
    // Also watch for user ID changes (from null to having a user ID)
    'userStore.currentUser.userId': function (newVal, oldVal) {
      // Close auth dialog when user gets authenticated
      if (!oldVal && newVal && !this.userStore.currentUser.isAnonymous) {
        this.showAuthDialog = false;
      }
    },
    // Watch for signin upgrade completed
    'userStore.signingInUpgraded': function (newVal) {
      if (newVal) {
        this.showAuthDialog = false;
      }
    },
  },
};
</script>
<style>
.panel-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5vmin;
  width: 100%;
  height: fit-content;
  overflow: visible;
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
</style>
