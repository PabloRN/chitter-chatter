<template>
  <v-dialog v-model="show" max-width="500" persistent>
    <v-card class="report-dialog">
      <!-- Header -->
      <v-card-title class="dialog-header">
        <v-icon class="mr-2">mdi-alert-octagon</v-icon>
        Report User
        <v-spacer></v-spacer>
        <v-btn icon size="small" @click="close" :disabled="loading">
          <v-icon color="black">mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <!-- Content -->
      <v-card-text class="pt-4">
        <p class="report-intro mb-4">
          Report inappropriate behavior or content from <strong>{{ targetUserNickname }}</strong>.
          Reports are reviewed by our moderation team.
        </p>

        <v-form ref="formRef" v-model="formValid" @submit.prevent="submitReport">
          <!-- Reason Selection -->
          <v-select
            v-model="formData.reason"
            label="Reason *"
            :items="reasonOptions"
            prepend-inner-icon="mdi-flag"
            variant="outlined"
            :disabled="loading"
            :rules="[rules.required]"
            class="mb-2"
          ></v-select>

          <!-- Description -->
          <v-textarea
            v-model="formData.description"
            label="Additional Details *"
            prepend-inner-icon="mdi-text"
            :rules="[rules.required, rules.maxLength(500)]"
            counter="500"
            rows="5"
            variant="outlined"
            :disabled="loading"
            placeholder="Please provide specific details about the issue..."
            class="mb-2"
          ></v-textarea>

          <v-alert type="info" density="compact" class="mb-2">
            <v-icon size="small" class="mr-1">mdi-information</v-icon>
            False reports may result in action against your account.
          </v-alert>
        </v-form>
      </v-card-text>

      <!-- Actions -->
      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn text @click="close" :disabled="loading">
          Cancel
        </v-btn>
        <v-btn
          color="error"
          variant="flat"
          @click="submitReport"
          :loading="loading"
          :disabled="!formValid || loading"
        >
          <v-icon start>mdi-send</v-icon>
          Submit Report
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed } from 'vue';
import { getDatabase, ref as dbRef, push, get, set } from 'firebase/database';
import useUserStore from '@/stores/user';

const props = defineProps({
  modelValue: Boolean,
  targetUserId: String,
  targetUserNickname: String,
});

const emit = defineEmits(['update:modelValue', 'success', 'error', 'already-reported', 'limit-reached']);

const userStore = useUserStore();

const show = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const formRef = ref(null);
const formValid = ref(false);
const loading = ref(false);

const formData = ref({
  reason: '',
  description: '',
});

const reasonOptions = [
  'Harassment or Bullying',
  'Spam or Advertising',
  'Inappropriate Content',
  'Offensive Language',
  'Impersonation',
  'Other Violation',
];

const rules = {
  required: (value) => !!value || 'This field is required',
  maxLength: (max) => (value) => {
    return !value || value.length <= max || `Maximum ${max} characters allowed`;
  },
};

const close = () => {
  if (!loading.value) {
    show.value = false;
    resetForm();
  }
};

const resetForm = () => {
  formData.value = {
    reason: '',
    description: '',
  };
  if (formRef.value) {
    formRef.value.reset();
  }
};

const checkReportEligibility = async () => {
  const db = getDatabase();
  const currentUserId = userStore.getCurrentUser?.userId;

  if (!currentUserId) {
    throw new Error('Must be logged in to report');
  }

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Check if user already reported this target
  const targetCheckRef = dbRef(db, `userReports/${currentUserId}/targets/${props.targetUserId}`);
  const targetSnapshot = await get(targetCheckRef);

  if (targetSnapshot.exists()) {
    return { canReport: false, reason: 'already-reported' };
  }

  // Check daily limit (3 reports per day)
  const dailyCountRef = dbRef(db, `userReports/${currentUserId}/${today}/count`);
  const dailySnapshot = await get(dailyCountRef);
  const dailyCount = dailySnapshot.val() || 0;

  if (dailyCount >= 3) {
    return { canReport: false, reason: 'limit-reached' };
  }

  return { canReport: true };
};

const submitReport = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  loading.value = true;

  try {
    // Check eligibility first
    const eligibility = await checkReportEligibility();

    if (!eligibility.canReport) {
      if (eligibility.reason === 'already-reported') {
        emit('already-reported');
      } else if (eligibility.reason === 'limit-reached') {
        emit('limit-reached');
      }
      close();
      return;
    }

    const db = getDatabase();
    const reportsRef = dbRef(db, 'reports/users');
    const currentUserId = userStore.getCurrentUser?.userId;
    const today = new Date().toISOString().split('T')[0];

    const reportData = {
      reportedUserId: props.targetUserId,
      reportedUserNickname: props.targetUserNickname,
      reportedBy: currentUserId,
      reportedByNickname: userStore.getCurrentUser?.nickname || 'Anonymous',
      reason: formData.value.reason,
      description: formData.value.description,
      createdAt: Date.now(),
      status: 'pending',
      processed: false,
    };

    // Submit report
    await push(reportsRef, reportData);

    // Update user's report tracking
    const dailyCountSnapshot = await get(dbRef(db, `userReports/${currentUserId}/${today}/count`));
    const currentCount = dailyCountSnapshot.val() || 0;

    // Mark target as reported
    await set(dbRef(db, `userReports/${currentUserId}/targets/${props.targetUserId}`), true);

    // Increment daily count
    await set(dbRef(db, `userReports/${currentUserId}/${today}/count`), currentCount + 1);

    emit('success');

    setTimeout(() => {
      close();
    }, 100);
  } catch (error) {
    console.error('Error submitting report:', error);
    emit('error', error.message);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.report-dialog .dialog-header {
  background: #d32f2f;
  color: white;
  display: flex;
  align-items: center;
}

.report-intro {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.5;
}
</style>
