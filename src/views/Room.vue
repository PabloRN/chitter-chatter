<!-- eslint-disable max-len -->
<template>
  <div class="home" @dragover.prevent @dragenter.prevent>
    <v-card>
      <v-img v-if="background !== ''" :src="background !== '' ? background : ''" class="white--text align-end"
        height="100vh" cover>
        <chatter-component v-for="[key, { userId, avatar, nickname }] in chattersArray" :userId="userId" :key="key"
          :avatar="avatar" :nickname="nickname" :room="roomId" v-show="true" />
      </v-img>
      {{ $route.params.id }}
    </v-card>
    <v-dialog v-if="privateRequestDialog" v-model="privateRequestDialog" persistent width="600"
      class="pa-5 ma-5 progress-dialog">
      <v-card style="width: 100%">
        <v-card-title class="text-body-2"> </v-card-title>
        <v-card-text style="height: 10vh">
          {{ `User ${privateRequestUser.nickname} wants to start a private chat with you` }}
        </v-card-text>
        <v-card-actions class="text-body-2 pa-2 d-flex justify-center align-center">
          <v-btn small class="px-10" color="primary darken-1" tile @click="
            confirmPrivateRequest();
          privateRequestDialog = false;
          ">
            Confirm</v-btn>
          <v-btn small class="px-10" color="primary darken-1" tile outlined @click="
            rejectPrivateRequest();
          privateRequestDialog = false;
          ">
            Reject</v-btn>
          <v-btn small class="px-10" color="primary darken-1" tile outlined
            @click="rejectPrivateAndBlockUserRequest(); privateRequestDialog = false;">
            Reject and block</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog persistent scrollable v-if="showDialog" v-model="showDialog" width="600" min-height="80vh"
      class="pa-5 ma-5 private-dialog">
      <PrivateDialogBubble @privateMessageClosed="privateMessageClosed" :message="pMessage" />
    </v-dialog>
    <TimeMachine style="position: fixed; bottom: 0; right: 0; overflow-y: scroll" />
    <div class="theme-switcher-container">
      <v-speed-dial v-model="isOpen" location="top center" transition="fade-transition">
        <template v-slot:activator="{ props: activatorProps }">
          <v-fab v-bind="activatorProps" size="large" icon="mdi-dots-vertical"></v-fab>
        </template>
        <v-btn key="3" class="mx-2 speed-dial-menu-item" fab dark small @click.prevent.stop="handleEmit('exitRoom')"
          @touchstart.native.prevent="handleEmit('exitRoom')">
          <div>
            <v-icon class="manga-icon"> mdi-exit-to-app </v-icon>
          </div>
        </v-btn>
        <v-btn key="3" class="mx-2 speed-dial-menu-item" fab dark small @click.prevent.stop="handleEmit('reportRoom')"
          @touchstart.native.prevent="handleEmit('reportRoom')">
          <div>
            <v-icon class="manga-icon"> mdi-alarm-light </v-icon>
          </div>
        </v-btn>
        <v-btn key="4" class="mx-2 speed-dial-menu-item" fab dark small @click.prevent.stop="handleEmit('roomInfo')"
          @touchstart.native.prevent="handleEmit('roomInfo')">
          <div>
            <v-icon class="manga-icon"> mdi-information </v-icon>
          </div>
        </v-btn>

        <v-btn key="1" class="mx-2 speed-dial-menu-item" fab dark small @click.prevent.stop="handleEmit('showMessages')"
          @touchstart.native.prevent="handleEmit('showMessages')">
          <div>
            <v-icon class="manga-icon"> mdi-message-text-fast-outline </v-icon>
          </div>
        </v-btn>

        <v-btn :disabled="!isUserAuthenticated" key="2" class="mx-2 speed-dial-menu-item" fab dark small
          @click.prevent.stop="handleEmit('toggleFavorite')" @touchstart.native.prevent="handleEmit('toggleFavorite')">
          <div>
            <v-icon v-if="isFavorite" class="manga-icon"> mdi-heart-minus </v-icon>
            <v-icon v-else class="manga-icon">
              mdi-heart-plus </v-icon>
          </div>
        </v-btn>
      </v-speed-dial>
      <!-- <v-btn icon size="small" @click="showThemeSelector = !showThemeSelector" class="theme-toggle-btn">
        <v-icon>mdi-palette</v-icon>
      </v-btn>
      <v-menu v-model="showThemeSelector" :close-on-content-click="false" location="top">
        <template v-slot:activator="{ }">
        </template>
        <v-card min-width="200">
          <v-card-title class="text-body-2">Theme</v-card-title>
          <v-card-text>
            <v-radio-group v-model="currentTheme" @update:modelValue="setTheme">
              <v-radio v-for="theme in availableThemes" :key="theme.name" :label="theme.label" :value="theme.name"
                density="compact" />
            </v-radio-group>
          </v-card-text>
        </v-card>
      </v-menu> -->
    </div>
  </div>
