<template>
  <router-view></router-view>
</template>

<script>
import {

  mapActions,
} from 'vuex';

export default {
  // beforeRouteEnter(to, from, next) {
  //   next((vm) => {
  //     console.log(vm.$store.getters['cognito/userGroups']);
  //     (vm.$store.getters['cognito/userGroups']).foreach((one) => {
  //       if (one === 'ADMIN') {
  //         console.log('isAdmin');
  //         isAdmin = true;
  //       } else (vm.$router.push('/login'));
  //     });
  //   });
  // },
  components: {
  },
  computed: {
    ...mapActions('store', ['setSnackbar']),
  },
};
</script>

<style>

</style>
