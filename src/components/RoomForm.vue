<template>
  <div class="room-form-container">
    <v-card class="room-form-card" elevation="4">
      <v-card-title class="form-title  mb-2">
        <v-icon class="mr-2">{{ isEdit ? 'mdi-pencil' : 'mdi-plus' }}</v-icon>
        {{ isEdit ? 'Edit Room' : 'Create Room' }}
      </v-card-title>

      <v-card-text>
        <v-form ref="form" v-model="formValid" @submit.prevent="handleSubmit">
          <!-- Room Name -->
          <v-text-field v-model="formData.name" :rules="nameRules" label="Room Name"
            hint="Enter a descriptive name for your room" persistent-hint outlined dense :counter="50" class="mb-4"
            required />

          <!-- Theme Selection -->
          <v-select v-model="formData.theme" :items="themeOptions" item-title="text" item-value="value" label="Theme"
            hint="Choose a theme that best describes your room" persistent-hint outlined dense class="mb-4" required />

          <!-- Description -->
          <v-textarea v-model="formData.description" :rules="descriptionRules" label="Description"
            hint="Describe what your room is about" persistent-hint outlined dense :counter="200" rows="3"
            class="mb-4" />

          <!-- Room Settings Row -->
          <v-row class="mb-4">
            <v-col cols="12" sm="6">
              <v-text-field v-model.number="formData.maxUsers" :rules="maxUsersRules" label="Max Users" type="number"
                hint="Maximum users allowed" persistent-hint outlined dense :min="2" :max="100" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model.number="formData.minAge" :rules="minAgeRules" label="Minimum Age" type="number"
                hint="Minimum age requirement" persistent-hint outlined dense :min="13" :max="99" />
            </v-col>
          </v-row>

          <!-- Private Room Toggle -->
          <v-switch v-model="formData.isPrivate" label="Private Room"
            hint="Private rooms are only visible to invited users" persistent-hint class="mb-4" />

          <!-- Background Image Upload -->
          <div class="upload-section mb-4">
            <div class="text-subtitle-2 font-weight-medium mb-2">Background Image</div>
            <v-file-input v-model="backgroundFile" accept="image/*" label="Upload Background Image"
              hint="Recommended size: 1920x1080px" persistent-hint outlined dense show-size prepend-icon="mdi-image"
              @change="onBackgroundFileChange" />

            <div v-if="backgroundPreview || formData.backgroundImage || formData.picture || formData.thumbnail"
              class="mt-3">
              <v-img :src="backgroundPreview || formData.backgroundImage || formData.picture || formData.thumbnail"
                height="200" class="background-preview" />
              <v-btn v-if="backgroundPreview" small color="error" class="mt-2" @click="removeBackgroundImage">
                Remove Image
              </v-btn>
            </div>
          </div>

          <!-- Avatar Manager Section -->
          <div class="upload-section mb-4">
            <AvatarManager ref="avatarManager" :roomId="props.roomId" v-model="formData.allowedAvatars" />
          </div>
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-4">
        <v-btn text @click="$router.go(-1)">
          Cancel
        </v-btn>
        <v-spacer />
        <v-btn color="primary" :disabled="!formValid || !hasChanges" :loading="roomsStore.roomCreationLoading"
          @click="handleSubmit">
          {{ isEdit ? 'Update Room' : 'Create Room' }}
          <v-tooltip v-if="isEdit && formValid && !hasChanges" activator="parent" location="top">
            No changes to save
          </v-tooltip>
        </v-btn>
      </v-card-actions>
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
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import useRoomsStore from '@/stores/rooms'
import useUserStore from '@/stores/user'
import { ROOM_THEMES, ROOM_CONSTRAINTS, DEFAULT_ROOM_VALUES, validateRoom } from '@/utils/roomTypes'
import AvatarManager from '@/components/AvatarManager.vue'

