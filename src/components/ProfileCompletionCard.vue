<template>
  <v-card v-if="showCard && !isDismissed" class="profile-completion-card mb-4" elevation="4">
    <v-btn
      icon
      size="x-small"
      class="close-btn"
      @click="dismissCard"
    >
      <v-icon>mdi-close</v-icon>
    </v-btn>

    <v-card-text class="pa-4">
      <div class="completion-header">
        <v-icon size="32" color="primary" class="mr-3">mdi-account-check</v-icon>
        <div>
          <h3 class="text-h6 mb-1">Complete Your Profile</h3>
          <p class="text-body-2 text-grey">
            {{ completionPercentage }}% complete - Add more details to enhance your experience!
          </p>
        </div>
      </div>

      <!-- Progress Bar -->
      <v-progress-linear
        :model-value="completionPercentage"
        color="primary"
        height="8"
        rounded
        class="my-3"
      ></v-progress-linear>

      <!-- Checklist -->
      <div class="completion-checklist">
        <div
          v-for="item in checklistItems"
          :key="item.key"
          class="checklist-item"
          :class="{ 'completed': item.completed }"
        >
          <v-icon
            size="20"
            :color="item.completed ? 'success' : 'grey-lighten-1'"
            class="mr-2"
          >
            {{ item.completed ? 'mdi-check-circle' : 'mdi-circle-outline' }}
          </v-icon>
          <span class="checklist-text">{{ item.label }}</span>
          <v-btn
            v-if="!item.completed"
            size="x-small"
            variant="text"
            color="primary"
            @click="handleQuickAction(item.key)"
            class="ml-auto"
          >
            Add
          </v-btn>
        </div>
      </div>

      <!-- Action Button -->
      <v-btn
        v-if="completionPercentage < 100"
        color="primary"
        variant="elevated"
        block
        class="mt-3"
        @click="$emit('edit-profile')"
      >
        <v-icon left>mdi-pencil</v-icon>
        Complete My Profile
      </v-btn>
    </v-card-text>
  </v-card>
</template>

<script setup>
import {
  ref, computed, watch, onMounted,
} from 'vue';

// Props
const props = defineProps({
  user: {
    type: Object,
    required: true,
  },
  completionData: {
    type: Object,
    required: true,
  },
});

// Emits
const emit = defineEmits(['edit-profile', 'quick-action']);

// Local state
const isDismissed = ref(false);
const DISMISSED_KEY = 'profile_completion_dismissed';

// Computed
const completionPercentage = computed(() => props.completionData?.percentage || 0);

const showCard = computed(() => !props.user?.isAnonymous && completionPercentage.value < 100);

const checklistItems = computed(() => [
  {
    key: 'nickname',
    label: 'Set a unique nickname',
    completed: props.completionData?.hasNickname || false,
  },
  {
    key: 'avatar',
    label: 'Upload a profile picture',
    completed: props.completionData?.hasAvatar || false,
  },
  {
    key: 'age',
    label: 'Add your age',
    completed: props.completionData?.hasAge || false,
  },
  {
    key: 'hobbies',
    label: 'Select your hobbies',
    completed: props.completionData?.hasHobbies || false,
  },
  {
    key: 'description',
    label: 'Write a description',
    completed: props.completionData?.hasDescription || false,
  },
]);

// Methods
const dismissCard = () => {
  isDismissed.value = true;
  localStorage.setItem(DISMISSED_KEY, 'true');
};

const handleQuickAction = (key) => {
  emit('quick-action', key);
  emit('edit-profile');
};

// Lifecycle
onMounted(() => {
  // Check if user previously dismissed
  const dismissed = localStorage.getItem(DISMISSED_KEY);
  if (dismissed === 'true' && completionPercentage.value < 100) {
    isDismissed.value = true;
  }
});

// Watch for completion - clear dismissed state when user completes profile
watch(completionPercentage, (newVal) => {
  if (newVal >= 100) {
    localStorage.removeItem(DISMISSED_KEY);
  }
});
</script>

<style scoped>
.profile-completion-card {
  position: relative;
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  border: 2px solid rgba(103, 126, 234, 0.2);
}

.close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
}

.completion-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.completion-checklist {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checklist-item {
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.checklist-item:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.checklist-item.completed {
  opacity: 0.6;
}

.checklist-text {
  flex: 1;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.87);
}

.checklist-item.completed .checklist-text {
  text-decoration: line-through;
  color: rgba(0, 0, 0, 0.6);
}

/* Animation */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.profile-completion-card {
  animation: slideDown 0.3s ease-out;
}

/* Mobile responsiveness */
@media (max-width: 600px) {
  .completion-header {
    flex-direction: column;
    text-align: center;
  }

  .completion-header .v-icon {
    margin-bottom: 8px;
  }
}
</style>
