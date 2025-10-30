<template>
  <v-card class="profile-rooms themed-card" elevation="2">
    <v-card-title class="section-title">
      <v-icon class="mr-2">mdi-home-group</v-icon>
      My Rooms
      <v-spacer />
      <v-chip v-if="!userStore.getCurrentUser?.isAnonymous" small :color="canCreateRoom ? 'success' : 'warning'"
        text-color="white">
        {{ ownedRooms.length }}/{{ roomLimit }} rooms
      </v-chip>
    </v-card-title>

    <v-card-text>
      <!-- Anonymous User Message -->
      <div v-if="userStore.getCurrentUser?.isAnonymous" class="anonymous-message">
        <v-icon color="info" size="48" class="mb-2">mdi-account-alert</v-icon>
        <h3>Create an Account to Own Rooms</h3>
        <p class="text-body-2 mt-2">
          Register to create and manage your own chat rooms
        </p>
        <v-btn color="primary" @click="$router.push('/user/signup')">
          Sign Up
        </v-btn>
      </div>

      <!-- Registered User Content -->
      <div v-else>
        <!-- Loading State -->
        <div v-if="loading" class="text-center py-8">
          <v-progress-circular indeterminate color="primary" />
          <p class="mt-2">Loading your rooms...</p>
        </div>

        <!-- No Rooms State -->
        <div v-else-if="ownedRooms.length === 0" class="no-rooms-message">
          <v-icon color="grey" size="64" class="mb-3">mdi-home-plus</v-icon>
          <h3>No Rooms Yet</h3>
          <p class="text-body-2 mt-2 mb-4">
            Create your first room to start building your community
          </p>
          <v-btn v-if="canCreateRoom" color="primary" @click="$router.push('/profile/room/create')">
            <v-icon left>mdi-plus</v-icon>
            Create Your First Room
          </v-btn>
          <v-alert v-else color="warning" class="mt-4">
            You have reached your room creation limit
          </v-alert>
        </div>

        <!-- Rooms List -->
        <div v-else>
          <div class="rooms-grid">
            <v-card v-for="room in ownedRooms" :key="room.id" class="room-card" elevation="2"
              @click="goToRoom(room.id)">
              <!-- Room Background -->
              <div class="room-background">
                <v-img v-if="room.thumbnail || room.backgroundImage" :src="room.thumbnail || room.backgroundImage"
                  height="120" cover class="room-bg-image" />
                <div v-else class="room-bg-placeholder">
                  <v-icon size="40" color="grey">mdi-image-off</v-icon>
                </div>

                <!-- Room Status Overlay -->
                <div class="room-overlay">
                  <v-chip small :color="room.isPrivate ? 'orange' : 'green'" text-color="white">
                    {{ room.isPrivate ? 'Private' : 'Public' }}
                  </v-chip>

                </div>
              </div>

              <!-- Room Info -->
              <v-card-text class="room-info">
                <h4 class="room-name">{{ room.name }}</h4>
                <div class="room-meta">
                  <div class="d-flex align-center">
                    <v-avatar v-for="topic in room.topics" :key="topic" size="24" class="mr-1" :color="topic.color">
                      <v-icon size="16" color="white">{{ topic.icon }}</v-icon>
                    </v-avatar>
                  </div>
                  <div class="room-users">
                    <v-icon small>mdi-account-group</v-icon>
                    {{ room.maxUsers }}
                  </div>
                </div>
                <p v-if="room.description" class="room-description">
                  {{ room.description }}
                </p>
              </v-card-text>

              <!-- Room Actions -->
              <v-card-actions class="room-actions">
                <v-btn small text color="primary" @click.stop="editRoom(room.id)">
                  <v-icon left small>mdi-pencil</v-icon>
                  Edit
                </v-btn>
                <v-btn small text color="green" @click.stop="copyRoomLink(room.id)">
                  <v-icon left small>mdi-link</v-icon>
                  Share
                </v-btn>
                <v-spacer />
                <v-btn small text color="red" @click.stop="showDeleteDialog(room)">
                  <v-icon left small>mdi-delete</v-icon>
                  Delete
                </v-btn>
                <v-menu offset-y>
                  <template #activator="{ on, attrs }">
                    <v-btn icon small v-bind="attrs" v-on="on" @click.stop>
                      <v-icon>mdi-dots-vertical</v-icon>
                    </v-btn>
                  </template>
                  <v-list density="compact">
                    <v-list-item
                      @click="copyRoomLink(room.id)"
                      prepend-icon="mdi-link"
                      title="Copy Link">
                    </v-list-item>
                    <v-list-item
                      @click="showDeleteDialog(room)"
                      prepend-icon="mdi-delete"
                      title="Delete"
                      class="error--text">
                    </v-list-item>
                  </v-list>
                </v-menu>
              </v-card-actions>
            </v-card>
          </div>

          <!-- Create Room Button -->
          <div class="create-room-section">
            <v-btn v-if="canCreateRoom" color="primary" large block outlined
              @click="$router.push('/profile/room/create')">
              <v-icon left>mdi-plus</v-icon>
              Create New Room
            </v-btn>

            <!-- Room Limit Reached - Upgrade Options -->
            <v-card v-else class="upgrade-card" elevation="3">
              <v-card-title class="upgrade-header">
                <v-icon color="warning" class="mr-2">mdi-alert-circle</v-icon>
                Room Limit Reached
              </v-card-title>

              <v-card-text>
                <p class="text-body-2 mb-4">
                  You've reached your limit of {{ roomLimit }} room{{ roomLimit === 1 ? '' : 's' }}.
                  Choose an option below to create more rooms:
                </p>

                <div class="upgrade-options">
                  <!-- Quick Purchase Option -->
                  <v-card class="option-card one-time" elevation="2" @click="handleBuyRoomSlot">
                    <div class="option-badge">Quick Purchase</div>
                    <div class="option-content">
                      <v-icon size="40" color="success" class="mb-2">mdi-home-plus</v-icon>
                      <h3 class="option-title">Buy 1 Extra Room</h3>
                      <div class="price">
                        <span class="price-amount">${{ subscriptionService.ROOM_SLOT_PRICE }}</span>
                        <span class="price-period">one-time</span>
                      </div>
                      <p class="option-description">
                        Perfect if you just need one more room
                      </p>
                      <v-btn
                        color="success"
                        block
                        :loading="purchasingRoomSlot"
                        class="mt-3"
                      >
                        <v-icon left>mdi-cart</v-icon>
                        Purchase Now
                      </v-btn>
                    </div>
                  </v-card>

                  <!-- Subscription Options -->
                  <v-card
                    v-if="userTier === 'free'"
                    class="option-card subscription"
                    elevation="2"
                    @click="goToPricing"
                  >
                    <div class="option-badge popular">Most Popular</div>
                    <div class="option-content">
                      <v-icon size="40" class="mb-2" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                        mdi-crown
                      </v-icon>
                      <h3 class="option-title">Upgrade to Landlord</h3>
                      <div class="price">
                        <span class="price-amount">$9.99</span>
                        <span class="price-period">/month</span>
                      </div>
                      <ul class="feature-list">
                        <li><v-icon small color="success">mdi-check</v-icon> Up to 10 rooms</li>
                        <li><v-icon small color="success">mdi-check</v-icon> Custom backgrounds</li>
                        <li><v-icon small color="success">mdi-check</v-icon> Moderation tools</li>
                        <li><v-icon small color="success">mdi-check</v-icon> No ads</li>
                      </ul>
                      <v-btn
                        color="primary"
                        block
                        class="mt-3 gradient-btn"
                      >
                        <v-icon left>mdi-diamond-stone</v-icon>
                        View Plans
                      </v-btn>
                    </div>
                  </v-card>

                  <v-card
                    v-else-if="userTier === 'landlord'"
                    class="option-card subscription"
                    elevation="2"
                    @click="goToPricing"
                  >
                    <div class="option-badge premium">Premium</div>
                    <div class="option-content">
                      <v-icon size="40" class="mb-2" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                        mdi-star
                      </v-icon>
                      <h3 class="option-title">Upgrade to Creator</h3>
                      <div class="price">
                        <span class="price-amount">$29.99</span>
                        <span class="price-period">/month</span>
                      </div>
                      <ul class="feature-list">
                        <li><v-icon small color="success">mdi-check</v-icon> Unlimited rooms</li>
                        <li><v-icon small color="success">mdi-check</v-icon> Custom branding</li>
                        <li><v-icon small color="success">mdi-check</v-icon> API access</li>
                        <li><v-icon small color="success">mdi-check</v-icon> Revenue sharing</li>
                      </ul>
                      <v-btn
                        color="primary"
                        block
                        class="mt-3 gradient-btn"
                      >
                        <v-icon left>mdi-diamond-stone</v-icon>
                        View Plans
                      </v-btn>
                    </div>
                  </v-card>
                </div>
              </v-card-text>
            </v-card>
          </div>
        </div>
      </div>
    </v-card-text>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="error--text">
          Delete Room
        </v-card-title>
        <v-card-text>
          Are you sure you want to delete "<strong>{{ roomToDelete?.name }}</strong>"?
          <br><br>
          This action cannot be undone and will:
          <ul class="mt-2">
            <li>Remove all messages</li>
            <li>Disconnect all users</li>
            <li>Delete all custom avatars</li>
          </ul>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="deleteDialog = false">
            Cancel
          </v-btn>
          <v-btn color="error" :loading="roomsStore.roomCreationLoading" @click="confirmDelete">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Success/Error Snackbars -->
    <v-snackbar v-model="showSuccess" color="success" timeout="3000">
      {{ successMessage }}
    </v-snackbar>

    <v-snackbar v-model="showError" color="error" timeout="5000">
      {{ errorMessage }}
    </v-snackbar>
  </v-card>
