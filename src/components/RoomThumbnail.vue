<!-- eslint-disable max-len -->
<template>
  <v-scroll-y-reverse-transition>
    <v-card @click="enterRoom(room, id)" class="mx-auto">
      <v-img :src="room?.thumbnail ? room.thumbnail : room.picture" class="white--text align-end" height="200px" cover>
        <v-card-actions>
          <v-list-item class="roomtitle">
            <v-list-item-title class="roomtitle">{{ room?.nombre }}</v-list-item-title>

            <v-row align="center" justify="end">
              <!-- <v-icon class="mr-1 roomtitle"> mdi-account-multiple-plus </v-icon>
              <span class="subheading mr-2 roomtitle">{{ usersOnline || 0 }}</span>
              <span class="mr-1">·</span> -->
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
import useRoomsStore from '@/stores/rooms';

export default {
  name: 'RoomThumbnail',
  setup() {
    const roomsStore = useRoomsStore();

    return {
      roomsStore,
    };
  },
  props: {
    id: String,
    room: Object,
  },
  data: () => ({
    usersOnline: 0,
  }),
  mounted() { },
  computed: {
    roomList() {
      return this.roomsStore.roomList;
    },
    usersOnlineNow() {
      return this.roomsStore.usersOnlineNow;
    },
  },
  methods: {
    enterRoom(room, key) {
      this.$router.push({
        name: 'room',
        params: { roomId: key },
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
@import url('https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap');

.roomtitle {
  color: var(--text-light) !important;
  font-weight: bold;
  font-size: 1.3em;
  font-family: 'Nanum Pen Script', cursive !important;
  overflow: inherit;
  text-overflow: inherit;
  white-space: nowrap;
  text-shadow: var(--shadow-light);
}
</style>
