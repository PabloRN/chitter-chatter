<template>
<v-scroll-y-reverse-transition>
 <div v-if="showBubble" class="bubble bubble-bottom-left">
   {{text}}</div>
</v-scroll-y-reverse-transition>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'dialogbubble',
  props: {

  },
  data: () => ({
    text: '',
    showBubble: false,
    cleanTime: Function,
  }),
  mounted() {

  },
  computed: {
    ...mapGetters('dialog', ['getText']),
  },
  methods: {
    removeTimer() {
      clearTimeout(this.cleanTime);
    },
  },
  watch: {
    getText(value) {
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

.bubble {
  position: absolute;
  font-family: sans-serif;
  font-size: 14px;
  line-height: 18px;
  width: 200px;
  background: #fff;
  border-radius: 10px;
  padding: 18px;
  text-align: center;
  color: #000;
  top: -90px;
  max-height: 72px;
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
  left: 32px;
  bottom: -24px;
}
</style>
