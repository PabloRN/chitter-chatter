<template>
  <v-menu v-model="showMenu" :close-on-content-click="false" location="bottom end" offset="8" max-width="400"
    max-height="600">
    <template v-slot:activator="{ props }">
      <v-btn icon v-bind="props" class="notification-bell-btn">
        <v-badge :content="unreadCount" :model-value="unreadCount > 0" color="error" overlap>
          <v-icon :color="unreadCount > 0 ? 'primary' : ''">
            {{ unreadCount > 0 ? 'mdi-bell-ring' : 'mdi-bell-outline' }}
          </v-icon>
        </v-badge>
      </v-btn>
    </template>

    <NotificationPanel :notifications="notifications" :loading="loading" @close="showMenu = false"
      @mark-as-read="handleMarkAsRead" @mark-as-clicked="handleMarkAsClicked" @mark-all-as-read="handleMarkAllAsRead"
      @delete-notification="handleDeleteNotification" @delete-all="handleDeleteAll" />
  </v-menu>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import useNotificationsStore from '@/stores/notifications';
import useUserStore from '@/stores/user';
import useMainStore from '@/stores/main';
import NotificationPanel from './NotificationPanel.vue';

// Stores
const notificationsStore = useNotificationsStore();
const userStore = useUserStore();
const mainStore = useMainStore();

// Store refs
const { notifications, unreadCount } = storeToRefs(notificationsStore);
const { currentUser } = storeToRefs(userStore);

// Local state
const showMenu = ref(false);
const loading = ref(false);

// Computed
const userId = computed(() => currentUser.value?.userId);

// Methods
const handleMarkAsRead = async (notificationId) => {
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
};

const handleMarkAsClicked = async (notificationId) => {
  if (!userId.value) return;

  try {
    await notificationsStore.markAsClicked(userId.value, notificationId);
  } catch (error) {
    console.error('Error marking notification as clicked:', error);
    mainStore.setSnackbar({
      type: 'error',
      msg: 'Failed to mark notification as clicked',
    });
  }
};

const handleMarkAllAsRead = async () => {
  if (!userId.value) return;

  try {
    loading.value = true;
    await notificationsStore.markAllAsRead(userId.value);
    mainStore.setSnackbar({
      type: 'success',
      msg: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    mainStore.setSnackbar({
      type: 'error',
      msg: 'Failed to mark all as read',
    });
  } finally {
    loading.value = false;
  }
};

const handleDeleteNotification = async (notificationId) => {
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
};

const handleDeleteAll = async () => {
  if (!userId.value) return;

  try {
    loading.value = true;
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
    loading.value = false;
  }
};

// Lifecycle
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
</script>

<style scoped>
.notification-bell-btn {
  position: relative;
}
</style>
