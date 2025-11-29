<template>
  <v-dialog v-model="dialogVisible" max-width="600" scrollable>
    <v-card>
      <!-- Header -->
      <v-card-title class="d-flex align-center justify-space-between friend-requests-header">
        <div class="d-flex align-center">
          <v-icon left class="mr-2">mdi-account-plus</v-icon>
          <span class="text-h6">Friend Requests</span>
          <v-chip
            v-if="friendRequests.length > 0"
            size="small"
            color="primary"
            class="ml-2"
          >
            {{ friendRequests.length }}
          </v-chip>
        </div>
        <v-btn icon size="small" @click="closeDialog">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider></v-divider>

      <!-- Content -->
      <v-card-text class="pa-0" style="max-height: 500px">
        <!-- Empty State -->
        <div v-if="friendRequests.length === 0" class="empty-state py-8">
          <v-icon size="64" color="grey-lighten-1">mdi-account-multiple-outline</v-icon>
          <p class="mt-4 text-body-1 text-grey">No pending friend requests</p>
          <p class="text-body-2 text-grey-lighten-1">New requests will appear here</p>
        </div>

        <!-- Friend Requests List -->
        <v-list v-else>
          <v-list-item
            v-for="request in friendRequests"
            :key="request.id"
            class="friend-request-item"
          >
            <!-- Avatar -->
            <template #prepend>
              <v-avatar size="48">
                <v-img v-if="request.fromUserAvatar" :src="request.fromUserAvatar" />
                <v-icon v-else>mdi-account-circle</v-icon>
              </v-avatar>
            </template>

            <!-- Content -->
            <v-list-item-title class="friend-request-name">
              {{ request.fromUserNickname || 'Unknown User' }}
            </v-list-item-title>
            <v-list-item-subtitle class="friend-request-time">
              <v-icon size="x-small" class="mr-1">mdi-clock-outline</v-icon>
              {{ formatTime(request.createdAt) }}
            </v-list-item-subtitle>

            <!-- Actions -->
            <template #append>
              <div class="friend-request-actions">
                <v-btn
                  icon="mdi-check"
                  size="small"
                  color="success"
                  variant="tonal"
                  @click="handleAccept(request.id)"
                  :loading="processingRequest === request.id"
                  :disabled="processingRequest !== null"
                >
                  <v-icon>mdi-check</v-icon>
                  <v-tooltip activator="parent" location="top">Accept</v-tooltip>
                </v-btn>
                <v-btn
                  icon="mdi-close"
                  size="small"
                  color="error"
                  variant="tonal"
                  @click="handleDecline(request.id)"
                  :loading="decliningRequest === request.id"
                  :disabled="processingRequest !== null"
                  class="ml-2"
                >
                  <v-icon>mdi-close</v-icon>
                  <v-tooltip activator="parent" location="top">Decline</v-tooltip>
                </v-btn>
              </div>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>

      <v-divider></v-divider>

      <!-- Footer -->
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="closeDialog">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { formatDistanceToNow } from 'date-fns';
import useUserStore from '@/stores/user';

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits(['update:modelValue']);

// Store
const userStore = useUserStore();
const { friendRequestsList } = storeToRefs(userStore);

// Local state
const processingRequest = ref(null);
const decliningRequest = ref(null);

// Computed
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const friendRequests = computed(() => friendRequestsList.value || []);

// Methods
const formatTime = (timestamp) => {
  try {
    return formatDistanceToNow(timestamp, { addSuffix: true });
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Recently';
  }
};

const handleAccept = async (requestId) => {
  try {
    processingRequest.value = requestId;
    await userStore.acceptFriendRequest(requestId);
  } catch (error) {
    console.error('Error accepting friend request:', error);
  } finally {
    processingRequest.value = null;
  }
};

const handleDecline = async (requestId) => {
  try {
    decliningRequest.value = requestId;
    processingRequest.value = requestId;
    await userStore.declineFriendRequest(requestId);
  } catch (error) {
    console.error('Error declining friend request:', error);
  } finally {
    decliningRequest.value = null;
    processingRequest.value = null;
  }
};

const closeDialog = () => {
  dialogVisible.value = false;
};
</script>

<style scoped>
.friend-requests-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.friend-requests-header .v-icon {
  color: white;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.friend-request-item {
  padding: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.friend-request-item:last-child {
  border-bottom: none;
}

.friend-request-name {
  font-weight: 600;
  font-size: 16px;
  color: rgba(0, 0, 0, 0.87);
  margin-bottom: 4px;
}

.friend-request-time {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
}

.friend-request-actions {
  display: flex;
  gap: 8px;
}

/* Animation for request items */
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

.friend-request-item {
  animation: slideIn 0.3s ease-out;
}

/* Mobile responsiveness */
@media (max-width: 600px) {
  .friend-request-item {
    padding: 12px;
  }

  .friend-request-name {
    font-size: 14px;
  }

  .friend-request-time {
    font-size: 12px;
  }
}
</style>
