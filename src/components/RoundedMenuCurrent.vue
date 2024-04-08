<template>
  <div style="text-align:center;position:relative;top:-250px;left:10px;height:200">
    <v-btn height="200" class="mx-2 menu-activator" dark
      @click.prevent.stop="toggleMenu"
      @touchstart.native.prevent="toggleMenu">
    </v-btn>
    <v-btn :class="hideMenu ? 'hidded' : 'nothidded' "
    class="mx-2 menu-item" fab dark small @click.prevent.stop="emit('showAvatarList')"
      @touchstart.native.prevent="emit('showAvatarList')">
      <v-icon >
        mdi mdi-account-switch
    </v-icon>
    </v-btn>
    <v-btn class="mx-2 menu-item"
     :class="hideMenu ? 'hidded' : 'nothidded' "
      fab dark small @click.prevent.stop="emit('privateMessage')"
      @touchstart.native.prevent.stop="emit('privateMessage')">
      <v-icon >
      mdi-forum-outline
    </v-icon>
    </v-btn>
    <v-btn  :class="hideMenu ? 'hidded' : 'nothidded' "
     class="mx-2 menu-item" fab dark small @click.prevent.stop="emit('exitRoom')"
      @touchstart.native.prevent="emit('exitRoom')">
      <v-icon >
      mdi-door-open
    </v-icon>
    </v-btn>
    <v-btn  :class="hideMenu ? 'hidded' : 'nothidded' "
     class="mx-2 menu-item" fab dark small @click.prevent="toggleMenu"
      @touchstart.native.prevent="toggleMenu">
      <v-icon >
        mdi mdi-eye-off
    </v-icon>
    </v-btn>
    <v-btn  :class="hideMenu ? 'hidded' : 'nothidded' "
     class="mx-2 menu-item" fab dark small @click.prevent.stop="emit('signOut')"
      @touchstart.native.prevent="emit('signOut')">
      <v-icon >
        mdi mdi-logout-variant
    </v-icon>
    </v-btn>
    <v-btn  :class="hideMenu ? 'hidded' : 'nothidded' "
     class="mx-2 menu-item" fab dark small @click.prevent="toggleMenu"
      @touchstart.native.prevent="toggleMenu">
      <v-icon >
      mdi-alpha-f-circle-outline
    </v-icon>
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
  }),
  mounted() {

  },
  computed: {
    ...mapGetters('user', ['getCurrentUser']),
  },
  methods: {
    ...mapActions('messages', ['sendMessage']),
    enterPress(e) {
      if (e.type === 'keypress' && e.key === 'Enter') {
        this.talk();
      }
    },
    toggleMenu() {
      // e.preventDefault();
      // e.stopPropagation();
      console.log(this.moving);
      if (this.moving === false) {
        this.hideMenu = !this.hideMenu;
      }
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
.keyboard-icon{
   z-index: 100;
   border: 2px solid white;
}
.menu-item {
   -webkit-transition-timing-function: cubic-bezier(0.935, 0, 0.34, 1.33);
   transition-timing-function: cubic-bezier(0.935, 0, 0.34, 1.33);
   position: absolute;
   top: 50px;
   left: -5px;
   z-index: 100;
   border: 2px solid white;
}
.nothidded:nth-child(2) {
   transition-duration: 180ms;
   -webkit-transition-duration: 180ms;
   -webkit-transform: translate3d(0.08361px, -104.99997px, 0);
   transform: translate3d(0.08361px, -104.99997px, 0);
   opacity: 1;
}
.nothidded:nth-child(3) {
   transition-duration: 280ms;
   -webkit-transition-duration: 280ms;
   -webkit-transform: translate3d(90.9466px, -52.47586px, 0);
   transform: translate3d(90.9466px, -52.47586px, 0);
   opacity: 1;
}

.nothidded:nth-child(4) {
   transition-duration: 380ms;
   -webkit-transition-duration: 380ms;
   -webkit-transform: translate3d(90.9466px, 52.47586px, 0);
   transform: translate3d(90.9466px, 52.47586px, 0);
   opacity: 1;
}

.nothidded:nth-child(5) {
   transition-duration: 480ms;
   -webkit-transition-duration: 480ms;
   -webkit-transform: translate3d(0.08361px, 104.99997px, 0);
   transform: translate3d(0.08361px, 104.99997px, 0);
   opacity: 1;
}

.nothidded:nth-child(6) {
   transition-duration: 580ms;
   -webkit-transition-duration: 580ms;
   -webkit-transform: translate3d(-90.86291px, 52.62064px, 0);
   transform: translate3d(-90.86291px, 52.62064px, 0);
   opacity: 1;
}

.nothidded:nth-child(7) {
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
}

</style>
