<template>
  <v-dialog
    v-model="show"
    max-width="700"
    scrollable
  >
    <v-card class="room-info-dialog">
      <!-- Header -->
      <v-card-title class="dialog-header">
        <v-icon>mdi-information</v-icon>
        Room Information
        <v-spacer></v-spacer>
        <v-btn icon size="small" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider></v-divider>

      <v-card-text class="dialog-content">
        <!-- Room Background Banner -->
        <div
          v-if="room.backgroundImage"
          class="room-banner"
          :style="{ backgroundImage: `url(${room.backgroundImage})` }"
        >
          <v-chip
            v-if="room.isFanArt"
            class="fan-art-badge"
            color="pink"
            variant="flat"
          >
            <v-icon start>mdi-heart</v-icon>
            Fan Art Room
          </v-chip>
        </div>

        <!-- Room Details Section -->
        <div class="info-section">
          <h3 class="section-title">
            <v-icon>mdi-door-open</v-icon>
            Room Details
          </h3>

          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Room Name</div>
              <div class="info-value">{{ room.name }}</div>
            </div>

            <div class="info-item" v-if="room.description">
              <div class="info-label">Description</div>
              <div class="info-value">{{ room.description }}</div>
            </div>

            <div class="info-item" v-if="room.topics?.length">
              <div class="info-label">Topics</div>
              <div class="topics-container">
                <v-chip
                  v-for="topic in room.topics"
                  :key="topic.name"
                  :color="topic.color"
                  :prepend-icon="topic.icon"
                  class="ma-2"
                >
                  {{ topic.name }}
                </v-chip>
              </div>
            </div>

            <div class="info-item">
              <div class="info-label">Capacity</div>
              <div class="info-value">
                {{ room.usersOnline || 0 }} / {{ room.maxUsers }} users
              </div>
            </div>

            <div class="info-item">
              <div class="info-label">Created</div>
              <div class="info-value">{{ formatDate(room.createdAt) }}</div>
            </div>

            <div class="info-item" v-if="room.minAge">
              <div class="info-label">Minimum Age</div>
              <div class="info-value">{{ room.minAge }}+</div>
            </div>
          </div>
        </div>

        <v-divider class="my-4"></v-divider>

        <!-- Owner/Creator Section -->
        <div class="info-section owner-section">
          <h3 class="section-title">
            <v-icon>mdi-account-star</v-icon>
            Room Creator
          </h3>

          <div class="owner-card">
            <!-- Avatar -->
            <div class="owner-avatar-section">
              <v-avatar
                :color="getTierColor(ownerData?.subscriptionTier)"
                size="80"
                class="owner-avatar elevation-4"
              >
                <span class="avatar-initials-large">
                  {{ getInitials(ownerData?.nickname || room?.createdBy) }}
                </span>
              </v-avatar>

              <!-- Creator badges -->
              <div v-if="ownerData" class="creator-badges">
                <v-chip
                  v-if="ownerData.isCreator || ownerData.subscriptionTier === 'creator'"
                  color="purple"
                  variant="flat"
                  size="small"
                >
                  <v-icon start size="small">mdi-star</v-icon>
                  Creator
                </v-chip>
                <v-chip
                  v-if="ownerData.subscriptionTier === 'landlord'"
                  color="blue"
                  variant="flat"
                  size="small"
                >
                  <v-icon start size="small">mdi-home-city</v-icon>
                  Landlord
                </v-chip>
              </div>
            </div>

            <!-- Owner Info -->
            <div v-if="ownerData" class="owner-details">
              <div class="owner-name" v-if="showField('showNickname')">
                {{ ownerData.nickname }}
              </div>

              <div class="owner-stats">
                <div v-if="showField('showLevel')" class="stat-item">
                  <v-icon size="small">mdi-trophy</v-icon>
                  Level {{ ownerData.level || 'L1' }}
                </div>
                <div v-if="showField('showAge') && ownerData.age" class="stat-item">
                  <v-icon size="small">mdi-cake</v-icon>
                  {{ ownerData.age }} years old
                </div>
              </div>

              <!-- Hobbies -->
              <div v-if="showField('showHobbies') && ownerData.hobbies?.length" class="owner-hobbies">
                <div class="info-label">Interests</div>
                <div class="hobbies-chips">
                  <v-chip
                    v-for="hobby in ownerData.hobbies"
                    :key="typeof hobby === 'string' ? hobby : hobby.name"
                    :color="typeof hobby === 'string' ? 'grey' : hobby.color"
                    :prepend-icon="typeof hobby === 'object' ? hobby.icon : undefined"
                    class="ma-2"
                  >
                    {{ typeof hobby === 'string' ? hobby : hobby.name }}
                  </v-chip>
                </div>
              </div>

              <!-- Description/Bio -->
              <div v-if="showField('showDescription') && ownerData.description" class="owner-bio">
                <div class="info-label">About</div>
                <p>{{ ownerData.description }}</p>
              </div>

              <!-- View Full Profile Button -->
              <v-btn
                variant="outlined"
                color="primary"
                size="small"
                @click="viewOwnerProfile"
              >
                <v-icon start>mdi-account-details</v-icon>
                View Full Profile
              </v-btn>
            </div>
          </div>
        </div>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="close">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, watch } from 'vue';
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

