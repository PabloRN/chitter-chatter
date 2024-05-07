<!-- eslint-disable max-len -->
<template>
<v-scroll-y-reverse-transition>
  <v-card @click="enterRoom(room, id)">
          <v-img :src="room.picture" class="white--text align-end"
           gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)"
            height="200px">
            <v-card-title v-text="room.nombre"></v-card-title>
          </v-img>

          <v-card-actions>
            <v-spacer></v-spacer>

            <v-btn icon>
              <v-icon>mdi-heart</v-icon>
            </v-btn>

            <v-btn icon>
              {{ usersOnline }}
              <v-icon>mdi mdi-account-group</v-icon>
            </v-btn>
            <v-btn icon>
              <v-icon>mdi-share-variant</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
</v-scroll-y-reverse-transition>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'RoomThumbnail',
  props: {
    id: String,
    room: Object,
  },
  data: () => ({
    usersOnline: 0,
  }),
  mounted() {

  },
  computed: {
    ...mapState('rooms', ['roomList', 'usersOnlineNow']),
  },
  methods: {
    enterRoom(room, key) {
      this.$router.push({
        name: 'room',
        params: { roomId: key, background: room.picture, maxusers: room.maxusers },
      });
    },
  },
  watch: {
    usersOnlineNow() {
      this.usersOnline = this.roomList[this.id]?.usersOnline;
    },
  },
};
</script>
<style scoped>

</style>
