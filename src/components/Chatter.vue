<template>
<div :id="userId" :ref="userId"
    heigth="200"
    @keyboard-clicked="keyboardCLicked"
    @click="chatterClicked"
    @touchstart="chatterClicked"
    width="50"
    style="heigth:200px;width:50px;">
    <DialogBubble ref="bubble" class="mb-5" :id="`bb-${userId}`" :message="message" />
    <v-img class="chatter" height="200" max-width="50" :src="avatar"></v-img>
    <TypeBox ref="keyboard" v-if="isCurrentUser" />
    <RoundedMenu v-on="{['privateMessage']:invitePrivate}"
     ref="roundedmenu" v-if="!isCurrentUser" />
</div>
</template>

<script>
import {
  mapGetters,
  mapState,
  mapActions,
} from 'vuex';
import TypeBox from '@/components/TypeBox.vue';
import DialogBubble from '@/components/DialogBubble.vue';
import RoundedMenu from '@/components/RoundedMenu.vue';

export default {
  name: 'chatter',
  components: {
    TypeBox,
    DialogBubble,
    RoundedMenu,
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
    expresionList: [{
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
    windowHeight: 0,
    windowWidth: 0,
  }),
  created() {
    this.windowHeight = window.outerHeight;
    this.windowWidth = window.outerWidth;
  },
  async mounted() {
    this.chatterManager = await this.$refs[this.userId];
    if (this.chatterManager) {
      this.initPosition({
        left: this.usersPosition[this.userId] && this.usersPosition[this.userId].position ? this.usersPosition[this.userId].position.left : `${this.windowWidth / 2}px`,
        top: this.usersPosition[this.userId] && this.usersPosition[this.userId].position ? this.usersPosition[this.userId].position.top : `${this.windowHeight / 2}px`,
        userId: this.userId,
      });
      this.chatterManager.style.position = 'absolute';
      this.chatterManager.style.left = `${this.windowWidth / 2}px`;
      this.chatterManager.style.top = `${this.windowHeight / 2}px`;

      // Mouse events
      this.chatterManager.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this.isDown = true;
        this.offset = [
          this.chatterManager.offsetLeft - e.clientX,
          this.chatterManager.offsetTop - e.clientY,
        ];
      }, true);
      document.addEventListener('mousemove', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.isDown && this.userId === Object.keys(this.getCurrentUser)[0]) {
          this.mouseMoved = true;
          const mousePosition = {
            x: e.clientX,
            y: e.clientY,

          };
          this.changePosition({
            left: `${mousePosition.x + this.offset[0]}px`,
            top: `${mousePosition.y + this.offset[1]}px`,
            userId: this.userId,
          });
        }
      }, true);

      // Touch events
      this.chatterManager.addEventListener('mouseup', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.isDown = false;
      }, true);
      this.chatterManager.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.isDown = true;
        this.offset = [
          this.chatterManager.offsetLeft - e.changedTouches[0].clientX,
          this.chatterManager.offsetTop - e.changedTouches[0].clientY,
        ];
      }, true);
      this.chatterManager.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (this.isDown && this.userId === Object.keys(this.getCurrentUser)[0]) {
          this.mouseMoved = true;
          const mousePosition = {
            x: e.changedTouches[0].clientX,
            y: e.changedTouches[0].clientY,
          };
          this.changePosition({
            left: `${mousePosition.x + this.offset[0]}px`,
            top: `${mousePosition.y + this.offset[1]}px`,
            userId: this.userId,
          });
        }
      });
      this.chatterManager.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.isDown = false;
      }, true);
    }
  },
  computed: {
    ...mapGetters('user', ['getCurrentUser', 'getUserPosition']),
    ...mapState('messages', ['dialogText']),
    ...mapState('user', ['usersPosition', 'userPositionmodified']),
    isCurrentUser() {
      return this.userId === Object.keys(this.getCurrentUser)[0];
    },
    userposition() {
      return this.usersPosition[this.userId].position;
    },
  },
  methods: {
    ...mapActions('user', ['initPosition', 'changePosition']),
    ...mapActions('messages', ['sendPrivateMessageRequest']),
    keyboardCLicked(e) {
      e.preventDefault();
      e.stopPropagation();
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
    leaveRoom() {

    },
    invitePrivate() {
      this.sendPrivateMessageRequest({ currentUser: this.getCurrentUser, userId: this.userId });
    },
    chatterClicked(e) {
      e.preventDefault();
      e.stopPropagation();
      if (this.mouseMoved !== true) {
        if (!this.isCurrentUser) {
          console.log(this.userId);
        }
      }
      this.mouseMoved = false;
      this.keyboardClicked = false;
    },
  },
  watch: {
    dialogText(newVal) {
      if (newVal[newVal.length - 1].userId === this.userId) {
        this.message = newVal[newVal.length - 1].text;
      }
    },
    userPositionmodified() {
      if (this.usersPosition[this.userId]) {
        const {
          left,
          top,
        } = this.usersPosition[this.userId].position;
        this.chatterManager.style.left = left;
        this.chatterManager.style.top = top;
      }
    },
  },
};
</script>

<style scoped>
.chatter:hover {
    cursor: pointer;
}

.chater {
    position: absolute;
}
</style>
