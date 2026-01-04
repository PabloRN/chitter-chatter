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

<script setup>
import { useSeo } from '@/composables/useSeo';
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
// const seoConfig = reactive({
//   title: '',
//   description: '',
//   image: '',
//   url: '',
//   type: 'website',
//   keywords: [],
//   schema: null,
// });
useSeo(seoConfig);
onMounted(() => {
  useSeo({
    title: 'Toonstalk - Create Animated Chat Rooms for Your Community',
    description: 'Join thousands creating real-time animated chat rooms. Perfect for gamers, creators, educators, and friend groups. Customize avatars, backgrounds, and chat with unlimited users. Free to start!',
    url: 'https://toonstalk.com',
    keywords: ['toonstalk', 'animated chat', 'online chat rooms', 'virtual communities', 'create chat room'],
  });
  setTimeout(() => { router.push({ name: 'rooms' }); }, 5000); // this.setDrawer(false);
})

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
