<!-- eslint-disable max-len -->
<template>
  <div style="text-align:center">
    <v-btn class="mx-2 keyboard-icon" fab dark x-small :ripple="false" @click.prevent="toggleKeyBoard"
      @touchstart.native.prevent="toggleKeyBoard">
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
          <v-textarea @keypress.enter.prevent="enterPress" @input="checkValue" class="text-area-input text-body-2"
            no-resize hide-details rows="1" row-height="2" max="10" :maxlength="61" counter ref="refDialog"
            :value="message" v-model="message" outlined style="border-radius: 10px 0px 0px 10px;line-height: 1.3;">
          </v-textarea>
        </v-col>
        <v-spacer></v-spacer>
        <v-col cols="3" style="background: rgba(255,255,255,0.5);border-radius: 0px 10px 10px 0px;">
          <v-btn class="grey lighten-1" :disabled="message.length === 0" @click="talk" @touchstart.native.prevent="talk"
            block elevation="2" large x-small style="border-radius: 0px 10px 10px 0px;height: 98.5%;">
            <span class="text-caption font-weight-medium" style="color: #616161;
text-shadow: 1px 1px 1px rgba(255,255,255,.5);">Talk</span></v-btn>
        </v-col>
      </v-row>
    </v-expand-transition>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

export default {
  name: 'typebox',
  props: {
    moving: {
      default: false,
      type: Boolean,
    },
  },
  data: () => ({
    message: '',
    hideKeyboard: true,
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
    talk() {
      this.sendMessage(
        {
          message: this.message,
          userId: this.getCurrentUser.userId,
          roomId: this.$route.params.roomId,
        },
      );
      this.message = '';
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
  left: -120px;
  bottom: -60px;
  position: absolute;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  line-height: 1.3;
  width: 300px;
}

.text-area-input textarea {
  line-height: 1.3rem !important;
  margin-top: 3px !important;
  padding-top: 5px !important;
}

.keyboard-icon {
  z-index: 100;
  border: 2px solid white;
}
</style>
