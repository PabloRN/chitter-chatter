<template>
  <div class="room-avatar-selector">
    <div class="text-subtitle-1 font-weight-medium mb-2">Room Avatars</div>
    <p class="text-caption mb-4">
      Select or upload avatars that users can choose from in this room. Select multiple by clicking checkboxes.
    </p>

    <v-card outlined>
      <v-tabs v-model="activeTab" grow>
        <v-tab>Upload Custom</v-tab>
        <v-tab>Select Preloaded</v-tab>
      </v-tabs>

      <v-card-text>
        <v-tabs-window v-model="activeTab">
          <!-- Tab 1: Upload Custom -->
          <v-tabs-window-item>
            <div class="upload-section">
              <v-file-input v-model="uploadedFiles" accept="image/*" label="Upload Avatar Images" multiple
                hint="Select one or more avatar images. Mini versions will be auto-cropped." persistent-hint outlined
                dense show-size prepend-icon="mdi-account-multiple" @change="onFileChange" />

              <!-- Preview uploaded files -->
              <div v-if="uploadedPreviews.length > 0" class="mt-4">
                <div class="text-subtitle-2 mb-2">Uploaded Avatars:</div>
                <div class="avatars-grid">
                  <div v-for="(preview, index) in uploadedPreviews" :key="index" class="avatar-item"
                    :class="{ 'default-avatar': isDefaultAvatar(`uploaded_${index}`) }">
                    <!-- Main Avatar Display -->
                    <div class="avatar-display">
                      <v-img :src="preview.mainUrl" height="100" class="main-avatar" />

                      <!-- Default Badge -->
                      <v-chip v-if="isDefaultAvatar(`uploaded_${index}`)" small color="success" class="default-badge">
                        <v-icon small left>mdi-star</v-icon>
                        Default
                      </v-chip>

                      <!-- Action Buttons -->
                      <div class="avatar-actions">
                        <v-btn v-if="!isDefaultAvatar(`uploaded_${index}`)" x-small color="success" fab
                          class="action-btn" @click.stop="setAsDefault(`uploaded_${index}`)">
                          <v-icon>mdi-star</v-icon>
                        </v-btn>
                        <v-btn x-small icon color="error" class="action-btn" @click.stop="removeUploadedAvatar(index)">
                          <v-icon color="black">mdi-close</v-icon>
                        </v-btn>
                      </div>
                    </div>

                    <!-- Mini Avatar Display -->
                    <div class="mini-avatar-section">
                      <v-avatar size="40" class="mini-avatar">
                        <v-img :src="preview.miniUrl" />
                      </v-avatar>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </v-tabs-window-item>

          <!-- Tab 2: Select Preloaded -->
          <v-tabs-window-item>
            <div v-if="loadingPreloaded" class="text-center py-8">
              <v-progress-circular indeterminate color="primary" />
              <p class="mt-2">Loading avatars...</p>
            </div>

            <div v-else-if="preloadedAvatars.length === 0" class="text-center py-8">
              <v-icon size="64" color="grey">mdi-account-off</v-icon>
              <p class="mt-2 text-caption">No preloaded avatars available yet</p>
            </div>

            <div v-else class="avatars-grid">
              <div v-for="avatar in preloadedAvatars" :key="avatar.id" class="avatar-item selectable"
                :class="{ selected: isPreloadedSelected(avatar.id), 'default-avatar': isDefaultAvatar(avatar.id) }"
                @click="togglePreloadedAvatar(avatar)">
                <!-- Main Avatar Display -->
                <div class="avatar-display">
                  <v-img :src="avatar.originalPath" height="100" class="main-avatar" />

                  <!-- Default Badge -->
                  <v-chip v-if="isDefaultAvatar(avatar.id)" small color="success" class="default-badge">
                    <v-icon small left>mdi-star</v-icon>
                    Default
                  </v-chip>

                  <!-- Action Buttons -->
                  <div class="avatar-actions">
                    <v-btn v-if="isPreloadedSelected(avatar.id) && !isDefaultAvatar(avatar.id)" x-small color="success"
                      fab class="action-btn" @click.stop="setAsDefault(avatar.id)">
                      <v-icon>mdi-star</v-icon>
                    </v-btn>
                  </div>

                  <!-- Selection Check Icon -->
                  <v-icon v-if="isPreloadedSelected(avatar.id)" class="check-icon" color="success">
                    mdi-check-circle
                  </v-icon>
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

        <!-- Selected Summary -->
        <div v-if="totalSelected > 0" class="selected-summary mt-4">
          <v-chip color="primary" text-color="white">
            <v-icon left small>mdi-check</v-icon>
            {{ totalSelected }} avatar{{ totalSelected > 1 ? 's' : '' }} selected
          </v-chip>
        </div>
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
import {
  ref, computed, watch, onMounted, onUnmounted,
} from 'vue';
import useRoomsStore from '@/stores/rooms';
import {
  resizeImage, cropToMiniAvatar, createPreviewURL, revokePreviewURL,
} from '@/utils/imageUtils';

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['update:modelValue']);