</template>

<script setup>
import {
  ref, computed, onMounted, watch,
} from 'vue';
import { useRouter, useRoute } from 'vue-router';
import useRoomsStore from '@/stores/rooms';
import useUserStore from '@/stores/user';
import { ROOM_TOPICS, USER_ROOM_LIMITS, calculateTotalRoomLimit } from '@/utils/roomTypes';
import subscriptionService from '@/services/subscriptionService';

const router = useRouter();
const route = useRoute();
const roomsStore = useRoomsStore();
const userStore = useUserStore();

// State
const loading = ref(false);
const deleteDialog = ref(false);
const roomToDelete = ref(null);
const showSuccess = ref(false);
const showError = ref(false);
const successMessage = ref('');
const errorMessage = ref('');
const purchasingRoomSlot = ref(false);

// Computed
const ownedRooms = computed(() => roomsStore.getOwnedRooms);
const canCreateRoom = computed(() => roomsStore.canCreateRoom);
const roomLimit = computed(() => {
  const currentUser = userStore.getCurrentUser;
  return calculateTotalRoomLimit(currentUser);
});

// Check user's subscription tier to show appropriate upgrade options
const userTier = computed(() => {
  const currentUser = userStore.getCurrentUser;
  return currentUser?.subscriptionTier || 'free';
});


