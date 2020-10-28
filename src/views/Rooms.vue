<template>
  <div class="home">
<v-row dense>
        <v-col
          v-for="(room, key) in getAllRooms"
          :key="key"
          :cols="2"
        >
          <v-card @click="enterRoom(room, key)">
            <v-img
              :src="room.picture"
              class="white--text align-end"
              gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)"
              height="200px"
            >
              <v-card-title v-text="room.nombre"></v-card-title>
            </v-img>

            <v-card-actions>
              <v-spacer></v-spacer>

              <v-btn icon>
                <v-icon>mdi-heart</v-icon>
              </v-btn>

              <v-btn icon>
                <v-icon>mdi-bookmark</v-icon>
              </v-btn>

              <v-btn icon>
                <v-icon>mdi-share-variant</v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
  </div>
</template>

<script>
// @ is an alias to /src
import { mapActions, mapGetters, mapState } from 'vuex';

export default {
  name: 'Home',
  components: {

  },
  data: () => ({

  }),
  computed: {
    ...mapGetters('rooms', ['getAllRooms']),
    ...mapState('rooms', ['roomList']),
    ...mapGetters('authorization', ['getCurrentUser']),
  },
  methods: {
    ...mapActions('rooms', ['getRooms', 'pushUser']),
    enterRoom(room, key) {
      this.pushUser({ roomId: key, userId: Object.keys(this.getCurrentUser)[0] });
      this.$router.push({
        name: 'room',
        params: { roomid: key, background: room.picture, maxusers: room.maxusers },
      });
    },
  },
  created() {
    this.getRooms();
  },
  watch: {
    roomList: {
      deep: true,
      handler(newval, oldval) { console.log({ newval, oldval }); },
    },
  },
};
</script>