const roomsStore = useRoomsStore();

// State
const activeTab = ref(0);
const uploadedFiles = ref([]);
const uploadedPreviews = ref([]);
const selectedPreloadedIds = ref([]);
const preloadedAvatars = ref([]);
const loadingPreloaded = ref(false);
const showSuccess = ref(false);
const showError = ref(false);
const successMessage = ref('');
const errorMessage = ref('');
const previewUrls = ref([]);
const defaultAvatarId = ref(null); // Track which avatar is default

// Computed
const totalSelected = computed(() => uploadedPreviews.value.length + selectedPreloadedIds.value.length);

const selectedAvatars = computed(() => {
  const avatars = [];

  // Add uploaded avatars
  uploadedPreviews.value.forEach((preview, index) => {
    const avatarId = `uploaded_${index}`;
    avatars.push({
      type: 'uploaded',
      mainFile: preview.mainFile,
      miniFile: preview.miniFile,
      mainUrl: preview.mainUrl,
      miniUrl: preview.miniUrl,
      isDefault: defaultAvatarId.value === avatarId,
    });
  });

  // Add preloaded avatars
  selectedPreloadedIds.value.forEach((id) => {
    const avatar = preloadedAvatars.value.find((a) => a.id === id);
    if (avatar) {
      avatars.push({
        type: 'preloaded',
        id: avatar.id,
        url: avatar.originalPath,
        miniUrl: avatar.miniPath,
        isDefault: defaultAvatarId.value === id,
      });
    }
  });

  // Ensure at least one avatar is default
  if (avatars.length > 0 && !avatars.some((a) => a.isDefault)) {
    avatars[0].isDefault = true;
    defaultAvatarId.value = avatars[0].id || `uploaded_0`;
  }

  return avatars;
});

// Methods
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

const onFileChange = async (fileOrEvent) => {
  let files = fileOrEvent;
  if (fileOrEvent && fileOrEvent.target && fileOrEvent.target.files) {
    files = Array.from(fileOrEvent.target.files);
  } else if (!Array.isArray(files)) {
    files = files ? [files] : [];
  }

  if (files.length === 0) return;

  for (const file of files) {
    // Validate file type
    if (!file.type || !file.type.startsWith('image/')) {
      showError.value = true;
      errorMessage.value = `${file.name} is not a valid image file`;
      continue;
    }

    // Validate file size (max 1MB)
    if (file.size > 1 * 1024 * 1024) {
      showError.value = true;
      errorMessage.value = `${file.name} is too large. Please select files smaller than 1MB`;
      continue;
    }

    try {
      // Resize main avatar
      const resizedMainBlob = await resizeImage(file, 80, 220, true);
      const mainUrl = createPreviewURL(resizedMainBlob);

      // Auto-crop mini avatar
      const miniBlob = await cropToMiniAvatar(file, 0.35);
      const miniUrl = createPreviewURL(miniBlob);

      uploadedPreviews.value.push({
        mainFile: new File([resizedMainBlob], `avatar_${Date.now()}.png`, { type: 'image/png' }),
        miniFile: new File([miniBlob], `mini_${Date.now()}.png`, { type: 'image/png' }),
        mainUrl,
        miniUrl,
      });

      // Track URLs for cleanup
      previewUrls.value.push(mainUrl, miniUrl);
    } catch (error) {
      console.error('Error processing image:', error);
      showError.value = true;
      errorMessage.value = `Failed to process ${file.name}: ${error.message}`;
    }
  }

  // Set first uploaded avatar as default if no default is set
  if (!defaultAvatarId.value && uploadedPreviews.value.length > 0) {
    defaultAvatarId.value = `uploaded_0`;
  }

  showSuccess.value = true;
  successMessage.value = `${files.length} avatar${files.length > 1 ? 's' : ''} ready to upload`;
  uploadedFiles.value = [];
};

