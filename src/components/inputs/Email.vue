<template>
  <v-text-field
    v-model="email"
    type="email"
    label="Email"
    prepend-inner-icon="mdi-email"
  />
</template>

<script>
export default {
  name: 'Email',
  data: () => ({
    email: '',
  }),
};
</script>
