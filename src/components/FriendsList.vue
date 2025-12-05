<template>
  <v-card v-if="!headless" class="friends-list-card" elevation="4">
    <!-- Header -->
    <v-card-title class="d-flex align-center justify-space-between">
      <div class="d-flex align-center">
        <v-icon left class="mr-2">mdi-account-group</v-icon>
        <span>Friends</span>
        <v-chip v-if="friends.length > 0" size="small" color="success" class="ml-2">
          {{ friends.length }}
        </v-chip>
      </div>
      <v-btn v-if="friendRequests.length > 0" variant="tonal" color="primary" size="small"
        @click="$emit('show-requests')">
        <v-badge :content="friendRequests.length" color="error" overlap>
          <v-icon left size="small">mdi-account-clock</v-icon>
        </v-badge>
        <span class="ml-2">Requests</span>
      </v-btn>
    </v-card-title>

    <v-divider></v-divider>

    <!-- Content -->
    <v-card-text class="pa-0">
      <!-- Empty State -->
      <div v-if="friends.length === 0" class="empty-state py-8">
        <v-icon size="64" color="grey-lighten-1">mdi-account-multiple-outline</v-icon>
        <p class="mt-4 text-body-1 text-grey">No friends yet</p>
        <p class="text-body-2 text-grey-lighten-1">Add friends to start connecting!</p>
      </div>

      <!-- Friends List -->
      <v-list v-else>
        <v-list-item v-for="friend in friends" :key="friend.userId" class="friend-item">
          <!-- Avatar -->
          <template #prepend>
            <v-avatar size="48">
              <v-img v-if="friend.personalAvatar" :src="friend.personalAvatar" />
              <v-icon v-else>mdi-account-circle</v-icon>
            </v-avatar>
          </template>

          <!-- Content -->
          <v-list-item-title class="friend-name">
            {{ friend.nickname || 'Unknown' }}
          </v-list-item-title>
          <v-list-item-subtitle class="friend-since">
            <v-icon size="x-small" class="mr-1">mdi-calendar</v-icon>
            Friends since {{ formatDate(friend.addedAt) }}
          </v-list-item-subtitle>

          <!-- Actions -->
          <template #append>
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn icon size="small" variant="text" v-bind="props">
                  <v-icon>mdi-dots-vertical</v-icon>
                </v-btn>
              </template>

              <v-list density="compact">
                <v-list-item @click="viewProfile(friend.userId)">
                  <template #prepend>
                    <v-icon size="small">mdi-account</v-icon>
                  </template>
                  <v-list-item-title>View Profile</v-list-item-title>
                </v-list-item>

                <v-list-item @click="sendMessage(friend.userId)">
                  <template #prepend>
                    <v-icon size="small">mdi-message</v-icon>
                  </template>
                  <v-list-item-title>Send Messages</v-list-item-title>
                </v-list-item>

                <v-list-item @click="goToRoom(friend.roomId)">
                  <template #prepend>
                    <v-icon size="small">mdi-map-marker-account</v-icon>
                  </template>
                  <v-list-item-title>Meet up</v-list-item-title>
                </v-list-item>

                <v-divider></v-divider>

                <v-list-item @click="confirmRemoveFriend(friend)">
                  <template #prepend>
                    <v-icon size="small" color="error">mdi-account-remove</v-icon>
                  </template>
                  <v-list-item-title class="text-error">Remove Friend</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </template>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>

  <!-- Headless mode: render only content -->
  <div v-else>
    <!-- Empty State -->
    <div v-if="friends.length === 0" class="empty-state py-8">
      <v-icon size="64" color="grey-lighten-1">mdi-account-multiple-outline</v-icon>
      <p class="mt-4 text-body-1 text-grey">No friends yet</p>
      <p class="text-body-2 text-grey-lighten-1">Add friends to start connecting!</p>
    </div>

    <!-- Friends List -->
    <v-list v-else>
      <v-list-item v-for="friend in friends" :key="friend.userId" class="friend-item">
        <!-- Avatar -->
        <template #prepend>
          <v-avatar size="48">
            <v-img v-if="friend.personalAvatar" :src="friend.personalAvatar" />
            <v-icon v-else>mdi-account-circle</v-icon>
          </v-avatar>
        </template>

        <!-- Content -->
        <v-list-item-title class="friend-name">
          {{ friend.nickname || 'Unknown' }}
        </v-list-item-title>
        <v-list-item-subtitle class="friend-since">
          <v-icon size="x-small" class="mr-1">mdi-calendar</v-icon>
          Friends since {{ formatDate(friend.addedAt) }}
        </v-list-item-subtitle>

        <!-- Actions -->
        <template #append>
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn icon size="small" variant="text" v-bind="props">
                <v-icon>mdi-dots-vertical</v-icon>
              </v-btn>
            </template>

            <v-list density="compact">
              <v-list-item @click="viewProfile(friend.userId)">
                <template #prepend>
                  <v-icon size="small">mdi-account</v-icon>
                </template>
                <v-list-item-title>View Profile</v-list-item-title>
              </v-list-item>

              <v-list-item @click="sendMessage(friend.userId)">
                <template #prepend>
                  <v-icon size="small">mdi-message</v-icon>
                </template>
                <v-list-item-title>Send Message</v-list-item-title>
              </v-list-item>

              <v-list-item @click="goToRoom(friend.roomId)">
                <template #prepend>
                  <v-icon size="small">mdi-map-marker-account</v-icon>
                </template>
                <v-list-item-title>Meet up</v-list-item-title>
              </v-list-item>

              <v-divider></v-divider>

              <v-list-item @click="confirmRemoveFriend(friend)">
                <template #prepend>
                  <v-icon size="small" color="error">mdi-account-remove</v-icon>
                </template>
                <v-list-item-title class="text-error">Remove Friend</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </template>
      </v-list-item>
    </v-list>
  </div>

  <!-- Remove Friend Confirmation Dialog -->
  <v-dialog v-model="showRemoveDialog" max-width="400">
    <v-card>
      <v-card-title class="text-h6">Remove Friend</v-card-title>
      <v-card-text>
        Are you sure you want to remove <strong>{{ friendToRemove?.nickname }}</strong> from your friends list?
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="showRemoveDialog = false">Cancel</v-btn>
        <v-btn color="error" variant="tonal" @click="handleRemoveFriend" :loading="removingFriend">
          Remove
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { format } from 'date-fns';
import { useRouter } from 'vue-router';
import useUserStore from '@/stores/user';
import useMainStore from '@/stores/main';

