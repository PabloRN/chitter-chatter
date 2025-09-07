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
                <v-img v-if="room.backgroundImage || room.picture || room.thumbnail"
                  :src="room.backgroundImage || room.picture || room.thumbnail" height="120" cover
                  class="room-bg-image" />
                <div v-else class="room-bg-placeholder">
                  <v-icon size="40" color="grey">mdi-image-off</v-icon>
                </div>

                <!-- Room Status Overlay -->
                <div class="room-overlay">
                  <v-chip small :color="room.isPrivate ? 'orange' : 'green'" text-color="white">
                    {{ room.isPrivate ? 'Private' : 'Public' }}
                  </v-chip>
                  <div class="room-users">
                    <v-icon small>mdi-account-group</v-icon>
                    {{ room.usersOnline || 0 }}/{{ room.maxUsers }}
                  </div>
                </div>
              </div>

              <!-- Room Info -->
              <v-card-text class="room-info">
                <h4 class="room-name">{{ room.name }}</h4>
                <div class="room-meta">
                  <v-chip x-small outlined class="theme-chip">
                    {{ getThemeLabel(room.theme) }}
                  </v-chip>
                  <span class="room-age">{{ formatDate(room.createdAt) }}</span>
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
                  <v-list dense>
                    <v-list-item @click="copyRoomLink(room.id)">
                      <v-list-item-icon>
                        <v-icon small>mdi-link</v-icon>
                      </v-list-item-icon>
                      <v-list-item-content>
                        <v-list-item-title>Copy Link</v-list-item-title>
                      </v-list-item-content>
                    </v-list-item>
                    <v-list-item @click="showDeleteDialog(room)">
                      <v-list-item-icon>
                        <v-icon small color="error">mdi-delete</v-icon>
                      </v-list-item-icon>
                      <v-list-item-content>
                        <v-list-item-title class="error--text">Delete</v-list-item-title>
                      </v-list-item-content>
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
            <v-alert v-else color="info" class="mt-4">
              <div class="d-flex align-center">
                <v-icon class="mr-2">mdi-information</v-icon>
                <div>
                  <strong>Room Limit Reached</strong>
                  <br>
                  <small>Upgrade to premium to create unlimited rooms</small>
                </div>
              </div>
            </v-alert>
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import useRoomsStore from '@/stores/rooms'
import useUserStore from '@/stores/user'
import { ROOM_THEMES, USER_ROOM_LIMITS } from '@/utils/roomTypes'

const router = useRouter()
const roomsStore = useRoomsStore()
const userStore = useUserStore()

// State
const loading = ref(false)
const deleteDialog = ref(false)
const roomToDelete = ref(null)
const showSuccess = ref(false)
const showError = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

// Computed
const ownedRooms = computed(() => roomsStore.getOwnedRooms)
const canCreateRoom = computed(() => roomsStore.canCreateRoom)
const roomLimit = computed(() => {
  // TODO: Check if user is paid when payment system is implemented
  return USER_ROOM_LIMITS.free
})

// Methods
const loadOwnedRooms = async (forceRefresh = false) => {
  const currentUser = userStore.getCurrentUser
  if (!currentUser || currentUser.isAnonymous) {
    // Clear owned rooms if user is not eligible
    roomsStore.clearOwnedRooms()
    return
  }

  loading.value = true
  try {
    console.log('Loading owned rooms, forceRefresh:', forceRefresh)
    await roomsStore.fetchOwnedRooms(currentUser.userId, forceRefresh)
    console.log('Owned rooms loaded:', roomsStore.getOwnedRooms.length)
  } catch (error) {
    showError.value = true
    errorMessage.value = `Failed to load rooms: ${error.message}`
  } finally {
    loading.value = false
  }
}

const goToRoom = (roomId) => {
  router.push(`/rooms/${roomId}`)
}

const editRoom = (roomId) => {
  router.push(`/profile/room/${roomId}/edit`)
}

const getThemeLabel = (themeValue) => {
  const theme = ROOM_THEMES.find(t => t.value === themeValue)
  return theme ? theme.label : themeValue
}

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const copyRoomLink = async (roomId) => {
  try {
    const url = `${window.location.origin}/rooms/${roomId}`
    await navigator.clipboard.writeText(url)
    showSuccess.value = true
    successMessage.value = 'Room link copied to clipboard!'
  } catch (error) {
    showError.value = true
    errorMessage.value = 'Failed to copy link'
  }
}

const showDeleteDialog = (room) => {
  roomToDelete.value = room
  deleteDialog.value = true
}

const confirmDelete = async () => {
  if (!roomToDelete.value) return

  try {
    await roomsStore.deleteRoom(roomToDelete.value.id)
    showSuccess.value = true
    successMessage.value = 'Room deleted successfully'
    deleteDialog.value = false
    roomToDelete.value = null
  } catch (error) {
    showError.value = true
    errorMessage.value = `Failed to delete room: ${error.message}`
  }
}

// Watchers
watch(() => userStore.getCurrentUser?.userId, (newUserId, oldUserId) => {
  if (newUserId !== oldUserId) {
    loadOwnedRooms()
  }
})

// Lifecycle
onMounted(() => {
  loadOwnedRooms()
})
</script>

<style scoped>
.profile-rooms {
  border-radius: 12px !important;
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
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
}

/* Themed card overrides */
.themed-card {
  background-color: var(--card-background) !important;
  color: var(--text-primary) !important;
  border: 1px solid var(--card-border) !important;
}
</style>