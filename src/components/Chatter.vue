<template>
<div :id="id" :ref="id" @click="chatterClicked" heigth="200"
 width="50" style="heigth:200px;width:50px;">
 <DialogBubble class="mb-7"/>
  <v-img
  height="200"
  max-width="50"
  src="https://firebasestorage.googleapis.com/v0/b/chitter-chatter-f762a.appspot.com/o/avatars%2FLayer%2010.png?alt=media&token=14f69a60-6bab-448f-8747-67428bbcd4fc"
></v-img>
<TypeBox />
</div>
</template>

<script>
import TypeBox from '@/components/TypeBox.vue';
import DialogBubble from '@/components/DialogBubble.vue';

export default {
  name: 'chatter',
  components: {
    TypeBox,
    DialogBubble,
  },
  props: {
    id: String,
  },
  data: () => ({
    chatterManager: {},
    offset: [0, 0],
    isDown: false,
    avatar: '',
    positionX: 0,
    positionY: 0,
    talking: false,
    muted: false,
    dialogText: '',
    status: '',
    visible: '',
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
    console.log(windowWidth / 2);
    this.chatterManager = this.$refs[this.id];
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
