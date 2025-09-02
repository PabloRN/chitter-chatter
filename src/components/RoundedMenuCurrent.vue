<template>
  <div class="rounded-menu" style="text-align: center; height: 200; z-index: 1000;">
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
      @click.prevent.stop="handleEmit('showAvatarList')" @touchstart.native.prevent="handleEmit('showAvatarList')">
      <div>
        <v-icon class="manga-icon"> mdi-cards </v-icon>
      </div>
      <div class="icon-caption">Switch Avatar</div>
    </v-btn>
    <v-btn class="mx-2 menu-item" :class="hideMenu ? 'hidden' : 'nothidden'" fab dark small
      @click.prevent.stop="handleEmit('privateMessage')" @touchstart.native.prevent="handleEmit('privateMessage')">
      <div>
        <v-icon class="manga-icon">mdi-account-cog</v-icon>
      </div>
      <div class="icon-caption">Profile</div>

    </v-btn>
    <v-btn :class="hideMenu ? 'hidden' : 'nothidden'" class="mx-2 menu-item" fab dark small
      @click.prevent.stop="handleEmit('exitRoom')" @touchstart.native.prevent="handleEmit('exitRoom')">
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
      @click.prevent.stop="handleEmit('signOut')" @touchstart.native.prevent="handleEmit('signOut')" v-touch="{
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
      @click.prevent.stop="handleEmit('showMessages')" @touchstart.native.prevent="handleEmit('showMessages')">
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

<script setup>
import { ref, computed, nextTick } from 'vue';
import useUserStore from '@/stores/user';
import useMessagesStore from '@/stores/messages';

// props
const props = defineProps({
  moving: {
    type: Boolean,
    default: false,
  },
});

// emits
const emit = defineEmits(['privateMessage', 'exitRoom', 'showAvatarList', 'signOut', 'showMessages']);

// stores
const userStore = useUserStore();
const messagesStore = useMessagesStore();

// reactive state
const message = ref('');
const hideMenu = ref(true);
const movingTouch = ref(false);

// computed
const getCurrentUser = computed(() => userStore.getCurrentUser);

// functions
const toggleMenu = () => {
  nextTick(() => {
    if (!props.moving) {
      hideMenu.value = !hideMenu.value;
    }
  });
};

const toggleMenuTouch = () => {
  nextTick(() => {
    if (!movingTouch.value) {
      hideMenu.value = !hideMenu.value;
    }
  });
};

const handleEmit = (item) => {
  if (movingTouch.value) return;

  switch (item) {
    case 'privateMessage':
      toggleMenu();
      emit('privateMessage');
      break;
    case 'exitRoom':
      toggleMenu();
      emit('exitRoom');
      break;
    case 'showAvatarList':
      toggleMenu();
      emit('showAvatarList');
      break;
    case 'signOut':
      toggleMenu();
      if (!getCurrentUser.value.isAnonymous) {
        emit('signOut');
      }
      break;
    case 'showMessages':
      toggleMenu();
      emit('showMessages');
      break;
  }
};
</script>

<style lang="scss">
@import '@/styles/rounded-menu.scss';
</style>
