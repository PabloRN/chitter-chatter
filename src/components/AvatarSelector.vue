<template>
  <div class="text-center">
    <v-bottom-sheet v-model="sheet" width="70%">
      <v-sheet class="avatar-selector-sheet text-center">
        <div class="py-3">
          <h3 class="avatar-selector-title">Choose Your Character</h3>
          <div class="avatar-container">
            <!-- Navigation buttons -->
            <button class="nav-button nav-button-left" @click="previousSlide" :disabled="currentSlide === 0">
              <v-icon>mdi-chevron-left</v-icon>
            </button>
            <!-- Slider -->
            <div class="slider-wrapper">
              <div class="avatar-slider" ref="slider">
                <div class="slider-track" :style="{ transform: `translateX(-${currentSlide * slideWidth}px)` }">
                  <div v-for="(item, index) in avatarsList" :key="index" class="slider-item-custom"
                    @click="avatarSelected($event, item)" @touchstart="handleTouchStart" @touchmove="handleTouchMove"
                    @touchend="handleTouchEnd" tabindex="0" @keydown.enter.space="avatarSelected($event, item)"
                    role="button" aria-label="Select avatar">
                    <div class="avatar-card">
                      <div class="avatar-frame">
                        <div class="anime-sparkles">
                          <div class="sparkle sparkle-1"></div>
                          <div class="sparkle sparkle-2"></div>
                          <div class="sparkle sparkle-3"></div>
                          <div class="sparkle sparkle-4"></div>
                        </div>
                        <v-img contain class="avatar-image-selector" :src="item.url"></v-img>
                        <div class="manga-speed-lines"></div>
                      </div>
                      <div class="avatar-glow"></div>
                      <div class="anime-aura"></div>
                    </div>
                  </div>
                </div>
                <div v-if="avatarsList.length === 0" class="loading-text">Loading characters...</div>
              </div>
            </div>
            <button class="nav-button nav-button-right" @click="nextSlide" :disabled="currentSlide >= maxSlide">
              <v-icon>mdi-chevron-right</v-icon>
            </button>
          </div>
          <!-- Slide indicators -->
          <div class="slide-indicators">
            <div v-for="(dot, index) in totalDots" :key="index" class="indicator-dot"
              :class="{ active: index === currentSlide }" @click="goToSlide(index)"
              @keydown.enter.space="goToSlide(index)" tabindex="0" role="button" aria-label="Go to slide"></div>
          </div>
        </div>
      </v-sheet>
    </v-bottom-sheet>
  </div>
</template>
<script setup>
import {
  ref, computed, watch, onMounted, nextTick,
} from 'vue';
import useRoomsStore from '@/stores/rooms';
import useUserStore from '@/stores/user';

// Props
const props = defineProps({
  showAvatarSelector: {
    type: Boolean,
    default: false,
  },
  roomId: {
    type: String,
    default: null,
  },
});

// Emits
const emit = defineEmits(['onClose', 'onShowLoginDialog']);

// Stores
const roomsStore = useRoomsStore();
const userStore = useUserStore();

// Refs
const sheet = ref(false);
const itemSelectedUrl = ref('');
const currentSlide = ref(0);
const touchStartX = ref(0);
const touchStartTime = ref(0);
const isDragging = ref(false);
const slideWidth = ref(150); // Width of each slide including margin
const avatars = ref([]);
const isLoading = ref(false);

// Computed
const avatarsList = computed(() => {
  if (props.roomId) {
    // If we're in a specific room, try to get room-specific avatars first
    const room = roomsStore.roomList[props.roomId] || roomsStore.currentRoom;
    if (room?.allowedAvatars && room.allowedAvatars.length > 0) {
      return room.allowedAvatars.map((avatar, index) => ({
        avatarId: index,
        url: avatar.url || avatar.avatarURL,
        name: avatar.name,
      }));
    }
  }
  // Fallback to default room avatars
  return roomsStore.avatarsList;
});
const currentUser = computed(() => userStore.currentUser);
const signingInUpgraded = computed(() => userStore.signingInUpgraded);
const maxSlide = computed(() => Math.max(0, avatarsList.value.length - 1));
const totalDots = computed(() => avatarsList.value.length);

// Lifecycle
onMounted(async () => {
  // Load room-specific avatars if we have a roomId
  if (props.roomId) {
    try {
      await loadRoomAvatars();
    } catch (error) {
      console.warn('Failed to load room avatars, using defaults:', error);
    }
  }

  avatars.value = avatarsList.value;
  nextTick(() => {
    currentSlide.value = 0;
  });
});

// Watchers
watch(() => props.showAvatarSelector, (newVal) => {
  console.log('newVal', newVal);
  sheet.value = newVal;
});

