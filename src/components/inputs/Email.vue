<template>
  <ValidationProvider v-slot="{ errors, valid }" :name="$attrs.label" :rules="rules">
    <v-text-field
      v-model="email"
      prepend-inner-icon="mdi-account"
      type="text"
      :error-messages="errors"
      :success="valid"
      v-bind="$attrs"
      name="email"
      class="mb-3"
      :label="$t('LOGIN_FORM_EMAIL_LABEL')"
      v-on="$listeners"
      outlined
      placeholder="   "
      background-color="transparent"
    />
  </ValidationProvider>
</template>

<script>
// Utilities
import { ValidationProvider } from 'vee-validate';
import { mapActions } from 'vuex';

export default {
  components: {
    ValidationProvider,
  },
  props: {
    rules: {
      type: [Object, String],
      default: '',
    },
    // must be included in props
    value: {
      type: null,
      default: '',
    },
  },
  data: () => ({
    show: false,
    errors: '',
    valid: '',
    email: '',
  }),
  computed: {
  },
  created() {

  },
  methods: {
    ...mapActions('user', ['setEmailAction']),
  },
  watch: {
    email(input) {
      this.setEmailAction(input);
    },
  },
};
</script>

<style lang="scss">
.v-chip__content {
  cursor: pointer !important;
}
</style>
