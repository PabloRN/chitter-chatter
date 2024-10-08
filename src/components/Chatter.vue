<!-- eslint-disable max-len -->
<template>
  <div
    style="text-align: center"
    :class="isCurrentUser ? 'current-user' : 'user'"
    :id="actualUserId"
    :ref="actualUserId"
    @click="chatterClicked"
  >
    <DialogBubble
      :ref="`$bubble_${actualUserId}`"
      :id="`$bubble_${actualUserId}`"
      :message="message"
      :class="dialogSide"
    />
    <div
      v-if="!isCurrentUser && actualUserId !== 'default_avatar_character_12345'"
      class="nicknameWrapper"
    >
      <div class="nickname">{{ nickname }}</div>
    </div>
    <v-img contain :id="`img-${actualUserId}`" class="avatar-image" :src="avatar"></v-img>
    <RoundedMenu
      v-on="{
  ['privateMessage']: invitePrivate,
  ['showUserMessages']: () => toggleUserMessages(),
      }"
      ref="roundedmenu"
      v-show="!isCurrentUser"
    />
    <RoundedMenuCurrent
      :moving="mouseMoved"
      ref="roundedmenucurrent"
      v-show="isCurrentUser"
      v-on="{
        ['exitRoom']: leaveRoom,
        ['signOut']: () => userSignOutCall(),
        ['showAvatarList']: () => (this.showAvatarSelector = !this.showAvatarSelector),
        ['showMessages']: () => toggleMessages(),
      }"
    />
    <TypeBox
      :ref="`keyboard_${actualUserId}`"
      :id="`keyboard_${actualUserId}`"
      v-if="isCurrentUser"
      :moving="mouseMoved"
    />
    <AvatarSelector
      :ref="`avatar-selector_${actualUserId}`"
      :id="`avatar-selector_${actualUserId}`"
      :showAvatarSelector="showAvatarSelector"
      v-on="{
        ['onClose']: () => {
          showAvatarSelector = false;
        },
        ['onShowLoginDialog']: () => {
          showLoginDialog = true;
        },
      }"
    />
    <v-dialog
      persistent
      scrollable
      v-if="showLoginDialog"
      v-model="showLoginDialog"
      width="600"
      min-height="80vh"
      class="pa-5 ma-5 private-dialog"
    >
      <LoginDialogBubble
        @onCloseLoginDialog="showLoginDialog = false"
        @onSavedNickName="updateNickName"
      />
    </v-dialog>
  </div>
</template>

<script>
import { mapGetters, mapState, mapActions } from 'vuex';
import TypeBox from '@/components/TypeBox.vue';
import DialogBubble from '@/components/DialogBubble.vue';
import RoundedMenu from '@/components/RoundedMenu.vue';
import RoundedMenuCurrent from '@/components/RoundedMenuCurrent.vue';
import AvatarSelector from '@/components/AvatarSelector.vue';
import LoginDialogBubble from '@/components/LoginDialogBubble.vue';

