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
    this.SET_LANG();
    // this.checkLoggedIn();
    console.log('ENV:', process.env.NODE_ENV);
  },
  methods: {
    ...mapActions('languageswitcher', ['SET_LANG']),
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
