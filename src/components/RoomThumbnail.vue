<!-- eslint-disable max-len -->
<template>
  <v-scroll-y-reverse-transition>
    <div class="room-card-container" @mouseenter="showPreview = true" @mouseleave="showPreview = false"
      @focusin="showPreview = true" @focusout="showPreview = false">
      <v-card @click="enterRoom(room, id)" class="mx-auto room-card">
        <v-img :src="room?.thumbnail ? room.thumbnail : room.picture" class="room-image" height="200px" :cover="true">
          <!-- Subtle gradient overlay for text visibility -->
          <div class="gradient-overlay"></div>
          <!-- Heart icon for favorites (top right) -->
          <v-btn @click.stop="toggleFavorite" class="favorite-btn" icon small :disabled="!isUserAuthenticated"
            :color="isFavorite ? 'red' : 'white'">
            <v-icon>{{ isFavorite ? 'mdi-heart' : 'mdi-heart-outline' }}</v-icon>
          </v-btn>
          <!-- Text overlay content -->
          <div class="text-overlay">
            <!-- Title and created by (left bottom) -->
            <div class="left-content">
              <div class="room-title">{{ room?.name }}</div>
              <div class="created-by">Created by {{ room?.createdBy || 'ToonsTalk' }}</div>
            </div>

            <!-- User count (right bottom) -->
            <div class="right-content">
              <div class="user-count">
                <v-icon class="user-icon" size="16">mdi-account-group</v-icon>
                <span>{{ usersOnline || 0 }}/{{ room?.maxUsers || 10 }}</span>
              </div>
            </div>
          </div>
        </v-img>
      </v-card>
    </div>
  </v-scroll-y-reverse-transition>

  <!-- TODO: Netflix-style hover preview - z-index conflicts with Vuetify components
       Need to investigate Vuetify's z-index system and find proper solution
       Current implementation works but may appear behind some Vuetify elements -->
  <!-- <v-card v-if="showPreview" class="hover-preview" elevation="8" @click="enterRoom(room, id)">
    <v-img :src="room?.thumbnail ? room.thumbnail : room.picture" height="120" cover>
      <div class="preview-gradient"></div>
    </v-img>
    <v-card-text class="preview-content">
      <div class="preview-title">{{ room?.nombre }}</div>
      <div class="preview-description">{{ room?.description || 'Join this amazing room and chat with other users!' }}</div>
      <div class="preview-stats">
        <span><v-icon size="14">mdi-account-group</v-icon> {{ usersOnline || 0 }}/{{ room?.maxUsers || 10 }}</span>
        <span class="ml-2">{{ room?.category || 'General' }}</span>
      </div>
    </v-card-text>
  </v-card> -->
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { getDatabase, ref as dbRef, update, get } from 'firebase/database';
import useRoomsStore from '@/stores/rooms';
import useUserStore from '@/stores/user';

// ✅ Props
const props = defineProps({
  id: String,
  room: Object,
});

// ✅ Stores
const roomsStore = useRoomsStore();
const userStore = useUserStore();
const router = useRouter();

// ✅ Local state
const showPreview = ref(false);

// ✅ Computed
const roomList = computed(() => roomsStore.roomList);
const usersOnlineNow = computed(() => roomsStore.usersOnlineNow);

const isUserAuthenticated = computed(() => {
  return userStore.currentUser?.userId && !userStore.currentUser?.isAnonymous;
});

const isFavorite = computed(() => {
  const favoriteRooms = userStore.currentUser?.favoriteRooms || [];
  return favoriteRooms.includes(props.id);
});

const usersOnline = computed(() => {
  return props.room?.usersOnline || 0;
});

// ✅ Methods
const enterRoom = (room, key) => {
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

.gradient-overlay {
  position: absolute;
  top: 120px;
  left: 0;
  right: 0;
  bottom: 0px;
  background: linear-gradient(to bottom, transparent 0%, transparent 20%, rgba(0, 0, 0, 0.2) 20%, rgba(0, 0, 0, 0.2) 100%);
  pointer-events: none;
  transition: top 0.3s ease, background 0.3s ease;
}


.room-card:hover .gradient-overlay {
  top: -50px;
  /* grow upwards */
  background: linear-gradient(to bottom,
      transparent 0%,
      transparent 20%,
      rgba(0, 0, 0, 0.2) 20%,
      rgba(0, 0, 0, 0.2) 100%);
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

.text-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  z-index: 1;
}

.left-content {
  flex: 1;
  color: white;
}

.room-title {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  line-height: 1.2;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
  margin-bottom: 2px;
}

.created-by {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 0.8rem;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
}

.right-content {
  color: white;
}

.user-count {
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
}

.user-icon {
  color: white;
}

/* Netflix-style hover preview */
.hover-preview {
  position: fixed !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  width: 300px;
  z-index: 2147483647 !important;
  cursor: pointer;
  animation: fadeInUp 0.3s ease-out;
  background: var(--card-background) !important;
  color: var(--text-primary) !important;
  border: 1px solid var(--card-border) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.16) !important;
  pointer-events: auto !important;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.9);
  }

  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

.preview-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom,
      transparent 0%,
      rgba(0, 0, 0, 0.4) 100%);
}

.preview-content {
  padding: 12px !important;
}

.preview-title {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--text-primary) !important;
}

.preview-description {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 0.85rem;
  color: var(--text-secondary) !important;
  line-height: 1.3;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.preview-stats {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 0.8rem;
  color: var(--text-secondary) !important;
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-stats span {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .hover-preview {
    display: none;
  }

  .text-overlay {
    padding: 12px;
  }

  .room-title {
    font-size: 1rem;
  }

  .created-by {
    font-size: 0.75rem;
  }
}
</style>
