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
              :userId="userId" :key="userId" :avatar="avatar" :nickname="nickname" :rooms="rooms" />
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
    initialUsers: Array,
  },
  computed: {
    ...mapState('rooms', ['userAdded']),
    ...mapState('authorization', ['userData']),
  },
  created() {
    this.innerHeight = window.innerHeight;
  },
  data: () => ({
    innerHeight: '',
    chatters: [],
  }),
  methods: {
    ...mapActions('authorization', ['getUserData']),

  },
  watch: {
    async userAdded(newUser) {
      if (newUser.roomId === this.roomid) {
        const userDataNew = await this.getUserData(newUser.userId);
        if (Object.keys(userDataNew).length > 0) {
          this.chatters.push(this.userData[newUser.userId]);
        }
      }
    },
  },
};
</script>
