<template>
  <div class="home">
<v-row dense>
        <v-col
          v-for="room in getAllRooms"
          :key="room.id"
          :cols="2"
        >
          <v-card @click="$router.push({name: 'room',
           params: {roomid: room.id, background: room.picture, maxusers: room.maxusers}})">
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
import { mapActions, mapGetters } from 'vuex';

export default {
  name: 'Home',
  components: {

  },
  data: () => ({
    cards: [
      {
        title: 'Pre-fab homes', src: 'https://cdn.vuetifyjs.com/images/cards/house.jpg', flex: 2, id: '12345',
      },
      {
        title: 'Favorite road trips', src: 'https://cdn.vuetifyjs.com/images/cards/road.jpg', flex: 2, id: '67890',
      },
      {
        title: 'Best airlines', src: 'https://cdn.vuetifyjs.com/images/cards/plane.jpg', flex: 2, id: '102938',
      },
    ],
  }),
  computed: {
    ...mapGetters('rooms', ['getAllRooms']),
  },
  methods: {
    ...mapActions('rooms', ['getRooms']),
  },
  created() {
    this.getRooms();
  },
  mounted() {
    console.log(this.getAllRooms);
  },
};
</script>
