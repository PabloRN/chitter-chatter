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
          <v-btn small class="px-10" color="primary darken-1" tile outlined @click="privateRequestDialog = false">
            Reject and block</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog persistent scrollable v-if="showDialog" v-model="showDialog" width="600" min-height="80vh"
      class="pa-5 ma-5 private-dialog">
      <PrivateDialogBubble @privateMessageClosed="privateMessageClosed" :message="pMessage" />
    </v-dialog>
    <TimeMachine style="position: fixed; bottom: 0; right: 0; overflow-y: scroll" />
  </div>
</template>

<script>
import ChatterComponent from '@/components/Chatter';
import TimeMachine from '@/components/TimeMachine';
import PrivateDialogBubble from '@/components/PrivateDialogBubble';
import useUserStore from '@/stores/user';
import useRoomsStore from '@/stores/rooms';
import useMessagesStore from '@/stores/messages';

export default {
  name: 'RoomComponent',
  components: {
    ChatterComponent,
    PrivateDialogBubble,
    TimeMachine,
  },
  props: {
    roomId: String,
  },
  setup() {
    const userStore = useUserStore();
    const roomsStore = useRoomsStore();
    const messagesStore = useMessagesStore();

    return {
      userStore,
      roomsStore,
      messagesStore,
    };
  },
  data: () => ({
    innerHeight: '',
    chatters: new Map(),
    initialUsers: [],
    background: '',
    privateRequestDialog: false,
    privateRequestUser: {},
    showDialog: false,
    pMessage: [],
    chattersCounter: 0,
    userInitialized: false,
  }),
  computed: {
    userAdded() { return this.roomsStore.userAdded; },
    userExit() { return this.roomsStore.userExit; },
    roomList() { return this.roomsStore.roomList; },
    avatarList() { return this.roomsStore.avatarsList; },
    currentRoom() { return this.roomsStore.currentRoom; },
    currentUser() { return this.userStore.currentUser; },
    requestedBy() { return this.userStore.requestedBy; },
    avatarUpdated() { return this.userStore.avatarUpdated; },
    usersSwitched() { return this.userStore.usersSwitched; },
    userData() { return this.userStore.userData; },
    signingInUpgraded() { return this.userStore.signingInUpgraded; },
    privateMessage() { return this.messagesStore.privateMessage; },
    privateUsers() { return this.messagesStore.privateUsers; },
    showMessagesStatus() { return this.messagesStore.showMessagesStatus; },
    getCurrentUser() { return this.userStore.getCurrentUser; },
    chattersArray() {
      return this.chattersCounter && Array.from(this.chatters);
    },
  },
  methods: {
    async initUsers() {
      setTimeout(async () => {
        if (
          Object.keys(this.currentRoom).length > 0
          && this.currentRoom.users
          && Object.keys(this.currentRoom.users).length > 0
        ) {
          const userIDs = Object.keys(this.currentRoom.users);
          // eslint-disable-next-line no-restricted-syntax
          for (const roomUserID of userIDs) {
            const { userId } = this.currentRoom.users[roomUserID];
            // eslint-disable-next-line no-await-in-loop
            const userDataNew = await this.userStore.getUserData(userId);
            if (Object.keys(userDataNew).length > 0) {
              this.chatters.set(userId, userDataNew);
              this.chattersCounter += 1;
            }
          }
        }
        this.tryPushUser();
      }, 100);
    },
    tryPushUser() {
      const user = this.getCurrentUser || this.currentUser;
      if (this.$route.params.roomId && user && user.userId && !this.userInitialized) {
        this.userInitialized = true;
        this.roomsStore.pushUser({ roomId: this.$route.params.roomId, userId: user.userId });
        this.roomsStore.getAvatars(this.$route.params.roomId);
      }
    },
    confirmPrivateRequest() {
      this.messagesStore.confirmPrivate({
        requestedBy: this.requestedBy.userId,
        currentUser: this.currentUser.userId,
      });
    },
    privateMessageClosed() {
      this.showDialog = false;
      this.messagesStore.closePrivate();
    },
  },
  created() {
    // eslint-disable-next-line max-len
  },
  mounted() {
    // eslint-disable-next-line max-len
    this.innerHeight = window.innerHeight;
    if (Object.keys(this.currentRoom).length === 0) {
      this.roomsStore.getRoomDetails(this.$route.params.roomId)
        // eslint-disable-next-line max-len
        .then(() => {
          this.background = this.currentRoom.picture;
          this.initUsers();
        });
    } else {
      this.background = this.currentRoom.picture;
      this.initUsers();
    }
    this.messagesStore.getDialogs(this.$route.params.roomId);
  },
  // beforeRouteLeave(from, to, next) {
  //   const userVal = Object.values(this.currentUser)[0];
  //   this.removeUser({
  //     userId: Object.keys(this.currentUser)[0],
  //     roomId: this.$route.params.roomId,
  //     roomUsersKey: userVal.rooms[this.$route.params.roomId].roomUsersKey,
  //   });
  //   next();
  // },
  watch: {
    async userAdded(newUser) {
      if (newUser && newUser?.roomId === this.$route.params.roomId) {
        const userDataNew = await this.userStore.getUserData(newUser.userId);
        if (Object.keys(userDataNew).length > 0) {
          this.chatters.set(newUser.userId, userDataNew);
          this.chattersCounter += 1;
        }
      }
    },
    async signingInUpgraded(newVal) {
      if (this.userData[this.usersSwitched.verifiedUser]) {
        const { rooms } = this.userData[this.usersSwitched.verifiedUser];
        if (newVal === true && Object.keys(rooms).length > 0) {
          if (Object.keys(rooms)[0] === this.$route.params.roomId) {
            const userDataNew = await this.getUserData(this.usersSwitched.verifiedUser);
            if (Object.keys(userDataNew).length > 0) {
              this.chatters.delete(this.usersSwitched.unverifiedUser);
              this.chatters.set(this.usersSwitched.verifiedUser, userDataNew);
              this.chattersCounter += 1;
            }
          }
        }
      }
    },
    userExit({ roomId, userId }) {
      if (roomId === this.$route.params.roomId) {
        this.chatters.delete(userId);
        this.chattersCounter -= 1;
      }
    },
    avatarUpdated({ url, userId }) {
      this.$nextTick(() => {
        const tempUser = this.chatters.get(userId);
        if (tempUser) {
          tempUser.avatar = url;
          this.chatters.set(userId, tempUser);
          this.chattersCounter += 1;
        }
      });
    },
    requestedBy(user) {
      if (user) {
        this.privateRequestDialog = true;
        this.privateRequestUser = user;
      }
    },
    privateMessage(newVal) {
      if (newVal) {
        this.showDialog = true;
        this.pMessage = [...newVal];
      }
    },
    async privateUsers(newVal) {
      if (newVal === null) {
        this.$nextTick(() => {
          this.showDialog = false;
        });
        this.messagesStore.cleanPrivateMessages();
        this.pMessage = [];
      }
    },
    currentUser(newUser) {
      if (newUser && newUser.userId && !this.userInitialized) {
        this.tryPushUser();
      }
    },
  },
};
</script>
<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap');

.closedialog {
  position: relative;
  top: 60px;
  left: 629px;
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
</style>
