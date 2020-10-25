<template>
  <div class="home" @dragover.prevent
      @dragenter.prevent>
          <v-card>
            <v-img
              :src="background"
              class="white--text align-end"
              :height="innerHeight"
            >
            <Chatter v-for="{userId, avatar, nickname, rooms} in chatters"
              :userId="userId"
              :key="userId"
              :avatar="avatar"
              :nickname="nickname"
              :rooms="rooms"
              :isCurrentUser="isCurrentUser" />
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
    background: String,
  },
  computed: {
    ...mapState('rooms', ['userAdded', 'roomList']),
    ...mapState('authorization', ['userData', 'currentUser']),
  },

  data: () => ({
    innerHeight: '',
    chatters: [],
    initialUsers: [],
    isCurrentUser: false,
  }),
  methods: {
    ...mapActions('authorization', ['getUserData']),
    ...mapActions('rooms', ['pushUser']),
    async initUsers() {
      if (Object.keys(this.roomList[this.roomid].users).length > 0) {
        Object.keys(this.roomList[this.roomid].users).forEach(async (roomUserID) => {
          const { userId } = this.roomList[this.roomid].users[roomUserID];
          const current = Object.keys(this.currentUser);
          this.isCurrentUser = userId === current[0];
          const userDataNew = await this.getUserData(userId);
          if (Object.keys(userDataNew).length > 0) {
            this.chatters.push(this.userData[userId]);
          }
        });
      }
    },
  },
  created() {
    this.innerHeight = window.innerHeight;
    this.initUsers();
  },
  mounted() {
    // const current = Object.keys(this.currentUser);
    // const currentData = Object.values(this.currentUser);

    // console.log(this.currentUser);
    // // eslint-disable-next-line max-len
    // this.chatters.push({ userId: current[0], ...currentData[0] });
    // console.log(this.chatters);
  },
  watch: {
    async userAdded(newUser) {
      if (newUser.roomId === this.roomid) {
        const userDataNew = await this.getUserData(newUser.userId);
        console.log(await userDataNew);
        if (Object.keys(userDataNew).length > 0) {
          this.chatters.push(this.userData[newUser.userId]);
          console.log(this.chatters);
        }
      }
    },
  },
};
</script>
