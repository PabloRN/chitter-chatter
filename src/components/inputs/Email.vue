<template>
  <v-text-field v-model="email" type="email" label="Email" prepend-inner-icon="mdi-email" />
</template>

<script>
export default {
  name: 'EmailInput',
  data: () => ({
    email: '',
  }),
};
</script>
