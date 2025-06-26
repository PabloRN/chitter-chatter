<!-- eslint-disable max-len -->
<template>
  <div style="text-align:center" ref="buttonK">
    <v-btn class="mx-2 manga-keyboard-icon" fab size="small" :ripple="false" @click="toggleKeyBoard"
      @touchstart.stop="toggleKeyBoard">
      <v-icon v-if="hideKeyboard" size="20">
        mdi-keyboard
      </v-icon>
      <v-icon v-else size="20">
        mdi-keyboard-off
      </v-icon>
    </v-btn>
    <v-expand-transition>
      <v-row v-if="!hideKeyboard" no-gutters class="pa-1 manga-typebox mt-3">
        <v-col cols="9" class="input-section">
          <v-text-field @keypress.enter.prevent="enterPress" class="manga-input" rows="1" row-height="2" max="10"
            :maxlength="61" ref="refDialog" v-model="message" hide-details variant="outlined"
            :rules="[rules.length(61)]" placeholder="Type your message..." inputmode="text" @blur="handleBlur"
            @focus="handleFocus" @input="handleInput">
          </v-text-field>
        </v-col>
        <v-col cols="3" class="button-section">
          <v-btn class="manga-talk-button" :disabled="message.length === 0" @click="talk"
            @touchstart.native.prevent="talk" block style="height: 100%">
            <span class="talk-text">TALK</span>
          </v-btn>
        </v-col>
      </v-row>
    </v-expand-transition>
  </div>
</template>

<script>
import isMobile from '@/utils/mobileDetection';
import useUserStore from '@/stores/user';
import useMessagesStore from '@/stores/messages';

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
    hideKeyboard: true,
    inputFocused: false,
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
        e.preventDefault();
        this.talk(e);
      }
    },
    talk(e) {
      e.preventDefault();
      e.stopPropagation();

      if (!this.message.trim()) {
        return;
      }

      this.messagesStore.sendMessage({
        message: this.message,
        userId: this.getCurrentUser.userId,
        nickname: this.getCurrentUser.nickname,
        roomId: this.$route.params.roomId,
        miniAvatar: this.getCurrentUser.miniAvatar,
      });

      this.message = '';

      // For mobile, ensure the input stays active and ready for next message
      if (isMobile()) {
        this.$nextTick(() => {
          if (!this.hideKeyboard && this.$refs.refDialog) {
            // Force focus and selection to ensure the input is ready
            const input = this.$refs.refDialog.$refs.input || this.$refs.refDialog;
            if (input) {
              input.focus();
              // Ensure cursor is positioned correctly
              setTimeout(() => {
                if (input.setSelectionRange) {
                  input.setSelectionRange(0, 0);
                }
              }, 50);
            }
          }
        });
      }
    },
    toggleKeyBoard(e) {
      e.preventDefault();
      e.stopPropagation();
      if (this.moving) return;
      this.$emit('keyboard-clicked');
      this.hideKeyboard = !this.hideKeyboard;
      this.$nextTick(() => {
        if (!this.hideKeyboard && this.$refs.refDialog) {
          // Add a small delay for mobile devices to ensure proper focus
          if (isMobile()) {
            setTimeout(() => {
              this.$refs.refDialog.focus();
            }, 150);
          } else {
            this.$refs.refDialog.focus();
          }
        }
      });
    },
    handleFocus() {
      // Track that the input is focused
      this.inputFocused = true;
    },
    handleBlur() {
      // Track that the input lost focus
      this.inputFocused = false;

      // On mobile, if the keyboard is supposed to be open but focus is lost, refocus
      if (isMobile() && !this.hideKeyboard) {
        setTimeout(() => {
          if (!this.hideKeyboard && this.$refs.refDialog && !this.inputFocused) {
            const input = this.$refs.refDialog.$refs.input || this.$refs.refDialog;
            if (input) {
              input.focus();
            }
          }
        }, 100);
      }
    },
    handleInput() {
      // Ensure focus is maintained during typing on mobile
      if (isMobile() && !this.inputFocused) {
        this.inputFocused = true;
      }
    },
  },
};
</script>
<style lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap');

/* Circular Keyboard Button - Same style as menu items */
.manga-keyboard-icon {
  background: #1a1a1a !important;
  border: 2px solid #ffffff !important;
  border-radius: 50% !important;
  z-index: 1000;
  width: 40px !important;
  height: 40px !important;
  min-width: 40px !important;

  .v-icon {
    color: #ffffff !important;
    font-size: 18px !important;
  }

  &:hover {
    background: #2a2a2a !important;
    border: 3px solid #ffffff !important;

    .v-icon {
      color: #ffffff !important;
    }
  }
}

/* Glass Typebox Container */
.manga-typebox {
  z-index: 1100;
  -webkit-transform: translate3d(0, 0, 0);
  left: -120px;
  bottom: 45px;
  position: absolute;
  width: 300px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);

  .input-section {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-right: 0;
    border-radius: 12px 0 0 12px;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow:
      0 8px 32px 0 rgba(31, 38, 135, 0.37),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }

  .button-section {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-left: 0;
    border-radius: 0 12px 12px 0;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow:
      0 8px 32px 0 rgba(31, 38, 135, 0.37),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
}

/* Manga Input Field */
.manga-input {
  font-family: 'Nanum Pen Script', cursive !important;

  :deep(.v-field) {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    border-radius: 0 !important;

    .v-field__outline {
      display: none !important;
    }

    .v-field__input {
      font-family: 'Nanum Pen Script', cursive !important;
      font-size: 1.2rem !important;
      font-weight: bold !important;
      color: #000000 !important;
      padding: 8px 12px !important;
      line-height: 1.3 !important;

      &::placeholder {
        color: #666666 !important;
        font-family: 'Nanum Pen Script', cursive !important;
        opacity: 0.7;
      }
    }
  }

  :deep(.v-messages) {
    display: none !important;
  }
}

/* Glass Talk Button */
.manga-talk-button {
  background: rgba(0, 0, 0, 0.4) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: 0 12px 12px 0 !important;
  backdrop-filter: blur(10px) !important;
  -webkit-backdrop-filter: blur(10px) !important;
  box-shadow:
    0 8px 32px 0 rgba(31, 38, 135, 0.37),
    inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
  transition: all 0.2s ease !important;

  &:hover {
    background: rgba(0, 0, 0, 0.6) !important;
    box-shadow:
      0 8px 32px 0 rgba(31, 38, 135, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
  }

  &:disabled {
    background: rgba(100, 100, 100, 0.3) !important;

    .talk-text {
      color: #cccccc !important;
    }
  }

  .talk-text {
    font-family: 'Nanum Pen Script', cursive !important;
    font-size: 1.1rem !important;
    font-weight: bold !important;
    color: #ffffff !important;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
    letter-spacing: 1px;
  }
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .manga-typebox {
    width: 280px;
    left: -110px;

    .manga-input :deep(.v-field__input) {
      font-size: 1.1rem !important;
      padding: 6px 10px !important;
    }

    .talk-text {
      font-size: 1rem !important;
    }
  }
}
</style>