</template>

<script setup>
import {
  ref, computed, onMounted, onBeforeUnmount, watch, nextTick,
} from 'vue';
import { getDatabase, ref as dbRef, set } from 'firebase/database';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import ChatterComponent from '@/components/Chatter';
import TimeMachine from '@/components/TimeMachine';
import PrivateDialogBubble from '@/components/PrivateDialogBubble';
import useUserStore from '@/stores/user';
import useRoomsStore from '@/stores/rooms';
import useMessagesStore from '@/stores/messages';
import useTheme from '@/composables/useTheme';

// Props
const props = defineProps({
  roomId: String,
});

// Composables
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const roomsStore = useRoomsStore();
const messagesStore = useMessagesStore();
const { currentTheme, availableThemes, setTheme } = useTheme();

// Reactive data
const innerHeight = ref('');
const chatters = ref(new Map());
const initialUsers = ref([]);
const background = ref('');
const privateRequestDialog = ref(false);
const privateRequestUser = ref({});
const showDialog = ref(false);
const pMessage = ref([]);
const chattersCounter = ref(0);
const showThemeSelector = ref(false);
const userInitialized = ref(false);
const isOpen = ref(false)

// Computed properties
const userAdded = computed(() => roomsStore.userAdded);
const isUserAuthenticated = computed(() => {
  return userStore.currentUser?.userId && !userStore.currentUser?.isAnonymous;
});
const userExit = computed(() => roomsStore.userExit);
const roomList = computed(() => roomsStore.roomList);
const avatarList = computed(() => roomsStore.avatarsList);
const currentRoom = computed(() => roomsStore.currentRoom);
const currentUser = computed(() => userStore.currentUser);
const requestedBy = computed(() => userStore.requestedBy);
const avatarUpdated = computed(() => userStore.avatarUpdated);
const usersSwitched = computed(() => userStore.usersSwitched);
const userData = computed(() => userStore.userData);
const signingInUpgraded = computed(() => userStore.signingInUpgraded);
const privateMessage = computed(() => messagesStore.privateMessage);
const privateUsers = computed(() => messagesStore.privateUsers);
const showMessagesStatus = computed(() => messagesStore.showMessagesStatus);
const getCurrentUser = computed(() => userStore.getCurrentUser);
const chattersArray = computed(() => {
  // Make this more reactive by accessing the properties that should trigger updates
  const avatarTrigger = avatarUpdated.value;
  const dataTrigger = userData.value;
  // Use the variables to avoid unused expression warnings
  return (avatarTrigger || dataTrigger || chattersCounter.value > 0) ? Array.from(chatters.value) : [];
});
const isFavorite = computed(() => getCurrentUser?.value?.favoriteRooms.some(room => room === props.roomId));
// Methods

const toggleMessages = () => {
  const currentStatus = messagesStore.showMessagesStatus;
  messagesStore.showMessages(!currentStatus);
};
const initUsers = async () => {
  setTimeout(async () => {
    if (
      Object.keys(currentRoom.value).length > 0
      && currentRoom.value.users
      && Object.keys(currentRoom.value.users).length > 0
    ) {
      const userIDs = Object.keys(currentRoom.value.users);
      for (const roomUserID of userIDs) {
        const { userId } = currentRoom.value.users[roomUserID];
        const userDataNew = await userStore.getUserData(userId);
        if (Object.keys(userDataNew).length > 0) {
          chatters.value.set(userId, userDataNew);
          chattersCounter.value += 1;
        }
      }
    }
  }, 100);
};

