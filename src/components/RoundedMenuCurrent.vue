<template>
<div style="text-align:center;height:200">
  <v-btn height="200" class="mx-2 menu-activator" dark
      @click.prevent.stop="toggleMenu"
      v-touch="{
        start: () => movingTouch = false,
        end: () => toggleMenuTouch,
        left: () => movingTouch = true,
        down: () => movingTouch = true,
        right: () => movingTouch = true,
        up: () => movingTouch = true,
        move: () => movingTouch = true,

}">
    </v-btn>
    <v-btn
      :class="hideMenu ? 'hidden' : 'nothidden'"
      class="mx-2 menu-item"
      fab
      dark
      small
      @click.prevent.stop="emit('showAvatarList')"
            v-touch="{
      end: () => emit('showAvatarList'),
    }"
    >
      <v-icon> mdi mdi-account-switch </v-icon>
    </v-btn>
    <v-btn
      class="mx-2 menu-item"
      :class="hideMenu ? 'hidden' : 'nothidden'"
      fab
      dark
      small
      @click="emit('privateMessage')"
      v-touch="{
      end: () => emit('privateMessage'),
    }"
    >
      <v-icon> mdi-forum-outline </v-icon>
    </v-btn>
    <v-btn
      :class="hideMenu ? 'hidden' : 'nothidden'"
      class="mx-2 menu-item"
      fab
      dark
      small
      @click.prevent.stop="emit('exitRoom')"
      @touchstart.native.prevent="emit('exitRoom')"
      v-touch="{
      end: () => toggleMenu,
    }"
    >
      <v-icon> mdi-door-open </v-icon>
    </v-btn>
    <v-btn
      :class="hideMenu ? 'hidden' : 'nothidden'"
      class="mx-2 menu-item"
      fab
      dark
      small
      @click.prevent="toggleMenu"
      @touchstart.native.prevent="toggleMenu"
      v-touch="{
      end: () => toggleMenu,
    }"
    >
      <v-icon> mdi mdi-eye-off </v-icon>
    </v-btn>
    <v-btn
      :class="hideMenu ? 'hidden' : 'nothidden'"
      class="mx-2 menu-item"
      fab
      dark
      small
      @click.prevent.stop="emit('signOut')"
      @touchstart.native.prevent="emit('signOut')"
      v-touch="{
      end: () => toggleMenu,
    }"
    >
      <v-icon> mdi mdi-logout-variant </v-icon>
    </v-btn>
    <v-btn
      :class="hideMenu ? 'hidden' : 'nothidden'"
      class="mx-2 menu-item"
      fab
      dark
      small
      @click.prevent="toggleMenu"
      @touchend.native.prevent="toggleMenu"
      v-touch="{
      end: () => toggleMenu,
    }"
    >
      <v-icon> mdi-alpha-f-circle-outline </v-icon>
    </v-btn>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

export default {
  name: 'roundedmenucurrent',
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
  mounted() {},
  computed: {
    ...mapGetters('user', ['getCurrentUser']),
  },
  methods: {
    ...mapActions('messages', ['sendMessage']),
    toggleMenu() {
      this.$nextTick(() => {
        if (this.moving === false) {
          this.hideMenu = !this.hideMenu;
        }
      });
    },
    toggleMenuTouch() {
      this.$nextTick(() => {
        // if (this.movingTouch === false) {
        this.hideMenu = !this.hideMenu;
        // }
      });
    },
    emit(item) {
      switch (item) {
        case 'privateMessage':
          this.toggleMenu();
          this.$emit('privateMessage');
          break;
        case 'exitRoom':
          this.toggleMenu();
          this.$emit('exitRoom');
          break;
        case 'showAvatarList':
          this.toggleMenu();
          this.$emit('showAvatarList');
          break;
        case 'signOut':
          this.toggleMenu();
          this.$emit('signOut');
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
  top: 50;
   margin-left: -40px;
   position: absolute;
   -webkit-transform: translate3d(0, 0, 0);
   transform: translate3d(0, 0, 0);
   -webkit-transition: -webkit-transform ease-out 200ms;
   transition: -webkit-transform ease-out 200ms;
   transition: opacity transform ease-out 200ms;
   transition: opacity transform ease-out 200ms, -webkit-transform ease-out 200ms;
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
.menu-item {
  -webkit-transition-timing-function: cubic-bezier(0.935, 0, 0.34, 1.33);
  transition-timing-function: cubic-bezier(0.935, 0, 0.34, 1.33);
  position: absolute;
  top: 50px;
  left: -5px;
  z-index: 1000;
  border: 2px solid white;
}
.nothidden:nth-child(2) {
   transition-duration: 180ms;
   -webkit-transition-duration: 180ms;
   -webkit-transform: translate3d(0.08361px, -104.99997px, 0);
   transform: translate3d(0.08361px, -104.99997px, 0);
   opacity: 1;
}
.nothidden:nth-child(3) {
   transition-duration: 280ms;
   -webkit-transition-duration: 280ms;
   -webkit-transform: translate3d(90.9466px, -52.47586px, 0);
   transform: translate3d(90.9466px, -52.47586px, 0);
   opacity: 1;
}

.nothidden:nth-child(4) {
   transition-duration: 380ms;
   -webkit-transition-duration: 380ms;
   -webkit-transform: translate3d(90.9466px, 52.47586px, 0);
   transform: translate3d(90.9466px, 52.47586px, 0);
   opacity: 1;
}

.nothidden:nth-child(5) {
   transition-duration: 480ms;
   -webkit-transition-duration: 480ms;
   -webkit-transform: translate3d(0.08361px, 104.99997px, 0);
   transform: translate3d(0.08361px, 104.99997px, 0);
   opacity: 1;
}

.nothidden:nth-child(6) {
   transition-duration: 580ms;
   -webkit-transition-duration: 580ms;
   -webkit-transform: translate3d(-90.86291px, 52.62064px, 0);
   transform: translate3d(-90.86291px, 52.62064px, 0);
   opacity: 1;
}

.nothidden:nth-child(7) {
   transition-duration: 680ms;
   -webkit-transition-duration: 680ms;
   -webkit-transform: translate3d(-91.03006px, -52.33095px, 0);
   transform: translate3d(-91.03006px, -52.33095px, 0);
   opacity: 1;
}
.menu-activator {
  opacity: 0;
  position: absolute;
  top: 0;
  height: 200px;
  left: 0;
  z-index: 1000;
  -webkit-transform:translate3d(0,0,0);
  // touch-action: none;
}

</style>
