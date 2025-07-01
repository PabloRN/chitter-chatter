<!-- eslint-disable max-len -->
<template>
  <div class="home">
    <v-app-bar dense elevation="4" rounded shaped>
      <v-toolbar-title style="display: flex; justify-content: flex-start">
        <v-img src="../assets/logotype_landing_page.png" class="my-3" contain width="6em" height="35"
          style="background-position: left!important;" />
      </v-toolbar-title>
    </v-app-bar>

    <div class="d-flex flex-nowrap flex-direction-row pa-2">
      <div class="panel-container">
        <div class="panel" v-for="(room, key) in getAllRooms" :key="key" :style="getRandomFlexBasis()">
          <RoomThumbnail :room="room" :id="key" :key="key" />
        </div>
      </div>
      <!-- <div class="panel" style="width: 25%; height: 85vh;display: flex;justify-content: center;align-items: center">

      </div> -->
    </div>
    <div style="width: 100%;display: flex; justify-content: center;align-items: center;margin-top: 20px;">
      <v-card style="width: 40%">
        <v-card-text class="text-subtitle-1" style="height: 20vh">
          <p>This is a temporary url created especially for you, our beloved early tester. Please note that it will
            expire soon.</p>
          <p>If you find this product amazing and you want to hear more from us and share your experience join us on our
            Discord channel <a href="https://discord.gg/MKtRuUfG" target="_blank">discord channel</a>. We'd love to hear
            from you! </p>
        </v-card-text>
      </v-card>
    </div>

    <v-footer padless absolute>
      <v-card flat tile width="100%" class="text-center">
        <v-divider></v-divider>
        <v-card-text>
          Copyright © {{ new Date().getFullYear() }} — <strong>toonstalk</strong>
        </v-card-text>
      </v-card>
    </v-footer>
    <v-dialog v-if="showWelcomeDialog" v-model="showWelcomeDialog" persistent width="600"
      class="pa-5 ma-5 progress-dialog">
      <v-card style="width: 100%">
        <v-card-title class="text-h6">Welcome, Early Tester! </v-card-title>
        <v-card-text class="text-subtitle-1" style="height: 20vh">
          <p>Thank you for being one of the selected few to try out our beta version. Your feedback is incredibly
            valuable in helping us shape the final product.</p>
          <p>Please remember that this is a beta version, so you may encounter some bugs or incomplete features. Also is
            only working on PC and tablet. We’d love to hear your thoughts on how we can improve!</p>
        </v-card-text>
        <v-card-actions class="text-body-2 pa-2 d-flex justify-end align-end">
          <v-btn small class="px-10" color="primary darken-1" tile @click="
            showWelcomeDialog = false;
          ">
            Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
// @ is an alias to /src
import useRoomsStore from '@/stores/rooms';
import useUserStore from '@/stores/user';
import RoomThumbnail from '@/components/RoomThumbnail';

export default {
  name: 'RoomsComponent',
  components: { RoomThumbnail },
  setup() {
    const roomsStore = useRoomsStore();
    const userStore = useUserStore();

    return {
      roomsStore,
      userStore,
    };
  },
  data: () => ({
    showWelcomeDialog: false,
    usersOnline: 0,
    flexBasisValues: ['25%'],
    variant: 'absolute',
    nickname: 'ttalker',
    userId: 'default_avatar_character_12345',
    avatar: 'https://firebasestorage.googleapis.com/v0/b/chitter-chatter-f762a.appspot.com/o/rooms%2Fkimetsu_1%2Favatars%2FL1%2Ftanjiro.png?alt=media&token=ebf9e68d-c0e2-4019-a201-24e6553aad0a',
  }),
  computed: {
    getAllRooms() {
      return this.roomsStore.getAllRooms;
    },
    roomList() {
      return this.roomsStore.roomList;
    },
    usersOnlineNow() {
      return this.roomsStore.usersOnlineNow;
    },
    getCurrentUser() {
      return this.userStore.getCurrentUser;
    },
  },
  methods: {
    getRandomFlexBasis() {
      const randomFlexBasis = this.flexBasisValues[Math.floor(Math.random()
        * this.flexBasisValues.length)];
      return { flexBasis: randomFlexBasis };
    },
  },
  created() {
    this.roomsStore.getRooms();
  },
  mounted() {
    if (!localStorage.getItem('hasVisited')) {
      this.showWelcomeDialog = true;
      localStorage.setItem('hasVisited', 'true');
    }
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
  z-index: 1000 !important;
  width: 200px !important;
  height: 500px !important;
}

.panelcolor {
  width: 300px;
  /* Adjust size as needed */
  height: 400px;
  /* Adjust size as needed */
  background-image:
    /* linear-gradient(to bottom, rgba(250, 250, 248, 0.9), rgba(230, 192, 70, 0)), */
    url("../assets/Screenshot 2024-07-04 at 22.05.41.png");
  background-size: cover, cover;
  background-repeat: no-repeat, no-repeat;
  position: relative;
  overflow: hidden;

}
</style>
