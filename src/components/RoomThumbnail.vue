<!-- eslint-disable max-len -->
<template>
  <v-scroll-y-reverse-transition>
    <v-card @click="enterRoom(room, id)" class="mx-auto" >
      <v-img
        :src="room?.thumbnail ? room.thumbnail : room.picture"
        class="white--text align-end"
        height="200px"
      >
        <v-card-actions>
          <v-list-item class="roomtitle">
            <v-list-item-content class="roomtitle">
              <v-list-item-title class="roomtitle">{{ room?.nombre }}</v-list-item-title>
            </v-list-item-content>

            <v-row align="center" justify="end">
              <v-icon class="mr-1 roomtitle"> mdi-account-multiple-plus </v-icon>
              <span class="subheading mr-2 roomtitle">{{ usersOnline || 0 }}</span>
              <span class="mr-1">·</span>
              <v-icon class="mr-1 roomtitle"> mdi-account-group </v-icon>
              <span class="subheading roomtitle">{{ usersOnline || 0 }}</span>
            </v-row>
          </v-list-item>
        </v-card-actions>
      </v-img>
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
  mounted() {},
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
<style>
.roomtitle {
  color: white!important;;
  font-weight: bold;
  font-size: 1.1em;
  overflow: inherit;
  text-overflow: inherit;
  white-space: nowrap;
  text-shadow: 1px 1px 2px black;
}
</style>
