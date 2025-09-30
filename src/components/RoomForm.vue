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
          <v-text-field :disabled="originalData && originalData.name" v-model="formData.name" :rules="nameRules"
            label="Room Name"
            :hint="originalData && originalData.name ? 'Room name cannot be changed' : 'Choose wisely! Room name cannot be changed'"
            persistent-hint outlined dense :counter="50" class="mb-4" required />

          <!-- Theme Selection -->
          <v-select v-model="formData.theme" :items="themeOptions" item-title="text" item-value="value" label="Theme"
            hint="Choose a theme that best describes your room" persistent-hint outlined dense class="mb-4" required />

          <!-- Description -->
          <v-textarea v-model="formData.description" :rules="descriptionRules" label="Description"
            hint="Let people know what your room is about" persistent-hint outlined dense :counter="200" rows="3"
            class="mb-4" />

          <!-- Room Settings Row -->
          <v-row class="mb-4">
            <v-col cols="12" sm="6">
              <v-text-field v-model.number="formData.maxUsers" :rules="maxUsersRules" label="Max Users" type="number"
                hint="Maximum users allowed" persistent-hint outlined dense :min="2" :max="30" />
            </v-col>
            <v-col cols="12" sm="6">

            </v-col>
          </v-row>

          <v-switch v-model="formData.minAge" label="+18" color="primary"
            hint="Sexual content is not allowed but you may want only +18 visitors" persistent-hint class="mb-4" />
          <!-- Private Room Toggle -->
          <v-switch v-model="formData.isPrivate" label="Private Room" color="primary"
            hint="Private rooms are only visible to invited users" persistent-hint class="mb-4" />

          <!-- Background Selector -->
          <div class="upload-section mb-4">
            <BackgroundSelector v-model="selectedBackground" />
          </div>

          <!-- Avatar Manager Section -->
          <div class="upload-section mb-4">
            <AvatarManager ref="avatarManager" v-model="formData.publicAvatars" />
          </div>

          <!-- Requirements Check Alert -->
          <v-alert v-if="!hasMinimumRequirements" type="warning" prominent border="left" class="mb-4">
            <div class="text-subtitle-2 mb-2">
              <v-icon class="mr-2">mdi-alert-circle</v-icon>
              Missing Requirements to Publish Room:
            </div>
            <ul class="ml-4">
              <li v-if="!selectedBackground.value && !formData.backgroundImage">
                <strong>Room background is required</strong> - Upload or select a background image
              </li>
              <li v-if="formData.publicAvatars.length < 2">
                <strong>At least 2 avatars required</strong> (currently: {{ formData.publicAvatars.length }})
              </li>
            </ul>
          </v-alert>
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-4">
        <v-btn text @click="$router.go(-1)">
          Cancel
        </v-btn>
        <v-spacer />
        <v-btn color="primary" :disabled="!canPublishRoom || !hasChanges" :loading="roomsStore.roomCreationLoading"
          @click="handleSubmit">
          {{ isEdit ? 'Update Room' : 'Create Room' }}
          <v-tooltip v-if="isEdit && formValid && !hasChanges" activator="parent" location="top">
            No changes to save
          </v-tooltip>
          <v-tooltip v-else-if="!hasMinimumRequirements" activator="parent" location="top">
            Missing required: {{ !selectedBackground.value && !formData.backgroundImage ? 'Background' : '' }}
            {{ formData.publicAvatars.length < 2 ? ((!selectedBackground.value && !formData.backgroundImage) ? ' & ' : '') + 'At least 2 avatars' : '' }}
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
import {
  ref, reactive, computed, onMounted, watch,
} from 'vue';
import { useRouter, useRoute } from 'vue-router';
import useRoomsStore from '@/stores/rooms';
import useUserStore from '@/stores/user';
import {
  ROOM_THEMES, ROOM_CONSTRAINTS, DEFAULT_ROOM_VALUES, validateRoom,
} from '@/utils/roomTypes';
import AvatarManager from '@/components/AvatarManager.vue';
import BackgroundSelector from '@/components/BackgroundSelector.vue';

const props = defineProps({
  roomId: {
    type: String,
    default: null,
  },
  isEdit: {
    type: Boolean,
    default: false,
  },
});

const router = useRouter();
const route = useRoute();
const roomsStore = useRoomsStore();
const userStore = useUserStore();
const getPublicAvatars = () => roomsStore.getPublicAvatars;

