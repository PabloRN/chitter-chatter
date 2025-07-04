<template>
  <div style="text-align: center; height: 200; z-index: 1000;">
    <v-btn height="200" :class="hideMenu ? 'hidden' : 'nothidden'" class="mx-2 menu-activator" dark
      @click.prevent.stop="toggleMenu" v-touch="{
        start: () => (movingTouch = false),
        end: () => toggleMenuTouch,
        left: () => (movingTouch = true),
        down: () => (movingTouch = true),
        right: () => (movingTouch = true),
        up: () => (movingTouch = true),
        move: () => (movingTouch = true),
      }">
    </v-btn>
    <!-- Dummy buffer item to prevent accidental triggers when opening menu -->
    <v-btn :class="hideMenu ? 'hidden' : 'nothidden'" class="mx-2 menu-item" fab dark small @click.prevent.stop
      @touchstart.native.prevent>
      <div>
        <v-icon class="manga-icon" style="opacity: 0.3;"> mdi-circle-outline </v-icon>
      </div>
      <div class="icon-caption" style="opacity: 0.3;">Buffer</div>
    </v-btn>
    <v-btn :class="hideMenu ? 'hidden' : 'nothidden'" class="mx-2 menu-item" fab dark small
      @click.prevent.stop="emit('showAvatarList')" @touchstart.native.prevent="emit('showAvatarList')">
      <div>
        <v-icon class="manga-icon"> mdi-account-switch </v-icon>
      </div>
      <div class="icon-caption">Switch Avatar</div>
    </v-btn>
    <v-btn class="mx-2 menu-item" :class="hideMenu ? 'hidden' : 'nothidden'" fab dark small
      @click.prevent.stop="emit('privateMessage')" @touchstart.native.prevent="emit('privateMessage')">
      <div>
        <v-icon class="manga-icon">mdi-account-cog</v-icon>
      </div>
      <div class="icon-caption">Profile</div>

    </v-btn>
    <v-btn :class="hideMenu ? 'hidden' : 'nothidden'" class="mx-2 menu-item" fab dark small
      @click.prevent.stop="emit('exitRoom')" @touchstart.native.prevent="emit('exitRoom')">
      <div>
        <v-icon class="manga-icon"> mdi-door-open </v-icon>
      </div>
      <div class="icon-caption">Exit Room</div>
    </v-btn>
    <v-btn :class="hideMenu ? 'hidden' : 'nothidden'" class="mx-2 menu-item" fab dark small
      @click.prevent.stop="toggleMenu" @touchstart.native.prevent="toggleMenu" v-touch="{
        end: () => toggleMenu,
      }">
      <div>
        <v-icon class="manga-icon"> mdi-eye-off </v-icon>
      </div>
      <div class="icon-caption">Hide</div>
    </v-btn>
    <v-btn :class="hideMenu ? 'hidden' : 'nothidden'" class="mx-2 menu-item" fab dark small
      @click.prevent.stop="emit('signOut')" @touchstart.native.prevent="emit('signOut')" v-touch="{
        end: () => toggleMenu,
      }">
      <div>
        <v-icon class="manga-icon" :disabled="getCurrentUser.isAnonymous">
          mdi-logout-variant
        </v-icon>
      </div>
      <div class="icon-caption" :disabled="getCurrentUser.isAnonymous">Logout</div>
    </v-btn>
    <v-btn :class="hideMenu ? 'hidden' : 'nothidden'" class="mx-2 menu-item" fab dark small
      @click.prevent.stop="emit('showMessages')" @touchstart.native.prevent="emit('showMessages')">
      <div>
        <v-icon class="manga-icon"> mdi-timeline-text-outline </v-icon>
      </div>
      <div class="icon-caption">Room Messages</div>
    </v-btn>
    <v-btn class="mx-2 menu-item hidden" fab dark small @click.prevent.stop="toggleMenu" v-touch="{
      start: () => (movingTouch = false),
      end: () => toggleMenuTouch,
      left: () => (movingTouch = true),
      down: () => (movingTouch = true),
      right: () => (movingTouch = true),
      up: () => (movingTouch = true),
      move: () => (movingTouch = true),
    }">
      <div>
      </div>
      <div class="icon-caption">toggle</div>
    </v-btn>
  </div>
</template>

<script>
import useUserStore from '@/stores/user';
import useMessagesStore from '@/stores/messages';

