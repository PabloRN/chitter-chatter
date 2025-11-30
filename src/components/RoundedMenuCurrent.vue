<template>
  <div class="rounded-menu" style="text-align: center; height: 200; z-index: 1000;">
    <v-btn height="200" :class="hideMenu ? 'hidden' : 'nothidden'" class="mx-2 menu-activator" dark
      @click.prevent.stop="toggleMenu" v-touch="{
        start: () => (movingTouch = false),
        end: () => toggleMenuTouch,
        left: () => (movingTouch = true),
        down: () => (movingTouch = true),
        right: () => (movingTouch = true),
        up: () => (movingTouch = true),
        move: () => (movingTouch = true),
      }">
    </v-btn>
    <!-- Dummy buffer item to prevent accidental triggers when opening menu -->
    <v-btn :class="hideMenu ? 'hidden' : 'nothidden'" class="mx-2 menu-item" fab dark small @click.prevent.stop
      @touchstart.native.prevent>
      <div>
        <v-icon class="manga-icon" style="opacity: 0.3;"> mdi-circle-outline </v-icon>
      </div>
      <div class="icon-caption" style="opacity: 0.3;">Buffer</div>
    </v-btn>
    <v-btn :class="hideMenu ? 'hidden' : 'nothidden'" class="mx-2 menu-item" fab dark small
      @click.prevent.stop="handleEmit('showAvatarList')" @touchstart.native.prevent="handleEmit('showAvatarList')">
      <div>
        <v-icon class="manga-icon"> mdi-cards </v-icon>
      </div>
      <div class="icon-caption">Switch Avatar</div>
    </v-btn>
    <v-btn class="mx-2 menu-item" :class="hideMenu ? 'hidden' : 'nothidden'" fab dark small
      @click.prevent.stop="handleEmit('showProfile')" @touchstart.native.prevent="handleEmit('showProfile')">
      <div>
        <v-icon class="manga-icon">mdi-account-cog</v-icon>
      </div>
      <div class="icon-caption">Profile</div>

    </v-btn>
    <v-btn :class="hideMenu ? 'hidden' : 'nothidden'" class="mx-2 menu-item" fab dark small
      @click.prevent.stop="handleEmit('exitRoom')" @touchstart.native.prevent="handleEmit('exitRoom')">
      <div>
        <v-icon class="manga-icon"> mdi-door-open </v-icon>
      </div>
      <div class="icon-caption">Exit Room</div>
    </v-btn>
    <v-btn :class="hideMenu ? 'hidden' : 'nothidden'" class="mx-2 menu-item" fab dark small
      @click.prevent.stop="toggleMenu" @touchstart.native.prevent="toggleMenu" v-touch="{
        end: () => toggleMenu,
      }">
      <div>
        <v-icon class="manga-icon"> mdi-eye-off </v-icon>
      </div>
      <div class="icon-caption">Hide</div>
    </v-btn>
    <v-btn v-if="!getCurrentUser.isAnonymous" :class="hideMenu ? 'hidden' : 'nothidden'" class="mx-2 menu-item" fab dark
      small @click.prevent.stop="handleEmit('signOut')" @touchstart.native.prevent="handleEmit('signOut')" v-touch="{
        end: () => toggleMenu,
      }">
      <div>
        <v-icon class="manga-icon" :disabled="getCurrentUser.isAnonymous">
          mdi-logout-variant
        </v-icon>
      </div>
      <div class="icon-caption">Logout</div>
    </v-btn>
    <v-btn v-else :class="hideMenu ? 'hidden' : 'nothidden'" class="mx-2 menu-item" fab dark small
      @click.prevent.stop="handleEmit('showLoginDialog')" @touchstart.native.prevent="handleEmit('showLoginDialog')"
      v-touch="{
        end: () => toggleMenu,
      }">
      <div>
        <v-icon class="manga-icon">
          mdi-account-circle
        </v-icon>
      </div>
      <div class="icon-caption" :disabled="getCurrentUser.isAnonymous">Login</div>
    </v-btn>
    <v-btn :class="hideMenu ? 'hidden' : 'nothidden'" class="mx-2 menu-item" fab dark small
      @click.prevent.stop="handleEmit('showNotifications')"
      @touchstart.native.prevent="handleEmit('showNotifications')">
      <div style="position: relative;">
        <v-icon class="manga-icon"> mdi-bell </v-icon>
        <v-badge v-if="hasUnreadNotifications" dot color="error" overlap
          style="position: absolute; top: -8px; right: -8px;">
        </v-badge>
      </div>
      <div class="icon-caption">Notifications</div>
    </v-btn>
    <v-btn class="mx-2 menu-item hidden" fab dark small @click.prevent.stop="toggleMenu" v-touch="{
      start: () => (movingTouch = false),
      end: () => toggleMenuTouch,
      left: () => (movingTouch = true),
      down: () => (movingTouch = true),
      right: () => (movingTouch = true),
      up: () => (movingTouch = true),
      move: () => (movingTouch = true),
    }">
      <div>
      </div>
      <div class="icon-caption">toggle</div>
    </v-btn>
  </div>

  <!-- Notifications Panel -->
  <v-menu v-model="showNotificationsPanel" :close-on-content-click="false" location="bottom" max-width="400">
    <NotificationPanel :notifications="notifications" :loading="loadingNotifications"
      @close="showNotificationsPanel = false" @mark-as-read="handleMarkAsRead" @mark-as-clicked="handleMarkAsClicked"
      @mark-all-as-read="handleMarkAllAsRead" @delete-notification="handleDeleteNotification"
      @delete-all="handleDeleteAll" />
  </v-menu>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import useUserStore from '@/stores/user';
