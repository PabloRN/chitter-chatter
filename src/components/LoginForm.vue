<template>
  <v-form @submit.prevent="submitForm" ref="formRef">
    <v-text-field v-model="userStore.email" :error-messages="errors.email ? [errors.email] : []" label="Email"
      type="email" required />

    <v-text-field v-model="userStore.password" :error-messages="errors.password ? [errors.password] : []"
      label="Password" type="password" required />

    <v-btn :loading="isSubmitting" type="submit" color="primary" block>
      {{ $t("LOGIN_FORM_BUTTON_TEXT") }}
    </v-btn>
  </v-form>
</template>

<script setup>
import { ref } from 'vue';
import { useForm } from 'vee-validate';
import * as yup from 'yup';
import useUserStore from '@/stores/user';

const formRef = ref(null);
const userStore = useUserStore();

const { handleSubmit, isSubmitting, errors } = useForm({
  validationSchema: yup.object({
    email: yup.string().required('Email is required').email('Invalid email'),
    password: yup.string().required('Password is required').min(6, 'Minimum 6 characters'),
  }),
});

const submitForm = handleSubmit(async () => {
  try {
    await userStore.signUserIn();
  } catch (err) {
    console.error('Login failed:', err);
  }
});
</script>

<style scoped>
v-form {
  max-width: 400px;
  margin: auto;
  padding: 1rem;
}
</style>
