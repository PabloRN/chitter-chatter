<!-- eslint-disable max-len -->
<template>
<v-scroll-y-reverse-transition>
        <v-card @click="enterRoom(room, id)"
    class="mx-auto"
    dark
  >
  <v-img :src="room?.thumbnail ? room.thumbnail : room.picture" class="white--text align-end"
           gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)"
            height="200px">
    <v-card-actions>
      <v-list-item class="roomtitle">
        <v-list-item-content class="roomtitle">
          <v-list-item-title class="roomtitle">{{ room?.nombre }}</v-list-item-title>
        </v-list-item-content>

        <v-row
          align="center"
          justify="end"
        >
          <v-icon class="mr-1">
            mdi-account-multiple-plus
          </v-icon>
          <span class="subheading mr-2">{{ usersOnline || 0 }}</span>
          <span class="mr-1">·</span>
          <v-icon class="mr-1">
            mdi-account-group
          </v-icon>
          <span class="subheading">{{ usersOnline || 0 }}</span>
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
<style >
.roomtitle{
    color: white;
    font-weight: bold;
    font-size: 1.1em;
    overflow: inherit;
    text-overflow: inherit;
    white-space: nowrap;
}
</style>
