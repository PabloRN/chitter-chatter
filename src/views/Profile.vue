<template>
  <div class="profile-page">
    <!-- Top Navigation -->
    <v-app-bar dense elevation="4" rounded shaped>
      <v-btn icon @click="goBack" class="back-btn">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <v-toolbar-title class="profile-toolbar-title">
        Profile
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn v-if="!isEditing" @click="isEditing = !isEditing" class="edit-btn">
        <v-icon>mdi-pencil</v-icon>
        Edit
      </v-btn>
      <v-btn v-else @click="isEditing = !isEditing" class="edit-btn">
        <v-icon>mdi-check</v-icon>
        Save
      </v-btn>

    </v-app-bar>

    <div class="profile-container">
      <!-- Profile Header -->
      <v-card class="profile-header themed-card" elevation="4">
        <div class="profile-header-content">
          <!-- Avatar Section -->
          <div class="avatar-section">
            <v-avatar size="120" class="profile-avatar-large">
              <v-img v-if="mainAvatar || getCurrentUser?.personalAvatar || getCurrentUser?.miniAvatar"
                :src="mainAvatar || getCurrentUser.personalAvatar || getCurrentUser.miniAvatar" />
              <v-icon v-else size="60">mdi-account-circle</v-icon>
            </v-avatar>
            <v-btn v-if="isEditing" fab small class="avatar-edit-btn" @click="changeAvatar">
              <v-icon>mdi-camera</v-icon>
            </v-btn>
            <!-- Hidden file input -->
            <input ref="fileInputAvatar" type="file" accept="image/*" style="display: none"
              @change="onAvatarFileChange" />
          </div>

          <!-- User Info -->
          <div class="user-info">
            <div class="user-name-section">
              <h1 v-if="!isEditing" class="user-name">
                {{ getCurrentUser?.nickname || 'Anonymous User' }}
              </h1>
              <v-text-field v-else v-model="editedUser.nickname" label="Display Name" class="edit-name-field" outlined
                dense />
            </div>

            <div class="user-stats">
              <div class="stat-item">
                <span class="stat-number">{{ favoriteRoomsCount }}</span>
                <span class="stat-label">Favorites</span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <span class="stat-number">{{ getCurrentUser?.level || 'L1' }}</span>
                <span class="stat-label">Level</span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <span class="stat-number">{{ joinedDate }}</span>
                <span class="stat-label">Joined</span>
              </div>
            </div>

            <div class="user-status">
              <v-chip :color="getCurrentUser?.onlineState ? 'success' : 'grey'" small class="status-chip">
                <v-icon small class="mr-1">
                  {{ getCurrentUser?.onlineState ? 'mdi-circle' : 'mdi-circle-outline' }}
                </v-icon>
                {{ getCurrentUser?.onlineState ? 'Online' : 'Offline' }}
              </v-chip>
            </div>
          </div>
        </div>
      </v-card>

      <!-- Profile Content -->
      <div class="profile-content">
        <!-- About Section -->
        <v-card class="profile-section themed-card" elevation="2">
          <v-card-title class="section-title">
            <v-icon class="mr-2">mdi-account-details</v-icon>
            About
          </v-card-title>
          <v-card-text>
            <div class="info-row">
              <span class="info-label">User ID:</span>
              <span class="info-value">{{ getCurrentUser?.userId?.substring(0, 8) }}...</span>
            </div>
            <div class="info-row">
              <span class="info-label">Account Type:</span>
              <span class="info-value">
                {{ getCurrentUser?.isAnonymous ? 'Guest' : 'Registered' }}
              </span>
            </div>
            <div class="info-row">
              <span class="info-label">Age:</span>
              <div v-if="!isEditing" class="info-value">
                {{ getCurrentUser?.age || 'Not specified' }}
              </div>
              <v-text-field v-else v-model="editedUser.age" label="Age" type="number" class="edit-field" outlined
                dense />
            </div>
          </v-card-text>
        </v-card>

        <!-- Preferences Section -->
        <v-card class="profile-section themed-card" elevation="2">
          <v-card-title class="section-title">
            <v-icon class="mr-2">mdi-cog</v-icon>
            Preferences
          </v-card-title>
          <v-card-text>
            <div class="preference-item">
              <div class="preference-info">
                <h4>Notifications</h4>
                <p>Receive notifications for room activities</p>
              </div>
              <v-switch v-model="preferences.notifications" :disabled="!isEditing" color="primary" />
            </div>

            <div class="preference-item">
              <div class="preference-info">
                <h4>Auto-join favorite rooms</h4>
                <p>Automatically join your favorite rooms when available</p>
              </div>
              <v-switch v-model="preferences.autoJoinFavorites" :disabled="!isEditing" color="primary" />
            </div>
          </v-card-text>
        </v-card>

        <!-- My Rooms Section -->
        <ProfileRooms />

        <!-- Actions Section -->
        <v-card v-if="!getCurrentUser?.isAnonymous" class="profile-section themed-card" elevation="2">
          <v-card-title class="section-title">
            <v-icon class="mr-2">mdi-shield-account</v-icon>
            Account Actions
          </v-card-title>
          <v-card-text>
            <!-- <div class="linked-accounts">
              <template v-for="provider in availableProviders" :key="provider.id">
                <v-btn small outlined :color="linkedProviders.includes(provider.id) ? 'success' : 'primary'"
                  class="mr-2 mb-2" :disabled="linkedProviders.includes(provider.id) && linkedProviders.length === 1"
                  @click="linkedProviders.includes(provider.id) ? unlinkAccount(provider.id) : linkAccount(provider.id)">
                  <v-icon class="mr-2">{{ provider.icon }}</v-icon>
                  {{ provider.name }}
                  <v-icon v-if="linkedProviders.includes(provider.id)" class="ml-1">mdi-check</v-icon>
                </v-btn>
              </template>