// Form state
const formValid = ref(false);
const form = ref(null);
const avatarManager = ref(null);
const backgroundFile = ref(null);
const backgroundPreview = ref('');
const selectedBackground = ref(null);

// UI state
const showSuccess = ref(false);
const showError = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

// Form data
const formData = reactive({
  name: DEFAULT_ROOM_VALUES.name,
  theme: DEFAULT_ROOM_VALUES.theme,
  description: DEFAULT_ROOM_VALUES.description,
  maxUsers: DEFAULT_ROOM_VALUES.maxUsers,
  minAge: DEFAULT_ROOM_VALUES.minAge,
  isPrivate: DEFAULT_ROOM_VALUES.isPrivate,
  backgroundImage: DEFAULT_ROOM_VALUES.backgroundImage,
  publicAvatars: [...DEFAULT_ROOM_VALUES.publicAvatars],
});

// Original data for change detection (only for edit mode)
const originalData = ref({});

// Computed
const themeOptions = computed(() => ROOM_THEMES.map((theme) => ({
  text: theme.label,
  value: theme.value,
})));

const hasMinimumRequirements = computed(() => {
  const hasBackground = !!selectedBackground.value || !!formData.backgroundImage;
  const hasEnoughAvatars = formData.publicAvatars.length >= 2;
  return hasBackground && hasEnoughAvatars;
});

const canPublishRoom = computed(() => {
  return formValid.value && hasMinimumRequirements.value;
});

const hasChanges = computed(() => {
  if (!props.isEdit) return true; // For new rooms, always allow creation

  // Check for basic form field changes
  const basicFieldsChanged = (
    formData.name !== originalData.value.name
    || formData.theme !== originalData.value.theme
    || formData.description !== originalData.value.description
    || formData.maxUsers !== originalData.value.maxUsers
    || formData.minAge !== originalData.value.minAge
    || formData.isPrivate !== originalData.value.isPrivate
  );

  // Check for background changes
  const backgroundChanged = !!selectedBackground.value;

  // Check for avatar changes - compare current avatars with original
  const avatarsChanged = JSON.stringify(formData.publicAvatars) !== JSON.stringify(originalData.value.publicAvatars);

  return basicFieldsChanged || backgroundChanged || avatarsChanged;
});

// Validation rules
const nameRules = [
  (v) => !!v || 'Room name is required',
  (v) => (v && v.length >= ROOM_CONSTRAINTS.name.minLength) || `Name must be at least ${ROOM_CONSTRAINTS.name.minLength} characters`,
  (v) => (v && v.length <= ROOM_CONSTRAINTS.name.maxLength) || `Name must be less than ${ROOM_CONSTRAINTS.name.maxLength} characters`,
];

const descriptionRules = [
  (v) => !v || v.length <= ROOM_CONSTRAINTS.description.maxLength || `Description must be less than ${ROOM_CONSTRAINTS.description.maxLength} characters`,
];

const maxUsersRules = [
  (v) => v >= ROOM_CONSTRAINTS.maxUsers.min || `Must be at least ${ROOM_CONSTRAINTS.maxUsers.min}`,
  (v) => v <= ROOM_CONSTRAINTS.maxUsers.max || `Must be no more than ${ROOM_CONSTRAINTS.maxUsers.max}`,
];

// Methods
const loadRoomData = async () => {
  if (!props.isEdit || !props.roomId) return;

  try {
    // Ensure user is loaded first
    const currentUser = userStore.getCurrentUser;
    if (!currentUser?.userId) {
      // User not loaded yet, wait a bit and try again
      setTimeout(loadRoomData, 100);
      return;
    }

    let room = roomsStore.roomList[props.roomId]
      || roomsStore.ownedRooms.find((r) => r.id === props.roomId);

    // If room not found in local stores, try to fetch it
    if (!room) {
      await roomsStore.fetchOwnedRooms(currentUser.userId, true); // force refresh
      room = roomsStore.ownedRooms.find((r) => r.id === props.roomId);
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
        backgroundImage: room.backgroundImage || room.thumbnail,
        publicAvatars: room.publicAvatars || [],
      };

      // Update form data
      Object.assign(formData, {
        name: room.name,
        theme: room.theme,
        description: room.description,
        maxUsers: room.maxUsers,
        minAge: room.minAge,
        isPrivate: room.isPrivate,
        backgroundImage: room.backgroundImage || room.thumbnail,
        publicAvatars: (room.publicAvatars || []).map((avatar) => ({
          ...avatar,
          isPreview: false, // Mark existing avatars as not preview
        })),
      });

      // Load existing background for BackgroundSelector
      if (room.backgroundImage || room.thumbnail) {
        selectedBackground.value = {
          type: 'existing',
          url: room.backgroundImage || room.thumbnail,
          previewUrl: room.thumbnail || room.backgroundImage,
        };
      }
    } else {
      showError.value = true;
      errorMessage.value = 'Room not found or you do not have permission to edit it';
    }
  } catch (error) {
    showError.value = true;
    errorMessage.value = `Failed to load room data: ${error.message}`;
  }
};