// Methods
const loadOwnedRooms = async (forceRefresh = false) => {
  const currentUser = userStore.getCurrentUser;
  if (!currentUser?.userId || currentUser.isAnonymous) {
    // Clear owned rooms if user is not eligible or not loaded yet
    roomsStore.clearOwnedRooms();
    return;
  }

  loading.value = true;
  try {
    await roomsStore.fetchOwnedRooms(currentUser.userId, forceRefresh);
  } catch (error) {
    showError.value = true;
    errorMessage.value = `Failed to load rooms: ${error.message}`;
  } finally {
    loading.value = false;
  }
};

const goToRoom = (roomId) => {
  router.push(`/rooms/${roomId}`);
};

const editRoom = (roomId) => {
  router.push(`/profile/room/${roomId}/edit`);
};


const formatDate = (dateString) => {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const copyRoomLink = async (roomId) => {
  try {
    const url = `${window.location.origin}/rooms/${roomId}`;
    await navigator.clipboard.writeText(url);
    showSuccess.value = true;
    successMessage.value = 'Room link copied to clipboard!';
  } catch (error) {
    showError.value = true;
    errorMessage.value = 'Failed to copy link';
  }
};

const showDeleteDialog = (room) => {
  roomToDelete.value = room;
  deleteDialog.value = true;
};

const confirmDelete = async () => {
  if (!roomToDelete.value) return;

  try {
    await roomsStore.deleteRoom(roomToDelete.value.id);
    showSuccess.value = true;
    successMessage.value = 'Room deleted successfully';
    deleteDialog.value = false;
    roomToDelete.value = null;
  } catch (error) {
    showError.value = true;
    errorMessage.value = `Failed to delete room: ${error.message}`;
  }
};

const handleBuyRoomSlot = async () => {
  purchasingRoomSlot.value = true;
  try {
    const currentUser = userStore.getCurrentUser;
    const checkoutUrl = await subscriptionService.purchaseRoomSlot(currentUser.userId);
    // Redirect to Stripe Checkout
    window.location.href = checkoutUrl;
  } catch (error) {
    showError.value = true;
    errorMessage.value = `Failed to start purchase: ${error.message}`;
    purchasingRoomSlot.value = false;
  }
};

const goToPricing = () => {
  router.push('/pricing');
};

// Watchers
watch(() => userStore.getCurrentUser?.userId, (newUserId, oldUserId) => {
  if (newUserId !== oldUserId) {
    loadOwnedRooms();
  }
});

// Watch for route changes and refresh when coming back to profile
watch(() => route.path, (newPath, oldPath) => {
  // If we're navigating to the profile page from a room edit page, refresh
  if (newPath === '/profile' && oldPath?.includes('/profile/room/') && oldPath?.includes('/edit')) {
    console.log('🏠 Returning from room edit - refreshing owned rooms...');
    loadOwnedRooms(true); // force refresh
  }
});

// Lifecycle
onMounted(() => {
  loadOwnedRooms();
});
</script>

<style scoped>
.profile-rooms {
  border-radius: 12px !important;

  .section-title {
    display: flex;
    margin-bottom: 20px;
  }
}

.section-title {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  font-weight: 600 !important;
  color: var(--text-primary) !important;
  font-size: 1.1rem !important;
  border-bottom: 1px solid var(--card-border);
}

.anonymous-message,
.no-rooms-message {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);
}

