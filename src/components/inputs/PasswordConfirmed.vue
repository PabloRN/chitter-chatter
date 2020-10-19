<template>
  <ValidationObserver>
    <ValidationProvider v-slot="{ errors, valid }" :name="$attrs.label" :rules="{
     required: true,
regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[\^$*.\[\]{}\(\)?\-“!@#%&/,><\’:;|_~`])\S{8,99}$/ }"
      vid="confirmation">
      <v-text-field
       v-model="password"
       :append-icon="show ? 'mdi-eye' : 'mdi-eye-off'"
       prepend-inner-icon="mdi-lock"
       :type="show ? 'text' : 'password'"
       :error-messages="errors"
       :success="valid"
       v-bind="$attrs"
       name="password"
       class="mb-3"
       label="Password"
       outlined
       background-color="transparent"
       v-on="$listeners" @click:append="show = !show" />
    </ValidationProvider>
    <ValidationProvider v-slot="{ errors, valid }" :name="$attrs.label"
      rules="required|confirmed:confirmation">
      <v-text-field
       v-model="confirmation"
       :append-icon="show ? 'mdi-eye' : 'mdi-eye-off'"
        prepend-inner-icon="mdi-lock"
        :type="show ? 'text' : 'password'"
        :error-messages="errors"
        :success="valid"
        v-bind="$attrs"
        name="password"
        class="mb-3"
        label="Password confirmation"
        v-on="$listeners"
        outlined
        background-color="transparent"
        @click:append="show = !show" />
    </ValidationProvider>
  </ValidationObserver>
</template>

<script>
// Utilities
import { ValidationProvider, ValidationObserver } from 'vee-validate';
import { mapActions } from 'vuex';

export default {
  components: {
    ValidationProvider,
    ValidationObserver,
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
    confirmation: '',
    password: '',
  }),
  computed: {

  },
  methods: {
    ...mapActions('authorization', ['setPasswordAction']),
  },
  watch: {
    password(input) {
      this.setPasswordAction(input);
    },
  },

  created() {

  },
};
</script>

<style lang="scss">
.v-chip__content {
  cursor: pointer !important;
}
</style>
