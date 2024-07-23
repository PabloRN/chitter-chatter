<template>
  <v-scroll-y-reverse-transition>
    <div class="login-dialog text-body-2 pa-4" style="width:100%; height:80vh;">
<!-- The surrounding HTML is left untouched by FirebaseUI.
     Your app may use that space for branding, controls and other customizations.-->
     <h1>Welcome to My Awesome App</h1>
     <div id="firebaseui-auth-container"></div>
     <div id="loader">Loading...</div>

    </div>
  </v-scroll-y-reverse-transition>
</template>

<script>
import { mapGetters, mapState, mapActions } from 'vuex';
import 'firebaseui/dist/firebaseui.css';

export default {
  name: 'privatedialogbubble',
  components: {

  },
  props: {
    message: Array,
  },
  data: () => ({
    text: '',
  }),
  mounted() {
    this.setFirebaseUiInstance();
    console.log('fue llamado');
  },
  computed: {
    // ...mapGetters('messages', ['getText']),
    ...mapGetters('user', ['getCurrentUser']),
    ...mapState('user', ['userData']),
  },
  methods: {
    ...mapActions('user', ['setFirebaseUiInstance']),

    closeDialogLogin() {
      this.$emit('onCloseLoginDialog');
    },
  },
  watch: {

  },
};
</script>
<style scoped>

.closedialog{
  position: absolute;
    right: 1px;
    top: 1px;
    z-index: 1;
}
.private-text{
  margin: 10px;
  font-family: 'Nanum Pen Script', cursive !important;
  font-size: 1.3rem ;
  line-height: 1.1;
}
.login-dialog{
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  background-color: aliceblue;
}
</style>
