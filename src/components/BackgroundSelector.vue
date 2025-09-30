<template>
  <div class="background-selector">
    <div class="text-subtitle-1 font-weight-medium mb-2">Room Background</div>
    <p class="text-caption mb-4">
      Choose a background for your room. You can upload your own or select from our collection.
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
              <!-- Custom Upload Card -->
              <div class="upload-card" @click="triggerFileUpload">
                <div class="upload-content">
                  <v-icon size="64" color="primary" class="mb-3">mdi-cloud-upload</v-icon>
                  <div class="upload-title">Upload Background Image</div>
                  <div class="upload-hint">Click to browse or drag & drop</div>
                  <div class="upload-specs">Recommended: 1920x1080px • Max 5MB</div>
                </div>

                <!-- Hidden file input -->
                <input ref="fileInput" type="file" accept="image/*" style="display: none" @change="onFileChange" />
              </div>
            </div>
          </v-tabs-window-item>

          <!-- Tab 2: Select Preloaded -->
          <v-tabs-window-item>
            <div v-if="loadingPreloaded" class="text-center py-8">
              <v-progress-circular indeterminate color="primary" />
              <p class="mt-2">Loading backgrounds...</p>
            </div>

            <div v-else-if="preloadedBackgrounds.length === 0" class="text-center py-8">
              <v-icon size="64" color="grey">mdi-image-off</v-icon>
              <p class="mt-2 text-caption">No preloaded backgrounds available yet</p>
            </div>

            <div v-else class="backgrounds-grid">
              <div v-for="bg in preloadedBackgrounds" :key="bg.id" class="background-item"
                :class="{ selected: selectedPreloadedId === bg.id }" @click="selectPreloaded(bg)">
                <v-img :src="bg.thumbnailPath" height="120" cover class="background-thumbnail" />
                <v-icon v-if="selectedPreloadedId === bg.id" class="check-icon" color="success">
                  mdi-check-circle
                </v-icon>
              </div>
            </div>
          </v-tabs-window-item>
        </v-tabs-window>

        <!-- Preview Section -->
        <div v-if="previewUrl" class="preview-section mt-4">
          <div class="text-subtitle-2 mb-2">Preview:</div>
          <v-img :src="previewUrl" height="200" class="background-preview" />
          <v-btn small color="error" class="mt-2" @click="clearSelection">
            Clear Selection
          </v-btn>
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
  ref, computed, watch, onMounted,
} from 'vue';
import useRoomsStore from '@/stores/rooms';
import { createPreviewURL, revokePreviewURL } from '@/utils/imageUtils';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => null,
  },
});

const emit = defineEmits(['update:modelValue']);

const roomsStore = useRoomsStore();

// State
const activeTab = ref(0);
const fileInput = ref(null);
const uploadedFile = ref(null);
const selectedPreloadedId = ref(null);
const preloadedBackgrounds = ref([]);
const loadingPreloaded = ref(false);
const previewUrl = ref('');
const showSuccess = ref(false);
const showError = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

// Computed
const selectedBackground = computed(() => {
  if (activeTab.value === 0 && uploadedFile.value) {
    return {
      type: 'uploaded',
      file: uploadedFile.value,
      previewUrl: previewUrl.value,
    };
  } if (activeTab.value === 1 && selectedPreloadedId.value) {
    const bg = preloadedBackgrounds.value.find((b) => b.id === selectedPreloadedId.value);
    return {
      type: 'preloaded',
      id: bg.id,
      url: bg.originalPath,
      previewUrl: bg.thumbnailPath,
    };
  }
  return null;
});

// Methods
const loadPreloadedBackgrounds = async () => {
  loadingPreloaded.value = true;
  try {
    const backgrounds = await roomsStore.fetchPreloadedBackgrounds();
    preloadedBackgrounds.value = Object.values(backgrounds);
  } catch (error) {
    console.error('Error loading preloaded backgrounds:', error);
    showError.value = true;
    errorMessage.value = 'Failed to load preloaded backgrounds';
  } finally {
    loadingPreloaded.value = false;
  }
};

