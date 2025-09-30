<template>
  <v-card class="admin-panel themed-card" elevation="2">
    <v-card-title class="section-title">
      <v-icon class="mr-2" color="error">mdi-shield-crown</v-icon>
      Admin Panel
      <v-spacer />
      <v-chip small color="error" text-color="white">
        <v-icon small left>mdi-lock</v-icon>
        Admin Only
      </v-chip>
    </v-card-title>

    <v-card-text>
      <v-tabs v-model="activeTab" grow>
        <v-tab>Backgrounds</v-tab>
        <v-tab>Avatars</v-tab>
      </v-tabs>

      <v-tabs-window v-model="activeTab" class="mt-4">
        <!-- Backgrounds Management -->
        <v-tabs-window-item>
          <div class="management-section">
            <h4 class="text-h6 mb-3">Manage Preloaded Backgrounds</h4>

            <!-- Upload New Background -->
            <v-card outlined class="mb-4">
              <v-card-title class="text-subtitle-1">Upload New Background</v-card-title>
              <v-card-text>
                <v-file-input v-model="newBackgroundFile" accept="image/*" label="Select Background Image"
                  hint="Will be compressed and a thumbnail will be generated automatically" persistent-hint outlined
                  dense show-size prepend-icon="mdi-image-plus" />
                <v-btn color="primary" :disabled="!newBackgroundFile" :loading="uploading" class="mt-2"
                  @click="uploadBackground">
                  <v-icon left>mdi-upload</v-icon>
                  Upload Background
                </v-btn>
              </v-card-text>
            </v-card>

            <!-- Background List -->
            <div v-if="loadingBackgrounds" class="text-center py-8">
              <v-progress-circular indeterminate color="primary" />
              <p class="mt-2">Loading backgrounds...</p>
            </div>

            <div v-else-if="backgrounds.length === 0" class="text-center py-8">
              <v-icon size="64" color="grey">mdi-image-off</v-icon>
              <p class="mt-2">No backgrounds uploaded yet</p>
            </div>

            <div v-else class="assets-grid">
              <v-card v-for="bg in backgrounds" :key="bg.id" outlined class="asset-card">
                <v-img :src="bg.thumbnailPath" height="120" cover />
                <v-card-actions>
                  <small class="text-caption">{{ formatDate(bg.uploadedAt) }}</small>
                  <v-spacer />
                  <v-btn icon small color="error" @click="deleteBackground(bg.id)">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </v-card-actions>
              </v-card>
            </div>
          </div>
        </v-tabs-window-item>

        <!-- Avatars Management -->
        <v-tabs-window-item>
          <div class="management-section">
            <h4 class="text-h6 mb-3">Manage Preloaded Avatars</h4>

            <!-- Upload New Avatar -->
            <v-card outlined class="mb-4">
              <v-card-title class="text-subtitle-1">Upload New Avatar</v-card-title>
              <v-card-text>
                <v-file-input v-model="newAvatarFile" accept="image/*" label="Select Avatar Image"
                  hint="Mini avatar will be auto-cropped from the head area" persistent-hint outlined dense show-size
                  prepend-icon="mdi-account-plus" />
                <v-btn color="primary" :disabled="!newAvatarFile" :loading="uploading" class="mt-2"
                  @click="uploadAvatar">
                  <v-icon left>mdi-upload</v-icon>
                  Upload Avatar
                </v-btn>
              </v-card-text>
            </v-card>

            <!-- Avatar List -->
            <div v-if="loadingAvatars" class="text-center py-8">
              <v-progress-circular indeterminate color="primary" />
              <p class="mt-2">Loading avatars...</p>
            </div>

            <div v-else-if="avatars.length === 0" class="text-center py-8">
              <v-icon size="64" color="grey">mdi-account-off</v-icon>
              <p class="mt-2">No avatars uploaded yet</p>
            </div>

            <div v-else class="assets-grid">
              <v-card v-for="avatar in avatars" :key="avatar.id" outlined class="asset-card">
                <v-img :src="avatar.originalPath" height="150" contain class="pa-2" />
                <v-card-actions>
                  <small class="text-caption">{{ formatDate(avatar.uploadedAt) }}</small>
                  <v-spacer />
                  <v-btn icon small color="error" @click="deleteAvatar(avatar.id)">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </v-card-actions>
              </v-card>
            </div>
          </div>
        </v-tabs-window-item>
      </v-tabs-window>
    </v-card-text>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="error--text">
          Confirm Deletion
        </v-card-title>
        <v-card-text>
          Are you sure you want to delete this {{ deleteType }}? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" :loading="deleting" @click="confirmDelete">Delete</v-btn>
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
  ref, computed, onMounted,
} from 'vue';
import useRoomsStore from '@/stores/rooms';
import useUserStore from '@/stores/user';