watch(signingInUpgraded, (newVal, oldVal) => {
  console.log('🔍 AvatarSelector signingInUpgraded changed:', { newVal, oldVal, itemSelectedUrl: itemSelectedUrl.value });
  // Only trigger when signingInUpgraded changes from false to true
  if (newVal === true && oldVal === false && itemSelectedUrl.value !== '') {
    console.log('🎨 User upgraded, applying selected avatar:', itemSelectedUrl.value);
    setTimeout(() => {
      userStore.changeAvatar(itemSelectedUrl.value);
      // Close the avatar selector after successful avatar change
      console.log('🔄 Closing avatar selector');
      emit('onClose');
      // Reset the selected URL
      itemSelectedUrl.value = '';
    }, 1000);
  }
});

// Methods
async function loadRoomAvatars() {
  if (!props.roomId) return;

  try {
    const roomAvatars = await roomsStore.getRoomAvatars(props.roomId);
    // Update the room data if we got custom avatars
    if (roomAvatars && roomAvatars.length > 0) {
      const room = roomsStore.roomList[props.roomId];
      if (room) {
        room.allowedAvatars = roomAvatars;
      }
    }
  } catch (error) {
    console.warn('Failed to load room-specific avatars:', error);
  }
}

function setIsLoading(val) {
  isLoading.value = val;
}

function submit() {
  userStore.signUserIn();
}

function previousSlide() {
  if (currentSlide.value > 0) {
    currentSlide.value -= 1;
  }
}

function nextSlide() {
  if (currentSlide.value < maxSlide.value) {
    currentSlide.value += 1;
  }
}

function goToSlide(index) {
  currentSlide.value = index;
}

function handleTouchStart(e) {
  touchStartX.value = e.touches[0].clientX;
  touchStartTime.value = Date.now();
  isDragging.value = false;
}

function handleTouchMove(e) {
  if (Math.abs(e.touches[0].clientX - touchStartX.value) > 10) {
    isDragging.value = true;
    e.preventDefault();
  }
}

function handleTouchEnd(e) {
  const touchEndTime = Date.now();
  const touchDuration = touchEndTime - touchStartTime.value;
  if (isDragging.value || touchDuration > 300) {
    e.preventDefault();
    e.stopPropagation();
  }
  setTimeout(() => {
    isDragging.value = false;
  }, 100);
}

function avatarSelected(e, item) {
  if (isDragging.value) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }
  e.stopPropagation();
  e.preventDefault();
  if (!currentUser.value.isAnonymous) {
    userStore.changeAvatar(item.url);
    emit('onClose');
  } else {
    itemSelectedUrl.value = item.url;
    emit('onShowLoginDialog');
  }
}
</script>

<style scoped>
.avatar-selector-sheet {
  background: var(--selection-background) !important;
  border: 2px solid var(--avatar-border) !important;
  border-radius: 25px 25px 0 0 !important;
  color: var(--text-primary);
  position: relative;
  overflow: hidden;
  height: auto !important;
  min-height: 300px;
  padding-bottom: 10px !important;
}

.avatar-selector-sheet::before {
  content: '';
  position: absolute;
  top: -20%;
  left: -30%;
  right: -30%;
  bottom: -20%;
  background:
    /* radial-gradient(circle at 20% 30%, rgba(255, 107, 157, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(138, 43, 226, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 40% 80%, rgba(255, 20, 147, 0.2) 0%, transparent 50%),
    radial-gradient(circle at 60% 20%, rgba(138, 43, 226, 0.2) 0%, transparent 40%),
    radial-gradient(circle at 10% 60%, rgba(255, 20, 147, 0.3) 0%, transparent 45%), */
    linear-gradient(116deg, rgb(244, 117, 34) 32.01%, rgb(239, 68, 35) 67.87%);
  background-size: 200% 200%;
  background-position: center;
  animation: background-shift 8s ease-in-out infinite alternate;
  pointer-events: none;
}

@keyframes background-shift {
  0% {
    background-position: 0% 0%;
  }

  25% {
    background-position: 30% 20%;
  }

  50% {
    background-position: 70% 60%;
  }

  75% {
    background-position: 20% 80%;
  }

  100% {
    background-position: 100% 100%;
  }
}

.avatar-selector-title {
  font-family: 'Nanum Pen Script', cursive;
  font-size: 2.2rem;
  color: var(--text-primary);
  text-shadow: var(--shadow-light);
  margin-bottom: 1rem;
  font-weight: bold;
  position: relative;
  z-index: 2;
}

