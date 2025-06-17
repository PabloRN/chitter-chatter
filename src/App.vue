<!-- eslint-disable max-len -->
<template>
  <v-app>
    <!-- <Drawer /> -->
    <v-main>
       <v-fade-transition mode="out-in">
         router view
      <router-view />
      </v-fade-transition>
    </v-main>
     <snack-bar />

     <!-- Landscape orientation message -->
     <div class="landscape-message">
       <div>
         <h2>📱 Please rotate your device</h2>
         <p>This chat room works best in landscape mode</p>
         <p>Rotate your device for the optimal experience</p>
       </div>
     </div>

  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';
// import * as firebase from 'firebase';
import {
  mapActions,
} from 'vuex';
// import Drawer from './components/layout/Drawer.vue';
import SnackBar from './components/Snackbar.vue';
// Utilities
export default Vue.extend({
  name: 'App',

  components: {
    // Drawer,
    SnackBar,
  },
  data: () => ({

  }),
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
    this.lockLandscapeOrientation();
    this.SET_LANG();
    this.getUser();
    // this.checkLoggedIn();
    window.addEventListener(
      'beforeunload',
      this.leaveBrowser,
    );
  },
  methods: {
    ...mapActions('languageswitcher', ['SET_LANG']),
    ...mapActions('user', ['getUser']),
    lockLandscapeOrientation() {
      if (window.screen && window.screen.orientation && window.screen.orientation.lock) {
        window.screen.orientation.lock('landscape').catch(() => {
          console.log('Screen orientation lock not supported or failed');
        });
      }
    },
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

<style>
@media screen and (max-width: 768px) and (orientation: portrait) {
  .landscape-message {
    display: flex;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.95);
    color: white;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    z-index: 10000;
    font-size: 18px;
    text-align: center;
    padding: 20px;
  }

  .landscape-message h2 {
    margin-bottom: 20px;
    font-size: 24px;
  }

  .landscape-message p {
    margin: 10px 0;
    font-size: 16px;
  }
}

@media screen and (min-width: 769px), screen and (max-width: 768px) and (orientation: landscape) {
  .landscape-message {
    display: none;
  }
}
</style>
