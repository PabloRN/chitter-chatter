<!-- eslint-disable max-len -->
<template>
  <v-scroll-y-reverse-transition>
    <div class="room-card-container">
      <v-card @click="enterRoom(room, id)" class="mx-auto room-card">
        <v-img :src="room?.thumbnail || room?.backgroundImage" class="room-image" height="200px" :cover="true">
          <!-- Default overlay (always visible) -->
          <div class="gradient-overlay"></div>
          <v-chip v-if="room.isFanArt" class="fan-art-badge ma-2" color="pink" variant="flat">
            <v-icon start>mdi-heart</v-icon>
            Fan Art
          </v-chip>
          <!-- Favorite button (top right) -->
          <v-btn @click.stop="toggleFavorite" class="favorite-btn" icon small :disabled="!isUserAuthenticated"
            :color="isFavorite ? 'red' : 'white'">
            <v-icon>{{ isFavorite ? 'mdi-heart' : 'mdi-heart-outline' }}</v-icon>
          </v-btn>

          <!-- Title and subtitle (always visible at bottom, animates up) -->
          <div class="text-overlay">
            <div class="room-title">{{ room?.name }}</div>
            <div class="created-by">Created by {{ room?.createdBy || 'ToonsTalk' }}</div>
          </div>

          <!-- User count badge (always visible, fades out on hover) -->
          <div class="user-count-badge" :class="{ 'has-friends': hasFriendsInRoom }">
            <v-icon v-if="hasFriendsInRoom" class="friend-indicator" size="12" color="success">
              mdi-account-heart
            </v-icon>
            <v-icon v-else class="user-icon" size="16">mdi-account-group</v-icon>
            <span>{{ usersOnline || 0 }}/{{ room?.maxUsers || 10 }}</span>
            <v-tooltip v-if="hasFriendsInRoom" activator="parent" location="top">
              {{ friendsInRoom.length }} {{ friendsInRoom.length === 1 ? 'friend' : 'friends' }} in this room
            </v-tooltip>
          </div>

          <!-- Hover overlay (description + actions) -->
          <div class="hover-overlay" @click.stop="enterRoom(room, id)">
            <div class="hover-content">
              <!-- Duplicate title/subtitle at top of hover overlay -->
              <div class="hover-header">
                <div class="room-title-hover">{{ room?.name }}</div>
                <div class="created-by-hover">Created by {{ room?.createdBy || 'ToonsTalk' }}</div>
              </div>

              <!-- Description in middle -->
              <div v-if="room?.description" class="description-hover">
                {{ room.description }}
              </div>

              <!-- Action icons at bottom -->
              <div class="hover-actions">
                <!-- Enter Room -->
                <div class="action-icon-wrapper" @click.stop="enterRoom(room, id)">
                  <v-avatar size="32" color="blue" class="action-icon">
                    <v-icon size="18" color="white">mdi-door-open</v-icon>
                  </v-avatar>
                  <v-tooltip activator="parent" location="top">Enter Room</v-tooltip>
                </div>

                <!-- Room Details -->
                <div class="action-icon-wrapper" @click.stop="showExpanded = true">
                  <v-avatar size="32" color="orange" class="action-icon">
                    <v-icon size="18" color="white">mdi-information-outline</v-icon>
                  </v-avatar>
                  <v-tooltip activator="parent" location="top">Room Details</v-tooltip>
                </div>

                <!-- Favorite -->
                <div class="action-icon-wrapper" @click.stop="toggleFavorite">
                  <v-avatar size="32" :color="isFavorite ? 'red' : 'grey'" class="action-icon"
                    :class="{ 'disabled': !isUserAuthenticated }">
                    <v-icon size="18" color="white">{{ isFavorite ? 'mdi-heart' : 'mdi-heart-outline' }}</v-icon>
                  </v-avatar>
                  <v-tooltip v-if="isUserAuthenticated" activator="parent" location="top">
                    {{ isFavorite ? 'Remove from Favorites' : 'Add to Favorites' }}
                  </v-tooltip>
                </div>
              </div>
            </div>
          </div>
        </v-img>
      </v-card>

      <!-- Room Preview Card (Phase 2) -->
      <RoomPreviewCard v-model="showExpanded" :room="room" />
    </div>
  </v-scroll-y-reverse-transition>
</template>

<script setup>
import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import useUserStore from '@/stores/user';
import friendsService from '@/services/friendsService';
import RoomPreviewCard from '@/components/RoomPreviewCard.vue';

// ✅ Props
const props = defineProps({
  id: String,
  room: Object,
});

// ✅ Stores
const userStore = useUserStore();
const router = useRouter();

// Store refs
const { friendsList } = storeToRefs(userStore);

// ✅ Computed
const isUserAuthenticated = computed(() => userStore.currentUser?.userId && !userStore.currentUser?.isAnonymous);

const isFavorite = computed(() => {
  const favoriteRooms = userStore.currentUser?.favoriteRooms || [];
  return favoriteRooms.includes(props.id);
});

const usersOnline = computed(() => props.room?.usersOnline || 0);

const roomIsFull = computed(() => usersOnline.value >= (props.room?.maxUsers || 20));

