<template>
  <div class="home pa-2">
    <v-row dense>
      <v-col v-for="(room, key) in getAllRooms" :key="key" cols="12" xs="12" sm="3" md="3" lg="2">
      <RoomThumbnail :room="room" :id="key" :key="key"/>
      </v-col>
    </v-row>
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
  }),
  computed: {
    ...mapGetters('rooms', ['getAllRooms']),
    ...mapState('rooms', ['roomList', 'usersOnlineNow']),
    ...mapGetters('user', ['getCurrentUser']),

  },
  methods: {
    ...mapActions('rooms', ['getRooms', 'pushUser']),
  },
  created() {
    this.getRooms();
  },
  mounted() {
    // console.log('usersOnline', this.usersOnline);
  },
  watch: {

  },
};
</script>
