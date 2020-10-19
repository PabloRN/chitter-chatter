<template>
  <div class="home" @dragover.prevent
      @dragenter.prevent>
          <v-card>
            <v-img
              :src="background"
              class="white--text align-end"
              :height="innerHeight"
            >
            <Chatter draggable
             @dragstart='startDrag($event, id)' v-for="chatter in chatters"
              :id="chatter.id" :key="chatter.id" />
            </v-img>
          </v-card>
  </div>
</template>

<script>
// @ is an alias to /src
import Chatter from '@/components/Chatter.vue';

export default {
  name: 'Home',
  components: {
    Chatter,
  },
  props: {
    roomid: String,
    background: String,
  },
  created() {
    this.innerHeight = window.innerHeight;
  },
  data: () => ({
    innerHeight: '',
    chatters: [{ id: '1111111' }],
  }),
  methods: {

  },
};
</script>
