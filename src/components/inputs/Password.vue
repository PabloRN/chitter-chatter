<template>
  <ValidationProvider v-slot="{ errors, valid }" :name="$attrs.label" :rules="{
             required: true,
regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[\^$*.\[\]{}\(\)?\-“!@#%&/,><\’:;|_~`])\S{8,99}$/ }">
    <v-text-field v-model="password" :append-icon="show ? 'mdi-eye' : 'mdi-eye-off'"
      prepend-inner-icon="mdi-lock" :type="show ? 'text' : 'password'" :error-messages="errors"
      :success="valid" v-bind="$attrs" name="password" class="mb-3"
      :label="$t('LOGIN_FORM_PASSWORD_LABEL')" v-on="$listeners" outlined
      background-color="transparent" @click:append="show = !show" placeholder="   " />
  </ValidationProvider>
</template>

<script>
// Utilities
import { ValidationProvider } from 'vee-validate';
import { mapActions } from 'vuex';

export default {
  name: 'PasswordComponent',
  components: {
    ValidationProvider,
  },
  props: {
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
    password: '',
  }),
  computed: {

  },
  watch: {
    password(input) {
      this.setPasswordAction(input);
    },
  },

  created() {

  },
  methods: {
    ...mapActions('user', ['setPasswordAction']),
  },
};
</script>

<style lang="scss">
.v-chip__content {
  cursor: pointer !important;
}
</style>
