<!-- eslint-disable max-len -->
<template>
  <div style="text-align: center" :class="isCurrentUser ? 'current-user' : 'user'" :id="actualUserId"
    :ref="actualUserId" @click="chatterClicked" tabindex="0" @keydown.enter="chatterClicked"
    @keydown.space="handleSpaceKey" role="button">
    <DialogBubble :ref="`$bubble_${actualUserId}`" :id="`$bubble_${actualUserId}`" :message="message"
      :class="dialogSide" />
    <div v-if="!isCurrentUser && actualUserId !== 'default_avatar_character_12345'" class="nicknameWrapper">
      <div class="nickname">{{ nickname }}</div>
    </div>
    <v-img contain :id="`img-${actualUserId}`" class="avatar-image" :src="avatar"></v-img>
    <RoundedMenu v-on="{
      ['privateMessage']: () => invitePrivate(),
      ['showUserMessages']: () => toggleUserMessages(),
    }" ref="roundedmenu" v-show="!isCurrentUser" />
    <RoundedMenuCurrent :moving="mouseMoved" ref="roundedmenucurrent" v-show="isCurrentUser" v-on="{
      ['exitRoom']: leaveRoom,
      ['signOut']: () => userSignOutCall(),
      ['showAvatarList']: () => (showAvatarSelector = !showAvatarSelector),
      ['showMessages']: () => toggleMessages(),
    }" />
    <TypeBox :ref="`keyboard_${actualUserId}`" :id="`keyboard_${actualUserId}`" v-if="isCurrentUser"
      :moving="mouseMoved" />
    <AvatarSelector :ref="`avatar-selector_${actualUserId}`" :id="`avatar-selector_${actualUserId}`"
      :showAvatarSelector="showAvatarSelector" @onClose="closeAvatarSelector"
      @onShowLoginDialog="showLoginDialogHandler" />
    <v-dialog persistent scrollable v-model="showLoginDialog" width="600" min-height="80vh"
      class="pa-5 ma-5 private-dialog">
      <LoginDialogBubble @onCloseLoginDialog="closeLoggingDialog" @onSavedNickName="updateNickName" />
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import TypeBox from '@/components/TypeBox';
import DialogBubble from '@/components/DialogBubble';
import RoundedMenu from '@/components/RoundedMenu';
import RoundedMenuCurrent from '@/components/RoundedMenuCurrent';
import AvatarSelector from '@/components/AvatarSelector';
import LoginDialogBubble from '@/components/LoginDialogBubble';
import useUserStore from '@/stores/user';
import useMessagesStore from '@/stores/messages';
import useRoomsStore from '@/stores/rooms';

const props = defineProps({
  userId: String,
  avatar: String,
  nickname: String,
  room: String,
});

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const messagesStore = useMessagesStore();
const roomsStore = useRoomsStore();

const showLoginDialog = ref(false);
const chatterManager = ref({});
const dialogs = ref('');
const expresion = reactive({
  default: true,
  angry: false,
  happy: false,
  sad: false,
  sorprise: false,
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
const touchMove = ref(false);
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

const getCurrentUser = computed(() => userStore.getCurrentUser);
const roomMessages = computed(() => messagesStore.roomMessages);
const usersPosition = computed(() => userStore.usersPosition);
const userPositionModified = computed(() => userStore.userPositionModified);
const userData = computed(() => userStore.userData);
const currentUser = computed(() => userStore.currentUser);
const isCurrentUser = computed(() => actualUserId.value === getCurrentUser.value?.userId);

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
    roomId: route.params.roomId,
    roomUsersKey: userVal.rooms[route.params.roomId].roomUsersKey,
    isAnonymous: getCurrentUser.value?.nickname === 'anonymous',
  });
  messagesStore.cleanMessages();
  router.push({
    name: 'rooms',
  });
};

const invitePrivate = () => {
  messagesStore.sendPrivateMessageRequest({
    currentUser: getCurrentUser.value?.userId,
    userId: actualUserId.value,
  });
};