const onFileChange = (fileOrEvent) => {
  let file = fileOrEvent;
  if (fileOrEvent && fileOrEvent.length) {
    file = fileOrEvent[0];
  } else if (fileOrEvent && fileOrEvent.target && fileOrEvent.target.files) {
    file = fileOrEvent.target.files[0];
  }

  if (!file) {
    clearSelection();
    return;
  }

  // Validate file type
  if (!file.type || !file.type.startsWith('image/')) {
    showError.value = true;
    errorMessage.value = 'Please select a valid image file';
    uploadedFile.value = null;
    return;
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    showError.value = true;
    errorMessage.value = 'Image file is too large. Please select a file smaller than 5MB';
    uploadedFile.value = null;
    return;
  }

  try {
    // Clear previous preview
    if (previewUrl.value) {
      revokePreviewURL(previewUrl.value);
    }

    // Create new preview
    previewUrl.value = createPreviewURL(file);
    selectedPreloadedId.value = null; // Clear preloaded selection

    showSuccess.value = true;
    successMessage.value = 'Background ready to upload';
  } catch (error) {
    console.error('Error processing image:', error);
    showError.value = true;
    errorMessage.value = `Failed to process image: ${error.message}`;
  }
};

const selectPreloaded = (bg) => {
  selectedPreloadedId.value = bg.id;
  previewUrl.value = bg.originalPath;
  uploadedFile.value = null; // Clear uploaded file

  showSuccess.value = true;
  successMessage.value = 'Background selected';
};

const clearSelection = () => {
  if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
    revokePreviewURL(previewUrl.value);
  }
  uploadedFile.value = null;
  selectedPreloadedId.value = null;
  previewUrl.value = '';
};

const triggerFileUpload = () => {
  fileInput.value?.click();
};

// Track if we're updating from parent to prevent emission loop
const isUpdatingFromParent = ref(false);

// Watchers
watch(selectedBackground, (newVal) => {
  if (!isUpdatingFromParent.value) {
    emit('update:modelValue', newVal);
  }
}, { deep: true });

watch(() => props.modelValue, (newVal) => {
  isUpdatingFromParent.value = true;

  if (!newVal) {
    clearSelection();
  } else if (newVal.type === 'preloaded') {
    selectedPreloadedId.value = newVal.id;
    previewUrl.value = newVal.previewUrl || newVal.url;
    activeTab.value = 1;
  } else if (newVal.type === 'existing') {
    previewUrl.value = newVal.previewUrl || newVal.url;
  }

  // Reset flag after Vue's next tick
  setTimeout(() => {
    isUpdatingFromParent.value = false;
  }, 0);
}, { immediate: true });

// Lifecycle
onMounted(() => {
  loadPreloadedBackgrounds();
});
</script>

<style scoped>
.background-selector {
  width: 100%;
}

.upload-section {
  padding: 16px 0;
}

.upload-card {
  border: 2px dashed var(--card-border);
  border-radius: 12px;
  padding: 48px 24px;
  text-align: center;
  background: var(--background-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
}

.upload-card:hover {
  border-color: var(--primary);
  background: rgba(var(--primary-rgb), 0.05);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--text-secondary);
}

.upload-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.upload-hint {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.upload-specs {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  font-style: italic;
}

.upload-card:hover .upload-content {
  color: var(--primary);
}

.upload-card:hover .upload-title {
  color: var(--primary);
}

.backgrounds-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.background-item {
  position: relative;
  border: 3px solid var(--card-border);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.background-item:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.background-item.selected {
  border-color: var(--success);
  box-shadow: 0 4px 12px rgba(var(--success-rgb), 0.3);
}

.background-thumbnail {
  width: 100%;
  height: 100%;
}

.check-icon {
  position: absolute;
  top: 8px;
  right: 8px;
  background: white;
  border-radius: 50%;
  padding: 2px;
}

.preview-section {
  background: rgba(var(--card-background-rgb), 0.5);
  padding: 16px;
  border-radius: 8px;
  border: 1px solid var(--card-border);
}

.background-preview {
  border-radius: 8px;
  border: 2px solid var(--card-border);
}

/* Responsive Design */
@media (max-width: 768px) {
  .backgrounds-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }
}
</style>