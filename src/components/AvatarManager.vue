<template>
  <div class="avatar-manager">
    <div class="text-subtitle-1 font-weight-medium mb-2">Room Avatars</div>
    <p class="text-caption mb-4">
      Upload avatars that users can choose from in this room. Mini versions will be auto-cropped from the head area.
    </p>

    <!-- Avatars Grid with Add Button -->
    <v-card outlined>
      <v-card-title class="text-h6">
        {{ roomAvatars.length > 0 ? 'Room Avatars' : 'Add Your First Avatar' }}
      </v-card-title>
      <v-card-text>
        <div class="avatars-grid">
          <!-- Existing Avatars -->
          <div v-for="(avatar, index) in roomAvatars" :key="avatar.name || index" class="avatar-item"
            :class="{ 'default-avatar': avatar.isDefault, 'pending-avatar': avatar.isPreview }">
            <!-- Main Avatar Display -->
            <div class="avatar-display">
              <v-img :src="avatar.mainUrl || avatar.url || avatar.avatarURL" max-height="100" max-width="100"
                class="main-avatar" contain />

              <!-- Default Badge -->
              <v-chip v-if="avatar.isDefault" small color="success" class="default-badge">
                <v-icon small left>mdi-star</v-icon>
                Default
              </v-chip>

              <!-- Pending Save Badge -->
              <v-chip v-if="avatar.isPreview" small color="warning" class="pending-badge">
                <v-icon small left>mdi-content-save-alert</v-icon>
                Pending
              </v-chip>

              <!-- Action Buttons Overlay -->
              <div class="avatar-actions">
                <v-btn v-if="!avatar.isDefault" x-small color="success" fab class="action-btn"
                  @click="setAsDefault(index)">
                  <v-icon>mdi-star</v-icon>
                </v-btn>
                <v-btn x-small color="error" fab class="action-btn" :disabled="!canDeleteAvatar"
                  @click="deleteAvatar(index)">
                  <v-icon>mdi-delete</v-icon>
                  <v-tooltip v-if="!canDeleteAvatar" activator="parent" location="top">
                    At least one avatar is required
                  </v-tooltip>
                </v-btn>
              </div>
            </div>

            <!-- Mini Avatar Display -->
            <div class="mini-avatar-section">
              <v-avatar size="40" class="mini-avatar">
                <v-img :src="avatar.miniUrl || avatar.miniAvatarURL" />
              </v-avatar>
            </div>

            <!-- Avatar Name -->
            <div class="avatar-name">
              {{ avatar.name || `Avatar ${index + 1}` }}
              <small v-if="avatar.isPreview" class="pending-text">After room updated</small>
            </div>
          </div>

          <!-- Add Avatar Card -->
          <div class="avatar-item add-avatar-card" @click="triggerFileUpload">
            <div class="add-avatar-content">
              <v-icon size="48" color="primary" class="mb-2">mdi-plus</v-icon>
              <div class="add-avatar-text">Add Avatar</div>
            </div>

            <!-- Hidden file input -->
            <input ref="fileInput" type="file" accept="image/*" style="display: none" @change="onAvatarFileChange" />
          </div>
        </div>

        <!-- No Default Warning -->
        <v-alert v-if="roomAvatars.length > 0 && !hasDefaultAvatar" type="warning" class="mt-4">
          <div class="d-flex align-center">
            <v-icon class="mr-2">mdi-alert</v-icon>
            <div>
              <strong>No Default Avatar Selected</strong>
              <br>
              <small>Please select a default avatar that new users will use when entering the room.</small>
            </div>
          </div>
        </v-alert>

        <!-- Minimum Avatar Warning -->
        <v-alert v-if="roomAvatars.length === 1" type="info" class="mt-4">
          <div class="d-flex align-center">
            <v-icon class="mr-2">mdi-information</v-icon>
            <div>
              <strong>Minimum Avatar Required</strong>
              <br>
              <small>Rooms must have at least one avatar. Delete button is disabled for the last avatar.</small>
            </div>
          </div>
        </v-alert>
      </v-card-text>
    </v-card>

    <!-- Success/Error Snackbars -->
    <v-snackbar v-model="showSuccess" color="success" timeout="3000">
      {{ successMessage }}
    </v-snackbar>

    <v-snackbar v-model="showError" color="error" timeout="5000">
      {{ errorMessage }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import useRoomsStore from '@/stores/rooms'
import { cropToMiniAvatar, resizeImage, createPreviewURL, revokePreviewURL } from '@/utils/imageUtils'

const props = defineProps({
  roomId: {
    type: String,
    default: null
  },
  modelValue: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

const roomsStore = useRoomsStore()

// State
const fileInput = ref(null)
const roomAvatars = ref([])
const showSuccess = ref(false)
const showError = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const previewUrls = ref([]) // Keep track of preview URLs for cleanup

// Computed

const hasDefaultAvatar = computed(() => {
  return roomAvatars.value.some(avatar => avatar.isDefault)
})

const canDeleteAvatar = computed(() => {
  return roomAvatars.value.length > 1
})

// Methods
const onAvatarFileChange = async (fileOrEvent) => {
  // Handle different ways the file can be passed
  let file = fileOrEvent
  if (fileOrEvent && fileOrEvent.length) {
    // If it's a FileList, get the first file
    file = fileOrEvent[0]
  } else if (fileOrEvent && fileOrEvent.target && fileOrEvent.target.files) {
    // If it's an event object
    file = fileOrEvent.target.files[0]
  }

  if (!file) return

  // Validate file type
  if (!file.type || !file.type.startsWith('image/')) {
    showError.value = true
    errorMessage.value = 'Please select a valid image file'
    return
  }

  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    showError.value = true
    errorMessage.value = 'Image file is too large. Please select a file smaller than 10MB'
    return
  }

  try {
    // Resize main avatar (maintain aspect ratio)
    const resizedMainBlob = await resizeImage(file, 256, 256, true)
    const mainUrl = createPreviewURL(resizedMainBlob)

    // Auto-crop mini avatar from top portion
    const miniBlob = await cropToMiniAvatar(file, 0.35) // Top 35% of image
    const miniUrl = createPreviewURL(miniBlob)

    // Add directly to the avatar list
    const avatarIndex = roomAvatars.value.length
    const avatarName = `avatar_${avatarIndex + 1}`

    const willBeDefault = !hasDefaultAvatar.value

    const newAvatar = {
      name: avatarName,
      mainFile: new File([resizedMainBlob], `temp_main_${Date.now()}.png`, { type: 'image/png' }),
      miniFile: new File([miniBlob], `temp_mini_${Date.now()}.png`, { type: 'image/png' }),
      mainUrl,
      miniUrl,
      isDefault: willBeDefault, // Only default if no existing default
      isPreview: true // Flag to indicate this is not yet uploaded
    }

    roomAvatars.value.push(newAvatar)

    // Track URLs for cleanup
    previewUrls.value.push(mainUrl, miniUrl)

    // Emit update
    emit('update:modelValue', roomAvatars.value)

    // Clear file input
    if (fileInput.value) {
      fileInput.value.value = ''
    }

    showSuccess.value = true
    successMessage.value = 'Avatar added! Will be uploaded when room is saved.'

  } catch (error) {
    console.error('Error processing image:', error)
    showError.value = true
    errorMessage.value = `Failed to process image: ${error.message}`
  }
}


const triggerFileUpload = () => {
  fileInput.value?.click()
}


// Upload all avatars to storage (called from room save)
const uploadAllAvatars = async (roomId) => {
  if (!roomAvatars.value.length) return []

  try {
    // Only upload new avatars (those with isPreview: true)
    const newAvatars = roomAvatars.value.filter(avatar => avatar.isPreview)
    if (newAvatars.length === 0) return []

    const avatarFiles = newAvatars.map(avatar => ({
      mainFile: avatar.mainFile,
      miniFile: avatar.miniFile
    }))

    // Get existing avatar names to avoid conflicts
    const existingAvatarNames = roomAvatars.value
      .filter(avatar => !avatar.isPreview)
      .map(avatar => avatar.name)


    return await roomsStore.uploadRoomAvatars(roomId, avatarFiles, existingAvatarNames)
  } catch (error) {
    throw error
  }
}

// Expose method for parent component to call
defineExpose({
  uploadAllAvatars
})

const setAsDefault = (index) => {
  // Update local state
  roomAvatars.value.forEach(a => a.isDefault = false)
  roomAvatars.value[index].isDefault = true

  emit('update:modelValue', roomAvatars.value)

  showSuccess.value = true
  successMessage.value = `Avatar ${index + 1} is now the default`
}

const deleteAvatar = (index) => {
  // Prevent deletion if only one avatar remains
  if (roomAvatars.value.length <= 1) {
    showError.value = true
    errorMessage.value = 'Cannot delete the last avatar. At least one avatar is required.'
    return
  }

  const avatar = roomAvatars.value[index]

  // Cleanup preview URLs if they exist
  if (avatar.mainUrl) revokePreviewURL(avatar.mainUrl)
  if (avatar.miniUrl) revokePreviewURL(avatar.miniUrl)

  const wasDefault = avatar.isDefault
  roomAvatars.value.splice(index, 1)

  // If we deleted the default avatar and there are others, make first one default
  if (wasDefault && roomAvatars.value.length > 0) {
    roomAvatars.value[0].isDefault = true
  }

  emit('update:modelValue', roomAvatars.value)


  showSuccess.value = true
  successMessage.value = 'Avatar removed!'
}

const loadExistingAvatars = () => {
  roomAvatars.value = [...(props.modelValue || [])]
}

const cleanupPreviewUrls = () => {
  previewUrls.value.forEach(url => revokePreviewURL(url))
  previewUrls.value = []
}

// Watchers
watch(() => props.modelValue, () => {
  loadExistingAvatars()
}, { immediate: true })

// Lifecycle
onMounted(() => {
  loadExistingAvatars()
})

onUnmounted(() => {
  cleanupPreviewUrls()
})
</script>

<style scoped>
.avatar-manager {
  width: 100%;
}

.upload-section {
  background: rgba(var(--card-background-rgb), 0.5);
}

.avatar-preview {
  border-radius: 8px;
  border: 2px solid var(--card-border);
}

.avatars-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.avatar-item {
  position: relative;
  border: 2px solid var(--card-border);
  border-radius: 12px;
  padding: 12px;
  text-align: center;
  background: var(--card-background);
  transition: all 0.3s ease;
}

.avatar-item:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
}

.avatar-item.default-avatar {
  border-color: var(--success);
  background: rgba(var(--success-rgb), 0.1);
}

.avatar-item.pending-avatar {
  border-color: var(--warning);
  background: rgba(var(--warning-rgb), 0.1);
}

.avatar-display {
  position: relative;
  margin-bottom: 8px;
}

.main-avatar {
  border-radius: 8px;
  margin: 0 auto;
}

.default-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  z-index: 1;
}

