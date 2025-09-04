<template>
  <v-expand-transition>
    <v-row no-gutters class="pa-1 typebox mt-3">
      <v-col cols="9" style="background: rgba(255,255,255, 1);border-radius: 3px 0px 0px 3px;line-height: 1.3;">

        <v-textarea ref="refDialog" v-model="message" @keypress.enter.prevent="enterPress"
          @input="checkValue($event.target.value)" class="text-area-input text-body-2" no-resize hide-details rows="1"
          row-height="2" max="10" :maxlength="500" counter outlined />
      </v-col>

      <v-spacer></v-spacer>

      <v-col cols="3" class="pl-1" style="background: rgba(255,255,255,1);border-radius: 0px 3px 3px 0px;">
        <v-btn class="grey lighten-5" :disabled="message.length === 0" @click="talk" @touchstart.prevent="talk" block
          elevation="2" large x-small style="border-radius: 0px 3px 3px 0px;height: 98.5%;">
          <span class="text-caption font-weight-medium"
            style="color: #616161; text-shadow: 1px 1px 1px rgba(255,255,255,1);">
            Talk
          </span>
        </v-btn>
      </v-col>
    </v-row>
  </v-expand-transition>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import useUserStore from '@/stores/user'
import useMessagesStore from '@/stores/messages'

const userStore = useUserStore()
const messagesStore = useMessagesStore()

// State
const message = ref('')
const hideKeyboard = ref(true)
const refDialog = ref(null)

const getCurrentUser = userStore.getCurrentUser

// Methods
function enterPress(e) {
  if (e.type === 'keypress' && e.key === 'Enter') {
    talk()
  }
}

function talk() {
  if (!message.value.trim()) return
  messagesStore.sendPrivateMessage({
    message: message.value,
    userId: getCurrentUser.userId,
  })
  message.value = ''
}

function toggleKeyBoard(e) {
  e.preventDefault()
  e.stopPropagation()
  hideKeyboard.value = !hideKeyboard.value

  nextTick(() => {
    if (refDialog.value) {
      refDialog.value.focus()
    }
  })
}

function checkValue(value) {
  if (value) {
    console.log('value:', value)
    message.value = value.substring(0, 500)
  } else {
    message.value = ''
  }
}
</script>

<style scoped lang="scss">
.typebox {
  left: 0;
  bottom: 0;
  position: relative;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  line-height: 1.3;
  width: 100%;
}

.text-area-input textarea {
  line-height: 1.3rem !important;
  margin-top: 3px !important;
  padding-top: 5px !important;
}

.keyboard-icon {
  z-index: 100;
  border: 3px solid white;
}
</style>
