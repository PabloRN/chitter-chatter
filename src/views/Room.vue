<template>
  <div class="home" @dragover.prevent
      @dragenter.prevent>
          <v-card>
            <v-img v-if="background !== ''"
              :src="background !== '' ? background : ''"
              class="white--text align-end"
              :height="innerHeight"
            >
            <Chatter v-for="{userId, avatar, nickname, rooms, position} in chatters"
              :userId="userId"
              :key="userId"
              :avatar="avatar"
              :nickname="nickname"
              :position="position"
              :rooms="rooms"/>
            </v-img>
            {{$route.params.id}}
          </v-card>
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
    ...mapState('rooms', ['userAdded', 'userExit', 'roomList', 'usersPosition']),
    ...mapState('authorization', ['userData', 'currentUser']),
  },

  data: () => ({
    innerHeight: '',
    chatters: [],
    initialUsers: [],
    isCurrentUser: false,
    background: '',
  }),
  methods: {
    ...mapActions('authorization', ['getUserData']),
    ...mapActions('rooms', ['getRooms', 'pushUser', 'removeUser', 'getPosition']),
    ...mapActions('messages', ['getDialogs']),
    async initUsers() {
      if (Object.keys(this.roomList).length > 0
       && Object.keys(this.roomList[this.$route.params.roomid].users).length > 0) {
        Object.keys(this.roomList[this.$route.params.roomid].users).forEach(async (roomUserID) => {
          const { userId } = this.roomList[this.$route.params.roomid].users[roomUserID];
          const userDataNew = await this.getUserData(userId);
          console.log(await userDataNew);
          if (Object.keys(userDataNew).length > 0) {
            const chatter = this.userData[userId];
            console.log(this.usersPosition);
            chatter.position = this.usersPosition[userId].position;
            console.log(chatter);
            this.chatters.push(chatter);
          }
        });
      }
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
    this.getPosition(this.$route.params.roomid);
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
  },
};
</script>
