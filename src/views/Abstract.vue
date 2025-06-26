<template>
  <router-view></router-view>
</template>

<script>
export default {
  name: 'AbstractView',
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
};
</script>

<style></style>