const props = defineProps({
  roomId: {
    type: String,
    default: null
  },
  isEdit: {
    type: Boolean,
    default: false
  }
})

const router = useRouter()
const route = useRoute()
const roomsStore = useRoomsStore()
const userStore = useUserStore()

// Form state
const formValid = ref(false)
const form = ref(null)
const avatarManager = ref(null)
const backgroundFile = ref(null)
const backgroundPreview = ref('')

// UI state
const showSuccess = ref(false)
const showError = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

// Form data
const formData = reactive({
  name: DEFAULT_ROOM_VALUES.name,
  theme: DEFAULT_ROOM_VALUES.theme,
  description: DEFAULT_ROOM_VALUES.description,
  maxUsers: DEFAULT_ROOM_VALUES.maxUsers,
  minAge: DEFAULT_ROOM_VALUES.minAge,
  isPrivate: DEFAULT_ROOM_VALUES.isPrivate,
  backgroundImage: DEFAULT_ROOM_VALUES.backgroundImage,
  allowedAvatars: [...DEFAULT_ROOM_VALUES.allowedAvatars]
})

// Original data for change detection (only for edit mode)
const originalData = ref({})

// Computed
const themeOptions = computed(() => ROOM_THEMES.map(theme => ({
  text: theme.label,
  value: theme.value
})))

const hasChanges = computed(() => {
  console.log('Checking for changes...', formData.theme)
  if (!props.isEdit) return true // For new rooms, always allow creation

  // Check for basic form field changes
  const basicFieldsChanged = (
    formData.name !== originalData.value.name ||
    formData.theme !== originalData.value.theme ||
    formData.description !== originalData.value.description ||
    formData.maxUsers !== originalData.value.maxUsers ||
    formData.minAge !== originalData.value.minAge ||
    formData.isPrivate !== originalData.value.isPrivate
  )

  // Check for background image changes
  const backgroundChanged = !!backgroundFile.value

  // Check for new avatars (avatars with isPreview: true)
  const hasNewAvatars = formData.allowedAvatars.some(avatar => avatar.isPreview)

  // Check if avatars were removed (comparing lengths)
  const avatarsRemoved = formData.allowedAvatars.filter(a => !a.isPreview).length !==
    originalData.value.allowedAvatars?.length

  // Check if default avatar changed
  const currentDefaultAvatar = formData.allowedAvatars.find(a => a.isDefault)
  const originalDefaultAvatar = originalData.value.allowedAvatars?.find(a => a.isDefault)
  const defaultAvatarChanged = currentDefaultAvatar?.name !== originalDefaultAvatar?.name

  const result = basicFieldsChanged || backgroundChanged || hasNewAvatars || avatarsRemoved || defaultAvatarChanged


  return result
})

// Validation rules
const nameRules = [
  v => !!v || 'Room name is required',
  v => (v && v.length >= ROOM_CONSTRAINTS.name.minLength) || `Name must be at least ${ROOM_CONSTRAINTS.name.minLength} characters`,
  v => (v && v.length <= ROOM_CONSTRAINTS.name.maxLength) || `Name must be less than ${ROOM_CONSTRAINTS.name.maxLength} characters`
]

const descriptionRules = [
  v => !v || v.length <= ROOM_CONSTRAINTS.description.maxLength || `Description must be less than ${ROOM_CONSTRAINTS.description.maxLength} characters`
]

const maxUsersRules = [
  v => v >= ROOM_CONSTRAINTS.maxUsers.min || `Must be at least ${ROOM_CONSTRAINTS.maxUsers.min}`,
  v => v <= ROOM_CONSTRAINTS.maxUsers.max || `Must be no more than ${ROOM_CONSTRAINTS.maxUsers.max}`
]

const minAgeRules = [
  v => v >= ROOM_CONSTRAINTS.minAge.min || `Must be at least ${ROOM_CONSTRAINTS.minAge.min}`,
  v => v <= ROOM_CONSTRAINTS.minAge.max || `Must be no more than ${ROOM_CONSTRAINTS.minAge.max}`
]

