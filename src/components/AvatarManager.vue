<template>
  <div class="avatar-manager">
    <div class="text-subtitle-1 font-weight-medium mb-2">Room Avatars</div>
    <p class="text-caption mb-4">
      Upload custom avatars or select from preloaded collection. Mini versions will be auto-cropped from the head area.
    </p>

    <!-- Avatars Grid with Add Button -->
    <v-card outlined>
      <v-tabs v-model="activeTab" grow>
        <v-tab>
          Manage Avatars
          <v-chip size="x-small" :color="isAtAvatarLimit ? 'warning' : 'primary'" class="ml-2">
            {{ currentAvatarCount }}/{{ avatarLimit }}
          </v-chip>
        </v-tab>
        <v-tab>Add from Collection</v-tab>
      </v-tabs>

      <v-card-text>
        <v-tabs-window v-model="activeTab">
          <!-- Tab 1: Manage Avatars -->
          <v-tabs-window-item>
            <div class="avatars-grid">
              <!-- Existing Avatars -->
              <div v-for="(avatar, index) in roomAvatars" :key="avatar.name || index" class="avatar-item"
                :class="{ 'default-avatar': avatar.isDefault, 'pending-avatar': avatar.isPreview }">
                <!-- Main Avatar Display -->
                <div class="avatar-display">
                  <v-img :src="avatar.mainUrl || avatar.url || avatar.avatarURL" max-height="100" max-width="100"
                    class="main-avatar" fill />

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

                <small v-if="avatar.isPreview" class="pending-text">After room updated</small>

              </div>

              <!-- Add Avatar Card -->
              <div class="avatar-item add-avatar-card"
                @click="canUpload && !isAtAvatarLimit ? triggerFileUpload() : null"
                :class="{ disabled: !canUpload || isAtAvatarLimit }">
                <div class="add-avatar-content">
                  <v-icon size="48" :color="(canUpload && !isAtAvatarLimit) ? 'primary' : 'grey'" class="mb-2">
                    {{ (!canUpload || isAtAvatarLimit) ? 'mdi-lock' : 'mdi-plus' }}
                  </v-icon>
                  <div class="add-avatar-text">
                    {{ isAtAvatarLimit ? 'Limit Reached' : 'Upload' }}
                  </div>
                  <v-tooltip v-if="!canUpload" activator="parent" location="bottom">
                    Create custom avatars with Owner tier ($2.99 one-time) - Bring your characters to life!
                  </v-tooltip>
                  <v-tooltip v-else-if="isAtAvatarLimit" activator="parent" location="bottom">
                    You've reached your avatar limit ({{ currentAvatarCount }}/{{ avatarLimit }}). Upgrade for more!
                  </v-tooltip>
                </div>

                <!-- Hidden file input -->
                <input ref="fileInput" type="file" accept="image/*" style="display: none"
                  @change="onAvatarFileChange" />
              </div>
            </div>

            <!-- Upgrade Card for Custom Avatar Upload -->
            <v-alert v-if="!canUpload" type="info" variant="tonal" prominent class="mt-4">
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="text-h6 mb-1">Create Custom Avatars</div>
                  <div class="text-body-2">Upgrade to Owner tier to upload custom avatars and bring your characters to
                    life!</div>
                </div>
                <v-btn color="primary" variant="elevated" to="/pricing" size="large">
                  Upgrade ($2.99)
                </v-btn>
              </div>
            </v-alert>

            <!-- Avatar Limit Warning -->
            <v-alert v-if="isAtAvatarLimit && canUpload" type="warning" variant="tonal" class="mt-4">
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="text-subtitle-2 mb-1">
                    Avatar Limit Reached ({{ currentAvatarCount }}/{{ avatarLimit }})
                  </div>
                  <div class="text-body-2">
                    <template v-if="!userStore.isCreatorUser">
                      Upgrade your tier to add more avatars and expand your creative options!
                    </template>
                    <template v-else>
                      You've reached the maximum avatar limit for Creator tier.
                    </template>
                  </div>
                </div>
                <v-btn v-if="!userStore.isCreatorUser" color="primary" variant="elevated" to="/pricing" size="large">
                  View Plans
                </v-btn>
              </div>
            </v-alert>

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
          </v-tabs-window-item>

          <!-- Tab 2: Add from Collection -->
          <v-tabs-window-item>
            <div v-if="loadingPreloaded" class="text-center py-8">
              <v-progress-circular indeterminate color="primary" />
              <p class="mt-2">Loading preloaded avatars...</p>
            </div>

            <div v-else-if="preloadedAvatars.length === 0" class="text-center py-8">
              <v-icon size="64" color="grey">mdi-account-off</v-icon>
              <p class="mt-2 text-caption">No preloaded avatars available yet</p>
            </div>

            <div v-else class="avatars-grid">
              <div v-for="avatar in preloadedAvatars" :key="avatar.id" class="avatar-item selectable"
                :class="{ 'already-added': isPreloadedAlreadyAdded(avatar.id) }" @click="addPreloadedAvatar(avatar)">
                <!-- Main Avatar Display -->
                <div class="avatar-display">
                  <v-img :src="avatar.originalPath" height="100" class="main-avatar" />

                  <!-- Already Added Badge -->
                  <v-chip v-if="isPreloadedAlreadyAdded(avatar.id)" small color="info" class="added-badge">
                    <v-icon small left>mdi-check</v-icon>
                    Added
                  </v-chip>

                  <!-- Add Button Overlay -->
                  <div v-if="!isPreloadedAlreadyAdded(avatar.id)" class="add-button-overlay">
                    <v-btn color="primary" fab small>
                      <v-icon>mdi-plus</v-icon>
                    </v-btn>
                  </div>
                </div>

                <!-- Mini Avatar Display -->
                <div class="mini-avatar-section">
                  <v-avatar size="40" class="mini-avatar">
                    <v-img :src="avatar.miniPath" />
                  </v-avatar>
                </div>
              </div>
            </div>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card-text>
    </v-card>

    <!-- Floating Ready Button (for preloaded avatar selection) -->
    <v-fab v-if="showReadyButton" app location="bottom end" color="primary" size="large" @click="onReadyClick">
      <v-icon start>mdi-check</v-icon>
      Done Selecting ({{ preloadedAvatarsSelected }})
    </v-fab>

    <!-- Success/Error Snackbars -->
    <v-snackbar v-model="showSuccess" color="success" timeout="3000">
      {{ successMessage }}
    </v-snackbar>

    <v-snackbar v-model="showError" color="red" timeout="5000">
      {{ errorMessage }}
    </v-snackbar>

    <v-snackbar v-model="showWarning" color="orange" timeout="5000">
      {{ warningMessage }}
    </v-snackbar>
  </div>