const handleSubmit = async () => {
  if (!form.value.validate()) return;

  try {
    const roomData = { ...formData };
    let { roomId } = props;

    // For new rooms, create room first to get roomId
    if (!props.isEdit) {
      const result = await roomsStore.createRoom(roomData);
      roomId = result.roomId;
    }

    // Handle background selection
    if (selectedBackground.value) {
      if (selectedBackground.value.type === 'uploaded' && selectedBackground.value.file) {
        // Upload custom background (includes thumbnail generation)
        const { backgroundURL, thumbnailURL } = await roomsStore.uploadBackgroundImage(roomId, selectedBackground.value.file);
        roomData.backgroundImage = backgroundURL;
        roomData.thumbnail = thumbnailURL;
      } else if (selectedBackground.value.type === 'preloaded') {
        // Use preloaded background URLs directly
        roomData.backgroundImage = selectedBackground.value.url;
        roomData.thumbnail = selectedBackground.value.previewUrl || selectedBackground.value.url;
      }
    }

    // Handle avatar uploads from AvatarManager
    if (avatarManager.value && formData.publicAvatars.length > 0) {
      const uploadedAvatars = await avatarManager.value.uploadAllAvatars(roomId);

      // Merge uploaded avatars with existing/preloaded avatars
      if (uploadedAvatars && uploadedAvatars.length > 0) {
        // Replace preview avatars with uploaded ones
        formData.publicAvatars = formData.publicAvatars.map((avatar) => {
          if (avatar.isPreview) {
            // Find corresponding uploaded avatar
            const uploaded = uploadedAvatars.find((ua) => ua.isDefault === avatar.isDefault);
            return uploaded || avatar;
          }
          return avatar;
        });
      }

      roomData.publicAvatars = formData.publicAvatars;
    }

    if (props.isEdit) {
      await roomsStore.updateRoom(roomId, roomData);

      // Force refresh owned rooms to ensure UI is up to date
      const currentUser = userStore.getCurrentUser;
      if (currentUser?.userId) {
        await roomsStore.fetchOwnedRooms(currentUser.userId, true); // force refresh
      }

      successMessage.value = 'Room updated successfully!';

      // Redirect back to profile after showing success message briefly
      setTimeout(() => {
        router.push('/profile');
      }, 1500);
    } else {
      // For new rooms, update the room data directly instead of calling updateRoom
      if (roomData.backgroundImage || roomData.publicAvatars.length > 0) {
        await roomsStore.updateRoomAssets(roomId, roomData);
      }
      successMessage.value = 'Room created successfully!';

      // Redirect to the new room or back to profile
      setTimeout(() => {
        router.push('/profile');
      }, 1500);
    }

    showSuccess.value = true;
  } catch (error) {
    console.error('Room operation failed:', error);
    showError.value = true;
    errorMessage.value = `Failed to ${props.isEdit ? 'update' : 'create'} room: ${error.message}`;
  }
};

// Lifecycle
onMounted(() => {
  // Check if user can create room (for create mode)
  if (!props.isEdit && !roomsStore.canCreateRoom) {
    showError.value = true;
    errorMessage.value = 'You have reached your room creation limit';
    setTimeout(() => {
      router.push('/profile');
    }, 2000);
    return;
  }

  loadRoomData();
});

// Watch user changes
watch(() => userStore.getCurrentUser?.userId, (newUserId, oldUserId) => {
  if (newUserId && newUserId !== oldUserId && props.isEdit) {
    // User just loaded or changed, reload room data
    loadRoomData();
  }
});

// Watch route changes
watch(() => route.params.roomId, () => {
  if (props.isEdit && route.params.roomId) {
    loadRoomData();
  }
});
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
