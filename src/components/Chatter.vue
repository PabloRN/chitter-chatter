<!-- eslint-disable max-len -->
<template>
  <div style="text-align: center" :class="[isCurrentUser ? 'current-user' : 'user', { 'dragging-locally': isDraggingLocally }]"
    :id="actualUserId" :ref="actualUserId" @click="chatterClicked" tabindex="0"
    @keydown.enter="chatterClicked" @keydown.space="handleSpaceKey" role="button"
    :style="chatterTransformStyle">
    <div v-if="!isCurrentUser && actualUserId !== 'default_avatar_character_12345'" class="nicknameWrapper">
      <div v-if="!isCurrentUser" class="nickname">{{ nickname }}</div>
    </div>
    <div class="avatar-with-bubble">
      <DialogBubble :ref="`$bubble_${actualUserId}`" :id="`$bubble_${actualUserId}`" :message="message"
        :class="dialogSide" />
      <v-img contain :id="`img-${actualUserId}`" class="avatar-image" :class="{ 'avatar-dragging': isActuallyMoving }"
        :src="avatar"></v-img>
      <RoundedMenu v-if="!isCurrentUser" :userId="props.userId" :nickname="props.nickname"
        :avatar-dimensions="avatarDimensions" v-on="{
          ['privateMessage']: () => invitePrivate(),
          ['showUserMessages']: () => toggleUserMessages(),
          ['blockUser']: () => toggleBlockUser(),
          ['showLoginDialog']: () => showLoginDialogHandler(),
          ['userInfo']: () => showUserInfo(),
          ['addFriend']: () => onAddFriendClicked(),
        }" ref="roundedmenu" />
      <RoundedMenuCurrent v-else :moving="mouseMoved" ref="roundedmenucurrent" v-on="{
        ['exitRoom']: leaveRoom,
        ['signOut']: () => userSignOutCall(),
        ['showAvatarList']: () => (showAvatarSelector = !showAvatarSelector),
        ['showMessages']: () => toggleMessages(),
        ['showProfile']: () => showProfile(),
        ['showLoginDialog']: () => showLoginDialogHandler(),
      }" />
    </div>


    <TypeBox :ref="`keyboard_${actualUserId}`" :id="`keyboard_${actualUserId}`" v-if="isCurrentUser"
      :moving="mouseMoved" :avatar-dimensions="avatarDimensions" :roomId="props.roomId" />
    <AvatarSelector :ref="`avatar-selector_${actualUserId}`" :id="`avatar-selector_${actualUserId}`"
      :showAvatarSelector="showAvatarSelector" :roomId="props.roomId" @onClose="closeAvatarSelector"
      @onShowLoginDialog="showLoginDialogHandler" />
    <v-dialog persistent scrollable v-model="showLoginDialog" width="600" min-height="80vh"
      class="pa-5 ma-5 private-dialog">
      <LoginDialogBubble @onCloseLoginDialog="closeLoggingDialog" @onSavedNickName="updateNickName" />
    </v-dialog>
    <UserInfoCard v-model="showUserInfoDialog" :userId="props.userId" />
  </div>
</template>

