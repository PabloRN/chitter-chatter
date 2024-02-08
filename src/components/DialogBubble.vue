<template>
<v-scroll-y-reverse-transition>
 <div v-if="showBubble" class="bubble bubble-bottom-left text-body-2 pa-4">
   {{text}}</div>
</v-scroll-y-reverse-transition>
</template>

<script>
// import { mapGetters } from 'vuex';

export default {
  name: 'dialogbubble',
  props: {
    id: String,
    message: String,
  },
  data: () => ({
    text: '',
    showBubble: false,
    cleanTime: Function,
  }),
  mounted() {

  },
  computed: {
    // ...mapGetters('messages', ['getText']),
  },
  methods: {
    removeTimer() {
      clearTimeout(this.cleanTime);
    },
  },
  watch: {
    message(value) {
      this.removeTimer();
      if (value && value.length > 0) {
        this.text = value;
        this.showBubble = true;
      }
      this.cleanTime = setTimeout(() => {
        this.text = '';
        this.showBubble = false;
      }, 5000);
    },
  },
};
</script>
<style scoped>
@import url(https://fonts.googleapis.com/css?family=Ubuntu:300,300italic,regular,italic,500,500italic,700,700italic);

.bubble {
  position: absolute;
  font-family: 'Courier New', Courier, monospace sans-serif!important;
  font-size: 16px;
  line-height: 1.2;
  width: 200px;
  background: #fff;
  border-radius: 10px;
  color: #000;
  top: -75px;
  max-height: 92px;
  text-align: center;
  box-shadow: 1px 1px 3px #424242;
}

.bubble-bottom-left:before {
  content: "";
  width: 0px;
  height: 0px;
  position: absolute;
  border-left: 24px solid #fff;
  border-right: 12px solid transparent;
  border-top: 12px solid #fff;
  border-bottom: 20px solid transparent;
  left: 42px;
  bottom: -24px;
}
</style>
