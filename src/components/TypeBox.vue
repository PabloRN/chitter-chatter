<!-- eslint-disable max-len -->
<template>
  <div style="text-align:center" ref="buttonK">
    <v-btn class="mx-2 keyboard-icon" fab dark x-small :ripple="false" @click="toggleKeyBoard"
      @touchsend="toggleKeyBoard">
      <v-icon v-if="hideKeyboard" dark>
        mdi-keyboard
      </v-icon>
      <v-icon v-else dark>
        mdi-keyboard-off
      </v-icon>
    </v-btn>
    <v-expand-transition>
      <v-row v-if="!hideKeyboard" no-gutters class="pa-1 typebox mt-3">
        <v-col class="" cols="9" style="background: rgba(255,255,255,0.5);border-radius: 10px 0px 0px 10px;">
          <v-text-field @keypress.enter.prevent="enterPress" @input="checkValue" class="text-area-input type-box text-body-2"
             rows="1" row-height="2" max="10" :maxlength="61" ref="refDialog"
            :value="message" v-model="message" counter="61" outlined :rules="[ rules.length(61)]"
             style="border-radius: 10px 0px 0px 10px;line-height: 1.3;">
          </v-text-field>
        </v-col>
        <v-spacer></v-spacer>
        <v-col cols="3" style="background: rgba(255,255,255,0.5);border-radius: 0px 10px 10px 0px;">
          <v-btn class="grey lighten-1 talk-button" :disabled="message.length === 0" @click="talk" @touchstart.native.prevent="talk"
            block elevation="2" large x-small style="border-radius: 0px 10px 10px 0px;height: 98.5%;">
            <span class="text-caption font-weight-medium" style="color: #616161;
text-shadow: 1px 1px 1px rgba(255,255,255,.5);">Talk</span></v-btn>
        </v-col>
      </v-row>
    </v-expand-transition>
  </div>
</template>

<script>
import isMobile from '@/utils/mobileDetection';
import { useUserStore } from '@/stores/user';
import { useMessagesStore } from '@/stores/messages';

export default {
  name: 'TypeBox',
  props: {
    moving: {
      default: false,
      type: Boolean,
    },
  },
  setup() {
    const userStore = useUserStore();
    const messagesStore = useMessagesStore();

    return {
      userStore,
      messagesStore,
    };
  },
  data: () => ({
    message: '',
    hideKeyboard: false,
    rules: {
      length: (len) => (v) => (v || '').length < len || '',
    },

  }),
  mounted() {

  },
  computed: {
    getCurrentUser() {
      return this.userStore.getCurrentUser;
    },
  },
  methods: {
    enterPress(e) {
      if (e.type === 'keypress' && e.key === 'Enter') {
        this.talk(e);
      }
    },
    talk(e) {
      e.preventDefault();
      e.stopPropagation();
      this.messagesStore.sendMessage(
        {
          message: this.message,
          userId: this.getCurrentUser.userId,
          nickname: this.getCurrentUser.nickname,
          roomId: this.$route.params.roomId,
          miniAvatar: this.getCurrentUser.miniAvatar,
        },
      );
      this.message = '';
      if (isMobile()) this.$refs.refDialog.blur();
    },
    toggleKeyBoard(e) {
      e.preventDefault();
      e.stopPropagation();
      if (this.moving) return;
      this.$emit('keyboard-clicked');
      this.hideKeyboard = !this.hideKeyboard;
      this.$nextTick(() => {
        if (this.$refs.refDialog) {
          this.$refs.refDialog.focus();
        }
      });
    },
    checkValue(value) {
      if (value) {
        this.dialog = value.substring(0, 61);
      }

      // value = value.substring(0, value.length - 1);
    },
    // typing(e) {
    // },
  },
};
</script>
<style lang="scss">
.typebox {
  z-index: 10000;
  -webkit-transform:translate3d(0,0,0);
  left: -120px;
  bottom: -60px;
  position: absolute;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  line-height: 1.3;
  width: 300px;
}

.text-area-input {
  line-height: 1.3rem !important;
  // margin-top: 3px !important;
  // padding-top: 5px !important;
  z-index: 999;
}
.talk-button {
  z-index: 10000;
}
.keyboard-icon {
  border: 2px solid white;
}
.v-text-field__details {
    display: flex;
    flex: 1 0 auto;
    max-width: 100%;
    min-height: 14px;
    overflow: hidden;
    position: absolute;
    bottom: -3px;
    right: 1px;
}
.v-input__slot {
    align-items: center;
    display: flex;
    margin-bottom: 0px;
    min-height: inherit;
    position: relative;
    transition: 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
    transition-property: height, min-height;
    width: 100%;
}
</style>