</template>

<script setup>
import {
  ref, computed, watch, onMounted, onUnmounted,
} from 'vue';
import useRoomsStore from '@/stores/rooms';
import useUserStore from '@/stores/user';
import {
  cropHeadMiniAvatar, resizeCharacterAvatar, createPreviewURL, revokePreviewURL,
} from '@/utils/imageUtils';
import { getAvatarLimit } from '@/constants/avatarLimits';

const props = defineProps({
  roomId: {
    type: String,
    default: null,
  },
  modelValue: {
    type: Array,
    default: () => [],
  },
  canUpload: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const roomsStore = useRoomsStore();
const userStore = useUserStore();

// State
const activeTab = ref(1);
const fileInput = ref(null);
const roomAvatars = ref([]);
const preloadedAvatars = ref([]);
const loadingPreloaded = ref(false);
const showSuccess = ref(false);
const showError = ref(false);
const showWarning = ref(false);
const successMessage = ref('');
const errorMessage = ref('');
const warningMessage = ref('');
const previewUrls = ref([]); // Keep track of preview URLs for cleanup

// Computed

const hasDefaultAvatar = computed(() => roomAvatars.value.some((avatar) => avatar.isDefault));

const canDeleteAvatar = computed(() => roomAvatars.value.length > 1);

// Count avatars added from preloaded collection (pending saves)
const preloadedAvatarsSelected = computed(() => roomAvatars.value.filter((a) => a.isPreview && a.type === 'preloaded').length);

// Show Ready button when on preloaded tab and avatars are selected
const showReadyButton = computed(() => activeTab.value === 1 && preloadedAvatarsSelected.value > 0);

// Avatar limit computeds
const avatarLimit = computed(() => {
  const user = userStore.getCurrentUser;
  return getAvatarLimit(user);
});

const currentAvatarCount = computed(() => roomAvatars.value.length);

const isAtAvatarLimit = computed(() => currentAvatarCount.value >= avatarLimit.value);

const remainingAvatars = computed(() => Math.max(0, avatarLimit.value - currentAvatarCount.value));

// Methods
const onAvatarFileChange = async (fileOrEvent) => {
  // Check avatar limit FIRST
  if (isAtAvatarLimit.value) {
    showError.value = true;
    errorMessage.value = `Avatar limit reached (${avatarLimit.value}). Upgrade your tier for more avatars!`;
    return;
  }

  // Handle different ways the file can be passed
  let file = fileOrEvent;
  if (fileOrEvent && fileOrEvent.length) {
    // If it's a FileList, get the first file
    file = fileOrEvent[0];
  } else if (fileOrEvent && fileOrEvent.target && fileOrEvent.target.files) {
    // If it's an event object
    file = fileOrEvent.target.files[0];
  }

  if (!file) return;

  // Validate file type
  if (!file.type || !file.type.startsWith('image/')) {
    showError.value = true;
    errorMessage.value = 'Please select a valid image file';
    return;
  }

  // Validate file size (max 1MB)
  if (file.size > 1 * 1024 * 1024) {
    showError.value = true;
    errorMessage.value = 'Image file is too large. Please select a file smaller than 1MB';
    return;
  }

  try {
    // Check aspect ratio before processing
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });

    const aspectRatio = img.width / img.height;
    URL.revokeObjectURL(img.src);

    // Warn if unusual ratio (< 0.3 = very tall, > 2.5 = very wide)
    if (aspectRatio < 0.3 || aspectRatio > 2.5) {
      const ratioType = aspectRatio < 0.3 ? 'tall' : 'wide';
      console.warn(`Unusual aspect ratio detected: ${aspectRatio.toFixed(2)}`);
      showWarning.value = true;
      warningMessage.value = `This avatar is very ${ratioType} (ratio: ${aspectRatio.toFixed(2)}). It will be displayed within size bounds but may not look optimal.`;
    }

    // Resize main avatar (maintain aspect ratio)
    const resizedMainBlob = await resizeCharacterAvatar(file, 80, 220, true);
    const mainUrl = createPreviewURL(resizedMainBlob);

    // Auto-crop mini avatar from top portion
    const miniBlob = await cropHeadMiniAvatar(file, 0.35); // Top 35% of image
    const miniUrl = createPreviewURL(miniBlob);

    // Add directly to the avatar list
    const avatarIndex = roomAvatars.value.length;
    const avatarName = `avatar_${avatarIndex + 1}`;

    const willBeDefault = roomAvatars.value.length === 0 || !roomAvatars.value.some((a) => a.isDefault);

    const newAvatar = {
      name: avatarName,
      mainFile: new File([resizedMainBlob], `temp_main_${Date.now()}.png`, { type: 'image/png' }),
      miniFile: new File([miniBlob], `temp_mini_${Date.now()}.png`, { type: 'image/png' }),
      mainUrl,
      miniUrl,
      isDefault: willBeDefault, // Only default if no existing default
      isPreview: true, // Flag to indicate this is not yet uploaded
    };

    roomAvatars.value.push(newAvatar);

    // Track URLs for cleanup
    previewUrls.value.push(mainUrl, miniUrl);

    // Emit update
    emit('update:modelValue', roomAvatars.value);

    // Clear file input
    if (fileInput.value) {
      fileInput.value.value = '';
    }

    showSuccess.value = true;
    successMessage.value = 'Avatar added! Will be uploaded when room is saved.';
  } catch (error) {
    console.error('Error processing image:', error);
    showError.value = true;
    errorMessage.value = `Failed to process image: ${error.message}`;
  }
};