<script setup>
import {
  ref, reactive, computed, onMounted, onUnmounted, watch, nextTick,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import TypeBox from '@/components/TypeBox';
import DialogBubble from '@/components/DialogBubble';
import RoundedMenu from '@/components/RoundedMenu';
import RoundedMenuCurrent from '@/components/RoundedMenuCurrent';
import AvatarSelector from '@/components/AvatarSelector';
import LoginDialogBubble from '@/components/LoginDialogBubble';
import UserInfoCard from '@/components/UserInfoCard';
import useUserStore from '@/stores/user';
import useMessagesStore from '@/stores/messages';
import useRoomsStore from '@/stores/rooms';
import { resolveRoomId } from '@/utils/slugResolver';

const props = defineProps({
  userId: String,
  avatar: String,
  nickname: String,
  roomId: String,
  roomIdOrSlug: String,
  isPanMode: Boolean, // True when room is being panned (mobile two-finger gesture)
});

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const messagesStore = useMessagesStore();
const roomsStore = useRoomsStore();
const showLoginDialog = ref(false);
const showUserInfoDialog = ref(false);
const chatterManager = ref({});
const dialogs = ref('');
const expresion = reactive({
  default: true,
  angry: false,
  happy: false,
  sad: false,
  surprise: false,
  inlove: false,
});
const dialogSide = ref('bubble-bottom-left');
const expresionList = ref([
  {
    icon: 'img/icons/smily-smile',
    name: 'smile',
  },
  {
    icon: 'img/icons/smily-inlove',
    name: 'inlove',
  },
  {
    icon: 'img/icons/smily-shocked',
    name: 'shocked',
  },
  {
    icon: 'img/icons/smily-sad',
    name: 'sad',
  },
  {
    icon: 'img/icons/smily-mad',
    name: 'mad',
  },
]);
const followedBy = ref([]);
const followingTo = ref([]);
const isDown = ref(false);
const keyboardClicked = ref(false);
const message = ref('');
const mouseMoved = ref(false);
const isActuallyMoving = ref(false);
const touchMove = ref(false);
let movementTimeout = null;
const openMenu = ref(false);
const touchend = ref('');
const touchstart = ref('');
const muted = ref(false);
const offset = ref([0, 0]);
const positionX = ref(0);
const positionY = ref(0);
const status = ref('');
const talking = ref(false);
const visible = ref('');
const pMessage = ref({});
const windowHeight = ref(0);
const windowWidth = ref(0);
const showAvatarSelector = ref(false);
const actualUserId = ref('');
const lastPosition = ref({ left: '', top: '' });
const avatarDimensions = ref({ width: 100, height: 240 });

// Virtual room dimensions (for mobile pan mode)
const ROOM_WIDTH = 2000;
const ROOM_HEIGHT = 2000;

// NEW: Drag optimization state
const dragVisualTransform = ref({ x: 0, y: 0 });
const isDraggingLocally = ref(false);
const initialMousePosition = ref({ x: 0, y: 0 });
const basePositionOnDragStart = ref({ left: 0, top: 0 });

const getCurrentUser = computed(() => userStore.getCurrentUser);
const roomMessages = computed(() => messagesStore.roomMessages);
const usersPosition = computed(() => userStore.usersPosition);
const userPositionModified = computed(() => userStore.userPositionModified);
const userData = computed(() => userStore.userData);
const currentUser = computed(() => userStore.currentUser);
// const isCurrentUser = computed(() => actualUserId.value === getCurrentUser.value?.userId);
const isCurrentUser = computed(() => props.userId === getCurrentUser.value?.userId);

// Check if mobile (simple detection)
const isMobile = computed(() => window.innerWidth <= 768);

// Max bounds for position (virtual room on mobile, viewport on desktop)
const maxWidth = computed(() => (isMobile.value ? ROOM_WIDTH : windowWidth.value));
const maxHeight = computed(() => (isMobile.value ? ROOM_HEIGHT : windowHeight.value));

// NEW: Computed style for drag transform
const chatterTransformStyle = computed(() => {
  if (isDraggingLocally.value && isCurrentUser.value) {
    return {
      transform: `translate(${dragVisualTransform.value.x}px, ${dragVisualTransform.value.y}px)`,
      willChange: 'transform',
    };
  }
  return {};
});

const updateNickName = () => {
  userStore.updateUserNickName();
  showLoginDialog.value = false;
};

const closeLoggingDialog = () => {
  showLoginDialog.value = false;
};

const closeAvatarSelector = () => {
  showAvatarSelector.value = false;
};

const showLoginDialogHandler = () => {
  showLoginDialog.value = true;
};

const showUserInfo = () => {
  showUserInfoDialog.value = true;
};

const onAddFriendClicked = async () => {
  // Check if user is authenticated
  if (getCurrentUser.value?.isAnonymous) {
    showLoginDialog.value = true;
    return;
  }

  try {
    await userStore.sendFriendRequest(props.userId);
    // Success - snackbar will be shown by the store
  } catch (error) {
    console.error('Failed to send friend request:', error);
    // Error snackbar will be shown by the store
  }
};

const handleSpaceKey = (e) => {
  if (document.activeElement === e.currentTarget) {
    e.preventDefault();
    chatterClicked(e);
  }
};

const keyboardCLicked = (e) => {
  e.preventDefault();
  e.stopPropagation();
  keyboardClicked.value = true;
};

const toggleMessages = () => {
  const currentStatus = messagesStore.showMessagesStatus;
  messagesStore.showMessages(!currentStatus);
};

const toggleUserMessages = () => {
  messagesStore.showUserMessages(props.userId);
};
const toggleBlockUser = () => {
  userStore.toggleBlockUser(props.userId);
};

function showProfile() {
  router.push({ name: 'profile' });
}

const findClosestDivPosition = (givenDivId) => {
  const divPositions = usersPosition.value;
  const givenDivPosition = divPositions[givenDivId];
  const givenDivLeft = parseFloat(givenDivPosition.position.left);
  const givenDivTop = parseFloat(givenDivPosition.position.top);

  const givenDivCenterX = givenDivLeft;
  const givenDivCenterY = givenDivTop;

  const closestDiv = { id: null, distance: Number.MAX_SAFE_INTEGER };

  Object.entries(divPositions).map(([id, { position }]) => {
    if (id && position && id !== givenDivId) {
      const divLeft = parseFloat(position.left);
      const divTop = parseFloat(position.top);
      const divCenterX = divLeft;
      const divCenterY = divTop;

      const horizontalDistance = Math.abs(givenDivCenterX - divCenterX);
      const verticalDistance = Math.abs(givenDivCenterY - divCenterY);

      const distance = Math.sqrt(horizontalDistance ** 2 + verticalDistance ** 2);

      if (distance < closestDiv.distance) {
        closestDiv.id = id;
        closestDiv.distance = distance;
      }
    }
    return position;
  });

  if (closestDiv.id !== null && closestDiv.id !== givenDivId) {
    const closestDivLeft = parseFloat(divPositions[closestDiv.id].position.left);
    if (closestDivLeft > givenDivLeft) {
      return 'position-left';
    }
    return 'position-right';
  }
  return 'position-right';
};

const changeExpresion = () => { };
const beInvisible = () => { };
const changeStatus = () => { };

const leaveRoom = () => {
  const userVal = userData.value[actualUserId.value];
  isDown.value = false;
  mouseMoved.value = false;
  roomsStore.removeUser({
    userId: actualUserId.value,
    roomId: props.roomId,
    roomUsersKey: userVal.rooms[props.roomId].roomUsersKey,
    isAnonymous: getCurrentUser.value?.nickname === 'anonymous',
  });
  messagesStore.cleanMessages();
  router.push({
    name: 'rooms',
  });
};

const invitePrivate = () => {
  if (getCurrentUser.value?.isAnonymous) {
    showLoginDialog.value = true;
    return;
  }
  messagesStore.sendPrivateMessageRequest({
    currentUser: getCurrentUser.value?.userId,
    userId: actualUserId.value,
  });
};

const userSignOutCall = () => {
  const userVal = userData.value[actualUserId.value];
  roomsStore.removeUser({
    userId: actualUserId.value,
    roomId: props.roomId,
    roomUsersKey: userVal.rooms[props.roomId].roomUsersKey,
    isAnonymous: getCurrentUser.value?.nickname === 'anonymous',
  });
  userStore.userSignOut(actualUserId.value);
  messagesStore.cleanMessages();
};

const chatterClicked = (e) => {
  e.preventDefault();
  e.stopPropagation();
  isDown.value = false;
};

const initUserData = (userId) => {
  actualUserId.value = userId;
  nextTick(() => {
    isDown.value = false;
    chatterManager.value = document.getElementById(actualUserId.value);
    if (chatterManager.value) {
      const usersPositionTemp = JSON.parse(JSON.stringify(usersPosition.value));
      chatterManager.value.style.position = 'absolute';
      setTimeout(() => {
        if (
          usersPositionTemp[actualUserId.value]
          && usersPositionTemp[actualUserId.value]?.position?.left
          && usersPositionTemp[actualUserId.value]?.position?.top
        ) {
          userStore.initPosition({
            left: usersPositionTemp[actualUserId.value]?.position?.left,
            top: usersPositionTemp[actualUserId.value]?.position?.top,
            userId,
          });
        } else {
          userStore.initPosition({
            left: '50px',
            top: '50px',
            userId,
          });
        }
        if (usersPosition.value[userId] && usersPosition.value[userId].position) {
          const { left, top } = usersPosition.value[userId].position;
          chatterManager.value.style.left = left;
          chatterManager.value.style.top = top;
        }
      }, 3000);

      addEventListeners();
    }
  });
};

const addEventListeners = () => {
  chatterManager.value.addEventListener(
    'mousedown',
    (e) => {
      if (e.target.tagName === 'INPUT' || e.target.closest('.v-text-field') || e.target.closest('input')) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      isDown.value = true;
      mouseMoved.value = false;

      // NEW: Capture base position and start drag optimization
      if (actualUserId.value === getCurrentUser.value.userId) {
        const currentLeft = chatterManager.value.style.left || '0px';
        const currentTop = chatterManager.value.style.top || '0px';

        basePositionOnDragStart.value = {
          left: parseInt(currentLeft, 10),
          top: parseInt(currentTop, 10),
        };

        initialMousePosition.value = {
          x: e.clientX,
          y: e.clientY,
        };

        isDraggingLocally.value = true;
        dragVisualTransform.value = { x: 0, y: 0 };

        userStore.startDragging({
          left: currentLeft,
          top: currentTop,
          userId: actualUserId.value,
        });

        console.log('🎯 Mouse down - Starting drag', { currentLeft, currentTop });
      }

      offset.value = [
        chatterManager.value.offsetLeft - e.clientX,
        chatterManager.value.offsetTop - e.clientY,
      ];
    },
    true,
  );
  chatterManager.value.addEventListener(
    'mousemove',
    (e) => {
      if (e.target.tagName === 'INPUT' || e.target.closest('.v-text-field') || e.target.closest('input')) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      if (isDown.value && actualUserId.value === getCurrentUser.value.userId) {
        mouseMoved.value = true;
        isActuallyMoving.value = true;

        // Clear existing timeout and set new one
        // NOTE: Animation is 0.4s, so keep wobble for at least one full cycle
        if (movementTimeout) clearTimeout(movementTimeout);
        movementTimeout = setTimeout(() => {
          isActuallyMoving.value = false;
        }, 400);

        // NEW: Calculate delta from initial mouse position
        const deltaX = e.clientX - initialMousePosition.value.x;
        const deltaY = e.clientY - initialMousePosition.value.y;

        // Apply bounds to the FINAL position (base + delta)
        const avatarWidth = getAvatarWidth();
        const avatarHeight = getAvatarHeight();

        const tentativeFinalLeft = basePositionOnDragStart.value.left + deltaX;
        const tentativeFinalTop = basePositionOnDragStart.value.top + deltaY;

        const boundedFinalLeft = Math.max(0, Math.min(
          tentativeFinalLeft,
          maxWidth.value - avatarWidth,
        ));
        const boundedFinalTop = Math.max(0, Math.min(
          tentativeFinalTop,
          maxHeight.value - avatarHeight,
        ));

        // Calculate bounded delta
        const boundedDeltaX = boundedFinalLeft - basePositionOnDragStart.value.left;
        const boundedDeltaY = boundedFinalTop - basePositionOnDragStart.value.top;

        // NEW: Update transform only (NO DB write, NO style.left/top update)
        dragVisualTransform.value = { x: boundedDeltaX, y: boundedDeltaY };

        // REMOVED: userStore.changePosition() - NO DB WRITES during drag!
      }
    },
    true,
  );

  chatterManager.value.addEventListener(
    'mouseup',
    async (e) => {
      if (e.target.tagName === 'INPUT' || e.target.closest('.v-text-field') || e.target.closest('input')) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      isDown.value = false;

      // NEW: Finalize drag with single DB write
      if (actualUserId.value === getCurrentUser.value.userId && isDraggingLocally.value) {
        // Calculate final position (base + delta)
        const finalLeft = basePositionOnDragStart.value.left + dragVisualTransform.value.x;
        const finalTop = basePositionOnDragStart.value.top + dragVisualTransform.value.y;

        // CRITICAL: Update DOM position BEFORE clearing transform to prevent jump
        chatterManager.value.style.left = `${finalLeft}px`;
        chatterManager.value.style.top = `${finalTop}px`;

        // Clear drag state (transform is now redundant since DOM position is set)
        isDraggingLocally.value = false;
        dragVisualTransform.value = { x: 0, y: 0 };

        // Write final position to DB (ONLY write during entire drag session)
        await userStore.finalizeDragPosition({
          left: `${finalLeft}px`,
          top: `${finalTop}px`,
          userId: actualUserId.value,
        });

        console.log('✅ Mouse up - Finalized drag', { finalLeft, finalTop });
      }

      setTimeout(() => {
        mouseMoved.value = false;
      }, 100);
    },
    true,
  );
  chatterManager.value.addEventListener(
    'touchstart',
    (e) => {
      // Skip if room is being panned or multi-finger touch
      if (props.isPanMode || e.touches.length !== 1) return;

      touchstart.value = usersPosition.value;
      isDown.value = true;
      mouseMoved.value = false;

      // NEW: Capture base position and start drag optimization (same as mousedown)
      if (actualUserId.value === getCurrentUser.value.userId) {
        const currentLeft = chatterManager.value.style.left || '0px';
        const currentTop = chatterManager.value.style.top || '0px';

        basePositionOnDragStart.value = {
          left: parseInt(currentLeft, 10),
          top: parseInt(currentTop, 10),
        };

        initialMousePosition.value = {
          x: e.changedTouches[0].clientX,
          y: e.changedTouches[0].clientY,
        };

        isDraggingLocally.value = true;
        dragVisualTransform.value = { x: 0, y: 0 };

        userStore.startDragging({
          left: currentLeft,
          top: currentTop,
          userId: actualUserId.value,
        });

        console.log('🎯 Touch start - Starting drag', { currentLeft, currentTop });
      }

      offset.value = [
        chatterManager.value.offsetLeft - e.changedTouches[0].clientX,
        chatterManager.value.offsetTop - e.changedTouches[0].clientY,
      ];
    },
    true,
  );
  chatterManager.value.addEventListener('touchmove', (e) => {
    // Skip if room is being panned or multi-finger touch
    if (props.isPanMode || e.touches.length !== 1) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    if (isDown.value && actualUserId.value === getCurrentUser.value.userId) {
      mouseMoved.value = true;
      isActuallyMoving.value = true;

      // Clear existing timeout and set new one
      // NOTE: Animation is 0.4s, so keep wobble for at least one full cycle
      if (movementTimeout) clearTimeout(movementTimeout);
      movementTimeout = setTimeout(() => {
        isActuallyMoving.value = false;
      }, 400);

      // NEW: Calculate delta from initial touch position (same as mousemove)
      const deltaX = e.changedTouches[0].clientX - initialMousePosition.value.x;
      const deltaY = e.changedTouches[0].clientY - initialMousePosition.value.y;

      // Apply bounds to the FINAL position (base + delta)
      const avatarWidth = getAvatarWidth();
      const avatarHeight = getAvatarHeight();

      const tentativeFinalLeft = basePositionOnDragStart.value.left + deltaX;
      const tentativeFinalTop = basePositionOnDragStart.value.top + deltaY;

      const boundedFinalLeft = Math.max(0, Math.min(
        tentativeFinalLeft,
        maxWidth.value - avatarWidth,
      ));
      const boundedFinalTop = Math.max(0, Math.min(
        tentativeFinalTop,
        maxHeight.value - avatarHeight,
      ));

      // Calculate bounded delta
      const boundedDeltaX = boundedFinalLeft - basePositionOnDragStart.value.left;
      const boundedDeltaY = boundedFinalTop - basePositionOnDragStart.value.top;

      // NEW: Update transform only (NO DB write)
      dragVisualTransform.value = { x: boundedDeltaX, y: boundedDeltaY };

      // REMOVED: userStore.changePosition() - NO DB WRITES during drag!
    }
  });
  chatterManager.value.addEventListener(
    'touchend',
    async () => {
      isDown.value = false;

      // NEW: Finalize drag with single DB write (same as mouseup)
      if (actualUserId.value === getCurrentUser.value.userId && isDraggingLocally.value) {
        // Calculate final position (base + delta)
        const finalLeft = basePositionOnDragStart.value.left + dragVisualTransform.value.x;
        const finalTop = basePositionOnDragStart.value.top + dragVisualTransform.value.y;

        // CRITICAL: Update DOM position BEFORE clearing transform to prevent jump
        chatterManager.value.style.left = `${finalLeft}px`;
        chatterManager.value.style.top = `${finalTop}px`;

        // Clear drag state (transform is now redundant since DOM position is set)
        isDraggingLocally.value = false;
        dragVisualTransform.value = { x: 0, y: 0 };

        // Write final position to DB (ONLY write during entire drag session)
        await userStore.finalizeDragPosition({
          left: `${finalLeft}px`,
          top: `${finalTop}px`,
          userId: actualUserId.value,
        });

        console.log('✅ Touch end - Finalized drag', { finalLeft, finalTop });
      }

      setTimeout(() => {
        mouseMoved.value = false;
      }, 100);
    },
    true,
  );
};

const getAvatarWidth = () => avatarDimensions.value.width;
const getAvatarHeight = () => avatarDimensions.value.height;

const updateAvatarDimensions = () => {
  const imgElement = document.getElementById(`img-${actualUserId.value}`);
  if (imgElement) {
    const rect = imgElement.getBoundingClientRect();
    avatarDimensions.value = {
      width: Math.max(50, Math.ceil(rect.width)),
      height: Math.max(120, Math.ceil(rect.height)),
    };
  }
};

const updateWindowSize = () => {
  windowHeight.value = window.innerHeight;
  windowWidth.value = window.innerWidth;

  updateAvatarDimensions();

  if (chatterManager.value && usersPosition.value?.[actualUserId.value]?.position) {
    const currentLeft = parseInt(usersPosition.value[actualUserId.value].position.left, 10);
    const currentTop = parseInt(usersPosition.value[actualUserId.value].position.top, 10);

    const avatarWidth = getAvatarWidth();
    const avatarHeight = getAvatarHeight();
    const boundedLeft = Math.max(0, Math.min(currentLeft, maxWidth.value - avatarWidth));
    const boundedTop = Math.max(0, Math.min(currentTop, maxHeight.value - avatarHeight));

    if (boundedLeft !== currentLeft || boundedTop !== currentTop) {
      userStore.changePosition({
        left: `${boundedLeft}px`,
        top: `${boundedTop}px`,
        userId: actualUserId.value,
      });
    }
  }
};

onMounted(async () => {
  isDown.value = false;
  windowHeight.value = window.innerHeight;
  windowWidth.value = window.innerWidth;
  updateWindowSize();
  window.addEventListener('resize', updateWindowSize);

  initUserData(props.userId);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateWindowSize);
});