const tryPushUser = () => {
  const user = getCurrentUser.value || currentUser.value;
  const { roomId } = route.params;

  if (!roomId || !user || !user.userId || userInitialized.value) {
    return;
  }

  userInitialized.value = true;
  roomsStore.pushUser({ roomId, userId: user.userId });
  roomsStore.getAvatars(roomId);
};

const confirmPrivateRequest = () => {
  messagesStore.confirmPrivate({
    requestedBy: requestedBy.value.userId,
    currentUser: currentUser.value.userId,
  });
};
const rejectPrivateRequest = () => {
  messagesStore.rejectPrivate({
    requestedBy: requestedBy.value.userId,
    currentUser: currentUser.value.userId,
  });
};
const rejectPrivateAndBlockUserRequest = () => {
  rejectPrivateRequest();
  userStore.toggleBlockUser(
    requestedBy.value.userId,
  );
};


const privateMessageClosed = () => {
  showDialog.value = false;
  messagesStore.closePrivate();
};

const removeUser = ({ userId, roomId, roomUsersKey }) => {
  roomsStore.removeUser({
    userId,
    roomId,
    roomUsersKey,
    isAnonymous: false,
  });
};

const updateWindowSize = () => {
  innerHeight.value = window.innerHeight;
};

const handleEmit = (item) => {
  switch (item) {
    case 'privateMessage':
      emit('privateMessage');
      break;
    case 'exitRoom':
      leaveRoom()
      break;
    case 'toggleFavorite':

      toggleFavorite();
      isOpen.value = false
      break;
    case 'reportRoom':
      console.log('Report room');
      break;
    case 'showMessages':

      toggleMessages();
      isOpen.value = false
      break;
  }
};

const leaveRoom = () => {
  roomsStore.removeUser({
    userId: roomsStore.getCurrentUser?.value.userId,
    roomId: route.params.roomId,
    roomUsersKey: roomsStore.getCurrentUser?.value.rooms[route.params.roomId].roomUsersKey,
    isAnonymous: roomsStore.getCurrentUser?.value.isAnonymous,
  });
  messagesStore.cleanMessages();
  router.push({
    name: 'rooms',
  });
};

const toggleFavorite = async () => {
  if (isUserAuthenticated.value) {
    await userStore.toggleFavorite(props.roomId);
  }
};

// Lifecycle hooks
onMounted(async () => {
  innerHeight.value = window.innerHeight;
  window.addEventListener('resize', updateWindowSize);

  if (Object.keys(currentRoom.value).length === 0) {
    await roomsStore.getRoomDetails(route.params.roomId);
    background.value = currentRoom.value.picture;
  } else {
    background.value = currentRoom.value.picture;
  }

  // Wait for user to be available before trying to add them to room
  if (currentUser.value && currentUser.value.userId) {
    tryPushUser();
    initUsers();
  } else {
    // Fallback: Check for user every 500ms for up to 10 seconds
    let attempts = 0;
    const maxAttempts = 20;
    const checkUserInterval = setInterval(() => {
      attempts++;
      const user = getCurrentUser.value || currentUser.value;

      if (user && user.userId && !userInitialized.value) {
        clearInterval(checkUserInterval);
        tryPushUser();
        initUsers();
      } else if (attempts >= maxAttempts) {
        clearInterval(checkUserInterval);
      }
    }, 500);
  }

  messagesStore.getDialogs(route.params.roomId);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateWindowSize);
});

onBeforeRouteLeave((from, to, next) => {
  if (currentUser.value && currentUser.value.userId) {
    console.log('currentUser.value', currentUser.value);
    const { roomId } = route.params;
    const { userId } = currentUser.value;

    if (currentUser.value.rooms && currentUser.value.rooms[roomId]) {
      removeUser({
        userId,
        roomId,
        roomUsersKey: currentUser.value.rooms[roomId].roomUsersKey,
      });
    } else {
      console.log('no room');
    }
  } else {
    console.log('no user');
  }
  next();
});


// Watchers
watch(userAdded, async (newUser) => {
  if (newUser && newUser?.roomId === route.params.roomId) {
    const userDataNew = await userStore.getUserData(newUser.userId);
    if (Object.keys(userDataNew).length > 0) {
      chatters.value.set(newUser.userId, userDataNew);
      chattersCounter.value += 1;
    }
  }
});