const triggerFileUpload = () => {
  fileInput.value?.click();
};

// Upload all avatars to storage (called from room save)
const uploadAllAvatars = async (roomId) => {
  if (!roomAvatars.value.length) return [];

  try {
    // Only upload new avatars (those with isPreview: true)
    const newAvatars = roomAvatars.value.filter((avatar) => avatar.isPreview && avatar.type !== 'preloaded');
    if (newAvatars.length === 0) return [];

    const avatarFiles = newAvatars.map((avatar) => ({
      mainFile: avatar.mainFile,
      miniFile: avatar.miniFile,
      isDefault: avatar.isDefault,
    }));

    // Get existing avatar names to avoid conflicts
    const existingAvatarNames = roomAvatars.value
      .filter((avatar) => !avatar.isPreview && avatar.type !== 'preloaded')
      .map((avatar) => avatar.name);

    return await roomsStore.uploadRoomAvatars(roomId, avatarFiles, existingAvatarNames);
  } catch (error) {
    throw error;
  }
};

// Expose method for parent component to call
defineExpose({
  uploadAllAvatars,
});

const setAsDefault = (index) => {
  // Update local state
  roomAvatars.value.forEach((a) => a.isDefault = false);
  roomAvatars.value[index].isDefault = true;

  emit('update:modelValue', roomAvatars.value);

  showSuccess.value = true;
  successMessage.value = `Avatar ${index + 1} is now the default`;
};

