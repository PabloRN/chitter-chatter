<template>
  <v-dialog v-model="show" max-width="600" transition="scale-transition" @click:outside="close">
    <v-card class="room-preview-card">
      <!-- Header with background image -->
      <div class="preview-header" :style="{ backgroundImage: `url(${room.backgroundImage})` }">
        <div class="header-overlay">

          <!-- Fan Art Badge -->
          <v-chip v-if="room.isFanArt" class="fan-art-badge" color="pink" variant="flat">
            <v-icon start>mdi-heart</v-icon>
            Fan Art
          </v-chip>
          <v-btn icon class="close-btn" @click="close">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
      </div>

      <!-- Room Title -->
      <v-card-title class="room-title">
        {{ room.name }}
      </v-card-title>

      <!-- Owner Section -->
      <div class="owner-section">
        <!-- Avatar with colored initials -->
        <v-avatar :color="getTierColor(ownerData?.subscriptionTier)" size="40" class="owner-avatar">
          <span class="avatar-initials">
            {{ getInitials(ownerData?.nickname || room.createdBy) }}
          </span>
        </v-avatar>

        <div class="owner-info">
          <div class="owner-name">{{ ownerData?.nickname || room.createdBy }}</div>
          <div class="owner-badge">
            <v-icon size="small" :color="getTierColor(ownerData?.subscriptionTier)">mdi-account-star</v-icon>
            <span>{{ ownerData?.isCreator ? 'Creator' : 'Owner' }}</span>
          </div>
        </div>
      </div>

      <!-- Topics -->
      <div v-if="room.topics?.length" class="topics-section">
        <v-chip v-for="topic in room.topics" :key="topic.name" :color="topic.color" :prepend-icon="topic.icon"
          class="ma-2">
          {{ topic.name }}
        </v-chip>
      </div>

      <!-- Description -->
      <v-card-text class="description-section">
        <div class="section-label">About this room</div>
        <p>{{ room.description || 'No description available.' }}</p>
      </v-card-text>

      <!-- Stats -->
      <div class="stats-section">
        <div class="stat">
          <v-icon>mdi-account-multiple</v-icon>
          <span>Max users {{ room.maxUsers }}</span>
        </div>
        <div class="stat">
          <v-icon>mdi-calendar</v-icon>
          <span>Created {{ formatDate(room.createdAt) }}</span>
        </div>
      </div>

      <!-- Actions -->
      <v-card-actions>
        <v-btn block color="primary" variant="flat" @click="enterRoom">
          <v-icon start>mdi-door-open</v-icon>
          Enter Room
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import useUserStore from '@/stores/user';
import { formatDistanceToNow } from 'date-fns';
import { getTierColor, getInitials } from '@/utils/avatarHelpers';

const props = defineProps({
  modelValue: Boolean,
  room: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);
const router = useRouter();
const userStore = useUserStore();

const show = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

// Load owner data
const ownerData = computed(() => {
  if (!props.room?.ownerId) return null;
  return userStore.userData[props.room.ownerId] || null;
});

// Watch for room changes to load owner data
watch(() => props.room?.ownerId, async (ownerId) => {
  if (ownerId && !userStore.userData[ownerId]) {
    try {
      await userStore.getUserData(ownerId);
    } catch (error) {
      console.warn('Failed to load owner data for room preview:', error);
      // Falls back to initials from room.createdBy
    }
  }
}, { immediate: true });

const formatDate = (dateString) => {
  if (!dateString) return 'Recently';
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return 'Recently';
  }
};

const close = () => {
  show.value = false;
};

const enterRoom = () => {
  router.push(`/rooms/${props.room.id}`);
  close();
};
</script>

<style lang="scss" scoped>
.room-preview-card {
  overflow: hidden;
}

.preview-header {
  height: 200px;
  background-size: cover;
  background-position: center;
  position: relative;
}

.header-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom,
      rgba(0, 0, 0, 0.3) 0%,
      rgba(0, 0, 0, 0.7) 100%);
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.close-btn {
  background: rgba(255, 255, 255, 1) !important;
  backdrop-filter: blur(10px);
  margin-left: 90%;
}

.fan-art-badge {
  font-weight: 600;
}

.room-title {
  font-size: 1.5rem;
  font-weight: 600;
  padding: 16px 16px 8px;
}

.owner-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--border-color);
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(var(--primary-rgb), 0.02);
  }
}

.owner-info {
  flex: 1;
}

.owner-name {
  font-weight: 600;
  color: var(--text-primary);
}

.owner-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

// Owner Avatar Styles
.owner-avatar {
  position: relative;
  border: 2px solid rgba(255, 255, 255, 0.2);
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.05);
    border-color: rgba(255, 255, 255, 0.4);
  }
}

.avatar-initials {
  font-size: 1rem;
  font-weight: 600;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  user-select: none;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.topics-section {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  padding: 16px;
}

.description-section {
  padding: 16px;

  .section-label {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  p {
    line-height: 1.6;
    color: var(--text-primary);
  }
}

.stats-section {
  display: flex;
  gap: 24px;
  padding: 16px;
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
}

.stat {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: var(--text-secondary);
}
</style>
