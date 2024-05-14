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
<style scoped lang="scss">
/* @import url(https://fonts.googleapis.com/css?family=Ubuntu:300,300italic,regular,italic,500,500italic,700,700italic); */
@import url(https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap);
.bubble {
  background-color:#fff;
  border:solid 2px #000;
  border-radius:12px;
  display:inline-block;
  margin:.5em;
  padding:.5em 1em;
  position: absolute;
  font-family: "Nanum Pen Script", cursive!important;
  font-size: 1.3rem!important;
  line-height: 1.1!important;
  width: 200px;
  height: auto;
  background: #fff;
  border-radius: 6px;
  color: #000;
  bottom: 215px;
  left: 15px;
  text-align: center;
  box-shadow: 1px 1px 3px #424242;
  z-index: 1000;
  &-current{
    @extend .bubble;
    z-index: 999;
    bottom: 225px;
  }
}

.bubble-bottom-left:before {
  border:solid 12px transparent;
  border-left:solid 12px #000;
  border-top:solid 12px #000;
  bottom:-24px;
  content:"";
  height:0;
  left:24px;
  position:absolute;
  transform:skew(-15deg);
  width:0;
}

.bubble-bottom-left:after {
  border:solid 10px transparent;
  border-left:solid 10px #fff;
  border-top:solid 10px #fff;
  bottom:-19px;
  content:"";
  height:0;
  left:27px;
  position:absolute;
  transform:skew(-15deg);
  width:0;
}

textarea:focus, input:focus{
    outline: none;
}
</style>