const roomsStore = useRoomsStore();
const userStore = useUserStore();

// State
const activeTab = ref(0);
const newBackgroundFile = ref(null);
const newAvatarFile = ref(null);
const backgrounds = ref([]);
const avatars = ref([]);
const loadingBackgrounds = ref(false);
const loadingAvatars = ref(false);
const uploading = ref(false);
const deleting = ref(false);
const deleteDialog = ref(false);
const deleteType = ref('');
const itemToDelete = ref(null);
const showSuccess = ref(false);
const showError = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

// Computed
const currentUser = computed(() => userStore.getCurrentUser);

// Methods
const loadBackgrounds = async () => {
  loadingBackgrounds.value = true;
  try {
    const data = await roomsStore.fetchPreloadedBackgrounds();
    backgrounds.value = Object.values(data);
  } catch (error) {
    console.error('Error loading backgrounds:', error);
    showError.value = true;
    errorMessage.value = 'Failed to load backgrounds';
  } finally {
    loadingBackgrounds.value = false;
  }
};

const loadAvatars = async () => {
  loadingAvatars.value = true;
  try {
    const data = await roomsStore.fetchPreloadedAvatars();
    avatars.value = Object.values(data);
  } catch (error) {
    console.error('Error loading avatars:', error);
    showError.value = true;
    errorMessage.value = 'Failed to load avatars';
  } finally {
    loadingAvatars.value = false;
  }
};

const uploadBackground = async () => {
  if (!newBackgroundFile.value) return;

  uploading.value = true;
  try {
    await roomsStore.uploadPreloadedBackground(newBackgroundFile.value, currentUser.value.userId);
    showSuccess.value = true;
    successMessage.value = 'Background uploaded successfully';
    newBackgroundFile.value = null;
    await loadBackgrounds();
  } catch (error) {
    console.error('Error uploading background:', error);
    showError.value = true;
    errorMessage.value = `Failed to upload background: ${error.message}`;
  } finally {
    uploading.value = false;
  }
};

const uploadAvatar = async () => {
  if (!newAvatarFile.value) return;

  uploading.value = true;
  try {
    await roomsStore.uploadPreloadedAvatar(newAvatarFile.value, currentUser.value.userId);
    showSuccess.value = true;
    successMessage.value = 'Avatar uploaded successfully';
    newAvatarFile.value = null;
    await loadAvatars();
  } catch (error) {
    console.error('Error uploading avatar:', error);
    showError.value = true;
    errorMessage.value = `Failed to upload avatar: ${error.message}`;
  } finally {
    uploading.value = false;
  }
};

const deleteBackground = (backgroundId) => {
  deleteType.value = 'background';
  itemToDelete.value = backgroundId;
  deleteDialog.value = true;
};

const deleteAvatar = (avatarId) => {
  deleteType.value = 'avatar';
  itemToDelete.value = avatarId;
  deleteDialog.value = true;
};

const confirmDelete = async () => {
  if (!itemToDelete.value) return;

  deleting.value = true;
  try {
    if (deleteType.value === 'background') {
      await roomsStore.deletePreloadedBackground(itemToDelete.value);
      await loadBackgrounds();
    } else {
      await roomsStore.deletePreloadedAvatar(itemToDelete.value);
      await loadAvatars();
    }

    showSuccess.value = true;
    successMessage.value = `${deleteType.value.charAt(0).toUpperCase() + deleteType.value.slice(1)} deleted successfully`;
    deleteDialog.value = false;
    itemToDelete.value = null;
  } catch (error) {
    console.error(`Error deleting ${deleteType.value}:`, error);
    showError.value = true;
    errorMessage.value = `Failed to delete ${deleteType.value}: ${error.message}`;
  } finally {
    deleting.value = false;
  }
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

// Lifecycle
onMounted(() => {
  loadBackgrounds();
  loadAvatars();
});
</script>

<style scoped>
.admin-panel {
  border-radius: 12px !important;
  border: 2px solid rgba(var(--error-rgb), 0.5) !important;
}

.section-title {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  font-weight: 600 !important;
  color: var(--text-primary) !important;
  font-size: 1.1rem !important;
  border-bottom: 1px solid var(--card-border);
}

.management-section {
  padding: 16px 0;
}

.assets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.asset-card {
  background-color: var(--card-background) !important;
  border: 1px solid var(--card-border) !important;
  transition: all 0.3s ease;
}

.asset-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

/* Themed card overrides */
.themed-card {
  background-color: var(--card-background) !important;
  color: var(--text-primary) !important;
  border: 1px solid var(--card-border) !important;
}

/* Responsive Design */
@media (max-width: 768px) {
  .assets-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }
}
</style>