export default {
  name: 'ChatterComponent',
  components: {
    TypeBox,
    DialogBubble,
    RoundedMenu,
    RoundedMenuCurrent,
    AvatarSelector,
    LoginDialogBubble,
  },
  props: {
    userId: String,
    avatar: String,
    nickname: String,
    room: String,
  },
  data: () => ({
    showLoginDialog: false,
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
    dialogSide: 'bubble-bottom-left',
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
    actualUserId: '',
  }),
  created() {
    this.isDown = false;
    this.windowHeight = window.outerHeight;
    this.windowWidth = window.outerWidth;
  },
  async mounted() {
    this.initUserData(this.userId);
  },
  computed: {
    ...mapGetters('user', ['getCurrentUser']),
    ...mapState('messages', ['roomMessages']),
    ...mapState('user', [
      'usersPosition',
      'userPositionModified',
      'userData',
      'currentUser',
    ]),
    isCurrentUser() {
      return this.actualUserId === this.getCurrentUser.userId;
    },
  },
  methods: {
    ...mapActions('user', [
      'initPosition',
      'changePosition',
      'userSignOut',
      'updateNickNameByUser',
    ]),
    ...mapActions('messages', ['sendPrivateMessageRequest', 'showMessages', 'showUserMessages', 'cleanMessages']),
    ...mapActions('rooms', ['removeUser']),
    updateNickName() {
      this.updateNickNameByUser();
      this.showLoginDialog = false;
    },
    keyboardCLicked(e) {
      e.preventDefault();
      e.stopPropagation();
      this.keyboardClicked = true;
    },
    toggleMessages() {
      this.showMessages(true);
    },
    toggleUserMessages() {
      this.showUserMessages(this.userId);
    },
    findClosestDivPosition(givenDivId) {
      const divPositions = this.usersPosition;
      const givenDivPosition = divPositions[givenDivId];
      const givenDivLeft = parseFloat(givenDivPosition.position.left);
      const givenDivTop = parseFloat(givenDivPosition.position.top);

      const givenDivCenterX = givenDivLeft;
      const givenDivCenterY = givenDivTop;

      const closestDiv = { id: null, distance: Number.MAX_SAFE_INTEGER };

      Object.entries(divPositions).map(([id, { position }]) => {
        if (id && position && id !== givenDivId) {
          const divLeft = parseFloat(position.left);
          const divTop = parseFloat(position.top);
          const divCenterX = divLeft;
          const divCenterY = divTop;

          const horizontalDistance = Math.abs(givenDivCenterX - divCenterX);
          const verticalDistance = Math.abs(givenDivCenterY - divCenterY);

          const distance = Math.sqrt(horizontalDistance ** 2 + verticalDistance ** 2);

          if (distance < closestDiv.distance) {
            closestDiv.id = id;
            closestDiv.distance = distance;
          }
        }
        return position;
      });

      if (closestDiv.id !== null && closestDiv.id !== givenDivId) {
        const closestDivLeft = parseFloat(divPositions[closestDiv.id].position.left);
        if (closestDivLeft > givenDivLeft) {
          return 'position-left';
        }
        return 'position-right';
      }
      return 'position-right';
    },
    changeExpresion() {},
    beInvisible() {},
    changeStatus() {},
    leaveRoom() {
      const userVal = this.userData[this.actualUserId];
      this.isDown = false;
      this.mouseMoved = false;
      this.removeUser({
        userId: this.actualUserId,
        roomId: this.$route.params.roomId,
        roomUsersKey: userVal.rooms[this.$route.params.roomId].roomUsersKey,
      });
      this.cleanMessages();
      this.$router.push({
        name: 'rooms',
      });
    },
    invitePrivate() {
      // eslint-disable-next-line max-len
      this.sendPrivateMessageRequest({
        currentUser: this.getCurrentUser.userId,
        userId: this.actualUserId,
      });
    },
    userSignOutCall() {
      const userVal = this.userData[this.actualUserId];
      this.removeUser({
        userId: this.actualUserId,
        roomId: this.$route.params.roomId,
        roomUsersKey: userVal.rooms[this.$route.params.roomId].roomUsersKey,
        isAnonymous: this.getCurrentUser.nickname === 'anonymous',
      });
      this.userSignOut(this.actualUserId);
      this.cleanMessages();
    },
    chatterClicked(e) {
      e.preventDefault();
      e.stopPropagation();
      this.isDown = false;
      // this.mouseMoved = false;
    },
    initUserData(userId) {
      this.actualUserId = userId;
      this.$nextTick(() => {
        this.isDown = false;
        this.chatterManager = this.$refs[this.actualUserId];
        if (this.chatterManager) {
          const usersPositionTemp = JSON.parse(JSON.stringify(this.usersPosition));
          this.chatterManager.style.position = 'absolute';
          setTimeout(() => {
            if (
              usersPositionTemp[this.actualUserId]
              && usersPositionTemp[this.actualUserId]?.position?.left
              && usersPositionTemp[this.actualUserId]?.position?.top
            ) {
              this.initPosition({
                left: usersPositionTemp[this.actualUserId]?.position?.left,
                top: usersPositionTemp[this.actualUserId]?.position?.top,
                userId,
              });
            } else {
              this.initPosition({
                left: `${this.windowWidth / 2}px`,
                top: `${this.windowHeight / 2}px`,
                userId,
              });
            }
            if (this.usersPosition[userId] && this.usersPosition[userId].position) {
              const { left, top } = this.usersPosition[userId].position;
              this.chatterManager.style.left = left;
              this.chatterManager.style.top = top;
            }
          }, 3000);

          // Add event listeners
          this.addEventListeners();
        }
      });
    },
    addEventListeners() {
      // Mouse events
      this.chatterManager.addEventListener(
        'mousedown',
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.isDown = true;
          this.mouseMoved = false;
          this.offset = [
            this.chatterManager.offsetLeft - e.clientX,
            this.chatterManager.offsetTop - e.clientY,
          ];
        },
        true,
      );
      this.chatterManager.addEventListener(
        'mousemove',
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (this.isDown && this.actualUserId === this.getCurrentUser.userId) {
            this.mouseMoved = true;
            const mousePosition = {
              x: e.clientX,
              y: e.clientY,
            };
            this.changePosition({
              left: `${mousePosition.x + this.offset[0]}px`,
              top: `${mousePosition.y + this.offset[1]}px`,
              userId: this.actualUserId,
            });
          }
        },
        true,
      );

      // Touch events
      this.chatterManager.addEventListener(
        'mouseup',
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.isDown = false;
        },
        true,
      );
      this.chatterManager.addEventListener(
        'touchstart',
        (e) => {
          this.touchstart = this.usersPosition;
          this.isDown = true;
          this.mouseMoved = false;
          this.offset = [
            this.chatterManager.offsetLeft - e.changedTouches[0].clientX,
            this.chatterManager.offsetTop - e.changedTouches[0].clientY,
          ];
        },
        true,
      );
      this.chatterManager.addEventListener('touchmove', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        if (this.isDown && this.actualUserId === this.getCurrentUser.userId) {
          this.mouseMoved = true;
          const mousePosition = {
            x: e.changedTouches[0].clientX,
            y: e.changedTouches[0].clientY,
          };
          this.changePosition({
            left: `${mousePosition.x + this.offset[0]}px`,
            top: `${mousePosition.y + this.offset[1]}px`,
            userId: this.actualUserId,
          });
        }
      });
      this.chatterManager.addEventListener(
        'touchend',
        () => {
          this.isDown = false;
        },
        true,
      );
    },
  },
  watch: {
    roomMessages(newVal) {
      if (newVal.length > 0 && newVal[newVal.length - 1].userId === this.actualUserId) {
        this.message = newVal[newVal.length - 1].text;
      }
    },
    userPositionModified() {
      if (this.usersPosition[this.actualUserId] && this.usersPosition[this.actualUserId].position) {
        const { left, top } = this.usersPosition[this.actualUserId].position;
        this.chatterManager.style.left = left;
        this.chatterManager.style.top = top;
        this.dialogSide = this.actualUserId !== 'default_avatar_character_12345'
          ? this.findClosestDivPosition(this.actualUserId)
          : 'position-left';
      }
    },
  },
};
</script>

<style scoped>
.avatar-image {
  filter: drop-shadow(1px 2px 1px #424242);
  position: relative;
  object-fit: contain;

  z-index: 10;
  width: 80px;
  height: 220px;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden; /* hide any overflow */
}

/* .v-image--cover {
  background-size: contain;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain; /* ensures the image fits within the container without cutting */
/* } */
.chatter:hover {
  cursor: pointer;
}

.chatter {
  background-size: contain;
}
.private-dialog {
  height: 80vh;
}
.current-user {
  z-index: 990;
}
.user {
  z-index: 980;
}
.nicknameWrapper {
  position: absolute;
  top: -25px;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: center;
}
.nickname{
  color: #ffffff;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 1);
  font-family: 'Nanum Pen Script', cursive !important;
  font-size: 1.5em;
}
</style>
