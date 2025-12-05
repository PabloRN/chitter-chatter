<template>
  <v-card class="notification-panel">
    <!-- Header -->
    <v-card-title class="d-flex align-center justify-space-between pa-4 notification-header">
      <div class="d-flex align-center">
        <v-icon left class="mr-2">mdi-bell</v-icon>
        <span class="text-h6">Notifications</span>
        <v-chip v-if="unreadNotifications.length > 0" size="small" color="primary" class="ml-2">
          {{ unreadNotifications.length }}
        </v-chip>
      </div>
      <v-btn icon size="small" @click="$emit('close')">
        <v-icon color="black">mdi-close</v-icon>
      </v-btn>
    </v-card-title>

    <v-divider></v-divider>

    <!-- Actions Bar -->
    <v-card-text class="pa-2">
      <div class="d-flex justify-space-between align-center">
        <v-btn v-if="unreadNotifications.length > 0" variant="text" size="small" color="primary"
          @click="$emit('mark-all-as-read')" :disabled="loading">
          <v-icon left size="small">mdi-check-all</v-icon>
          Mark all as read
        </v-btn>
        <v-spacer></v-spacer>
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn icon size="small" v-bind="props">
              <v-icon>mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item @click="$emit('delete-all')" :disabled="notifications.length === 0">
              <template #prepend>
                <v-icon color="error">mdi-delete</v-icon>
              </template>
              <v-list-item-title>Delete all</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </v-card-text>

    <v-divider></v-divider>

    <!-- Notifications List -->
    <v-card-text class="pa-0 notification-list">
      <div v-if="loading" class="text-center py-8">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
        <p class="mt-4 text-body-2">Loading notifications...</p>
      </div>

      <div v-else-if="notifications.length === 0" class="text-center py-8">
        <v-icon size="64" color="grey-lighten-1">mdi-bell-off-outline</v-icon>
        <p class="mt-4 text-body-1 text-grey">No notifications</p>
        <p class="text-body-2 text-grey-lighten-1">You're all caught up!</p>
      </div>

      <div v-else>
        <!-- Unread Notifications -->
        <div v-if="unreadNotifications.length > 0">
          <div class="notification-section-header px-4 py-2">
            <span class="text-caption text-grey-darken-1 font-weight-bold">NEW</span>
          </div>
          <NotificationItem v-for="notification in unreadNotifications" :key="notification.id"
            :notification="notification" @click="handleNotificationClick(notification)"
            @mark-as-read="$emit('mark-as-read', notification.id)"
            @delete="$emit('delete-notification', notification.id)" />
        </div>

        <!-- Read Notifications -->
        <div v-if="readNotifications.length > 0">
          <div class="notification-section-header px-4 py-2">
            <span class="text-caption text-grey-darken-1 font-weight-bold">EARLIER</span>
          </div>
          <NotificationItem v-for="notification in readNotifications" :key="notification.id"
            :notification="notification" @click="handleNotificationClick(notification)"
            @delete="$emit('delete-notification', notification.id)" />
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from 'vue';
import NotificationItem from './NotificationItem.vue';

// Props
const props = defineProps({
  notifications: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

// Emits
defineEmits([
  'close',
  'mark-as-read',
  'mark-as-clicked',
  'mark-all-as-read',
  'delete-notification',
  'delete-all',
]);

// Computed
const unreadNotifications = computed(() => props.notifications.filter((n) => !n.read));

const readNotifications = computed(() => props.notifications.filter((n) => n.read));

// Methods
const handleNotificationClick = (notification) => {
  // Emit mark-as-clicked which will handle the read status and navigation
  props.$emit('mark-as-clicked', notification.id);
};
</script>

<style scoped>
.notification-panel {
  min-width: 400px;
  max-height: 600px;
  display: flex;
  flex-direction: column;
}

.notification-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.notification-header .v-icon {
  color: white;
}

.notification-list {
  overflow-y: auto;
  max-height: 500px;
}

.notification-section-header {
  background-color: rgba(0, 0, 0, 0.02);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

/* Custom scrollbar */
.notification-list::-webkit-scrollbar {
  width: 8px;
}

.notification-list::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.notification-list::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.notification-list::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* Mobile responsiveness */
@media (max-width: 600px) {
  .notification-panel {
    min-width: 100vw;
  }
}
</style>
