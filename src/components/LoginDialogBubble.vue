<template>
  <v-scroll-y-reverse-transition>
    <v-card :loading="loading" class="mx-auto my-12" max-width="374"
     transition="scale-transition" height="fit-content">
      <template slot="progress">
        <v-progress-linear color="deep-purple" height="10" indeterminate></v-progress-linear>
      </template>
      <v-img height="250" src="https://cdn.vuetifyjs.com/images/cards/cooking.png"></v-img>
      <v-card-title> Naniii!?You are not logged in?</v-card-title>
      <v-card-text>
        <div class="my-4 text-subtitle-1">Hey, you need to log in to use this feature.</div>
      </v-card-text>
      <div id="firebaseui-auth-container"></div>
      <div id="loader">Loading...</div>
      <v-divider class="mx-4"></v-divider>
      <v-card-title v-if="showProfileForm">Welcome toonstalker</v-card-title>
      <div v-if="showProfileForm">
        <v-card-text>
          <p>This is your Nickname. You can change it now or anytime later in your profile</p>
          <v-text-field
            label="Your nickname"
            :hint="`${userNickName} will be assigned if empty`"
            persistent-hint
            outlined
            :value="userNickName"
          ></v-text-field>
        </v-card-text>
      </div>
      <v-card-actions>
        <v-btn color="deep-purple lighten-2" text @click="closeDialogLogin"> Close </v-btn>
        <v-btn v-if="showProfileForm" color="deep-purple lighten-2" text @click="updateNickName">
          Save and close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-scroll-y-reverse-transition>
</template>

<script>
import { mapGetters, mapState, mapActions } from 'vuex';
import 'firebaseui/dist/firebaseui.css';

export default {
  name: 'privatedialogbubble',
  components: {},
  props: {
    message: Array,
  },
  data: () => ({
    showProfileForm: false,
    userNickName: '',
    loading: false,
  }),
  mounted() {
    this.setFirebaseUiInstance();
  },
  computed: {
    // ...mapGetters('messages', ['getText']),
    ...mapGetters('user', ['getCurrentUser']),
    ...mapState('user', ['userData', 'currentUser', 'signingInUpgraded']),
  },
  methods: {
    ...mapActions('user', ['setFirebaseUiInstance', 'updateUserNickName']),

    closeDialogLogin() {
      this.$emit('onCloseLoginDialog');
    },
    updateNickName() {
      if (this.userNickName !== '') this.updateUserNickName(this.userNickName);
      this.$emit('onCloseLoginDialog');
    },
  },
  watch: {
    signingInUpgraded: {
      handler(newVal, oldVal) {
        // here having access to the new and old value
        // do stuff
        console.log({ newVal, oldVal });
        if (newVal === true) {
          this.userNickName = this.currentUser.nickname;
          this.showProfileForm = true;
        }
      },
    },
  },
};
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
</style>
