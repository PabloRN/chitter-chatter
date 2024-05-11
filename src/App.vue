<template>
  <v-app>
    <!-- <Drawer /> -->
    <v-main>
       <v-fade-transition mode="out-in">
         router view
      <router-view />
      </v-fade-transition>
    </v-main>
     <Snackbar />
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';
// import * as firebase from 'firebase';
import {
  mapActions,
} from 'vuex';
// import Drawer from './components/layout/Drawer.vue';
import Snackbar from './components/Snackbar.vue';
// Utilities
export default Vue.extend({
  name: 'App',

  components: {
    // Drawer,
    Snackbar,
  },
  mounted() {
    // this.checkLoggedIn();
    // this.$router.beforeEach((to, from, next) => {
    //   console.log(to);
    //   if (to.name === 'signup' || !this.$ls.get('isLoggedIn')) next({ name: 'login' });
    //   else next();
    // });
    // console.log(this.$router.beforeEach());
  },
  created() {
  // eslint-disable-next-line
    // const orientation = screen.orientation;
    // // eslint-disable-next-line
    // console.log(orientation)
    // if (orientation && orientation.lock) {
    //   // Lock the screen orientation to landscape
    //   // eslint-disable-next-line dot-notation
    //   orientation['lock']('landscape');
    // } else {
    //   // Screen orientation API not supported
    //   console.error('Screen orientation API is not supported on this device.');
    // }
    this.SET_LANG();
    this.getUser();
    // this.checkLoggedIn();
    console.log('ENV:', process.env.NODE_ENV);
    window.addEventListener(
      'beforeunload',
      this.leaveBrowser,
    );
  },
  methods: {
    ...mapActions('languageswitcher', ['SET_LANG']),
    ...mapActions('user', ['getUser']),
    leaveBrowser() {
      console.log('User leaved the browser');
    },
    // checkLoggedIn() {
    //   if (this.$ls.get('isLoggedIn') !== true) {
    //     this.$router.push({ name: 'login' });
    //   } else {
    //     // this.setUserDetails();
    //     // this.$router.push({ name: 'CasesList' });
    //   }
    // },
  },
  computed: {
    // maxWidth() {
    //   switch (this.$route.path) {
    //     case '/login': return '500';
    //     default: return '900';
    //   }
    // },
    // styles() {
    //   return {
    //     maxWidth: `${this.maxWidth}px`,
    //   };
    // },
  },

  watch: {
  //   isLoggedIn(val) {
  //     this.setUserDetails();
  //     if (val && this.isLoggedIn) {
  //       this.$router.push({ name: 'login' });
  //     } else {
  //       this.$router.push({ name: 'CasesList' });
  //     }
  //   },
  },
});
</script>
