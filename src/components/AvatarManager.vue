<template>
  <div class="avatar-manager">
    <div class="text-subtitle-1 font-weight-medium mb-2">Room Avatars</div>
    <p class="text-caption mb-4">
      Upload avatars that users can choose from in this room. Mini versions will be auto-cropped from the head area.
    </p>

    <!-- Upload Section -->
    <v-card class="upload-section mb-4" outlined>
      <v-card-title class="text-h6">Add New Avatar</v-card-title>
      <v-card-text>
        <v-file-input v-model="avatarFile" accept="image/*" label="Upload Avatar Image"
          hint="Recommended: 220x80px. Mini avatar will be auto-cropped from top portion." persistent-hint outlined
          dense show-size prepend-icon="mdi-account" @change="onAvatarFileChange" />

        <!-- Preview Section -->
        <v-row v-if="currentPreview" class="mt-4">
          <!-- Main Avatar Preview -->
          <v-col cols="12" md="6">
            <div class="text-subtitle-2 font-weight-medium mb-2">Full Avatar Preview</div>
            <div class="preview-container">
              <v-img :src="currentPreview.mainUrl" max-height="120" max-width="120" class="avatar-preview mx-auto"
                contain />
            </div>
          </v-col>

          <!-- Mini Avatar Preview -->
          <v-col cols="12" md="6">
            <div class="text-subtitle-2 font-weight-medium mb-2">Auto-Cropped Mini Avatar</div>
            <div class="preview-container">
              <v-avatar size="60" class="mx-auto d-block">
                <v-img :src="currentPreview.miniUrl" />
              </v-avatar>
            </div>
          </v-col>
        </v-row>

        <!-- Add Button -->
        <div class="text-center mt-4">
          <v-btn v-if="canAdd" color="primary" @click="addAvatarToList">
            <v-icon left>mdi-plus</v-icon>
            Add to Room
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- Current Avatars Grid -->
    <v-card v-if="roomAvatars.length > 0" outlined>
      <v-card-title class="text-h6">Current Room Avatars</v-card-title>
      <v-card-text>
        <div class="avatars-grid">
          <div v-for="(avatar, index) in roomAvatars" :key="avatar.name || index" class="avatar-item"
            :class="{ 'default-avatar': avatar.isDefault }">
            <!-- Main Avatar Display -->
            <div class="avatar-display">
              <v-img :src="avatar.mainUrl || avatar.url || avatar.avatarURL" max-height="100" max-width="100"
                class="main-avatar" contain />

              <!-- Default Badge -->
              <v-chip v-if="avatar.isDefault" small color="success" class="default-badge">
                <v-icon small left>mdi-star</v-icon>
                Default
              </v-chip>

              <!-- Action Buttons Overlay -->
              <div class="avatar-actions">
                <v-btn v-if="!avatar.isDefault" x-small color="success" fab class="action-btn"
                  @click="setAsDefault(index)">
                  <v-icon>mdi-star</v-icon>
                </v-btn>
                <v-btn x-small color="error" fab class="action-btn" @click="deleteAvatar(index)">
                  <v-icon>mdi-delete</v-icon>
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
            </div>
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
      </v-card-text>
    </v-card>

    <!-- Empty State -->
    <v-card v-else class="text-center py-8" outlined>
      <v-icon size="64" color="grey">mdi-account-plus</v-icon>
      <h3 class="mt-2">No Avatars Yet</h3>
      <p class="text-body-2 mt-2">
        Upload your first avatar to get started
      </p>
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
const avatarFile = ref(null)
const currentPreview = ref(null)
const roomAvatars = ref([])
const showSuccess = ref(false)
const showError = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const previewUrls = ref([]) // Keep track of preview URLs for cleanup

// Computed
const canAdd = computed(() => {
  return avatarFile.value && currentPreview.value
})

const hasDefaultAvatar = computed(() => {
  return roomAvatars.value.some(avatar => avatar.isDefault)
})

// Methods
const onAvatarFileChange = async (fileOrEvent) => {
  // Clear previous preview
  if (currentPreview.value) {
    revokePreviewURL(currentPreview.value.mainUrl)
    revokePreviewURL(currentPreview.value.miniUrl)
    currentPreview.value = null
  }

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

  console.log('File received:', file, 'Type:', typeof file, 'Constructor:', file.constructor.name)

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
    console.log('Processing image file:', file.name, file.type, file.size)
    console.log('Original filename will be ignored, using generated names')

    // Resize main avatar (maintain aspect ratio)
    console.log('Resizing main avatar...')
    const resizedMainBlob = await resizeImage(file, 256, 256, true)
    console.log('Main blob created:', resizedMainBlob)

    const mainUrl = createPreviewURL(resizedMainBlob)
    console.log('Main URL created:', mainUrl)

    // Auto-crop mini avatar from top portion
    console.log('Cropping mini avatar...')
    const miniBlob = await cropToMiniAvatar(file, 0.35) // Top 35% of image
    console.log('Mini blob created:', miniBlob)

    const miniUrl = createPreviewURL(miniBlob)
    console.log('Mini URL created:', miniUrl)

    currentPreview.value = {
      mainFile: new File([resizedMainBlob], `temp_main_${Date.now()}.png`, { type: 'image/png' }),
      miniFile: new File([miniBlob], `temp_mini_${Date.now()}.png`, { type: 'image/png' }),
      mainUrl,
      miniUrl
    }

    // Track URLs for cleanup
    previewUrls.value.push(mainUrl, miniUrl)
    console.log('Preview created successfully')

  } catch (error) {
    console.error('Error processing image:', error)
    showError.value = true
    errorMessage.value = `Failed to process image: ${error.message}`
  }
}

const addAvatarToList = () => {
  if (!currentPreview.value) return

  const avatarIndex = roomAvatars.value.length
  const avatarName = `avatar_${avatarIndex + 1}`

  // Add to avatars list (stored in memory until room save)
  const newAvatar = {
    name: avatarName,
    mainFile: currentPreview.value.mainFile,
    miniFile: currentPreview.value.miniFile,
    mainUrl: currentPreview.value.mainUrl,
    miniUrl: currentPreview.value.miniUrl,
    isDefault: avatarIndex === 0, // First avatar becomes default
    isPreview: true // Flag to indicate this is not yet uploaded
  }

  roomAvatars.value.push(newAvatar)

  // Emit update
  emit('update:modelValue', roomAvatars.value)

  // Clear form (but don't revoke URLs since they're now used by the avatar list)
  avatarFile.value = null
  currentPreview.value = null

  showSuccess.value = true
  successMessage.value = 'Avatar added! Will be uploaded when room is saved.'
}

// Upload all avatars to storage (called from room save)
const uploadAllAvatars = async (roomId) => {
  if (!roomAvatars.value.length) return []

  try {
    const avatarFiles = roomAvatars.value.map(avatar => ({
      mainFile: avatar.mainFile,
      miniFile: avatar.miniFile
    }))

    return await roomsStore.uploadRoomAvatars(roomId, avatarFiles)
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

  if (currentPreview.value) {
    revokePreviewURL(currentPreview.value.mainUrl)
    revokePreviewURL(currentPreview.value.miniUrl)
  }
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
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