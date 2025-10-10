<template>
  <v-dialog v-model="show" max-width="600" persistent>
    <v-card class="feedback-dialog">
      <!-- Header -->
      <v-card-title class="dialog-header">
        <v-icon class="mr-2">mdi-message-alert</v-icon>
        Send Feedback
        <v-spacer></v-spacer>
        <v-btn icon size="small" @click="close" :disabled="loading">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <!-- Form -->
      <v-card-text class="pt-4">
        <p class="feedback-intro mb-4">
          We'd love to hear from you! Please share your feedback, suggestions, or report any issues.
        </p>

        <v-form ref="formRef" v-model="formValid" @submit.prevent="submitFeedback">
          <!-- Full Name -->
          <v-text-field
            v-model="formData.fullName"
            label="Full Name *"
            prepend-inner-icon="mdi-account"
            :rules="[rules.required]"
            variant="outlined"
            :disabled="loading"
            class="mb-2"
          ></v-text-field>

          <!-- Email -->
          <v-text-field
            v-model="formData.email"
            label="Email *"
            prepend-inner-icon="mdi-email"
            type="email"
            :rules="[rules.required, rules.email]"
            variant="outlined"
            :disabled="isUserAuthenticated || loading"
            :hint="isUserAuthenticated ? 'Email from your account' : ''"
            persistent-hint
            class="mb-2"
          ></v-text-field>

          <!-- Title -->
          <v-text-field
            v-model="formData.title"
            label="Title *"
            prepend-inner-icon="mdi-format-title"
            :rules="[rules.required, rules.maxLength(100)]"
            counter="100"
            variant="outlined"
            :disabled="loading"
            class="mb-2"
          ></v-text-field>

          <!-- Description -->
          <v-textarea
            v-model="formData.description"
            label="Description *"
            prepend-inner-icon="mdi-text"
            :rules="[rules.required, rules.maxLength(500)]"
            counter="500"
            rows="5"
            variant="outlined"
            :disabled="loading"
            class="mb-2"
          ></v-textarea>

          <!-- reCAPTCHA Notice -->
          <div class="recaptcha-notice mb-4">
            <v-icon size="small" class="mr-1">mdi-shield-check</v-icon>
            <span class="text-caption">
              This form is protected by reCAPTCHA and the Google
              <a href="https://policies.google.com/privacy" target="_blank">Privacy Policy</a> and
              <a href="https://policies.google.com/terms" target="_blank">Terms of Service</a> apply.
            </span>
          </div>
        </v-form>
      </v-card-text>

      <!-- Actions -->
      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn
          text
          @click="close"
          :disabled="loading"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          @click="submitFeedback"
          :loading="loading"
          :disabled="!formValid || loading"
        >
          <v-icon start>mdi-send</v-icon>
          Send Feedback
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useReCaptcha } from 'vue-recaptcha-v3';
import { getDatabase, ref as dbRef, push } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import useUserStore from '@/stores/user';

const props = defineProps({
  modelValue: Boolean,
});

const emit = defineEmits(['update:modelValue', 'success', 'error']);

const userStore = useUserStore();
const { executeRecaptcha } = useReCaptcha();

const show = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const isUserAuthenticated = computed(() => userStore.getCurrentUser && !userStore.getCurrentUser.isAnonymous);
const getCurrentUser = computed(() => userStore.getCurrentUser);

const formRef = ref(null);
const formValid = ref(false);
const loading = ref(false);

const formData = ref({
  fullName: '',
  email: '',
  title: '',
  description: '',
});

// Validation rules
const rules = {
  required: (value) => !!value || 'This field is required',
  email: (value) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(value) || 'Please enter a valid email';
  },
  maxLength: (max) => (value) => {
    return !value || value.length <= max || `Maximum ${max} characters allowed`;
  },
};

// Auto-fill email if user is authenticated
watch(() => props.modelValue, (newValue) => {
  if (newValue && isUserAuthenticated.value) {
    // Get email from Firebase Auth directly
    const auth = getAuth();
    const firebaseUser = auth.currentUser;

    if (firebaseUser) {
      formData.value.email = firebaseUser.email || '';
      formData.value.fullName = getCurrentUser.value?.nickname || firebaseUser.displayName || '';
    } else {
      // Fallback to user store
      formData.value.email = getCurrentUser.value?.email || '';
      formData.value.fullName = getCurrentUser.value?.nickname || '';
    }
  } else if (newValue) {
    // For non-authenticated users, clear the fields
    formData.value.email = '';
    formData.value.fullName = '';
  }
});

const close = () => {
  if (!loading.value) {
    show.value = false;
    resetForm();
  }
};

const resetForm = () => {
  formData.value = {
    fullName: '',
    email: '',
    title: '',
    description: '',
  };
  if (formRef.value) {
    formRef.value.reset();
  }
};

const submitFeedback = async () => {
  // Validate form
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  loading.value = true;

  try {
    // Execute reCAPTCHA
    await executeRecaptcha('feedback_submit');

    // Get Realtime Database instance
    const db = getDatabase();
    const feedbackRef = dbRef(db, 'feedback');

    // Prepare feedback data
    const feedbackData = {
      fullName: formData.value.fullName,
      email: formData.value.email,
      title: formData.value.title,
      description: formData.value.description,
      userId: isUserAuthenticated.value ? getCurrentUser.value.userId : null,
      createdAt: Date.now(),
      processed: false,
    };

    // Add to Realtime Database - Cloud Function will trigger and send email
    await push(feedbackRef, feedbackData);

    emit('success');
    close();
  } catch (error) {
    console.error('Error submitting feedback:', error);
    emit('error', error.message);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.feedback-dialog .dialog-header {
  background: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
}

.feedback-intro {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.5;
}

.recaptcha-notice {
  display: flex;
  align-items: flex-start;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.4;
}

.recaptcha-notice a {
  color: var(--primary-color);
  text-decoration: none;
}

.recaptcha-notice a:hover {
  text-decoration: underline;
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .feedback-dialog .dialog-header {
    background: var(--primary-dark);
  }
}
</style>
