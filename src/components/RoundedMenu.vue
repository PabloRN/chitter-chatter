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
    <v-btn :disabled="isBlockedBy || otherIsAnonymous" :class="hideMenu ? 'hidden' : 'nothidden'" class="mx-2 menu-item"
      fab dark small @click.prevent="handleEmit('addFriend')" @touchstart.native.prevent="handleEmit('addFriend')">
      <div>
        <v-icon :disabled="isBlockedBy || otherIsAnonymous" class="manga-icon">
          mdi-account-plus </v-icon>
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
    <v-btn :class="hideMenu ? 'hidden' : 'nothidden'" class="mx-2 menu-item" fab dark small
      @click.prevent="handleEmit('userInfo')" @touchstart.native.prevent="handleEmit('userInfo')">
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
    <v-btn :class="hideMenu ? 'hidden' : 'nothidden'" class="mx-2 menu-item" fab dark small
      @click.prevent="handleEmit('reportUser')" @touchstart.native.prevent="handleEmit('reportUser')">
      <div>
        <v-icon class="manga-icon"> mdi-car-emergency </v-icon>
      </div>
      <div class="icon-caption">Report</div>
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
  <ReportUserDialog v-model="showReportDialog" :target-user-id="reportTargetUserId"
    :target-user-nickname="reportTargetNickname" @success="handleReportSuccess"
    @already-reported="handleAlreadyReported" @limit-reached="handleLimitReached" />
</template>

<script setup>
import useUserStore from '@/stores/user';
import {
  ref, computed, nextTick, onMounted,
} from 'vue';
import ReportUserDialog from '@/components/ReportUserDialog.vue';

const props = defineProps({
  userId: String,
  nickname: String,
});
const userStore = useUserStore();
// emits
const emit = defineEmits(['showUserMessages', 'privateMessage', 'blockUser', 'showLoginDialog', 'userInfo']);
const hideMenu = ref(true);
const movingTouch = ref(false);
const showReportDialog = ref(false);
const reportTargetUserId = ref('');
const reportTargetNickname = ref('');

const getCurrentUser = computed(() => userStore.getCurrentUser);
const otherIsAnonymous = computed(() => userStore.userData[props.userId]?.isAnonymous);
const currentUserIsAnonymous = computed(() => userStore.getCurrentUser?.isAnonymous);
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
        if (getCurrentUser.value?.isAnonymous) {
          emit('showLoginDialog');
          return;
        }
        // emit event to parent
        emit('privateMessage');
      }
      break;
    case 'showUserMessages':
      if (movingTouch.value === false) {
        toggleMenu();
        if (getCurrentUser.value?.isAnonymous) {
          emit('showLoginDialog');
          return;
        }
        // emit event to parent
        emit('showUserMessages');
      }
      break;
    case 'blockUser':
      if (movingTouch.value === false) {
        toggleMenu();
        if (getCurrentUser.value?.isAnonymous) {
          emit('showLoginDialog');
          return;
        }
        // emit event to parent
        emit('blockUser');
      }
      break;
    case 'addFriend':
      if (movingTouch.value === false) {
        toggleMenu();
        if (getCurrentUser.value?.isAnonymous) {
          emit('showLoginDialog');
          return;
        }
        // emit event to parent
        emit('addFriend');
      }
      break;
    case 'userInfo':
      if (movingTouch.value === false) {
        toggleMenu();
        if (getCurrentUser.value?.isAnonymous) {
          emit('showLoginDialog');
          return;
        }
        // emit event to parent
        emit('userInfo');
      }
      break;
    case 'reportUser':
      if (movingTouch.value === false) {
        toggleMenu();
        if (getCurrentUser.value?.isAnonymous) {
          emit('showLoginDialog');
          return;
        }
        // emit event to parent
        handleReportUser(props.userId);
      }
      break;
    default:
      break;
  }
};
function handleReportUser(userId) {
  const nickname = userStore.userData[userId]?.nickname;
  reportTargetUserId.value = userId;
  reportTargetNickname.value = nickname;
  showReportDialog.value = true;
}

function handleReportSuccess() {
  mainStore.setSnackbar({
    type: 'success',
    msg: 'Report submitted successfully. Our team will review it.',
  });
}

function handleAlreadyReported() {
  mainStore.setSnackbar({
    type: 'warning',
    msg: 'You have already reported this user. The report is under review.',
  });
}

function handleLimitReached() {
  mainStore.setSnackbar({
    type: 'error',
    msg: 'You have reached the daily report limit (3 reports/day).',
  });
}
</script>
<style lang="scss" scoped>
@import '@/styles/rounded-menu.scss';

// RoundedMenu specific override for buffer item
.nothidden:nth-child(2) {
  opacity: 0.3; // Different from RoundedMenuCurrent
}
</style>