watch(showLoginDialog, (newVal, oldVal) => {
  console.log('🏠 Chatter showLoginDialog changed:', { newVal, oldVal, userId: actualUserId.value });
});

watch(roomMessages, (newVal) => {
  if (newVal.length > 0) {
    const lastMessage = newVal[newVal.length - 1];
    if (lastMessage.userId === actualUserId.value) {
      message.value = lastMessage.text;
    }
  }
});

watch(userPositionModified, () => {
  if (usersPosition.value[actualUserId.value] && usersPosition.value[actualUserId.value].position) {
    const { left, top } = usersPosition.value[actualUserId.value].position;

    // Check if position actually changed
    if (left !== lastPosition.value.left || top !== lastPosition.value.top) {
      // Position changed, trigger wobble animation
      isActuallyMoving.value = true;

      // Clear existing timeout and set new one
      // NOTE: Animation is 0.4s, transition is 0.3s, so keep wobble for full animation
      if (movementTimeout) clearTimeout(movementTimeout);
      movementTimeout = setTimeout(() => {
        isActuallyMoving.value = false;
      }, 400);

      // Update last position
      lastPosition.value = { left, top };
    }

    // CRITICAL: Skip DOM update for current user (already updated on mouseup/touchend)
    if (!isCurrentUser.value) {
      chatterManager.value.style.left = left;
      chatterManager.value.style.top = top;
    }

    dialogSide.value = actualUserId.value !== 'default_avatar_character_12345'
      ? findClosestDivPosition(actualUserId.value)
      : 'position-left';
  }
});