// Check if friends are in the room
const friendsInRoom = computed(() => {
  if (!usersOnline.value || !friendsList.value || friendsList.value.length === 0) {
    return [];
  }

  const roomUsers = props.room.users;
  return friendsService.getFriendsInRoom(friendsList.value, roomUsers);
});

const hasFriendsInRoom = computed(() => friendsInRoom.value.length > 0);

// Expanded card state
const showExpanded = ref(false);

// ✅ Methods
const enterRoom = (room, key) => {
  if (roomIsFull.value) {
    alert('This room is full. Please try again later.');
    return;
  }
  router.push({
    name: 'room',
    params: { roomId: key },
  });
};

const toggleFavorite = async () => {
  if (isUserAuthenticated.value) {
    await userStore.toggleFavorite(props.id);
  }
};

// ✅ Watchers removed - now using computed property directly from props
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.room-card-container {
  position: relative;
  display: inline-block;
  width: 100%;
  overflow: visible;
}

/* .room-card-container:hover {
  z-index: 99999 !important;
} */

.room-card {
  position: relative;
  cursor: pointer;
  /* transition: transform 0.2s ease; */
}

.room-image {
  position: relative;
}

/* Gradient overlay (subtle, always visible) */
.gradient-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom,
      transparent 0%,
      transparent 50%,
      rgba(0, 0, 0, 0.3) 100%);
  pointer-events: none;
  z-index: 0;
}

.favorite-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10 !important;
  background: rgba(0, 0, 0, 0.2) !important;
  backdrop-filter: blur(4px);
  transition: all 0.2s ease;
  width: 28px !important;
  height: 28px !important;
  min-width: 28px !important;
  min-height: 28px !important;
  color: white !important;
}

.favorite-btn:hover {
  background: rgba(0, 0, 0, 0.4) !important;
}

.favorite-btn:disabled {
  background: rgba(0, 0, 0, 0.1) !important;
  cursor: not-allowed;
}

.favorite-btn:disabled .v-icon {
  opacity: 0.5;
}

.favorite-btn:hover {
  background: rgba(0, 0, 0, 0.7) !important;
  transform: scale(1.1);
}

/* Hide favorite button on card hover (action icon available in overlay) */
.room-card:hover .favorite-btn {
  opacity: 0;
  pointer-events: none;
}

/* Text overlay (fades out on hover, no translateY) */
.text-overlay {
  position: absolute;
  bottom: 16px;
  left: 16px;
  right: 56px;
  z-index: 2;
  color: white;
  transition: opacity 0.3s ease;
}

.room-card:hover .text-overlay {
  opacity: 0;
  /* Simple fade out, no translateY */
}

.room-title {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  line-height: 1.2;
  margin-bottom: 2px;
}

.created-by {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 0.8rem;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
}

/* User count badge (always visible, fades out on hover) */
.user-count-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
  background: rgba(0, 0, 0, 0.4);
  padding: 4px 8px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  color: white;
  z-index: 2;
  transition: all 0.3s ease;
}

.user-count-badge.has-friends {
  background: rgba(76, 175, 80, 0.5);
  border: 1px solid rgba(76, 175, 80, 0.5);
  animation: pulse 2s ease-in-out infinite;
}

.room-card:hover .user-count-badge {
  opacity: 0;
  transform: translateY(10px);
}

.user-icon {
  color: white;
}

.friend-indicator {
  margin-left: 4px;
  animation: pulse 12s ease-in-out infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }

  5% {
    transform: scale(1.15);
  }

  10% {
    transform: scale(1);
  }

  15% {
    transform: scale(1.15);
  }

  20%,
  100% {
    transform: scale(1);
  }
}

/* Hover overlay (description + actions) */
.hover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom,
      rgba(0, 0, 0, 0.5) 0%,
      rgba(0, 0, 0, 0.7) 100%);
  backdrop-filter: blur(4px);
  opacity: 0;
  transform: translateY(100%);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.room-card:hover .hover-overlay {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.hover-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
}

/* Duplicate title/subtitle inside hover overlay */
.hover-header {
  color: white;
}

.room-title-hover {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  line-height: 1.2;
  margin-bottom: 4px;
  color: white;
}

.created-by-hover {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 0.8rem;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.9);
}

/* Description (middle section with ellipsis) */
.description-hover {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1.4;
  flex: 1;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
}

/* Action icons (bottom) */
.hover-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding-top: 8px;
  z-index: 10;
  position: relative;
}

.action-icon-wrapper {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: transform 0.2s ease;
}

.action-icon-wrapper:hover {
  transform: scale(1.15);
}

.action-icon {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  cursor: pointer;
}

.action-icon.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .text-overlay {
    bottom: 12px;
    left: 12px;
    right: 48px;
  }


  .room-title {
    font-size: 1rem;
  }

  .created-by {
    font-size: 0.75rem;
  }

  .hover-overlay {
    padding: 12px;
  }

  .description-hover {
    font-size: 0.8rem;
    -webkit-line-clamp: 3;
  }

  .hover-actions {
    gap: 8px;
  }
}
</style>
