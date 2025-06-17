<template>
<v-expand-transition>
    <v-row no-gutters class="pa-1 typebox mt-3">
      <v-col class="" cols="9"
       style="background: rgba(255,255,255, 1);border-radius: 3px 0px 0px 3px;line-height: 1.3;">
        <v-textarea @keypress.enter.prevent="enterPress"
         @input="checkValue" class="text-area-input text-body-2"
           no-resize
           hide-details
           rows="1"
           row-height="2"
           max="10"
           :maxlength="61"
           counter
           ref="refDialog"
           :value="message"
           v-model="message" outlined>
        </v-textarea>
      </v-col>
      <v-spacer></v-spacer>
      <v-col cols="3" class="pl-1"
       style="background: rgba(255,255,255,1);border-radius: 0px 3px 3px 0px;">
        <v-btn class="grey lighten-5"
         :disabled="message.length === 0" @click="talk" @touchstart.native.prevent="talk"
          block elevation="2" large x-small
         style="border-radius: 0px 3px 3px 0px;height: 98.5%;">
         <span class="text-caption font-weight-medium"
          style="color: #616161;
text-shadow: 1px 1px 1px rgba(255,255,255,1);">Talk</span></v-btn>
      </v-col>
    </v-row>
    </v-expand-transition>
</template>

<script>
import { useUserStore } from '@/stores/user';
import { useMessagesStore } from '@/stores/messages';

export default {
  name: 'PrivateTypeBox',
  setup() {
    const userStore = useUserStore();
    const messagesStore = useMessagesStore();

    return {
      userStore,
      messagesStore,
    };
  },
  props: {

  },
  data: () => ({
    message: '',
    hideKeyboard: true,
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
        this.talk();
      }
    },
    talk() {
      this.messagesStore.sendPrivateMessage(
        {
          message: this.message,
          userId: this.getCurrentUser.userId,
        },
      );
      this.message = '';
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
        this.dialog = value.substring(0, 61);
      }

      // value = value.substring(0, value.length - 1);
    },
    // typing(e) {
    // },
  },
};
</script>
<style scoped lang="scss">

.typebox {
  left: 0;
  bottom: 0;
  position: relative;
  background-color: rgba(255,255,255, 0.3);
  border-radius: 3px;
  line-height: 1.3;
  width: 100%;
}
.text-area-input textarea{
    line-height: 1.3rem!important;
    margin-top: 3px!important;
    padding-top: 5px!important;
}
.keyboard-icon{
   z-index: 100;
   border: 3px solid white;
}

</style>
