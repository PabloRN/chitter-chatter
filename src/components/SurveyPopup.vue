<template>
  <v-dialog v-model="show" max-width="500" persistent>
    <v-card class="survey-dialog">
      <!-- Header -->
      <v-card-title class="dialog-header">
        <span class="header-icon">🌟</span>
        Quick Survey
        <v-spacer></v-spacer>
        <v-btn icon size="small" @click="dismiss" :disabled="loading">
          <v-icon color="black">mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <!-- Content -->
      <v-card-text class="pt-6 pb-4">
        <p class="survey-question">
          How likely are you to recommend ToonsTalk to a friend?
        </p>

        <!-- Star Rating -->
        <div class="rating-container">
          <v-rating v-model="rating" hover :length="5" :size="48" active-color="amber-darken-2" color="grey-lighten-1"
            :disabled="loading"></v-rating>
          <p class="rating-label" v-if="rating > 0">
            {{ getRatingLabel() }}
          </p>
        </div>

        <!-- Feedback Text Area -->
        <v-textarea v-model="feedback" label="Additional feedback (optional)" rows="4" variant="outlined"
          :disabled="loading" placeholder="Tell us what you think..." counter="500"
          :rules="[rules.maxLength(500)]"></v-textarea>

        <p class="survey-note">
          <v-icon size="small" class="mr-1">mdi-information-outline</v-icon>
          Your feedback helps us improve ToonsTalk. Thank you! 💙
        </p>
      </v-card-text>

      <!-- Actions -->
      <v-card-actions class="pa-4">
        <v-btn text @click="dismiss" :disabled="loading" size="small">
          Maybe Later
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn color="primary" variant="flat" @click="submitSurvey" :loading="loading" :disabled="!rating || loading">
          <v-icon start>mdi-send</v-icon>
          Submit
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed } from 'vue';
import { getDatabase, ref as dbRef, push } from 'firebase/database';
import useUserStore from '@/stores/user';

const props = defineProps({
  modelValue: Boolean,
});

const emit = defineEmits(['update:modelValue', 'success', 'dismissed']);

const userStore = useUserStore();

const show = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const rating = ref(0);
const feedback = ref('');
const loading = ref(false);

const rules = {
  maxLength: (max) => (value) => {
    return !value || value.length <= max || `Maximum ${max} characters allowed`;
  },
};

const getRatingLabel = () => {
  const labels = {
    1: 'Not likely 😕',
    2: 'Somewhat unlikely 🤔',
    3: 'Neutral 😐',
    4: 'Likely 😊',
    5: 'Very likely! 🤩',
  };
  return labels[rating.value] || '';
};

const dismiss = () => {
  if (!loading.value) {
    emit('dismissed');
    show.value = false;
    resetForm();
  }
};

const resetForm = () => {
  rating.value = 0;
  feedback.value = '';
};

const submitSurvey = async () => {
  if (!rating.value) return;

  loading.value = true;

  try {
    const db = getDatabase();
    const surveysRef = dbRef(db, 'surveys');

    const surveyData = {
      rating: rating.value,
      feedback: feedback.value || '',
      userId: userStore.getCurrentUser?.userId || 'anonymous',
      createdAt: Date.now(),
      processed: false,
    };

    await push(surveysRef, surveyData);

    emit('success');
    show.value = false;
    resetForm();
  } catch (error) {
    console.error('Error submitting survey:', error);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.survey-dialog .dialog-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  font-size: 20px;
  font-weight: 600;
}

.header-icon {
  font-size: 24px;
  margin-right: 8px;
}

.survey-question {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
  margin-bottom: 20px;
  line-height: 1.4;
}

.rating-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px 0 30px 0;
  padding: 20px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border-radius: 12px;
}

.rating-label {
  margin-top: 12px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-secondary);
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.survey-note {
  display: flex;
  align-items: center;
  color: var(--text-secondary);
  font-size: 13px;
  margin-top: 10px;
  margin-bottom: 0;
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .survey-dialog .dialog-header {
    background: linear-gradient(135deg, #5568d3 0%, #6a4c8f 100%);
  }

  .rating-container {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  }
}
</style>
