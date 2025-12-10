<template>
  <div style="display: flex; justify-content: center;align-items: center;height: 100%;flex-direction: column;">
    <div class="text-center">
      <v-img src="logo-206-70.png" class="logotype" contain height="80" style="position:relative;width: 22vw;" />
    </div>
    <div class="slogan">
      <p>Make chatting fun again</p>
    </div>

  </div>
</template>

<script>
export default {
  name: 'LoadingPage',

  data: () => ({

  }),
  mounted() {
    setTimeout(() => { this.$router.push({ name: 'rooms' }); }, 5000); // this.setDrawer(false);
  },
};
</script>
<style scoped>
.slogan {
  font-size: 1.7rem;
  font-weight: 400;
  color: var(--text-secondary);
  animation: logo-fade-in 4s ease-in-out;
  font-family: 'Nanum Pen Script', cursive !important;
}

.logotype {
  animation: logo-fade-in 2s ease-in-out;
  height: 80px;
  position: relative;
  width: 22vh;
}

@keyframes logo-fade-in {
  0% {
    opacity: 0;
  }

  100% {
    opacity: 1;
  }
}
</style>
