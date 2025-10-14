<template>
  <v-snackbar
    v-model="show"
    :timeout="-1"
    location="bottom"
    multi-line
    color="grey-darken-3"
  >
    <div class="consent-content">
      <div class="consent-text">
        <strong>Cookie Notice</strong>
        <p class="mt-2">
          We use basic cookies for essential functionality. Would you like to enable advanced analytics
          to help us improve your experience?
        </p>
      </div>
      <div class="consent-actions">
        <v-btn variant="text" @click="decline">
          Essential Only
        </v-btn>
        <v-btn variant="text" color="primary" @click="accept">
          Accept All
        </v-btn>
      </div>
    </div>
  </v-snackbar>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import analyticsService from '@/services/analyticsService';

const show = ref(false);

onMounted(() => {
  // Show consent popup if not already answered
  if (analyticsService.shouldShowConsent()) {
    show.value = true;
  }
});

const accept = () => {
  analyticsService.enableFullTracking();
  show.value = false;
};

const decline = () => {
  analyticsService.declineAdvancedTracking();
  show.value = false;
};
</script>

<style scoped>
.consent-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.consent-text {
  max-width: 600px;
}

.consent-text p {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.9;
}

.consent-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>
