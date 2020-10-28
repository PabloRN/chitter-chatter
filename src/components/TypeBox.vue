<template>
  <div style="text-align:center">
    <v-btn
      class="mx-2 keyboard-icon"
      fab
      dark
      x-small
      @click.prevent="toggleKeyBoard"
    >
      <v-icon v-if="hideKeyboard" dark>
        mdi-keyboard
      </v-icon>
      <v-icon v-else dark>
        mdi-keyboard-off
      </v-icon>
    </v-btn>
  <!-- <v-icon class="keyboard-icon" v-if="hideKeyboard" @click="toggleKeyBoard"
  color="white"
  medium
>mdi-keyboard-outline</v-icon> -->
<v-expand-transition>
    <v-row v-if="!hideKeyboard" no-gutters class="pa-1 typebox mt-3">
      <v-col class="" cols="9"
       style="background: rgba(255,255,255,0.5);border-radius: 10px 0px 0px 10px;">
        <v-textarea @keypress.enter.prevent="enterPress"
         @input="checkValue" class="text-area-input text-caption"
           no-resize
           hide-details
           :rows="1"
           row-height="5"
           max="10"
           counter
           ref="refDialog"
           :value="dialog"
           v-model="dialog" outlined style="border-radius: 10px 0px 0px 10px;line-height: 1.3;">
        </v-textarea>
      </v-col>
      <v-spacer></v-spacer>
      <v-col cols="3" style="background: rgba(255,255,255,0.5);border-radius: 0px 10px 10px 0px;">
        <v-btn class="grey lighten-1"
         :disabled="dialog.length === 0" @click="talk"  block elevation="2" large x-small
         style="border-radius: 0px 10px 10px 0px;height: 98.5%;">
         <span class="text-caption font-weight-medium"
          style="color: #616161;
text-shadow: 1px 1px 1px rgba(255,255,255,.5);">Talk</span></v-btn>
      </v-col>
    </v-row>
    </v-expand-transition>
  </div>
</template>

<script>
import { mapActions } from 'vuex';

export default {
  name: 'typebox',
  props: {

  },
  data: () => ({
    dialog: '',
    hideKeyboard: true,
  }),
  mounted() {

  },
  methods: {
    ...mapActions('dialog', ['sendText']),
    enterPress(e) {
      if (e.type === 'keypress' && e.key === 'Enter') {
        this.talk();
      }
    },
    talk() {
      this.sendText(this.dialog);
      this.dialog = '';
    },
    toggleKeyBoard(e) {
      e.preventDefault();
      e.stopPropagation();
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
        this.dialog = value.substring(0, 30);
      }

      // value = value.substring(0, value.length - 1);
    },
    // typing(e) {
    // },
  },
};
</script>
<style scoped>

.typebox {
  left: -120px;
  bottom: -60px;
  position: absolute;
  background-color: rgba(255,255,255, 0.3);
  border-radius: 10px;
  line-height: 1.3;
  width: 300px;
}
.text-area-input {
    line-height: 1.3rem!important;
}
.v-textarea textarea{
  line-height: 1.3rem!important;
}
.keyboard-icon{
   z-index: 100;
   border: 2px solid white;
}
</style>
