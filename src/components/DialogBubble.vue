<!-- eslint-disable max-len -->
<template>
<v-scroll-y-reverse-transition>
 <div v-if="showBubble" :class="isCurrentUser ? 'bubble-current': 'bubble'" class="bubble-bottom-left text-body-2 pa-4" >
   {{text}}</div>
</v-scroll-y-reverse-transition>
</template>

<script>
import { mapGetters } from 'vuex';

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
    ...mapGetters('user', ['getCurrentUser']),
    isCurrentUser() {
      return this.id === `$bubble_${this.getCurrentUser.userId}`;
    },
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
      }, 6000);
    },
  },
};
</script>
<style scoped>
/* @import url(https://fonts.googleapis.com/css?family=Ubuntu:300,300italic,regular,italic,500,500italic,700,700italic); */
@import url(https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap);
.bubble {
  position: absolute;
  font-family: "Nanum Pen Script", cursive!important;
  font-size: 1.1rem!important;
  line-height: 1.1!important;
  width: 200px;
  background: #fff;
  border-radius: 6px;
  color: #000;
  top: -60px;
  max-height: 92px;
  text-align: center;
  box-shadow: 1px 1px 3px #424242;
  z-index: 1000
}
.bubble-current {
  position: absolute;
  font-family: "Nanum Pen Script", cursive!important;
  font-size: 1.1rem!important;
  line-height: 1.1!important;
  width: 200px;
  background: #fff;
  border-radius: 6px;
  color: #000;
  top: -60px;
  max-height: 92px;
  text-align: center;
  box-shadow: 1px 1px 3px #424242;
  z-index: 999;
}

.bubble-bottom-left:before {
  content: "";
    width: 0px;
    height: 0px;
    position: absolute;
    border-left: 15px solid #fff;
    border-right: 5px solid transparent;
    border-top: 12px solid #fff;
    border-bottom: 30px solid transparent;
    left: 42px;
    bottom: -28px;
}
</style>
