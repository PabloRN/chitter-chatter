<template>
  <v-text-field
    v-model="password"
    type="password"
    label="Confirm Password"
    prepend-inner-icon="mdi-lock"
  />
</template>

<script>
export default {
  name: 'PasswordConfirmed',
  data: () => ({
    password: '',
  }),
};
</script>