// Props
defineProps({
  headless: {
    type: Boolean,
    default: false,
  },
});

// Emits
defineEmits(['show-requests']);

// Stores
const userStore = useUserStore();
const mainStore = useMainStore();
const router = useRouter();

// Store refs
const { friendsList, friendRequestsList } = storeToRefs(userStore);

// Local state
const showRemoveDialog = ref(false);
const friendToRemove = ref(null);
const removingFriend = ref(false);

// Computed
const friends = computed(() => friendsList.value || []);
const friendRequests = computed(() => friendRequestsList.value || []);

// Methods
const formatDate = (timestamp) => {
  try {
    return format(timestamp, 'MMM d, yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Recently';
  }
};

const viewProfile = (userId) => {
  // TODO: Navigate to user profile or show profile modal
  mainStore.setSnackbar({
    type: 'info',
    msg: 'Profile view coming soon!',
  });
};

const sendMessage = (userId) => {
  // TODO: Open private message dialog
  mainStore.setSnackbar({
    type: 'info',
    msg: 'Messaging feature coming soon!',
  });
};
const goToRoom = (userId) => {
  // TODO: Open private message dialog
  mainStore.setSnackbar({
    type: 'info',
    msg: 'Messaging feature coming soon!',
  });
};

const confirmRemoveFriend = (friend) => {
  friendToRemove.value = friend;
  showRemoveDialog.value = true;
};

const handleRemoveFriend = async () => {
  if (!friendToRemove.value) return;

  try {
    removingFriend.value = true;
    await userStore.removeFriend(friendToRemove.value.userId);
    showRemoveDialog.value = false;
    friendToRemove.value = null;
  } catch (error) {
    console.error('Error removing friend:', error);
  } finally {
    removingFriend.value = false;
  }
};
</script>

<style scoped>
.friends-list-card {
  background: white;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.friend-item {
  padding: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  transition: background-color 0.2s ease;
}

.friend-item:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.friend-item:last-child {
  border-bottom: none;
}

.friend-name {
  font-weight: 600;
  font-size: 16px;
  color: rgba(0, 0, 0, 0.87);
  margin-bottom: 4px;
}

.friend-since {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
}

/* Animation for friend items */
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

.friend-item {
  animation: slideIn 0.3s ease-out;
}

/* Mobile responsiveness */
@media (max-width: 600px) {
  .friend-item {
    padding: 12px;
  }

  .friend-name {
    font-size: 14px;
  }

  .friend-since {
    font-size: 12px;
  }
}
</style>
