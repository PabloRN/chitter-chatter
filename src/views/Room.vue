<template>
  <div class="home" @dragover.prevent
      @dragenter.prevent>
          <v-card>
            <v-img
              :src="background"
              class="white--text align-end"
              :height="innerHeight"
            >
            <Chatter v-for="chatter in chatters"
              :id="chatter.id" :key="chatter.id" />
            </v-img>
            {{$route.params.id}}
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
    chatters: [{ id: '1111111' }, { id: '1111112' }],
  }),
  methods: {

  },
};
</script>