const removeUploadedAvatar = (index) => {
  const preview = uploadedPreviews.value[index];
  if (preview.mainUrl) revokePreviewURL(preview.mainUrl);
  if (preview.miniUrl) revokePreviewURL(preview.miniUrl);

  const removedId = `uploaded_${index}`;
  uploadedPreviews.value.splice(index, 1);

  // If we removed the default avatar, set a new default
  if (defaultAvatarId.value === removedId) {
    if (uploadedPreviews.value.length > 0) {
      defaultAvatarId.value = `uploaded_0`;
    } else if (selectedPreloadedIds.value.length > 0) {
      defaultAvatarId.value = selectedPreloadedIds.value[0];
    } else {
      defaultAvatarId.value = null;
    }
  }
};

const isPreloadedSelected = (id) => selectedPreloadedIds.value.includes(id);

const isDefaultAvatar = (id) => defaultAvatarId.value === id;

const setAsDefault = (id) => {
  defaultAvatarId.value = id;
  showSuccess.value = true;
  successMessage.value = 'Default avatar updated';
};

const togglePreloadedAvatar = (avatar) => {
  const index = selectedPreloadedIds.value.indexOf(avatar.id);
  if (index === -1) {
    selectedPreloadedIds.value.push(avatar.id);
    // Set as default if it's the first avatar selected
    if (totalSelected.value === 0) {
      defaultAvatarId.value = avatar.id;
    }
  } else {
    selectedPreloadedIds.value.splice(index, 1);
    // If we removed the default avatar, set a new default
    if (defaultAvatarId.value === avatar.id && totalSelected.value > 0) {
      // Set first available avatar as default
      if (uploadedPreviews.value.length > 0) {
        defaultAvatarId.value = `uploaded_0`;
      } else if (selectedPreloadedIds.value.length > 0) {
        defaultAvatarId.value = selectedPreloadedIds.value[0];
      }
    }
  }
};

const cleanupPreviewUrls = () => {
  previewUrls.value.forEach((url) => revokePreviewURL(url));
  previewUrls.value = [];
};

// Track if we're updating from parent to prevent emission loop
const isUpdatingFromParent = ref(false);

// Watchers
watch(selectedAvatars, (newVal) => {
  if (!isUpdatingFromParent.value) {
    emit('update:modelValue', newVal);
  }
}, { deep: true });

watch(() => props.modelValue, (newVal) => {
  isUpdatingFromParent.value = true;

  if (!newVal || newVal.length === 0) {
    cleanupPreviewUrls();
    uploadedPreviews.value = [];
    selectedPreloadedIds.value = [];
  }

  // Reset flag after Vue's next tick
  setTimeout(() => {
    isUpdatingFromParent.value = false;
  }, 0);
}, { immediate: true });

// Lifecycle
onMounted(() => {
  loadPreloadedAvatars();
});

onUnmounted(() => {
  cleanupPreviewUrls();
});
</script>

<style scoped>
.room-avatar-selector {
  width: 100%;
}

.upload-section {
  padding: 16px 0;
}

.avatars-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
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

.avatar-item.selectable {
  cursor: pointer;
}

.avatar-item:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.avatar-item.selected {
  border-color: var(--success);
  box-shadow: 0 4px 12px rgba(var(--success-rgb), 0.3);
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
  box-shadow: var(--shadow-medium);
}

.check-icon {
  position: absolute;
  top: 8px;
  right: 8px;
  background: white;
  border-radius: 50%;
  padding: 2px;
  z-index: 1;
}

.mini-avatar-section {
  margin-bottom: 8px;
}

.mini-avatar {
  border: 2px solid var(--card-border);
}

.selected-summary {
  display: flex;
  justify-content: center;
  padding-top: 16px;
  border-top: 1px solid var(--card-border);
}

/* Responsive Design */
@media (max-width: 768px) {
  .avatars-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 12px;
  }
}
</style>