const emit = defineEmits(['update:modelValue', 'view-profile']);
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
      console.warn('Failed to load owner data for room info:', error);
    }
  }
}, { immediate: true });

// Privacy settings helper
const showField = (field) => {
  if (!ownerData.value?.privacySettings) return true; // Default to showing if no privacy settings
  return ownerData.value.privacySettings[field] !== false;
};

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

const viewOwnerProfile = () => {
  if (ownerData.value?.userId) {
    emit('view-profile', ownerData.value.userId);
  }
  close();
};
</script>

<style lang="scss" scoped>
.room-info-dialog {
  .dialog-header {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--background-secondary);
    font-weight: 600;
  }

  .dialog-content {
    padding: 0;
  }

  .room-banner {
    height: 150px;
    background-size: cover;
    background-position: center;
    position: relative;
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
    padding: 16px;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.5));
    }

    .fan-art-badge {
      position: relative;
      z-index: 1;
      font-weight: 600;
    }
  }

  .info-section {
    padding: 24px;

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 16px;
      color: var(--text-primary);
    }
  }

  .info-grid {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .info-item {
    .info-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .info-value {
      font-size: 1rem;
      color: var(--text-primary);
      line-height: 1.5;
    }
  }

  .topics-container {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .owner-card {
    background: var(--background-secondary);
    border-radius: 12px;
    padding: 24px;
    display: flex;
    gap: 24px;
    align-items: flex-start;
  }

  .owner-avatar-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .owner-avatar {
    position: relative;
    border: 3px solid rgba(255, 255, 255, 0.2);
    transition: all 0.2s ease;

    &:hover {
      transform: scale(1.03);
      border-color: rgba(255, 255, 255, 0.4);
    }
  }

  .avatar-initials-large {
    font-size: 2rem;
    font-weight: 700;
    color: white;
    text-transform: uppercase;
    letter-spacing: 1px;
    user-select: none;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .creator-badges {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .owner-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .owner-name {
    font-size: 1.3rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .owner-stats {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.9rem;
    color: var(--text-secondary);
  }

  .owner-hobbies {
    .hobbies-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
    }
  }

  .owner-bio {
    p {
      margin-top: 8px;
      line-height: 1.6;
      color: var(--text-primary);
    }
  }
}

/* Mobile responsive */
@media (max-width: 768px) {
  .room-info-dialog {
    .owner-card {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .owner-details {
      align-items: center;
    }

    .owner-stats {
      justify-content: center;
    }
  }
}
</style>
