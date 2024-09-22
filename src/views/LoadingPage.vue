<template>
  <div style="display: flex; justify-content: center;align-items: center;height: 100vh">
    <v-img
          :src="require('../assets/logotype_landing_page.png')"
          class="my-3"
          contain
          height="60" style="left: -20px;"
        />
  </div>
</template>

<script>
export default {
  name: 'LoadingPage',

  data: () => ({

  }),
  mounted() {
    setTimeout(() => { this.$router.push({ name: 'rooms' }); }, 3000); // this.setDrawer(false);
  },
};
</script>