@keyframes title-glow {
  0% {
    text-shadow:
      0 0 10px rgba(255, 107, 157, 0.8),
      2px 2px 4px rgba(0, 0, 0, 0.8),
      0 0 20px rgba(255, 20, 147, 0.6);
  }

  100% {
    text-shadow:
      0 0 15px rgba(255, 107, 157, 1),
      2px 2px 4px rgba(0, 0, 0, 0.8),
      0 0 30px rgba(255, 20, 147, 0.8),
      0 0 40px rgba(138, 43, 226, 0.6);
  }
}

.avatar-container {
  width: 95%;
  margin: 0 auto;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
  gap: 10px;
}

.slider-wrapper {
  flex: 1;
  height: 100%;
  overflow: hidden;
  position: relative;
}

/* Custom slider styles */
.avatar-slider {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.slider-track {
  display: flex;
  height: 100%;
  transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  align-items: center;
}

.nav-button {
  background: var(--avatar-selected);
  border: var(--border-width) solid var(--avatar-border);
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-medium);
  z-index: 10;
  flex-shrink: 0;
}

.nav-button:hover:not(:disabled) {
  transform: scale(1.1);
  box-shadow: var(--shadow-heavy);
  background: var(--button-background-hover);
}

.nav-button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  transform: none;
}

.nav-button .v-icon {
  color: var(--button-text);
  font-size: 24px;
}

.slide-indicators {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 15px;
  z-index: 2;
  position: relative;
}

.indicator-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
}

.indicator-dot.active {
  background: var(--avatar-selected);
  transform: scale(1.2);
  box-shadow: var(--shadow-light);
}

.indicator-dot:hover {
  background: rgba(255, 255, 255, 0.6);
  transform: scale(1.1);
}

.slider-item-custom {
  width: 120px;
  height: 200px;
  margin: 0 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
}

