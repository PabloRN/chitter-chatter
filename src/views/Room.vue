<!-- eslint-disable max-len -->
<!-- eslint-disable max-len -->
<template>
  <div class="home" @dragover.prevent @dragenter.prevent>
    <v-card>
      <v-img v-if="background !== ''" :src="background !== '' ? background : ''" class="white--text align-end"
        height="100vh">
        <Chatter v-for="[key, { userId, avatar, nickname }] in chattersArray" :userId="userId" :key="userId"
          :avatar="avatar" :nickname="nickname" :room="roomId" />
      </v-img>
      {{ $route.params.id }}
    </v-card>
    <v-dialog v-if="privateRequestDialog" v-model="privateRequestDialog" persistent width="600"
      class="pa-5 ma-5 progress-dialog">
      <v-card style="width:100%">
        <v-card-title class="text-body-2">
        </v-card-title>
        <v-card-text style="height: 10vh;">
          {{ `User ${privateRequestuser.nickname} wants to start a private chat with you` }}
        </v-card-text>
        <v-card-actions class=" text-body-2 pa-2 d-flex justify-center align-center">
          <v-btn small class="px-10" color="primary darken-1" tile
            @click="confirmPrivateRequest(); privateRequestDialog = false">
            Confirm</v-btn>
          <v-btn small class="px-10" color="primary darken-1" tile outlined
            @click="rejectPrivateRequest(); privateRequestDialog = false">
            Reject</v-btn>
          <v-btn small class="px-10" color="primary darken-1" tile outlined @click="privateRequestDialog = false">
            Reject and block</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog scrollable v-if="showDialog" v-model="showDialog" width="600" min-height="80vh"
      class="pa-5 ma-5 private-dialog">
      <PrivateDialogBubble @privateMessageClosed="privateMessageClosed" :message="pMessage" />
    </v-dialog>
  </div>
</template>

<script>
// @ is an alias to /src
import Chatter from '@/components/Chatter.vue';
import PrivateDialogBubble from '@/components/PrivateDialogBubble.vue';
import { mapState, mapActions } from 'vuex';

export default {
  name: 'Home',
  components: {
    Chatter,
    PrivateDialogBubble,
  },
  props: {
    roomId: String,
  },
  data: () => ({
    innerHeight: '',
    chatters: new Map(),
    initialUsers: [],
    isCurrentUser: false,
    background: '',
    privateRequestDialog: false,
    privateRequestuser: {},
    showDialog: false,
    pMessage: [],
    chattersCounter: 0,
  }),
  computed: {
    ...mapState('rooms', ['userAdded', 'userExit', 'roomList']),
    ...mapState('user', ['userData', 'currentUser', 'requestedBy']),
    ...mapState('messages', ['privateMessage', 'privateUsers']),
    chattersArray() {
      return this.chattersCounter && Array.from(this.chatters);
    },
  },
  methods: {
    ...mapActions('user', ['getUserData']),
    ...mapActions('rooms', ['getRooms', 'removeUser']),
    ...mapActions('messages', ['getDialogs', 'confirmPrivate', 'closePrivate', 'cleanPrivateMessages']),
    async initUsers() {
      if (
        Object.keys(this.roomList).length > 0
        && this.roomList[this.$route.params.roomId].users
        && Object.keys(this.roomList[this.$route.params.roomId].users).length > 0
      ) {
        const userIDs = Object.keys(this.roomList[this.$route.params.roomId].users);

        // eslint-disable-next-line no-restricted-syntax
        for (const roomUserID of userIDs) {
          const { userId } = this.roomList[this.$route.params.roomId].users[roomUserID];
          // eslint-disable-next-line no-await-in-loop
          const userDataNew = await this.getUserData(userId);
          if (Object.keys(userDataNew).length > 0) {
            this.chatters.set(userId, userDataNew);
            this.chattersCounter += 1;
          }
        }
      }
    },
    confirmPrivateRequest() {
      this.confirmPrivate({
        requestedBy: this.requestedBy.userId,
        currentUser: this.currentUser.userId,
      });
    },
    privateMessageClosed() {
      this.showDialog = false;
      this.closePrivate();
    },
  },
  mounted() {
    this.innerHeight = window.innerHeight;
    if (Object.keys(this.roomList).length === 0) {
      this.getRooms()
        // eslint-disable-next-line max-len
        .then(() => { this.background = this.roomList[this.$route.params.roomId].picture; this.initUsers(); });
    } else {
      this.background = this.roomList[this.$route.params.roomId].picture;
      this.initUsers();
    }
    this.getDialogs(this.$route.params.roomId);
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
      console.log('userAdded', newUser);
      if (newUser && newUser?.roomId === this.$route.params.roomId) {
        const userDataNew = await this.getUserData(newUser.userId);
        if (Object.keys(userDataNew).length > 0) {
          this.chatters.set(newUser.userId, userDataNew);
          this.chattersCounter += 1;
        }
      }
    },
    userExit({ roomId, userId }) {
      if (roomId === this.$route.params.roomId) {
        // const findUserIndex = (user) => userId === user;
        // const userIdIndex = this.chatters.findIndex(findUserIndex);
        this.chatters.delete(userId);
        this.chattersCounter -= 1;
      }
    },
    requestedBy(user) {
      if (user) {
        this.privateRequestDialog = true;
        this.privateRequestuser = user;
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
        this.cleanPrivateMessages();
        this.pMessage = [];
      }
    },
  },
};
</script>
<style scoped>
.closedialog {
  position: relative;
  top: 60px;
  left: 629px;
}
</style>
