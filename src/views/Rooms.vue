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
      <!-- <div class="panel" style="width: 25%; height: 85vh;display: flex;justify-content: center;align-items: center">

      </div> -->
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

export default {
  name: 'Home',
  components: { RoomThumbnail },
  data: () => ({
    usersOnline: 0,
    flexBasisValues: ['25%'],
    variant: 'absolute',
    nickname: 'ttalker',
    userId: 'default_avatar_character_12345',
    avatar: 'https://firebasestorage.googleapis.com/v0/b/chitter-chatter-f762a.appspot.com/o/rooms%2Fkimetsu_1%2Favatars%2FL1%2Ftanjiro.png?alt=media&token=ebf9e68d-c0e2-4019-a201-24e6553aad0a',
  }),
  computed: {
    ...mapGetters('rooms', ['getAllRooms']),
    ...mapState('rooms', ['roomList', 'usersOnlineNow']),
    ...mapGetters('user', ['getCurrentUser']),
  },
  methods: {
    ...mapActions('rooms', ['getRooms']),
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
<style>
.panel-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5vmin;
  width: 100%;
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
div#default_avatar_character_12345 .avatar-image {
  z-index: 1000!important;
  width: 200px!important;
  height: 500px!important;
}
.panelcolor {
  width: 300px; /* Adjust size as needed */
            height: 400px; /* Adjust size as needed */
            background-image:
                /* linear-gradient(to bottom, rgba(250, 250, 248, 0.9), rgba(230, 192, 70, 0)), */
                url("../assets/Screenshot 2024-07-04 at 22.05.41.png");
            background-size: cover, cover;
            background-repeat: no-repeat, no-repeat;
            position: relative;
            overflow: hidden;

}
</style>
