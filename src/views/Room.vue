<template>
  <div class="home" @dragover.prevent @dragenter.prevent>
    <v-card>
      <v-img v-if="background !== ''" :src="background !== '' ? background : ''"
        class="white--text align-end" height="800">
        <Chatter v-for="{userId, avatar, nickname, rooms} in chatters" :userId="userId"
          :key="userId" :avatar="avatar" :nickname="nickname" :rooms="rooms" />
      </v-img>
      {{$route.params.id}}
    </v-card>
    <v-dialog v-if="privateRequestDialog" v-model="privateRequestDialog"
     persistent width="600"
      class="pa-5 ma-5 progress-dialog">
        <v-card style="width:100%">
          <v-card-title class="text-body-2">
          </v-card-title>
          <v-card-text style="height: 10vh;">
            {{ `User ${privateRequestuser.nickname} wants to start a private chat with you` }}
          </v-card-text>
          <v-card-actions class=" text-body-2 pa-2 d-flex justify-center align-center">
            <v-btn small class="px-10" color="primary darken-1" tile
              @click="confirmPrivateRequest();privateRequestDialog = false">
             Confirm</v-btn>
            <v-btn small class="px-10" color="primary darken-1" tile outlined
              @click="rejectPrivateRequest();privateRequestDialog = false">
            Reject</v-btn>
            <v-btn small class="px-10" color="primary darken-1" tile outlined
              @click="privateRequestDialog = false">
            Reject and block</v-btn>
          </v-card-actions>
        </v-card>
    </v-dialog>
  </div>
</template>

<script>
// @ is an alias to /src
import Chatter from '@/components/Chatter.vue';
import { mapState, mapActions } from 'vuex';

export default {
  name: 'Home',
  components: {
    Chatter,
  },
  props: {
    roomid: String,
  },
  computed: {
    ...mapState('rooms', ['userAdded', 'userExit', 'roomList']),
    ...mapState('user', ['userData', 'currentUser', 'requestedBy']),
  },

  data: () => ({
    innerHeight: '',
    chatters: [],
    initialUsers: [],
    isCurrentUser: false,
    background: '',
    privateRequestDialog: false,
    privateRequestuser: {},
  }),
  methods: {
    ...mapActions('user', ['getUserData']),
    ...mapActions('rooms', ['getRooms', 'pushUser', 'removeUser']),
    ...mapActions('messages', ['getDialogs', 'confirmPrivate']),
    async initUsers() {
      if (Object.keys(this.roomList).length > 0
       && Object.keys(this.roomList[this.$route.params.roomid].users).length > 0) {
        Object.keys(this.roomList[this.$route.params.roomid].users).forEach(async (roomUserID) => {
          const { userId } = this.roomList[this.$route.params.roomid].users[roomUserID];
          const userDataNew = await this.getUserData(userId);
          if (Object.keys(userDataNew).length > 0) {
            const chatter = this.userData[userId];
            this.chatters.push(chatter);
          }
        });
      }
    },
    confirmPrivateRequest() {
      this.confirmPrivate({
        requestedBy: this.requestedBy.userId,
        currentUser: Object.keys(this.currentUser)[0],
      });
      console.log(this.requestedBy);
      console.log(this.currentUser);
    },
  },
  mounted() {
    this.innerHeight = window.innerHeight;
    if (Object.keys(this.roomList).length === 0) {
      this.getRooms()
        .then(() => { this.background = this.roomList[this.$route.params.roomid].picture; });
    } else {
      this.background = this.roomList[this.$route.params.roomid].picture;
    }
    this.getDialogs(this.$route.params.roomid);
    this.initUsers();
  },
  beforeRouteLeave(from, to, next) {
    const userVal = Object.values(this.currentUser)[0];
    this.removeUser({
      userId: Object.keys(this.currentUser)[0],
      roomId: this.$route.params.roomid,
      roomUsersKey: userVal.rooms[this.$route.params.roomid].roomUsersKey,
    });
    next();
  },
  watch: {
    async userAdded(newUser) {
      if (newUser.roomId === this.$route.params.roomid) {
        const userDataNew = await this.getUserData(newUser.userId);
        if (Object.keys(userDataNew).length > 0) {
          this.chatters.push(await userDataNew);
        }
      }
    },
    async userExit(user) {
      if (user.roomId === this.$route.params.roomid) {
        const findUserIndex = (userId) => userId === user.userId;
        const userIdIndex = this.chatters.findIndex(findUserIndex);
        this.chatters.splice(userIdIndex, 1);
      }
    },
    requestedBy(user) {
      if (user) {
        this.privateRequestDialog = true;
        this.privateRequestuser = user;
      }
    },
  },
};
</script>