watch(() => props.avatar, async (newAvatar) => {
  if (newAvatar) {
    await nextTick();
    const imgElement = document.getElementById(`img-${actualUserId.value}`);
    if (imgElement) {
      if (imgElement.complete) {
        updateAvatarDimensions();
      } else {
        imgElement.addEventListener('load', updateAvatarDimensions, { once: true });
      }
    }
  }
}, { immediate: true });
</script>

<style scoped>
@keyframes southpark-wobble {
  0% {
    transform: rotate(-3deg) scale(1.01);
  }

  25% {
    transform: rotate(3deg) scale(0.99);
  }

  50% {
    transform: rotate(-3deg) scale(1.01);
  }

  75% {
    transform: rotate(3deg) scale(0.99);
  }

  100% {
    transform: rotate(-3deg) scale(1.01);
  }
}

/* NEW: Smooth transitions for remote user movement ONLY */
.user:not(.dragging-locally) {
  transition: left 0.5s ease-out, top 0.5s ease-out;
}

/* Current user: no transition (already moved smoothly with transform) */
.current-user {
  transition: none;
}

.avatar-image {
  filter: drop-shadow(0.1px 0.2px 0.1px #c1c0c0);
  position: relative;
  /* Flexible sizing within bounds */
  height: auto;
  width: auto;
  min-height: 140px;
  max-height: 240px;
  min-width: 100px;
  max-width: min(180px, 12vw);
  object-fit: contain !important;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.avatar-image.avatar-dragging {
  animation: southpark-wobble 0.4s ease-in-out infinite;
}

.avatar-with-bubble {
  position: relative;
  display: inline-block;
}

.v-image--cover {
  background-size: contain;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.chatter:hover {
  cursor: pointer;
}

.chatter {
  object-fit: contain !important;
}

.private-dialog {
  height: 80vh;
}

.current-user {
  z-index: 990;
}

.user {
  z-index: 980;
}

.nicknameWrapper {
  position: absolute;
  top: -35px;
  left: -5px;
  width: 100%;
  display: flex;
  justify-content: center;
  width: 120%;
}

.nickname {
  color: #ffffff;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 1);
  font-family: 'Nanum Pen Script', cursive !important;
  font-size: 1.5em;
  width: 120%;
  border: 2px solid #ffffff;
  background-color: rgba(0, 0, 0, 0.5);
  text-align: center;
  display: inline-block;
}

@media (max-width: 768px) {
  .nickname {
    font-size: 1.4em;
  }

  .avatar-image {
    /* Keep normal size since we have virtual room (2000x2000px) */
    min-height: 140px;
    max-height: 240px;
    min-width: 100px;
    max-width: 180px;
  }
}

@media (max-width: 480px) {
  .nickname {
    font-size: 1.3em;
  }

  .avatar-image {
    /* Keep normal size since we have virtual room (2000x2000px) */
    min-height: 140px;
    max-height: 240px;
    min-width: 100px;
    max-width: 180px;
  }
}
</style>