.anonymous-message h3,
.no-rooms-message h3 {
  color: var(--text-primary);
  margin: 8px 0;
}

.rooms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.room-card {
  border-radius: 12px !important;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  background-color: var(--card-background) !important;
  border: 1px solid var(--card-border) !important;
}

.room-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12) !important;
}

.room-background {
  position: relative;
  height: 120px;
}

.room-bg-image {
  width: 100%;
  height: 100%;
}

.room-bg-placeholder {
  width: 100%;
  height: 100%;
  background: var(--card-background);
  display: flex;
  align-items: center;
  justify-content: center;
}

.room-overlay {
  position: absolute;
  top: 8px;
  right: 8px;
  left: 8px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  .v-chip {
    background-color: white;
    opacity: 0.9;
  }
}

.room-users {
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 4px;
}

.room-info {
  padding: 16px !important;
}

.room-name {
  color: var(--text-primary);
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 1.1rem;
}

.room-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.theme-chip {
  background: var(--primary-light) !important;
  color: var(--primary) !important;
}

.room-age {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.room-description {
  color: var(--text-secondary);
  font-size: 0.875rem;
  line-height: 1.4;
  margin: 0;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.room-actions {
  border-top: 1px solid var(--card-border);
  padding: 8px 16px !important;
}

.create-room-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--card-border);
}

/* Upgrade Card Styles */
.upgrade-card {
  border-radius: 12px !important;
  background-color: var(--card-background) !important;
  border: 1px solid var(--card-border) !important;
}

.upgrade-header {
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: 1px solid var(--card-border);
}

.upgrade-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.option-card {
  position: relative;
  border-radius: 12px !important;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: var(--card-background) !important;
  border: 2px solid var(--card-border) !important;
}

.option-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
}

.option-card.one-time:hover {
  border-color: #4caf50 !important;
}

.option-card.subscription:hover {
  border-color: #667eea !important;
}

.option-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #2196f3;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  z-index: 1;
}

.option-badge.popular {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.option-badge.premium {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.option-content {
  padding: 24px;
  text-align: center;
}

.option-title {
  color: var(--text-primary);
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 8px;
}

.price {
  margin: 16px 0;
}

.price-amount {
  color: var(--text-primary);
  font-size: 2rem;
  font-weight: 700;
}

.price-period {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-left: 4px;
}

.option-description {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin: 12px 0;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 16px 0;
  text-align: left;
}

.feature-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  color: var(--text-primary);
  font-size: 0.875rem;
}

.gradient-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  color: white !important;
}

/* Responsive Design */
@media (max-width: 768px) {
  .rooms-grid {
    grid-template-columns: 1fr;
  }

  .room-overlay {
    top: 4px;
    right: 4px;
    left: 4px;
  }

  .upgrade-options {
    grid-template-columns: 1fr;
  }

  .option-card {
    margin-bottom: 12px;
  }
}

/* Themed card overrides */
.themed-card {
  background-color: var(--card-background) !important;
  color: var(--text-primary) !important;
  border: 1px solid var(--card-border) !important;
}
</style>