.avatar-card {
  position: relative;
  width: 100px;
  height: 180px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.avatar-frame {
  position: relative;
  width: 90px;
  height: 160px;
  background: var(--avatar-background);
  border-radius: 20px;
  border: 3px solid var(--avatar-border);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: var(--shadow-medium);
  transition: all 0.4s ease;
}

.avatar-image-selector {
  width: 80px !important;
  height: 140px !important;
  object-fit: contain;
  transition: all 0.4s ease;
  filter: brightness(1.1) saturate(1.2);
  position: relative;
  z-index: 3;
}

.anime-sparkles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.sparkle {
  position: absolute;
  width: 6px;
  height: 6px;
  background: radial-gradient(circle, #fff 0%, rgba(255, 255, 255, 0) 70%);
  border-radius: 50%;
  opacity: 0;
  animation: sparkle-float 2.5s ease-in-out infinite;
}

.sparkle-1 {
  top: 15%;
  left: 20%;
  animation-delay: 0s;
}

.sparkle-2 {
  top: 25%;
  right: 15%;
  animation-delay: 0.8s;
}

.sparkle-3 {
  bottom: 30%;
  left: 15%;
  animation-delay: 1.2s;
}

.sparkle-4 {
  bottom: 20%;
  right: 25%;
  animation-delay: 1.8s;
}

@keyframes sparkle-float {

  0%,
  100% {
    opacity: 0;
    transform: scale(0) rotate(0deg);
  }

  50% {
    opacity: 1;
    transform: scale(1) rotate(180deg);
  }
}

.manga-speed-lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  background:
    repeating-linear-gradient(45deg,
      transparent,
      transparent 2px,
      rgba(255, 255, 255, 0.3) 2px,
      rgba(255, 255, 255, 0.3) 3px);
  transition: opacity 0.3s ease;
  pointer-events: none;
  z-index: 2;
}

.avatar-glow {
  position: absolute;
  top: -3px;
  left: -3px;
  right: -3px;
  bottom: -3px;
  background: linear-gradient(45deg, #ff6b9d, #8a2be2, #ff1493, #da70d6, #ff69b4);
  background-size: 300% 300%;
  border-radius: 23px;
  opacity: 0;
  transition: opacity 0.4s ease;
  z-index: -1;
  animation: gradient-shift 3s ease infinite;
}

.anime-aura {
  position: absolute;
  top: -8px;
  left: -8px;
  right: -8px;
  bottom: -8px;
  background: radial-gradient(circle, rgba(255, 107, 157, 0.4) 0%, transparent 70%);
  border-radius: 28px;
  opacity: 0;
  transition: all 0.4s ease;
  z-index: -2;
  filter: blur(8px);
}

@keyframes gradient-shift {
  0% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0% 50%;
  }
}

.avatar-card:hover {
  transform: scale(1.2) translateY(-15px) rotate(2deg);
  z-index: 10;
}

.avatar-card:hover .avatar-frame {
  border-image: linear-gradient(45deg, #ff1493, #ff69b4, #da70d6, #8a2be2) 1;
  box-shadow:
    0 15px 35px rgba(255, 20, 147, 0.4),
    0 0 30px rgba(255, 107, 157, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  animation: frame-pulse 1.5s ease-in-out infinite alternate;
}

.avatar-card:hover .avatar-glow {
  opacity: 1;
}

.avatar-card:hover .anime-aura {
  opacity: 1;
  transform: scale(1.1);
  animation: aura-pulse 2s ease-in-out infinite alternate;
}

.avatar-card:hover .manga-speed-lines {
  opacity: 0.6;
  animation: speed-lines 0.5s ease-out;
}

.avatar-card:hover .sparkle {
  animation-duration: 1.5s;
}

.avatar-card:hover .avatar-image-selector {
  transform: scale(1.1);
  filter: brightness(1.3) saturate(1.4) drop-shadow(0 0 10px rgba(255, 107, 157, 0.8));
}

.avatar-card:active {
  transform: scale(1.1) translateY(-8px) rotate(1deg);
}

.avatar-card:active .avatar-frame {
  border-image: linear-gradient(45deg, #ff0066, #ff1493, #da70d6) 1;
  box-shadow:
    0 8px 20px rgba(255, 0, 102, 0.5),
    0 0 25px rgba(255, 20, 147, 0.7);
}

@keyframes frame-pulse {
  0% {
    box-shadow:
      0 15px 35px rgba(255, 20, 147, 0.4),
      0 0 30px rgba(255, 107, 157, 0.6),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }

  100% {
    box-shadow:
      0 20px 45px rgba(255, 20, 147, 0.6),
      0 0 40px rgba(255, 107, 157, 0.8),
      inset 0 1px 0 rgba(255, 255, 255, 0.4);
  }
}

@keyframes aura-pulse {
  0% {
    filter: blur(8px);
    opacity: 1;
  }

  100% {
    filter: blur(12px);
    opacity: 0.7;
  }
}

@keyframes speed-lines {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }

  100% {
    opacity: 0.6;
    transform: scale(1);
  }
}

.loading-text {
  color: #fff;
  font-family: 'Nanum Pen Script', cursive;
  font-size: 1.8rem;
  text-shadow:
    0 0 10px rgba(255, 107, 157, 0.8),
    2px 2px 4px rgba(0, 0, 0, 0.8);
  animation: loading-glow 2s ease-in-out infinite alternate;
}

@keyframes loading-glow {
  0% {
    text-shadow:
      0 0 10px rgba(255, 107, 157, 0.8),
      2px 2px 4px rgba(0, 0, 0, 0.8);
  }

  100% {
    text-shadow:
      0 0 20px rgba(255, 107, 157, 1),
      2px 2px 4px rgba(0, 0, 0, 0.8),
      0 0 30px rgba(255, 20, 147, 0.6);
  }
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .avatar-selector-title {
    font-size: 1.8rem;
  }

  .avatar-container {
    height: 160px;
    gap: 5px;
  }

  .nav-button {
    width: 40px;
    height: 40px;
  }

  .nav-button .v-icon {
    font-size: 20px;
  }

  .slider-item-custom {
    width: 80px !important;
    margin: 0 10px !important;
  }

  .avatar-card {
    width: 70px;
    height: 120px;
  }

  .avatar-frame {
    width: 60px;
    height: 100px;
  }

  .avatar-image-selector {
    width: 50px !important;
    height: 80px !important;
  }

  .avatar-card:hover {
    transform: scale(1.15) translateY(-8px) rotate(1deg);
  }

  .sparkle {
    width: 4px;
    height: 4px;
  }

  .indicator-dot {
    width: 8px;
    height: 8px;
  }
}

@media (max-width: 480px) {
  .avatar-selector-sheet {
    min-height: 250px !important;
  }

  .avatar-container {
    height: 140px;
    gap: 3px;
  }

  .nav-button {
    width: 35px;
    height: 35px;
  }

  .nav-button .v-icon {
    font-size: 18px;
  }

  .slider-item-custom {
    width: 60px !important;
    height: 120px !important;
    margin: 0 8px !important;
  }

  .avatar-card {
    width: 50px;
    height: 100px;
  }

  .avatar-frame {
    width: 45px;
    height: 80px;
    border-radius: 15px;
  }

  .avatar-image-selector {
    width: 40px !important;
    height: 65px !important;
  }

  .avatar-glow {
    border-radius: 18px;
  }

  .anime-aura {
    border-radius: 23px;
  }

  .sparkle {
    width: 3px;
    height: 3px;
  }

  .indicator-dot {
    width: 6px;
    height: 6px;
  }

  .slide-indicators {
    margin-top: 10px;
    gap: 6px;
  }
}
</style>
