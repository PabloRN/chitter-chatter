<template>
  <v-dialog v-model="show" max-width="450" transition="dialog-bottom-transition">
    <v-card class="user-info-card">
      <!-- Close button -->
      <v-btn icon class="close-btn" @click="close">
        <v-icon color="black">mdi-close</v-icon>
      </v-btn>

      <!-- Loading state -->
      <div v-if="loading" class="loading-state">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        <p class="mt-4">Loading profile...</p>
      </div>

      <!-- User info content -->
      <div v-else-if="userInfo" class="user-info-content">
        <!-- Avatar Section -->
        <div v-if="userInfo.privacySettings?.showAvatar !== false" class="avatar-section">
          <v-avatar size="120" class="user-avatar">
            <v-img v-if="userInfo.avatar || userInfo.personalAvatar || userInfo.miniAvatar"
              :src="userInfo.personalAvatar || userInfo.avatar || userInfo.miniAvatar" />
            <v-icon v-else size="60">mdi-account-circle</v-icon>
          </v-avatar>
        </div>
        <div v-else class="avatar-section">
          <v-avatar size="120" class="user-avatar private-avatar">
            <v-icon size="60" color="grey">mdi-account-off</v-icon>
          </v-avatar>
          <p class="private-text">Avatar hidden</p>
        </div>

        <!-- User Details -->
        <div class="user-details">
          <!-- Nickname -->
          <div v-if="userInfo.privacySettings?.showNickname !== false" class="user-name-section">
            <h2 class="user-name">{{ userInfo.nickname || 'Unknown User' }}</h2>
            <v-chip v-if="userInfo.privacySettings?.showLevel !== false && userInfo.level" color="primary"
              variant="flat" size="small" class="level-chip">
              <v-icon start size="small">mdi-star</v-icon>
              {{ userInfo.level }}
            </v-chip>
          </div>
          <div v-else class="user-name-section">
            <h2 class="user-name private-text">Hidden User</h2>
            <p class="subtitle">This user prefers to remain anonymous</p>
          </div>

          <!-- Age -->
          <div v-if="userInfo.privacySettings?.showAge && userInfo.age" class="info-item">
            <v-icon class="info-icon" size="small">mdi-cake-variant</v-icon>
            <span class="info-label">Age:</span>
            <span class="info-value">{{ userInfo.age }}</span>
          </div>
          <div v-else-if="!userInfo.privacySettings?.showAge && userInfo.age" class="info-item private-item">
            <v-icon class="info-icon" size="small" color="grey">mdi-eye-off</v-icon>
            <span class="info-label private-text">Age is private</span>
          </div>

          <!-- Hobbies -->
          <div v-if="userInfo.privacySettings?.showHobbies && userInfo.hobbies?.length" class="hobbies-section">
            <div class="section-header">
              <v-icon size="small" class="mr-2">mdi-heart-multiple</v-icon>
              <span class="section-title">Hobbies</span>
            </div>
            <div class="hobbies-chips">
              <v-chip v-for="hobby in userInfo.hobbies" :key="hobby.name" :color="hobby.color"
                :prepend-icon="hobby.icon" size="small" class="hobby-chip">
                {{ hobby.name }}
              </v-chip>
            </div>
          </div>
          <div v-else-if="!userInfo.privacySettings?.showHobbies && userInfo.hobbies?.length"
            class="info-item private-item">
            <v-icon class="info-icon" size="small" color="grey">mdi-eye-off</v-icon>
            <span class="info-label private-text">Hobbies are private</span>
          </div>

          <!-- Description -->
          <div v-if="userInfo.privacySettings?.showDescription && userInfo.description" class="description-section">
            <div class="section-header">
              <v-icon size="small" class="mr-2">mdi-text</v-icon>
              <span class="section-title">About</span>
            </div>
            <p class="description-text">{{ userInfo.description }}</p>
          </div>
          <div v-else-if="!userInfo.privacySettings?.showDescription && userInfo.description"
            class="info-item private-item">
            <v-icon class="info-icon" size="small" color="grey">mdi-eye-off</v-icon>
            <span class="info-label private-text">Description is private</span>
          </div>

          <!-- Empty state if all private -->
          <div v-if="isAllPrivate" class="empty-state">
            <v-icon size="48" color="grey">mdi-lock</v-icon>
            <p class="mt-3">This user has made their profile private</p>
          </div>
        </div>
      </div>

      <!-- Error state -->
      <div v-else class="error-state">
        <v-icon size="48" color="error">mdi-alert-circle</v-icon>
        <p class="mt-3">Unable to load user profile</p>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { getDatabase, ref as dbRef, get } from 'firebase/database';

