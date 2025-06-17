<template>
  <v-text-field
    v-model="password"
    type="password"
    label="Password"
    prepend-inner-icon="mdi-lock"
  />
</template>

<script>
export default {
  name: 'Password',
  data: () => ({
    password: '',
  }),
};
</script>