.pending-badge {
  position: absolute;
  top: -8px;
  left: -8px;
  z-index: 1;
}

.avatar-actions {
  position: absolute;
  top: 4px;
  left: 4px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.avatar-item:hover .avatar-actions {
  opacity: 1;
}

.action-btn {
  box-shadow: var(--shadow-medium);
}

.mini-avatar-section {
  margin-bottom: 8px;
}

.mini-avatar {
  border: 2px solid var(--card-border);
}

.avatar-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  word-break: break-word;
}

.pending-text {
  display: block;
  font-size: 0.75rem;
  color: var(--warning);
  margin-top: 2px;
  font-style: italic;
}

/* Add Avatar Card */
.add-avatar-card {
  border: 2px dashed var(--card-border) !important;
  background: var(--background-secondary) !important;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.add-avatar-card:hover {
  border-color: var(--primary) !important;
  background: rgba(var(--primary-rgb), 0.05) !important;
  transform: translateY(-2px);
}

.add-avatar-content {
  text-align: center;
  color: var(--text-secondary);
  padding: 20px;
}

.add-avatar-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
}

.add-avatar-card:hover .add-avatar-content {
  color: var(--primary);
}

.add-avatar-card:hover .add-avatar-text {
  color: var(--primary);
}

/* Preview Section */
.avatar-preview-section {
  width: 100%;
}

.preview-card {
  background: rgba(var(--primary-rgb), 0.02) !important;
  border: 1px solid rgba(var(--primary-rgb), 0.1) !important;
}

/* Responsive Design */
@media (max-width: 768px) {
  .avatars-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
  }

  .avatar-actions {
    opacity: 1;
    /* Always show on mobile */
  }
}
</style>