const props = defineProps({
  modelValue: Boolean,
  userId: String,
});

const emit = defineEmits(['update:modelValue']);

const loading = ref(false);
const userInfo = ref(null);

const show = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const isAllPrivate = computed(() => {
  if (!userInfo.value?.privacySettings) return false;
  const settings = userInfo.value.privacySettings;
  return !settings.showNickname && !settings.showAvatar && !settings.showAge
    && !settings.showHobbies && !settings.showDescription;
});

const close = () => {
  show.value = false;
};

const loadUserInfo = async () => {
  if (!props.userId) return;

  loading.value = true;
  try {
    const db = getDatabase();
    const userRef = dbRef(db, `users/${props.userId}`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      userInfo.value = snapshot.val();

      // Ensure privacy settings exist with defaults
      if (!userInfo.value.privacySettings) {
        userInfo.value.privacySettings = {
          showAvatar: true,
          showNickname: true,
          showLevel: true,
          showAge: false,
          showHobbies: true,
          showDescription: true,
        };
      }
    } else {
      userInfo.value = null;
    }
  } catch (error) {
    console.error('Error loading user info:', error);
    userInfo.value = null;
  } finally {
    loading.value = false;
  }
};

// Load user info when dialog opens
watch(() => props.userId, (newUserId) => {
  if (newUserId && props.modelValue) {
    loadUserInfo();
  }
});

watch(() => props.modelValue, (newValue) => {
  if (newValue && props.userId) {
    loadUserInfo();
  }
});
</script>

<style scoped>
.user-info-card {
  position: relative;
  background: var(--background-primary);
  border-radius: 16px;
  overflow: hidden;
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: var(--text-secondary);
}

.user-info-content {
  padding: 24px;
  padding-top: 32px;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
}

.user-avatar {
  border: 4px solid var(--primary-color);
  box-shadow: var(--shadow-medium);
}

.private-avatar {
  border-color: var(--border-color);
  background: var(--background-secondary);
}

.avatar-section .private-text {
  margin-top: 8px;
  font-size: 13px;
  color: var(--text-secondary);
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.user-name-section {
  text-align: center;
  margin-bottom: 8px;
}

.user-name {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.level-chip {
  margin-top: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: var(--background-secondary);
  border-radius: 8px;
}

.info-item.private-item {
  opacity: 0.6;
  border: 1px dashed var(--border-color);
  background: transparent;
}

.info-icon {
  color: var(--text-secondary);
}

.info-label {
  font-weight: 500;
  color: var(--text-secondary);
}

.info-value {
  margin-left: auto;
  font-weight: 500;
  color: var(--text-primary);
}

.private-text {
  color: var(--text-secondary);
  opacity: 0.7;
  font-style: italic;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  color: var(--text-secondary);
}

.section-title {
  font-weight: 600;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.hobbies-section {
  padding: 16px;
  background: var(--background-secondary);
  border-radius: 12px;
}

.hobbies-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hobby-chip {
  font-size: 13px;
}

.description-section {
  padding: 16px;
  background: var(--background-secondary);
  border-radius: 12px;
}

.description-text {
  color: var(--text-primary);
  line-height: 1.6;
  margin: 0;
  font-size: 14px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  text-align: center;
  color: var(--text-secondary);
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .close-btn {
    background: rgba(255, 255, 255, 0.1);
  }
}
</style>
