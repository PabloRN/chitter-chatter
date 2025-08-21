<template>
  <v-scroll-y-reverse-transition>
    <v-card :loading="loading" class="mx-auto my-12" max-width="374" transition="scale-transition" height="fit-content">
      <template slot="progress">
        <v-progress-linear color="deep-purple" height="10" indeterminate></v-progress-linear>
      </template>
      <v-img height="250" src="../assets/naniii.jpg"></v-img>
      <v-card-title v-if="!showProfileForm"> Naniii!?You are not logged in?</v-card-title>
      <v-card-text v-if="!showProfileForm">
        <div class="my-4 text-subtitle-1">Hey, you need to log in to use this feature.</div>
      </v-card-text>
      <div id="firebaseui-auth-container"></div>
      <div v-if="!showProfileForm" id="loader">Loading...</div>
      <v-divider v-if="!showProfileForm" class="mx-4"></v-divider>
      <v-card-title v-if="showProfileForm">Welcome {{ ` ${tempNickName}` }}</v-card-title>
      <div v-if="showProfileForm">
        <v-card-text>
          <p>This is your Nickname. You can change it now or anytime later in your profile</p>
          <v-text-field label="Your nickname" :hint="`${tempNickName} will be assigned if empty`" persistent-hint
            outlined v-model="userNickName" :maxlength="10" :minlength="3"></v-text-field>
        </v-card-text>
      </div>
      <v-card-actions>
        <v-btn v-if="!showProfileForm" color="deep-purple lighten-2" text @click="closeDialogLogin"> Close </v-btn>
        <v-btn v-if="showProfileForm" color="deep-purple lighten-2" text @click="updateNickName">
          Save and close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-scroll-y-reverse-transition>
</template>

<script setup>
import {
  ref, onMounted, computed, watch, defineProps, defineEmits,
} from 'vue';
import useUserStore from '@/stores/user';

defineProps({
  message: Array,
});
const emit = defineEmits(['onCloseLoginDialog']);

const userStore = useUserStore();

const showProfileForm = ref(false);
const userNickName = ref('');
const tempNickName = ref('');
const loading = ref(false);

onMounted(() => {
  userStore.setFirebaseUiInstance(userStore.roomIn.roomId);
});

const currentUser = computed(() => userStore.currentUser);
const signingInUpgraded = computed(() => userStore.signingInUpgraded);

function closeDialogLogin() {
  emit('onCloseLoginDialog');
}

function updateNickName() {
  userStore.updateUserNickName(userNickName.value !== '' ? userNickName.value : tempNickName.value);
  emit('onCloseLoginDialog');
}

watch(signingInUpgraded, (newVal) => {
  if (newVal === true) {
    userNickName.value = currentUser.value.nickname;
    tempNickName.value = JSON.parse(JSON.stringify(userNickName.value)) || currentUser.value.nickname;
    showProfileForm.value = true;
  }
});

</script>
<style scoped>
.closedialog {
  position: absolute;
  right: 1px;
  top: 1px;
  z-index: 1;
}

.private-text {
  margin: 10px;
  font-family: 'Nanum Pen Script', cursive !important;
  font-size: 1.3rem;
  line-height: 1.1;
}

.login-dialog {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  background-color: aliceblue;
}

ul.firebaseui-idp-list {
  padding: 1px !important;
}
</style>