import useMessagesStore from '@/stores/messages';
import useNotificationsStore from '@/stores/notifications';
import useMainStore from '@/stores/main';
import NotificationPanel from '@/components/NotificationPanel.vue';

// props
const props = defineProps({
  moving: {
    type: Boolean,
    default: false,
  },
});

// emits
const emit = defineEmits(['privateMessage', 'exitRoom', 'showAvatarList', 'signOut', 'showMessages']);

// stores
const userStore = useUserStore();
const messagesStore = useMessagesStore();
const notificationsStore = useNotificationsStore();
const mainStore = useMainStore();

// Store refs
const { notifications: notificationsList, unreadCount } = storeToRefs(notificationsStore);

// reactive state
const message = ref('');
const hideMenu = ref(true);
const movingTouch = ref(false);
const showNotificationsPanel = ref(false);
const loadingNotifications = ref(false);

// computed
const getCurrentUser = computed(() => userStore.getCurrentUser);

// Notifications computed
const notifications = computed(() => notificationsList.value || []);
const hasUnreadNotifications = computed(() => unreadCount.value > 0);
const userId = computed(() => getCurrentUser.value?.userId);

// functions
const toggleMenu = () => {
  nextTick(() => {
    if (!props.moving) {
      hideMenu.value = !hideMenu.value;
    }
  });
};

const toggleMenuTouch = () => {
  nextTick(() => {
    if (!movingTouch.value) {
      hideMenu.value = !hideMenu.value;
    }
  });
};

const handleEmit = (item) => {
  if (movingTouch.value) return;

  switch (item) {
    case 'privateMessage':
      toggleMenu();
      emit('privateMessage');
      break;
    case 'exitRoom':
      toggleMenu();
      emit('exitRoom');
      break;
    case 'showAvatarList':
      toggleMenu();
      emit('showAvatarList');
      break;
    case 'signOut':
      toggleMenu();
      if (!getCurrentUser.value.isAnonymous) {
        emit('signOut');
      }
      break;
    case 'showProfile':
      toggleMenu();
      if (!getCurrentUser.value.isAnonymous) {
        emit('showProfile');
      } else {
        emit('showLoginDialog');
      }
      break;
    case 'showMessages':
      toggleMenu();
      emit('showMessages');
      break;
    case 'showNotifications':
      toggleMenu();
      if (!getCurrentUser.value?.isAnonymous) {
        showNotificationsPanel.value = true;
      } else {
        emit('showLoginDialog');
      }
      break;
    case 'showLoginDialog':
      toggleMenu();
      emit('showLoginDialog');
      break;
  }
};

// Lifecycle hooks
onMounted(() => {
  // Initialize notifications if user is logged in
  if (userId.value) {
    notificationsStore.initialize(userId.value);
  }
});

onUnmounted(() => {
  // Cleanup when component is unmounted
  if (userId.value) {
    notificationsStore.stopListening(userId.value);
  }
});

// Notification handlers
async function handleMarkAsRead(notificationId) {
  if (!userId.value) return;

  try {
    await notificationsStore.markAsRead(userId.value, notificationId);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    mainStore.setSnackbar({
      type: 'error',
      msg: 'Failed to mark notification as read',
    });
  }
}

async function handleMarkAsClicked(notificationId) {
  if (!userId.value) return;

  try {
    await notificationsStore.markAsClicked(userId.value, notificationId);
    showNotificationsPanel.value = false;
  } catch (error) {
    console.error('Error marking notification as clicked:', error);
  }
}

async function handleMarkAllAsRead() {
  if (!userId.value) return;

  try {
    loadingNotifications.value = true;
    await notificationsStore.markAllAsRead(userId.value);
    mainStore.setSnackbar({
      type: 'success',
      msg: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Error marking all as read:', error);
    mainStore.setSnackbar({
      type: 'error',
      msg: 'Failed to mark all as read',
    });
  } finally {
    loadingNotifications.value = false;
  }
}

async function handleDeleteNotification(notificationId) {
  if (!userId.value) return;

  try {
    await notificationsStore.deleteNotification(userId.value, notificationId);
    mainStore.setSnackbar({
      type: 'success',
      msg: 'Notification deleted',
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    mainStore.setSnackbar({
      type: 'error',
      msg: 'Failed to delete notification',
    });
  }
}

async function handleDeleteAll() {
  if (!userId.value) return;

  try {
    loadingNotifications.value = true;
    await notificationsStore.deleteAllNotifications(userId.value);
    mainStore.setSnackbar({
      type: 'success',
      msg: 'All notifications deleted',
    });
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    mainStore.setSnackbar({
      type: 'error',
      msg: 'Failed to delete all notifications',
    });
  } finally {
    loadingNotifications.value = false;
  }
}
</script>

<style lang="scss">
@import '@/styles/rounded-menu.scss';
</style>