const deleteAvatar = (index) => {
  // Prevent deletion if only one avatar remains
  if (roomAvatars.value.length <= 1) {
    showError.value = true;
    errorMessage.value = 'Cannot delete the last avatar. At least one avatar is required.';
    return;
  }

  const avatar = roomAvatars.value[index];

  // Cleanup preview URLs if they exist
  if (avatar.mainUrl) revokePreviewURL(avatar.mainUrl);
  if (avatar.miniUrl) revokePreviewURL(avatar.miniUrl);

  const wasDefault = avatar.isDefault;
  roomAvatars.value.splice(index, 1);

  // If we deleted the default avatar and there are others, make first one default
  if (wasDefault && roomAvatars.value.length > 0) {
    roomAvatars.value[0].isDefault = true;
  }

  emit('update:modelValue', roomAvatars.value);

  showSuccess.value = true;
  successMessage.value = 'Avatar removed!';
};

const loadExistingAvatars = () => {
  roomAvatars.value = [...(props.modelValue || [])];
};

const cleanupPreviewUrls = () => {
  previewUrls.value.forEach((url) => revokePreviewURL(url));
  previewUrls.value = [];
};

const loadPreloadedAvatars = async () => {
  loadingPreloaded.value = true;
  try {
    const avatars = await roomsStore.fetchPreloadedAvatars();
    preloadedAvatars.value = Object.values(avatars);
  } catch (error) {
    console.error('Error loading preloaded avatars:', error);
    showError.value = true;
    errorMessage.value = 'Failed to load preloaded avatars';
  } finally {
    loadingPreloaded.value = false;
  }
};

const isPreloadedAlreadyAdded = (preloadedId) => roomAvatars.value.some((avatar) => avatar.preloadedId === preloadedId);

const addPreloadedAvatar = (preloadedAvatar) => {
  // Check avatar limit FIRST
  if (isAtAvatarLimit.value) {
    showError.value = true;
    errorMessage.value = `Avatar limit reached (${avatarLimit.value}). Upgrade your tier for more avatars!`;
    return;
  }

  // Check if already added
  if (isPreloadedAlreadyAdded(preloadedAvatar.id)) {
    showError.value = true;
    errorMessage.value = 'This avatar is already added to your room';
    return;
  }

  const avatarIndex = roomAvatars.value.length;
  const willBeDefault = roomAvatars.value.length === 0 || !roomAvatars.value.some((a) => a.isDefault);

  const newAvatar = {
    name: preloadedAvatar.id,
    avatarURL: preloadedAvatar.originalPath,
    miniUrl: preloadedAvatar.miniPath,
    miniAvatarURL: preloadedAvatar.miniPath,
    isDefault: willBeDefault,
    type: 'preloaded',
    isPreview: true,
    preloadedId: preloadedAvatar.id, // Track which preloaded avatar this is
  };

  roomAvatars.value.push(newAvatar);
  emit('update:modelValue', roomAvatars.value);

  showSuccess.value = true;
  successMessage.value = 'Preloaded avatar added to room!';

  // Don't auto-switch - user clicks Ready button to switch
};

const onReadyClick = () => {
  // Switch to Manage Avatars tab to see the added avatars
  activeTab.value = 0;
};

// Watchers
watch(() => props.modelValue, () => {
  loadExistingAvatars();
}, { immediate: true });

// Lifecycle
onMounted(() => {
  loadExistingAvatars();
  loadPreloadedAvatars();
});

onUnmounted(() => {
  cleanupPreviewUrls();
});
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

/* Preloaded Avatar Selection */
.avatar-item.selectable {
  cursor: pointer;
}

.avatar-item.already-added {
  border-color: var(--info);
  background: rgba(var(--info-rgb), 0.1);
  opacity: 0.7;
}

.added-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  z-index: 1;
}

.add-button-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.avatar-item.selectable:hover .add-button-overlay {
  opacity: 1;
}

.avatar-item.already-added:hover {
  transform: none;
  cursor: not-allowed;
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
