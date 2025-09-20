<template>
  <div class="rounded-menu" style="text-align: center; height: 200; z-index: 1000; position: relative;">
    <v-btn height="200" class="mx-2 menu-activator" dark @click.prevent.stop="toggleMenu"
      v-touch="{ end: () => toggleMenuTouch }">
    </v-btn>
    <!-- Dummy buffer item to prevent accidental triggers when opening menu -->
    <v-btn :class="hideMenu ? 'hidden' : 'nothidden'" class="mx-2 menu-item" fab dark small @click.prevent.stop
      @touchstart.native.prevent>
      <div>
        <v-icon class="manga-icon" style="opacity: 0.3;"> mdi-circle-outline </v-icon>
      </div>
      <div class="icon-caption" style="opacity: 0.3;">Buffer</div>
    </v-btn>
    <v-btn :disabled="isBlockedBy" :class="hideMenu ? 'hidden' : 'nothidden'" class="mx-2 menu-item" fab dark small
      @click.prevent="toggleMenu" @touchstart.native.prevent="toggleMenu">
      <div>
        <v-icon :disabled="isBlockedBy" class="manga-icon"> mdi-account-plus </v-icon>
      </div>
      <div :disabled="isBlockedBy" class="icon-caption">Add friend</div>
    </v-btn>
    <v-btn :disabled="isBlockedBy" class="mx-2 menu-item" :class="hideMenu ? 'hidden' : 'nothidden'" fab dark small
      @click.prevent.stop="handleEmit('privateMessage')" @touchstart.native.prevent.stop="handleEmit('privateMessage')">

      <div>
        <v-icon :disabled="isBlockedBy" class="manga-icon"> mdi-forum-outline </v-icon>
      </div>
      <div :disabled="isBlockedBy" class="icon-caption">Talk privately</div>
    </v-btn>
    <v-btn :class="hideMenu ? 'hidden' : 'nothidden'" class="mx-2 menu-item" fab dark small @click.prevent="toggleMenu"
      @touchstart.native.prevent="toggleMenu">

      <div>
        <v-icon class="manga-icon"> mdi-information </v-icon>
      </div>
      <div class="icon-caption">Info</div>
    </v-btn>
    <v-btn :class="hideMenu ? 'hidden' : 'nothidden'" class="mx-2 menu-item" fab dark small
      @click.prevent="handleEmit('blockUser')" @touchstart.native.prevent="handleEmit('blockUser')">

      <div>

        <v-icon v-if="isBlocked" class="manga-icon"> mdi-account-lock-open </v-icon>
        <v-icon v-else class="manga-icon"> mdi-account-lock </v-icon>
      </div>
      <div class="icon-caption"> {{ isBlocked ? 'Unblock' : 'Block' }} </div>
    </v-btn>
    <v-btn disabled :class="hideMenu ? 'hidden' : 'nothidden'" class="mx-2 menu-item" fab dark small
      @click.prevent="toggleMenu" @touchstart.native.prevent="toggleMenu">
      <div>
        <v-icon disabled class="manga-icon"> mdi-car-emergency </v-icon>
      </div>
      <div disabled class="icon-caption">Report</div>
    </v-btn>
    <v-btn :class="hideMenu ? 'hidden' : 'nothidden'" class="mx-2 menu-item" fab dark small
      @click.prevent.stop="handleEmit('showUserMessages')" @touchstart.native.prevent="handleEmit('showUserMessages')">

      <div>
        <v-icon class="manga-icon"> mdi-timeline-text-outline </v-icon>
        <!-- <v-icon> mdi-account-lock </v-icon> -->
      </div>
      <div class="icon-caption">User Messages</div>
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
import useUserStore from '@/stores/user';
import {
  ref, computed, nextTick, onMounted,
} from 'vue';

const props = defineProps({
  userId: String,
});
const userStore = useUserStore();
// emits
const emit = defineEmits(['showUserMessages', 'privateMessage']);
const hideMenu = ref(true);
const movingTouch = ref(false);

const getCurrentUser = computed(() => userStore.getCurrentUser);
const isBlocked = computed(() => userStore.isBlocked(props.userId));
const isBlockedBy = computed(() => userStore.isBlockedBy(props.userId));

onMounted(() => {
  console.log('RoundedMenu mounted props', props);
});

const toggleMenu = () => {
  nextTick(() => {
    hideMenu.value = !hideMenu.value;
  });
};

const toggleMenuTouch = () => {
  nextTick(() => {
    if (movingTouch.value === false) {
      hideMenu.value = !hideMenu.value;
    }
  });
};

const handleEmit = (item) => {
  switch (item) {
    case 'privateMessage':
      if (movingTouch.value === false) {
        toggleMenu();
        // emit event to parent
        emit('privateMessage');
      }
      break;
    case 'showUserMessages':
      if (movingTouch.value === false) {
        toggleMenu();
        // emit event to parent
        emit('showUserMessages');
      }
      break;
    case 'blockUser':
      if (movingTouch.value === false) {
        toggleMenu();
        // emit event to parent
        emit('blockUser');
      }
      break;

    default:
      break;
  }
};
</script>
<style lang="scss" scoped>
@import '@/styles/rounded-menu.scss';

// RoundedMenu specific override for buffer item
.nothidden:nth-child(2) {
  opacity: 0.3; // Different from RoundedMenuCurrent
}
</style>
