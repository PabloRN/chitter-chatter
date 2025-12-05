<template>
  <v-hover v-slot="{ isHovering, props: hoverProps }">
    <div
      v-bind="hoverProps"
      class="notification-item"
      :class="{
        'notification-unread': !notification.read,
        'notification-read': notification.read,
        'notification-hover': isHovering,
      }"
      @click="handleClick"
    >
      <!-- Left Section: Icon -->
      <div class="notification-icon-wrapper">
        <v-avatar :color="notificationColor" size="40">
          <v-icon :color="iconColor">{{ notificationIcon }}</v-icon>
        </v-avatar>
        <!-- Priority Indicator -->
        <v-chip
          v-if="notification.priority === 'urgent' || notification.priority === 'high'"
          size="x-small"
          :color="notification.priority === 'urgent' ? 'error' : 'warning'"
          class="priority-chip"
        >
          {{ notification.priority }}
        </v-chip>
      </div>

      <!-- Middle Section: Content -->
      <div class="notification-content">
        <div class="notification-title">
          {{ notification.title }}
          <v-chip
            v-if="!notification.read"
            size="x-small"
            color="primary"
            class="ml-2 unread-chip"
          >
            NEW
          </v-chip>
        </div>
        <div class="notification-message">
          {{ notification.message }}
        </div>
        <div class="notification-time">
          <v-icon size="x-small" class="mr-1">mdi-clock-outline</v-icon>
          {{ formattedTime }}
        </div>
      </div>

      <!-- Right Section: Actions -->
      <div class="notification-actions">
        <v-menu>
          <template v-slot:activator="{ props: menuProps }">
            <v-btn
              icon
              size="x-small"
              variant="text"
              v-bind="menuProps"
              @click.stop
            >
              <v-icon>mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
          <v-list density="compact">
            <v-list-item
              v-if="!notification.read"
              @click.stop="$emit('mark-as-read')"
            >
              <template #prepend>
                <v-icon size="small">mdi-check</v-icon>
              </template>
              <v-list-item-title>Mark as read</v-list-item-title>
            </v-list-item>
            <v-list-item @click.stop="$emit('delete')">
              <template #prepend>
                <v-icon size="small" color="error">mdi-delete</v-icon>
              </template>
              <v-list-item-title class="text-error">Delete</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </div>
  </v-hover>
</template>

<script setup>
import { computed } from 'vue';
import { formatDistanceToNow } from 'date-fns';

// Props
const props = defineProps({
  notification: {
    type: Object,
    required: true,
  },
});

// Emits
defineEmits(['click', 'mark-as-read', 'delete']);

// Computed
const notificationIcon = computed(() => {
  const iconMap = {
    friend_request: 'mdi-account-plus',
    friend_accepted: 'mdi-account-check',
    friend_online: 'mdi-account-circle',
    room_invite: 'mdi-message-text',
    system: 'mdi-information',
    subscription: 'mdi-diamond-stone',
    achievement: 'mdi-trophy',
  };
  return iconMap[props.notification.type] || 'mdi-bell';
});

const notificationColor = computed(() => {
  const colorMap = {
    friend_request: 'blue-lighten-4',
    friend_accepted: 'green-lighten-4',
    friend_online: 'green-lighten-4',
    room_invite: 'purple-lighten-4',
    system: 'grey-lighten-3',
    subscription: 'purple-lighten-4',
    achievement: 'amber-lighten-4',
  };
  return colorMap[props.notification.type] || 'grey-lighten-3';
});

const iconColor = computed(() => {
  const colorMap = {
    friend_request: 'blue-darken-2',
    friend_accepted: 'green-darken-2',
    friend_online: 'green-darken-2',
    room_invite: 'purple-darken-2',
    system: 'grey-darken-2',
    subscription: 'purple-darken-2',
    achievement: 'amber-darken-2',
  };
  return colorMap[props.notification.type] || 'grey-darken-2';
});

const formattedTime = computed(() => {
  try {
    return formatDistanceToNow(props.notification.createdAt, { addSuffix: true });
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Recently';
  }
});

// Methods
const handleClick = () => {
  // Emit click event which parent will handle
  // Parent will mark as clicked and navigate if needed
  props.$emit('click');
};
</script>

<style scoped>
.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: background-color 0.2s ease;
  position: relative;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-unread {
  background-color: rgba(103, 126, 234, 0.05);
}

.notification-read {
  background-color: white;
  opacity: 0.85;
}

.notification-hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.notification-icon-wrapper {
  position: relative;
  margin-right: 12px;
  flex-shrink: 0;
}

.priority-chip {
  position: absolute;
  top: -4px;
  right: -4px;
  text-transform: uppercase;
  font-weight: bold;
  font-size: 8px;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-weight: 600;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.87);
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  line-height: 1.4;
}

.notification-message {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.6);
  margin-bottom: 6px;
  line-height: 1.4;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.notification-time {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
}

.notification-actions {
  margin-left: 8px;
  flex-shrink: 0;
}

.unread-chip {
  font-weight: bold;
  font-size: 9px;
  height: 18px !important;
  padding: 0 6px !important;
}

/* Animation for new notifications */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.notification-item {
  animation: slideIn 0.3s ease-out;
}

/* Mobile responsiveness */
@media (max-width: 600px) {
  .notification-item {
    padding: 10px 12px;
  }

  .notification-title {
    font-size: 13px;
  }

  .notification-message {
    font-size: 12px;
  }

  .notification-icon-wrapper {
    margin-right: 10px;
  }
}
</style>