// Methods
const onBackgroundFileChange = (fileOrEvent) => {
  // Handle different ways the file can be passed (similar to AvatarManager)
  let file = fileOrEvent
  if (fileOrEvent && fileOrEvent.length) {
    // If it's a FileList, get the first file
    file = fileOrEvent[0]
  } else if (fileOrEvent && fileOrEvent.target && fileOrEvent.target.files) {
    // If it's an event object
    file = fileOrEvent.target.files[0]
  }

  if (file && file instanceof File) {
    const reader = new FileReader()
    reader.onload = (e) => {
      backgroundPreview.value = e.target.result
    }
    reader.readAsDataURL(file)
  } else {
    backgroundPreview.value = ''
  }
}

const removeBackgroundImage = () => {
  backgroundFile.value = null
  backgroundPreview.value = ''
}


const loadRoomData = async () => {
  if (!props.isEdit || !props.roomId) return

  try {
    // Ensure user is loaded first
    const currentUser = userStore.getCurrentUser
    if (!currentUser?.userId) {
      // User not loaded yet, wait a bit and try again
      setTimeout(loadRoomData, 100)
      return
    }

    let room = roomsStore.roomList[props.roomId] ||
      roomsStore.ownedRooms.find(r => r.id === props.roomId)

    // If room not found in local stores, try to fetch it
    if (!room) {
      await roomsStore.fetchOwnedRooms(currentUser.userId, true) // force refresh
      room = roomsStore.ownedRooms.find(r => r.id === props.roomId)
    }

    if (room) {
      // Store original data for change detection
      originalData.value = {
        name: room.name,
        theme: room.theme,
        description: room.description,
        maxUsers: room.maxUsers,
        minAge: room.minAge,
        isPrivate: room.isPrivate,
        backgroundImage: room.backgroundImage || room.picture || room.thumbnail,
        allowedAvatars: room.allowedAvatars || []
      }

      // Update form data
      Object.assign(formData, {
        name: room.name,
        theme: room.theme,
        description: room.description,
        maxUsers: room.maxUsers,
        minAge: room.minAge,
        isPrivate: room.isPrivate,
        backgroundImage: room.backgroundImage || room.picture || room.thumbnail,
        allowedAvatars: (room.allowedAvatars || []).map(avatar => ({
          ...avatar,
          isPreview: false // Mark existing avatars as not preview
        }))
      })

    } else {
      showError.value = true
      errorMessage.value = 'Room not found or you do not have permission to edit it'
    }
  } catch (error) {
    showError.value = true
    errorMessage.value = `Failed to load room data: ${error.message}`
  }
}