</div> -->
            <!-- <small v-if="linkedProviders.length === 1 && getCurrentUser?.providerData?.length === 1"
              class="text-caption">
              You must keep at least one linked account
            </small> -->
            <v-btn outlined color="primary" class="action-btn" @click="exportData">
              <v-icon class="mr-2">mdi-download</v-icon>
              Export My Data
            </v-btn>

            <v-btn outlined color="error" class="action-btn ml-2" @click="showDeleteDialog = true">
              <v-icon class="mr-2">mdi-delete</v-icon>
              Delete Account
            </v-btn>
          </v-card-text>
        </v-card>
      </div>
    </div>

    <!-- Delete Account Confirmation -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title class="error--text">
          Delete Account
        </v-card-title>
        <v-card-text>
          Are you sure you want to delete your account? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showDeleteDialog = false">Cancel</v-btn>
          <v-btn color="error" @click="deleteAccount">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-snackbar v-model="showSuccess" color="success" timeout="3000">
      {{ successMessage }}
    </v-snackbar>

    <v-snackbar v-model="showError" color="error" timeout="5000">
      {{ errorMessage }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import useUserStore from '@/stores/user'
import ProfileRooms from '@/components/ProfileRooms.vue'
import { GoogleAuthProvider, EmailAuthProvider, linkWithPopup, unlink } from 'firebase/auth'
import { resizeImage, createPreviewURL } from '@/utils/imageUtils'

const availableProviders = [
  { id: 'google.com', name: 'Google', icon: 'mdi-google', provider: new GoogleAuthProvider() },
  { id: 'yahoo.com', name: 'Yahoo', icon: 'mdi-yahoo', provider: null }, // placeholder, implement OAuth if you have it
  { id: 'github.com', name: 'GitHub', icon: 'mdi-github', provider: null }, // same
]

const router = useRouter()
const userStore = useUserStore()

// state
const isEditing = ref(false)
const showDeleteDialog = ref(false)
const editedUser = ref({
  nickname: '',
  age: null,
})
const preferences = ref({
  notifications: true,
  autoJoinFavorites: false,
})
const mainAvatar = ref(null)
const pendingAvatar = ref(null)
const fileInputAvatar = ref(null)
const showSuccess = ref(false)
const showError = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

// computed
const getCurrentUser = computed(() => userStore.getCurrentUser)
const favoriteRoomsCount = computed(() => getCurrentUser.value?.favoriteRooms?.length || 0)
const joinedDate = computed(() => 'Dec 2024') // TODO: fetch from user data
const linkedProviders = computed(() => userStore.linkedProviders)


// redirect if not authenticated
onMounted(() => {
  if (getCurrentUser.value?.isAnonymous) {
    router.push({ name: 'rooms' })
  }
})

// watchers
watch(isEditing, async (newVal) => {
  if (newVal === false) {
    editedUser.value.nickname = getCurrentUser.value?.nickname || ''
    editedUser.value.age = getCurrentUser.value?.age || null
  } else {
    await saveProfile()
  }
})

// methods

const linkAccount = async (providerId) => {
  try {
    const auth = userStore.getAuthInstance()
    const providerObj = availableProviders.find(p => p.id === providerId)?.provider
    if (!providerObj) throw new Error('Provider not configured')

    const result = await linkWithPopup(auth.currentUser, providerObj)
    console.log('Linked successfully:', result)
    userStore.refreshCurrentUser()
  } catch (error) {
    console.error('Failed to link provider:', error)
  }
}

// Unlink provider
const unlinkAccount = async (providerId) => {
  try {
    const auth = userStore.getAuthInstance()
    if (linkedProviders.value.length <= 1) {
      console.warn('Cannot unlink the last provider')
      return
    }
    await unlink(auth.currentUser, providerId)
    console.log('Unlinked provider:', providerId)
    userStore.refreshCurrentUser()
  } catch (error) {
    console.error('Failed to unlink provider:', error)
  }
}
const goBack = () => router.go(-1)

const saveProfile = async () => {
  try {
    if (editedUser.value.nickname !== getCurrentUser.value?.nickname) {
      await userStore.updateUserNickName(editedUser.value.nickname)
    }
    // upload avatar if pending
    if (pendingAvatar.value) {
      userStore.uploadUserPersonalAvatar(pendingAvatar.value.file)
      pendingAvatar.value = null
    }
    // TODO: update other fields like age
    console.log('Profile updated successfully')
  } catch (error) {
    console.error('Error updating profile:', error)
  }
}

const changeAvatar = () => {
  fileInputAvatar.value?.click()
}

const onAvatarFileChange = async (fileOrEvent) => {
  let file = fileOrEvent?.target?.files?.[0] || fileOrEvent[0] || fileOrEvent
  if (!file) return

  if (!file.type.startsWith('image/')) {
    showError.value = true
    errorMessage.value = 'Please select a valid image file'
    return
  }
  if (file.size > 0.2 * 1024 * 1024) {
    showError.value = true
    errorMessage.value = 'Image file is too large'
    return
  }

  try {
    const resizedBlob = await resizeImage(file, 50, 50, true)
    const previewUrl = createPreviewURL(resizedBlob)

    pendingAvatar.value = {
      file: new File([resizedBlob], `avatar_${Date.now()}.png`, { type: 'image/png' }),
      previewUrl
    }
    mainAvatar.value = previewUrl

    if (fileInputAvatar.value) fileInputAvatar.value.value = ''

    showSuccess.value = true
    successMessage.value = 'Avatar ready. Will upload on save.'
  } catch (err) {
    console.error('Error processing image:', err)
    showError.value = true
    errorMessage.value = 'Failed to process image'
  }
}

const exportData = () => {
  console.log('Export data clicked')
}

const deleteAccount = async () => {
  try {
    console.log('Delete account clicked')
    showDeleteDialog.value = false
  } catch (error) {
    console.error('Error deleting account:', error)
  }
}
</script>
<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.profile-page {
  min-height: 100vh;
  background: var(--background-primary);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.profile-toolbar-title {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  font-weight: 600 !important;
}

.back-btn,
.edit-btn {
  color: var(--text-primary) !important;
}

.profile-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

/* Profile Header */
.profile-header {
  margin-bottom: 20px;
  border-radius: 16px !important;
  overflow: visible;
}

.profile-header-content {
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 24px;
}

.avatar-section {
  position: relative;
  flex-shrink: 0;
}

.profile-avatar-large {
  border: 4px solid var(--card-border);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.avatar-edit-btn {
  position: absolute;
  bottom: 0;
  right: 0px;
  background: var(--primary) !important;
  color: white !important;
  height: 100%;
  width: 100%;
  border-radius: 50%;

  .mdi-camera::before {
    content: "\F0100";
    font-size: 34px;
    text-shadow: 3px 3px 6px black;
  }
}

.user-info {
  flex: 1;
}

.user-name {
  color: var(--text-primary);
  margin: 0 0 16px 0;
  font-weight: 600;
  font-size: 2rem;
}

.edit-name-field {
  margin-bottom: 16px;
}

.user-stats {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.stat-label {
  display: block;
  font-size: 0.875rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: var(--card-border);
}

.status-chip {
  font-weight: 500;
}

/* Profile Content */
.profile-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.profile-section {
  border-radius: 12px !important;
}

.section-title {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  font-weight: 600 !important;
  color: var(--text-primary) !important;
  font-size: 1.1rem !important;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--card-border);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 500;
  color: var(--text-secondary);
}

.info-value {
  color: var(--text-primary);
  font-weight: 500;
}

.edit-field {
  max-width: 120px;
  margin-left: auto;
}

/* Preferences */
.preference-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid var(--card-border);
}

.preference-item:last-child {
  border-bottom: none;
}

.preference-info h4 {
  margin: 0 0 4px 0;
  font-weight: 500;
  color: var(--text-primary);
}

.preference-info p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.action-btn {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  text-transform: none !important;
  border-radius: 8px !important;
  margin-bottom: 8px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .profile-container {
    padding: 16px;
  }

  .profile-header-content {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }

  .user-stats {
    justify-content: center;
  }

  .action-btn {
    width: 100%;
    margin-left: 0 !important;
    margin-bottom: 8px;
  }
}

/* Themed card overrides */
.themed-card {
  background-color: var(--card-background) !important;
  color: var(--text-primary) !important;
  border: 1px solid var(--card-border) !important;
}

.linked-accounts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

/* Buttons for providers */
.linked-accounts .v-btn {
  border-radius: 9999px;
  /* pill shape */
  text-transform: none;
  font-weight: 500;
  letter-spacing: 0.3px;
  transition: all 0.2s ease;
  min-width: 120px;
  justify-content: flex-start;
  /* keep icon + text aligned */
  padding: 0.4rem 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* Hover effect */
.linked-accounts .v-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
}

/* Active (already linked) */
.linked-accounts .v-btn.success {
  background: linear-gradient(135deg, #4caf50, #43a047);
  color: white !important;
  border: none;
}

/* Unlinked (available to connect) */
.linked-accounts .v-btn.primary {
  background: linear-gradient(135deg, #2196f3, #1976d2);
  color: white !important;
  border: none;
}

/* Disabled state */
.linked-accounts .v-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
</style>