export default {
  name: 'RoundedMenuCurrent',
  setup() {
    const userStore = useUserStore();
    const messagesStore = useMessagesStore();

    return {
      userStore,
      messagesStore,
    };
  },
  props: {
    moving: {
      default: false,
      type: Boolean,
    },
  },
  data: () => ({
    message: '',
    hideMenu: true,
    movingTouch: false,
  }),
  mounted() { },
  computed: {
    getCurrentUser() {
      return this.userStore.getCurrentUser;
    },
  },
  methods: {
    toggleMenu() {
      this.$nextTick(() => {
        if (this.moving === false) {
          this.hideMenu = !this.hideMenu;
        }
      });
    },
    toggleMenuTouch() {
      this.$nextTick(() => {
        if (this.movingTouch === false) {
          this.hideMenu = !this.hideMenu;
        }
      });
    },
    emit(item) {
      switch (item) {
        case 'privateMessage':
          if (this.movingTouch === false) {
            this.toggleMenu();
            this.$emit('privateMessage');
          }
          break;
        case 'exitRoom':
          if (this.movingTouch === false) {
            this.toggleMenu();
            this.$emit('exitRoom');
          }
          break;
        case 'showAvatarList':
          if (this.movingTouch === false) {
            this.toggleMenu();
            this.$emit('showAvatarList');
          }
          break;
        case 'signOut':
          if (this.movingTouch === false) {
            this.toggleMenu();
            if (this.getCurrentUser.isAnonymous === false) this.$emit('signOut');
          }
          break;
        case 'showMessages':
          if (this.movingTouch === false) {
            this.toggleMenu();
            this.$emit('showMessages');
          }
          break;

        default:
          break;
      }
    },
  },
};
</script>
<style lang="scss">
.menu-item {
  z-index: 1000;
  width: min-content;
  top: -65px;
  left: 15px;
  margin-left: -40px;
  position: absolute;
  -webkit-transform: translate3d(0, 0, 0);
  transform: translate3d(0, 0, 0);
  -webkit-transition: -webkit-transform ease-out 200ms;
  transition: -webkit-transform ease-out 200ms;
  transition: opacity transform ease-out 200ms;
  transition: opacity transform ease-out 200ms, -webkit-transform ease-out 200ms;
  -webkit-transition-timing-function: cubic-bezier(0.935, 0, 0.34, 1.33);
  transition-timing-function: cubic-bezier(0.935, 0, 0.34, 1.33);
  border: 2px solid white;
}

.menu-item:nth-child(2) {
  -webkit-transition-duration: 180ms;
  transition-duration: 180ms;
  opacity: 0;
}

.menu-item:nth-child(3) {
  -webkit-transition-duration: 180ms;
  transition-duration: 180ms;
  opacity: 0;
}

.menu-item:nth-child(4) {
  -webkit-transition-duration: 180ms;
  transition-duration: 180ms;
  opacity: 0;
}

.menu-item:nth-child(5) {
  -webkit-transition-duration: 180ms;
  transition-duration: 180ms;
  opacity: 0;
}

.menu-item:nth-child(6) {
  -webkit-transition-duration: 180ms;
  transition-duration: 180ms;
  opacity: 0;
}

.menu-item:nth-child(7) {
  -webkit-transition-duration: 180ms;
  transition-duration: 180ms;
  opacity: 0;
}

// .menu-item {
//   -webkit-transition-timing-function: cubic-bezier(0.935, 0, 0.34, 1.33);
//   transition-timing-function: cubic-bezier(0.935, 0, 0.34, 1.33);
//   position: absolute;
//   top: 45px;
//   left: 5px;
//   z-index: 1000;
//   border: 2px solid white;
// }
.nothidden:nth-child(2) {
  /* Buffer item positioned away from main menu area */
  transition-duration: 180ms;
  -webkit-transition-duration: 180ms;
  -webkit-transform: translate3d(0.08361px, -140px, 0);
  transform: translate3d(0.08361px, -140px, 0);
  opacity: 0;
}

.nothidden:nth-child(3) {
  transition-duration: 180ms;
  -webkit-transition-duration: 180ms;
  -webkit-transform: translate3d(0.08361px, -104.99997px, 0);
  transform: translate3d(0.08361px, -104.99997px, 0);
  opacity: 1;
}

.nothidden:nth-child(4) {
  transition-duration: 280ms;
  -webkit-transition-duration: 280ms;
  -webkit-transform: translate3d(90.9466px, -52.47586px, 0);
  transform: translate3d(90.9466px, -52.47586px, 0);
  opacity: 1;
}

.nothidden:nth-child(5) {
  transition-duration: 380ms;
  -webkit-transition-duration: 380ms;
  -webkit-transform: translate3d(90.9466px, 52.47586px, 0);
  transform: translate3d(90.9466px, 52.47586px, 0);
  opacity: 1;
}

.nothidden:nth-child(6) {
  transition-duration: 480ms;
  -webkit-transition-duration: 480ms;
  -webkit-transform: translate3d(0.08361px, 104.99997px, 0);
  transform: translate3d(0.08361px, 104.99997px, 0);
  opacity: 1;
}

.nothidden:nth-child(7) {
  transition-duration: 580ms;
  -webkit-transition-duration: 580ms;
  -webkit-transform: translate3d(-90.86291px, 52.62064px, 0);
  transform: translate3d(-90.86291px, 52.62064px, 0);
  opacity: 1;
}

.nothidden:nth-child(8) {
  transition-duration: 680ms;
  -webkit-transition-duration: 680ms;
  -webkit-transform: translate3d(-91.03006px, -52.33095px, 0);
  transform: translate3d(-91.03006px, -52.33095px, 0);
  opacity: 1;
}

.menu-activator {
  opacity: 0;
  position: absolute;
  top: 20px;
  height: 200px;
  left: 5px;
  z-index: 1000;
  -webkit-transform: translate3d(0, 0, 0);
  // touch-action: none;
}

.icon-caption {
  position: absolute;
  text-shadow: 1px 1px 2px black;
  top: 35px;
  font-weight: bold;
  font-size: 0.8rem;
  color: #ffffff;
}

.hidden {
  opacity: 0;
  height: 200px !important;
  z-index: 1000;
  top: 0;
}

/* Circular Icon Button Styling */
.v-btn.menu-item {
  background: #1a1a1a !important;
  border: 2px solid #ffffff !important;
  border-radius: 50% !important;
  width: 40px !important;
  height: 40px !important;
  min-width: 40px !important;
  top: 90px;

  .manga-icon {
    color: #ffffff !important;
    font-size: 18px !important;
  }

  &:hover {
    background: #2a2a2a !important;
    border: 3px solid #ffffff !important;

    .manga-icon {
      color: #ffffff !important;
    }
  }
}
</style>