const userSignOutCall = () => {
  const userVal = userData.value[actualUserId.value];
  roomsStore.removeUser({
    userId: actualUserId.value,
    roomId: route.params.roomId,
    roomUsersKey: userVal.rooms[route.params.roomId].roomUsersKey,
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
        const mousePosition = {
          x: e.clientX,
          y: e.clientY,
        };
        const avatarWidth = getAvatarWidth();
        const avatarHeight = getAvatarHeight();
        const newLeft = Math.max(0, Math.min(
          mousePosition.x + offset.value[0],
          windowWidth.value - avatarWidth,
        ));
        const newTop = Math.max(0, Math.min(
          mousePosition.y + offset.value[1],
          windowHeight.value - avatarHeight,
        ));
        userStore.changePosition({
          left: `${newLeft}px`,
          top: `${newTop}px`,
          userId: actualUserId.value,
        });
      }
    },
    true,
  );

  chatterManager.value.addEventListener(
    'mouseup',
    (e) => {
      if (e.target.tagName === 'INPUT' || e.target.closest('.v-text-field') || e.target.closest('input')) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      isDown.value = false;
    },
    true,
  );
  chatterManager.value.addEventListener(
    'touchstart',
    (e) => {
      touchstart.value = usersPosition.value;
      isDown.value = true;
      mouseMoved.value = false;
      offset.value = [
        chatterManager.value.offsetLeft - e.changedTouches[0].clientX,
        chatterManager.value.offsetTop - e.changedTouches[0].clientY,
      ];
    },
    true,
  );
  chatterManager.value.addEventListener('touchmove', (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    if (isDown.value && actualUserId.value === getCurrentUser.value.userId) {
      mouseMoved.value = true;
      const mousePosition = {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY,
      };
      const avatarWidth = getAvatarWidth();
      const avatarHeight = getAvatarHeight();
      const newLeft = Math.max(0, Math.min(
        mousePosition.x + offset.value[0],
        windowWidth.value - avatarWidth,
      ));
      const newTop = Math.max(0, Math.min(
        mousePosition.y + offset.value[1],
        windowHeight.value - avatarHeight,
      ));
      userStore.changePosition({
        left: `${newLeft}px`,
        top: `${newTop}px`,
        userId: actualUserId.value,
      });
    }
  });
  chatterManager.value.addEventListener(
    'touchend',
    () => {
      isDown.value = false;
    },
    true,
  );
};

const getAvatarWidth = () => 80;
const getAvatarHeight = () => 220;

const updateWindowSize = () => {
  windowHeight.value = window.innerHeight;
  windowWidth.value = window.innerWidth;

  if (chatterManager.value && usersPosition.value?.[actualUserId.value]?.position) {
    const currentLeft = parseInt(usersPosition.value[actualUserId.value].position.left, 10);
    const currentTop = parseInt(usersPosition.value[actualUserId.value].position.top, 10);

    const avatarWidth = getAvatarWidth();
    const avatarHeight = getAvatarHeight();
    const boundedLeft = Math.max(0, Math.min(currentLeft, windowWidth.value - avatarWidth));
    const boundedTop = Math.max(0, Math.min(currentTop, windowHeight.value - avatarHeight));

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
    chatterManager.value.style.left = left;
    chatterManager.value.style.top = top;
    dialogSide.value = actualUserId.value !== 'default_avatar_character_12345'
      ? findClosestDivPosition(actualUserId.value)
      : 'position-left';
  }
});
</script>

<style scoped>
.avatar-image {
  filter: drop-shadow(1px 2px 1px #424242);
  position: relative;
  object-fit: contain;
  z-index: 10;
  width: 80px;
  height: 220px;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* .v-image--cover {
  background-size: contain;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
} */
.chatter:hover {
  cursor: pointer;
}

.chatter {
  background-size: contain;
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
  top: -25px;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: center;
}

.nickname {
  color: #ffffff;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 1);
  font-family: 'Nanum Pen Script', cursive !important;
  font-size: 1.5em;
}

@media (max-width: 768px) {
  .nickname {
    font-size: 1.2em;
  }

  .avatar-image {
    width: 60px;
    height: 165px;
    min-height: 150px;
  }
}

@media (max-width: 480px) {
  .nickname {
    font-size: 1em;
  }

  .avatar-image {
    width: 45px;
    height: 124px;
    min-height: 110px;
  }
}
</style>
