<!-- eslint-disable max-len -->
<template>
  <div class="home">
    <v-app-bar dense elevation="4" rounded shaped>
      <v-toolbar-title style="display: flex; justify-content: flex-start">
        <v-img
          :src="require('../assets/logotype_landing_page.png')"
          class="my-3"
          contain
          width="6em"
          height="35"
          style="background-position: left!important;"
        />
      </v-toolbar-title>
    </v-app-bar>
    <div class="d-flex flex-nowrap flex-direction-row pa-2">
      <div class="panel-container">
        <div class="panel" v-for="(room, key) in getAllRooms" :key="key"
         :style="getRandomFlexBasis()">
          <RoomThumbnail :room="room" :id="key" :key="key" />
        </div>
      </div>
      <div class="panel" style="width: 25%; height: 80vh;">
        <Chatter v-for="[key, { userId, avatar, nickname }] in chattersArray" :userId="userId" :key="userId"
        :avatar="avatar" :nickname="nickname" :room="roomId" v-show="true"/>
      </div>
    </div>
    <v-footer
      padless
      absolute
    >
      <v-card
        flat
        tile
        width="100%"
        class="text-center"
      >
        <v-divider></v-divider>
        <v-card-text>
          Copyright © {{ new Date().getFullYear() }} — <strong>toonstalk</strong>
        </v-card-text>
      </v-card>
    </v-footer>
  </div>
</template>
<script>
// @ is an alias to /src
import { mapActions, mapGetters, mapState } from 'vuex';
import RoomThumbnail from '@/components/RoomThumbnail.vue';
import Chatter from '@/components/Chatter.vue';

export default {
  name: 'Home',
  components: { RoomThumbnail, Chatter },
  data: () => ({
    usersOnline: 0,
    flexBasisValues: ['25%', '35%', '30%'],
    variant: 'absolute',
  }),
  computed: {
    ...mapGetters('rooms', ['getAllRooms']),
    ...mapState('rooms', ['roomList', 'usersOnlineNow']),
    ...mapGetters('user', ['getCurrentUser']),
  },
  methods: {
    ...mapActions('rooms', ['getRooms', 'pushUser']),
    getRandomFlexBasis() {
      const randomFlexBasis = this.flexBasisValues[Math.floor(Math.random()
        * this.flexBasisValues.length)];
      return { flexBasis: randomFlexBasis };
    },
  },
  created() {
    this.getRooms();
  },
  mounted() {
    // console.log('usersOnline', this.usersOnline);
  },
  watch: {
    // ...
  },
};
</script>
<style scoped>
.panel-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5vmin;
  width: 75%;
  height: fit-content
}
.panel {
  background-color: #fff;
  border: solid 2px #000;
  box-shadow: 0 6px 6px -6px #000;
  display: inline-block;
  height: 200px;
  margin: 0.5vmin;
  overflow: hidden;
  position: relative;
  flex: 1 1 auto;
}
</style>
