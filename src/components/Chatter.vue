<template>
<div :id="userId" :ref="userId" @click="chatterClicked" heigth="200"
 width="50" style="heigth:200px;width:50px;">
 <DialogBubble class="mb-7"/>
  <v-img
  height="200"
  max-width="50"
  :src="avatar"
></v-img>
<TypeBox v-if="isCurrentUser" />
</div>
</template>

<script>
import { mapGetters } from 'vuex';
import TypeBox from '@/components/TypeBox.vue';
import DialogBubble from '@/components/DialogBubble.vue';

export default {
  name: 'chatter',
  components: {
    TypeBox,
    DialogBubble,
  },
  props: {
    userId: String,
    avatar: String,
    nickname: String,
    rooms: Object,
    isCurrentUser: {
      type: Boolean,
      default: false,
    },
  },
  data: () => ({
    chatterManager: {},
    offset: [0, 0],
    isDown: false,
    positionX: 0,
    positionY: 0,
    talking: false,
    muted: false,
    dialogs: '',
    status: '',
    visible: '',
    followingTo: [],
    followedBy: [],
    expresion: {
      default: true,
      angry: false,
      happy: false,
      sad: false,
      sorprise: false,
      inlove: false,
    },
    expresionList: [
      {
        icon: 'img/icons/smily-smile',
        name: 'smile',
      },
      {
        icon: 'img/icons/smily-inlove',
        name: 'inlove',
      },
      {
        icon: 'img/icons/smily-shocked',
        name: 'shocked',
      },
      {
        icon: 'img/icons/smily-sad',
        name: 'sad',
      },
      {
        icon: 'img/icons/smily-mad',
        name: 'mad',
      },
    ],
  }),
  mounted() {
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    this.chatterManager = this.$refs[this.userId];
    // Object.assign(this.chatterManager)
    this.chatterManager.style.position = 'absolute';
    this.chatterManager.style.left = `${windowWidth / 2}px`;
    this.chatterManager.style.top = `${windowHeight / 2}px`;
    this.chatterManager.addEventListener('mousedown', (e) => {
      this.isDown = true;
      this.offset = [
        this.chatterManager.offsetLeft - e.clientX,
        this.chatterManager.offsetTop - e.clientY,
      ];
    }, true);
    document.addEventListener('mouseup', () => {
      this.isDown = false;
    }, true);

    document.addEventListener('mousemove', (event) => {
      event.preventDefault();
      if (this.isDown) {
        const mousePosition = {

          x: event.clientX,
          y: event.clientY,

        }; if (this.chatterManager.offsetLeft >= 0) {
          this.chatterManager.style.left = `${mousePosition.x + this.offset[0]}px`;
        } else {
          this.chatterManager.offsetLeft = 0;
          this.chatterManager.offsetLeft += 5;
        }
        if (this.chatterManager.offsetTop >= 0) {
          this.chatterManager.style.top = `${mousePosition.y + this.offset[1]}px`;
        }
      }
    }, true);
  },
  computed: {
    ...mapGetters('authorization', ['getCurrentUser']),
  },
  methods: {
    changeAvatar() {

    },
    changeExpresion() {

    },
    beInvisible() {

    },
    changeStatus() {

    },
    toTalk() {

    },
    leaveRoom() {

    },
    chatterClicked() {
      if (this.id) {
        console.log(this.id);
      }
    },
  },

};
</script>
<style scoped>

</style>
