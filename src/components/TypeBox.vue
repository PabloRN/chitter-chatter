<!-- eslint-disable max-len -->
<template>
  <div :style="{ ...typeBoxPosition, textAlign: 'center' }" ref="buttonK">
    <!-- Keyboard Toggle Button -->
    <v-btn class="mx-2 manga-keyboard-icon" fab small :ripple="false" @click="toggleKeyBoard"
      @touchstart.stop="toggleKeyBoard">
      <v-icon v-if="hideKeyboard" size="20">mdi-keyboard</v-icon>
      <v-icon v-else size="20">mdi-keyboard-off</v-icon>
    </v-btn>

    <v-expand-transition>
      <v-row v-if="!hideKeyboard" no-gutters class="manga-typebox mt-3">
        <!-- Input Field -->
        <v-col cols="9" class="input-section">
          <v-text-field ref="refDialog" v-model="message" class="manga-input" rows="1" row-height="2" :maxlength="61"
            hide-details variant="outlined" placeholder="Type your message..." inputmode="text"
            @keydown.enter.prevent="enterPress" />
        </v-col>

        <!-- Talk Button -->
        <v-col cols="3" class="button-section">
          <v-btn class="manga-talk-button" :disabled="message.length === 0" block @click="talk"
            @touchstart.prevent="talk">
            <span class="talk-text">TALK</span>
          </v-btn>
        </v-col>
      </v-row>
    </v-expand-transition>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue';
import { useRoute } from 'vue-router';

import isMobile from '@/utils/mobileDetection';
import useUserStore from '@/stores/user';
import useMessagesStore from '@/stores/messages';

/* -----------------------------------
 * Props & Emits
 * ----------------------------------- */
const props = defineProps({
  moving: {
    type: Boolean,
    default: false,
  },
  avatarDimensions: {
    type: Object,
    default: () => ({ width: 80, height: 220 }),
  },
  roomId: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['keyboard-clicked']);

/* -----------------------------------
 * Stores & Router
 * ----------------------------------- */
const userStore = useUserStore();
const messagesStore = useMessagesStore();
const route = useRoute();

/* -----------------------------------
 * Refs / State
 * ----------------------------------- */
const message = ref('');
const hideKeyboard = ref(false);
const inputFocused = ref(false);

const refDialog = ref(null);
const buttonK = ref(null);

/* -----------------------------------
 * Computed
 * ----------------------------------- */
const getCurrentUser = computed(() => userStore.getCurrentUser);

const typeBoxPosition = computed(() => {
  const avatarWidth = props.avatarDimensions.width;
  const typeBoxWidth = window.innerWidth <= 768 ? 280 : 300;
  const leftOffset = (avatarWidth - typeBoxWidth) / 2;

  return {
    left: `${leftOffset}px`,
    bottom: '-70px',
  };
});

/* -----------------------------------
 * Methods
 * ----------------------------------- */
function enterPress(e) {
  e.preventDefault();
  talk(e);
}

function talk(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  if (!message.value.trim()) return;

  messagesStore.sendMessage({
    message: message.value,
    userId: getCurrentUser.value.userId,
    nickname: getCurrentUser.value.nickname,
    roomId: props.roomId,
    miniAvatar: getCurrentUser.value.miniAvatar,
  });

  message.value = '';

  // Hide keyboard on mobile
  if (isMobile()) {
    const input = refDialog.value?.$el?.querySelector('input');
    input?.blur();

    nextTick(() => {
      hideKeyboard.value = true;
    });
  }
}

function toggleKeyBoard(e) {
  e.preventDefault();
  e.stopPropagation();

  if (props.moving) return;

  emit('keyboard-clicked');
  hideKeyboard.value = !hideKeyboard.value;

  nextTick(() => {
    if (!hideKeyboard.value && refDialog.value) {
      refDialog.value.focus();
    }
  });
}
</script>

<style lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

/* Keyboard Button */
.manga-keyboard-icon {
  background: var(--button-background) !important;
  border: var(--border-width) solid var(--button-border) !important;
  border-radius: 50% !important;
  z-index: 1000;
  width: 40px !important;
  height: 40px !important;
  min-width: 40px !important;

  .v-icon {
    color: #fff !important;
  }

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 0 18px rgba(255, 110, 196, 0.9), 0 0 18px rgba(120, 115, 245, 0.9);
  }
}

/* Typebox Container */
.manga-typebox {
  position: absolute;
  width: 300px;
  right: -115%;
  color: #ffffff;
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 16px;
  padding: 4px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.6);


  .input-section {
    background: rgba(255, 255, 255, 0.15);
    border: 0px solid rgba(255, 255, 255, 0.3);
    border-radius: 12px 0 0 12px;
    box-shadow: inset 0 0 6px rgba(255, 255, 255, 0.2);
  }

  .button-section {
    background: rgba(0, 0, 0, 0.5);
    border-radius: 0 12px 12px 0;
    border-left: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: inset 0 0 8px rgba(255, 255, 255, 0.2);

    button: {
      height: 100%;
    }
  }
}

/* Input Field */
.manga-input :deep(.v-field__input) {
  font-size: 0.9rem !important;
  color: #fff !important;
  text-shadow: 1px 1px 2px #000;
  padding: 6px 10px !important;

  &::placeholder {
    color: #ddd !important;
    opacity: 0.8;
  }
}

/* Talk Button */
.manga-talk-button {
  background: rgba(0, 0, 0, 0.4) !important;
  border: 1px solid rgba(255, 255, 255, 0.306) !important;
  border-radius: 0 12px 12px 0 !important;
  color: #fff;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  transition: all 0.2s ease;
  box-shadow: var(--shadow-medium) !important;
  height: 100% !important;


  &:hover {
    transform: scale(1.05);
    box-shadow: var(--shadow-medium) !important;
  }

  &:disabled {
    background: rgba(100, 100, 100, 0.3) !important;

    .talk-text {
      color: #bbb !important;
      text-shadow: none;
    }
  }

  .talk-text {
    font-size: 0.7rem;
  }
}

/* Mobile tweaks */
@media (max-width: 768px) {
  .manga-typebox {
    width: 280px;
    right: -110%;

    .manga-input :deep(.v-field__input) {
      font-size: 0.8rem !important;
      padding: 4px 8px !important;
    }

    .talk-text {
      font-size: 0.8rem !important;
    }
  }
}
</style>