const handleSubmit = async () => {
  if (!form.value.validate()) return

  try {
    let roomData = { ...formData }
    let roomId = props.roomId


    // For new rooms, create room first to get roomId
    if (!props.isEdit) {
      const result = await roomsStore.createRoom(roomData)
      roomId = result.roomId
    }

    // Upload background image if selected
    if (backgroundFile.value) {
      const backgroundURL = await roomsStore.uploadBackgroundImage(roomId, backgroundFile.value)
      roomData.backgroundImage = backgroundURL
      // Also set picture and thumbnail for compatibility
      roomData.picture = backgroundURL
      roomData.thumbnail = backgroundURL
    }

    // Handle avatar management for rooms
    if (avatarManager.value && formData.allowedAvatars.length > 0) {
      // Check if there are any new avatars (isPreview = true)
      const hasNewAvatars = formData.allowedAvatars.some(avatar => avatar.isPreview)

      if (hasNewAvatars) {
        const uploadedAvatars = await avatarManager.value.uploadAllAvatars(roomId)

        // For edit mode, combine existing avatars with new ones
        if (props.isEdit) {
          const existingAvatars = formData.allowedAvatars.filter(avatar => !avatar.isPreview)
          roomData.allowedAvatars = [...existingAvatars, ...uploadedAvatars]
        } else {
          // For new rooms, just use the uploaded avatars
          roomData.allowedAvatars = uploadedAvatars
        }
      } else {
        // No new avatars, but check if avatars were removed or modified
        if (props.isEdit) {
          // Always send the current avatar list for edit mode to handle removals
          roomData.allowedAvatars = formData.allowedAvatars.filter(avatar => !avatar.isPreview)
        } else {
          roomData.allowedAvatars = formData.allowedAvatars
        }
      }
    } else if (props.isEdit) {
      // Handle case where all avatars might have been removed (though this should be prevented by UI)
      roomData.allowedAvatars = []
    }

    // Safety check: ensure we don't accidentally remove all avatars
    if (props.isEdit && (!roomData.allowedAvatars || roomData.allowedAvatars.length === 0)) {
      // This should not happen due to UI prevention, but if it does, preserve existing avatars
      delete roomData.allowedAvatars
    }


    if (props.isEdit) {
      await roomsStore.updateRoom(roomId, roomData)

      // Force refresh owned rooms to ensure UI is up to date
      const currentUser = userStore.getCurrentUser
      if (currentUser?.userId) {
        await roomsStore.fetchOwnedRooms(currentUser.userId, true) // force refresh
      }

      successMessage.value = 'Room updated successfully!'

      // Redirect back to profile after showing success message briefly
      setTimeout(() => {
        router.push('/profile')
      }, 1500)
    } else {
      // For new rooms, update the room data directly instead of calling updateRoom
      if (roomData.backgroundImage || roomData.allowedAvatars.length > 0) {
        await roomsStore.updateRoomAssets(roomId, roomData)
      }
      successMessage.value = 'Room created successfully!'

      // Redirect to the new room or back to profile
      setTimeout(() => {
        router.push('/profile')
      }, 1500)
    }

    showSuccess.value = true
  } catch (error) {
    console.error('Room operation failed:', error)
    showError.value = true
    errorMessage.value = `Failed to ${props.isEdit ? 'update' : 'create'} room: ${error.message}`
  }
}

// Lifecycle
onMounted(() => {
  // Check if user can create room (for create mode)
  if (!props.isEdit && !roomsStore.canCreateRoom) {
    showError.value = true
    errorMessage.value = 'You have reached your room creation limit'
    setTimeout(() => {
      router.push('/profile')
    }, 2000)
    return
  }

  loadRoomData()
})

// Watch user changes  
watch(() => userStore.getCurrentUser?.userId, (newUserId, oldUserId) => {
  if (newUserId && newUserId !== oldUserId && props.isEdit) {
    // User just loaded or changed, reload room data
    loadRoomData()
  }
})

// Watch route changes
watch(() => route.params.roomId, () => {
  if (props.isEdit && route.params.roomId) {
    loadRoomData()
  }
})
</script>

<style scoped>
.room-form-container {
  min-height: 100vh;
  background: var(--background-primary);
  padding: 20px;
}

.room-form-card {
  max-width: 800px;
  margin: 0 auto;
  border-radius: 16px !important;
  background-color: var(--card-background) !important;
  border: 1px solid var(--card-border) !important;
}

.form-title {
  font-weight: 600 !important;
  color: var(--text-primary) !important;
  border-bottom: 1px solid var(--card-border);
}

.upload-section {
  border: 1px dashed var(--card-border);
  border-radius: 8px;
  padding: 16px;
  background: rgba(var(--card-background-rgb), 0.5);
}

.background-preview {
  border-radius: 8px;
  border: 1px solid var(--card-border);
}


/* Responsive Design */
@media (max-width: 768px) {
  .room-form-container {
    padding: 16px;
  }

  .avatars-grid {
    justify-content: center;
  }
}
</style>