watch(signingInUpgraded, async (newVal) => {
  if (userData.value[usersSwitched.value.verifiedUser]) {
    const { rooms } = userData.value[usersSwitched.value.verifiedUser];
    if (newVal === true && Object.keys(rooms).length > 0) {
      if (Object.keys(rooms)[0] === route.params.roomId) {
        const userDataNew = await userStore.getUserData(usersSwitched.value.verifiedUser);
        if (Object.keys(userDataNew).length > 0) {
          // Always update the chatters map for any user upgrade to show new avatar
          chatters.value.delete(usersSwitched.value.unverifiedUser);
          chatters.value.set(usersSwitched.value.verifiedUser, userDataNew);
          chattersCounter.value += 1;
        }
      }
    }
  }
});

// Also watch for other user upgrades specifically
watch(() => userStore.otherUserUpgraded, async (newVal) => {
  if (newVal) {
    // Another user in the room has upgraded, update their data
    const userDataNew = await userStore.getUserData(newVal.verifiedUser);
    if (Object.keys(userDataNew).length > 0) {
      chatters.value.delete(newVal.unverifiedUser);
      chatters.value.set(newVal.verifiedUser, userDataNew);
      chattersCounter.value += 1;
    }
  }
});

watch(userExit, ({ roomId, userId }) => {
  if (roomId === route.params.roomId) {
    chatters.value.delete(userId);
    chattersCounter.value -= 1;
  }
});

watch(avatarUpdated, ({ url, userId }) => {
  nextTick(() => {
    const tempUser = chatters.value.get(userId);
    if (tempUser) {
      tempUser.avatar = url;
      chatters.value.set(userId, tempUser);
      chattersCounter.value += 1;
    }
  });
});

watch(requestedBy, (user) => {
  if (user) {
    privateRequestDialog.value = true;
    privateRequestUser.value = user;
  }
});

watch(privateMessage, (newVal) => {
  if (newVal && newVal.length > 0) {
    showDialog.value = true;
    pMessage.value = [...newVal];
  }
});

watch(privateUsers, async (newVal) => {
  if (newVal === null) {
    nextTick(() => {
      showDialog.value = false;
    });
    messagesStore.cleanPrivateMessages();
    pMessage.value = [];
  }
});

// CRUCIAL: Watch for when currentUser becomes available and then add to room
watch(currentUser, (newUser, oldUser) => {
  if (newUser && newUser.userId && !userInitialized.value) {
    tryPushUser();
    initUsers();
  }
}, { immediate: true });

watch(currentRoom, (newRoom) => {
  // When room data becomes available, check if we need to add the user
  if (newRoom && Object.keys(newRoom).length > 0 && !userInitialized.value) {
    nextTick(() => {
      if (currentUser.value && currentUser.value.userId) {
        tryPushUser();
        initUsers();
      }
    });
  }
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap');

.closedialog {
  position: relative;
  top: 60px;
  left: 629px;
}

.v-btn.speed-dial-menu-item {
  background: var(--button-background) !important;
  border: var(--border-width) solid var(--button-border) !important;
  border-radius: 50% !important;
  width: 40px !important;
  height: 40px !important;
  min-width: 40px !important;

  .manga-icon {
    color: var(--button-text) !important;
    font-size: 18px !important;
  }

  &:hover {
    background: var(--button-background-hover) !important;
    border: var(--border-width-hover) solid var(--button-border) !important;

    .manga-icon {
      color: var(--button-text) !important;
    }
  }
}

.chatter {
  animation: flop 1s ease-in-out;
}

/* Clean dialog styling */
:deep(.v-card-text) {
  font-size: 1rem;
}

:deep(.v-btn) {
  font-size: 0.9rem;
}

/* Theme Switcher Styles */
.theme-switcher-container {
  position: fixed;
  bottom: 50px;
  right: 55px;
  z-index: 1001;
}

.theme-toggle-btn {
  background: var(--button-background) !important;
  border: var(--border-width) solid var(--button-border) !important;
  color: var(--button-text) !important;

  &:hover {
    background: var(--button-background-hover) !important;
  }
}
</style>
