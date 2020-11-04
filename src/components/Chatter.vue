<template>
<div :id="userId" :ref="userId"
 heigth="200"
@keyboard-clicked="keyboardCLicked"

 width="50" style="heigth:200px;width:50px;">
 <DialogBubble ref="bubble" class="mb-7" :id="`bb-${userId}`" :message="message" />
  <v-img class="chatter"
  height="200"
  max-width="50"
  :src="avatar"
></v-img>
<TypeBox ref="keyboard" v-if="isCurrentUser" />
</div>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
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
  },
  data: () => ({
    keyboardClicked: false,
    mouseMoved: false,
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
    message: '',
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
      e.preventDefault();
      this.isDown = true;
      this.offset = [
        this.chatterManager.offsetLeft - e.clientX,
        this.chatterManager.offsetTop - e.clientY,
      ];
    }, true);
    document.addEventListener('mouseup', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.isDown = false;
    }, true);
    this.chatterManager.addEventListener('click', (e) => {
      e.preventDefault();
      // e.stopPropagation();
      if (this.mouseMoved !== true && e.target.localName === 'div') {
        console.log('clicked');
      }
      this.mouseMoved = false;
      this.keyboardClicked = false;
    }, true);

    document.addEventListener('mousemove', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.isDown && this.userId === Object.keys(this.getCurrentUser)[0]) {
        this.mouseMoved = true;
        const mousePosition = {

          x: e.clientX,
          y: e.clientY,

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
    ...mapState('messages', ['dialogText']),
    isCurrentUser() {
      return this.userId === Object.keys(this.getCurrentUser)[0];
    },
  },
  methods: {
    keyboardCLicked(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('keyboardCLicked');
      this.keyboardClicked = true;
    },
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
        console.log(this.$$refs[this.id]);
      }
    },
  },
  watch: {
    dialogText(newVal) {
      if (newVal[newVal.length - 1].userId === this.userId) {
        this.message = newVal[newVal.length - 1].text;
      }
      console.log(newVal);
    },
  },
};
</script>
<style scoped>
.chatter:hover{
  cursor: pointer;
}
</style>
