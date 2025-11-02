<template>
  <div class="testing-panel">
    <v-alert type="info" class="mb-4" density="compact">
      <div class="d-flex align-center">
        <v-icon class="mr-2">mdi-information</v-icon>
        <div>
          <strong>Services Testing Panel</strong>
          <p class="text-caption mb-0">Test authentication services, tab communication, and navigation functionality</p>
        </div>
      </div>
    </v-alert>

    <!-- Import the existing ServicesTest component -->
    <ServicesTest />
  </div>
</template>

<script setup>
import ServicesTest from '@/views/ServicesTest.vue';
</script>

<style scoped lang="scss">
.testing-panel {
  width: 100%;

  // Override the services test container padding for better integration
  :deep(.services-test-container) {
    padding: 0;
    background-color: transparent;
    min-height: auto;
  }
}
</style>
