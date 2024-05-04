<!-- eslint-disable max-len -->
<template>
  <div style="text-align: center;" :class="isCurrentUser ? 'current-user' : 'user'" :id="userId" :ref="userId" @click="chatterClicked">
    <DialogBubble :ref="`$bubble_${userId}`" :id="`$bubble_${userId}`" :message="message" />
    <div v-if="!isCurrentUser" style="position: absolute;top: -22px;left: 5px; color: #ffffff;
text-shadow: 1px 1px 1px rgba(0,0,0,1);">{{nickname}}</div>
    <v-img :id="`img-${userId}`" class="chatter" height="auto" max-height="210px"  min-height="200" width="auto" max-width="70px" :src="avatar"></v-img>
    <RoundedMenu v-on="{
      ['privateMessage']: invitePrivate,
    }" ref="roundedmenu" v-show="!isCurrentUser" />
    <RoundedMenuCurrent :moving="mouseMoved" ref="roundedmenucurrent" v-show="isCurrentUser" v-on="{
      ['exitRoom']: leaveRoom,
      ['signOut']: () => userSignOutCall(),
      ['showAvatarList']: () => this.showAvatarSelector = !this.showAvatarSelector,
    }" />
    <TypeBox  :ref="`keyboard_${userId}`"  :id="`keyboard_${userId}`" v-if="isCurrentUser" :moving="mouseMoved" />
    <AvatarSelector :ref="`avatar-selector_${userId}`"  :id="`avatar-selector_${userId}`" v-show="showAvatarSelector" :showAvatarSelector="showAvatarSelector"   @onClose="() => this.showAvatarSelector = false"/>
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
import RoundedMenuCurrent from '@/components/RoundedMenuCurrent.vue';
import AvatarSelector from '@/components/AvatarSelector.vue';

export default {
  name: 'chatter',
  components: {
    TypeBox,
    DialogBubble,
    RoundedMenu,
    RoundedMenuCurrent,
    AvatarSelector,
  },
  props: {
    userId: String,
    avatar: String,
    nickname: String,
    room: String,
  },
  data: () => ({
    chatterManager: {},
    dialogs: '',
    expresion: {
      default: true,
      angry: false,
      happy: false,
      sad: false,
      sorprise: false,
      inlove: false,
    },
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
    followedBy: [],
    followingTo: [],
    isDown: false,
    keyboardClicked: false,
    message: '',
    mouseMoved: false,
    touchMove: false,
    openMenu: false,
    touchend: '',
    touchstart: '',
    muted: false,
    offset: [0, 0],
    positionX: 0,
    positionY: 0,
    status: '',
    talking: false,
    visible: '',
    pMessage: {},
    windowHeight: 0,
    windowWidth: 0,
    showAvatarSelector: false,
  }),
  created() {
    this.isDown = false;
    this.windowHeight = window.outerHeight;
    this.windowWidth = window.outerWidth;
  },
  async mounted() {
    this.isDown = false;
    this.chatterManager = this.$refs[this.userId];
    if (this.chatterManager) {
      const userID = this.userId;
      const usersPositionTemp = JSON.parse(JSON.stringify(this.usersPosition));
      this.chatterManager.style.position = 'absolute';
      setTimeout(() => {
        if (usersPositionTemp[userID]
        && usersPositionTemp[userID]?.position?.left
        && usersPositionTemp[userID]?.position?.top) {
          this.initPosition({
            left: usersPositionTemp[userID]?.position?.left,
            top: usersPositionTemp[userID]?.position?.top,
            userId: this.userId,
          });
        } else {
          this.initPosition({
            left: `${this.windowWidth / 2}px`,
            top: `${this.windowHeight / 2}px`,
            userId: this.userId,
          });
        }
        if (this.usersPosition[this.userId] && this.usersPosition[this.userId].position) {
          const {
            left,
            top,
          } = this.usersPosition[this.userId].position;
          this.chatterManager.style.left = left;
          this.chatterManager.style.top = top;
        }
      }, 1500);

      // Mouse events
      // this.chatterManager.addEventListener('dblclick', (e) => {
      //   e.preventDefault();
      //   e.stopPropagation();
      //   this.showAvatarSelector = true;
      // }, true);
      this.chatterManager.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.isDown = true;
        this.mouseMoved = false;
        this.offset = [
          this.chatterManager.offsetLeft - e.clientX,
          this.chatterManager.offsetTop - e.clientY,
        ];
      }, true);
      this.chatterManager.addEventListener('mousemove', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.isDown && this.userId === this.getCurrentUser.userId) {
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
        this.touchstart = this.usersPosition;
        this.isDown = true;
        this.mouseMoved = false;
        this.offset = [
          this.chatterManager.offsetLeft - e.changedTouches[0].clientX,
          this.chatterManager.offsetTop - e.changedTouches[0].clientY,
        ];
      }, true);
      this.chatterManager.addEventListener('touchmove', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        if (this.isDown && this.userId === this.getCurrentUser.userId) {
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
      this.chatterManager.addEventListener('touchend', () => {
        this.isDown = false;
      }, true);
    }
  },
  computed: {
    ...mapGetters('user', ['getCurrentUser']),
    ...mapState('messages', ['dialogText']),
    ...mapState('user', ['usersPosition', 'userPositionModified', 'userData', 'avatarUpdated']),
    isCurrentUser() {
      return this.userId === this.getCurrentUser.userId;
    },
  },
  methods: {
    ...mapActions('user', ['initPosition', 'changePosition', 'userSignOut']),
    ...mapActions('messages', ['sendPrivateMessageRequest']),
    ...mapActions('rooms', ['removeUser']),
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
      const userVal = this.userData[this.userId];
      this.isDown = false;
      this.mouseMoved = false;
      this.removeUser({
        userId: this.userId,
        roomId: this.$route.params.roomId,
        roomUsersKey: userVal.rooms[this.$route.params.roomId].roomUsersKey,
      });
      this.$router.push({
        name: 'rooms',
      });
    },
    invitePrivate() {
      // eslint-disable-next-line max-len
      this.sendPrivateMessageRequest({ currentUser: this.getCurrentUser.userId, userId: this.userId });
    },
    userSignOutCall() {
      console.log('userSignOut called');
      const userVal = this.userData[this.userId];
      this.removeUser({
        userId: this.userId,
        roomId: this.$route.params.roomId,
        roomUsersKey: userVal.rooms[this.$route.params.roomId].roomUsersKey,
        isAnonymous: this.getCurrentUser.nickname === 'anonymous',
      });
      this.userSignOut(this.userId);
    },
    chatterClicked(e) {
      e.preventDefault();
      e.stopPropagation();
      this.isDown = false;
      // this.mouseMoved = false;
    },
  },
  watch: {
    dialogText(newVal) {
      if (newVal[newVal.length - 1].userId === this.userId) {
        this.message = newVal[newVal.length - 1].text;
      }
    },
    userPositionModified() {
      if (this.usersPosition[this.userId] && this.usersPosition[this.userId].position) {
        const {
          left,
          top,
        } = this.usersPosition[this.userId].position;
        this.chatterManager.style.left = left;
        this.chatterManager.style.top = top;
      }
    },
    usersPosition: {
      deep: true,
      handler(newval, oldval) { console.log({ newval, oldval }); },
    },
  },
};
</script>

<style scoped>
.chatter:hover {
  cursor: pointer;
}

.chatter {
  position: relative;
  object-fit: fill;
  z-index: 10;
}

.private-dialog {
  height: 80vh;
}
.current-user{
  z-index: 990;
}
</style>
