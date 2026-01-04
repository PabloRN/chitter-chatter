<template>
  <v-scroll-y-reverse-transition>
    <div class="private-dialog text-body-2 pa-4" style="width:100%; height:80vh;">
      <v-btn @click="closedialogprivate" class="menu-item" fab small>
        <v-icon color="black" class="manga-icon">mdi-close</v-icon>
      </v-btn>
      <v-card id="dialogPrivate" class="pa-4" style="width:100%; height:65vh; overflow-y: scroll">
        <v-card-title class="text-body-2">

        </v-card-title>
        <v-card-text v-for="(t, idx) in text" :key="idx" style="height: 10vh;" :class="t.userId === getCurrentUser.userId
          ? 'd-flex justify-end align-center' : 'd-flex justify-start align-center'">
          <v-avatar v-if="t.userId !== getCurrentUser.userId" color="white" class="avatar">
            <v-img contain :src="userData[t.userId].miniAvatar" alt="avatar"
              class="elevation-6 pa-1 mini-avatar"></v-img>
          </v-avatar>
          <div class="ma-3 private-text">{{ t.message }}</div>
          <v-avatar v-if="t.userId === getCurrentUser.userId" color="white" class="avatar">
            <v-img contain :src="getCurrentUser.miniAvatar" alt="avatar" class="elevation-6 pa-1 mini-avatar"></v-img>
          </v-avatar>
        </v-card-text>
      </v-card>
      <PrivateTypeBox />

    </div>
  </v-scroll-y-reverse-transition>
</template>

<script>
import PrivateTypeBox from '@/components/PrivateTypeBox';
import useUserStore from '@/stores/user';

export default {
  name: 'PrivateDialogBubble',
  components: {
    PrivateTypeBox,
  },
  setup() {
    const userStore = useUserStore();

    return {
      userStore,
    };
  },
  props: {
    message: Array,
  },
  data: () => ({
    text: '',
  }),
  mounted() {
    this.text = this.message;
  },
  computed: {
    getCurrentUser() {
      return this.userStore.getCurrentUser;
    },
    userData() {
      return this.userStore.userData;
    },
  },
  methods: {
    gotoBottom(element) {
      // eslint-disable-next-line no-param-reassign
      element.scrollTop = element.scrollHeight;
    },
    closedialogprivate() {
      this.$emit('privateMessageClosed');
    },
  },
  watch: {
    message(value) {
      if (value && value.length > 0) {
        this.text = value;
        this.avatar = value.avatar;
        const element = document.getElementById('dialogPrivate');
        this.gotoBottom(element);
      }
    },
  },
};
</script>
<style scoped>
@import url(https://fonts.googleapis.com/css?family=Ubuntu:300,300italic,regular,italic,500,500italic,700,700italic);

.private-dialog {
  height: 100%;
  position: relative;
}

.v-btn.menu-item {
  position: absolute;
  right: 0;
  top: -10px;
  z-index: 1;
  height: 60px;
  border-radius: 50%;
  background: var(--button-background) !important;
  border: var(--border-width) solid var(--button-border) !important;
  border-radius: 50% !important;
  width: 40px !important;
  height: 40px !important;
  min-width: 40px !important;

  .manga-icon {
    color: var(--button-text) !important;
    font-size: 18px !important;
  }

  &:hover {
    background: var(--button-background-hover) !important;
    border: var(--border-width-hover) solid var(--button-border) !important;

    .manga-icon {
      color: var(--button-text) !important;
    }
  }
}

.close-dialog {
  position: absolute;
  right: -15px;
  top: -15px;
  z-index: 1;
  height: 60px;
  border-radius: 50%;
}

.private-text {
  margin: 10px;
  font-family: 'Nanum Pen Script', cursive !important;
  font-size: 1.3rem;
  line-height: 1.1;
}

.mini-avatar {
  background-size: 80%;
}

.avatar {
  width: 40px;
  height: 40px;
  border: 1px solid #272626;
}
</style>
