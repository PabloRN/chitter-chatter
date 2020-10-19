<template>
  <transition name="fade">
    <ValidationObserver ref="obs" v-slot="{ invalid }">
      <v-card class="elevation-0 login_card mb-1" transition="scale-transition">
        <v-card-text>
          <v-form>
            <Email class="pa-sm-1 pb-0" rules="required|email" label="Email" />
            <password-confirmed />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn :loading="isLoading" :disabled="invalid" class="ma-0" color="primary" tile
            depressed block ripple @click="onSignup">{{ $t("LOGIN_FORM_SIGN_BUTTON_TEXT") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </ValidationObserver>
  </transition>
</template>
<script>
import {
  mapMutations,
  mapState,
  mapActions,

} from 'vuex';
import { ValidationObserver } from 'vee-validate';
import PasswordConfirmed from '@/components/inputs/PasswordConfirmed.vue';
import Email from '@/components/inputs/Email.vue';

export default {

  components: {
    Email,
    ValidationObserver,
    PasswordConfirmed,
  },
  data: () => ({
    isLoading: false,
  }),
  computed: {
    ...mapState('authorization', ['email', 'password']),
  },
  mounted() {

  },
  methods: {
    ...mapMutations('store', ['setSnackbar']),
    ...mapActions('authorization', ['signUserUp']),
    setIsLoading(val) {
      this.isLoading = val;
    },
    onSignup() {
      this.signUserUp();
    },
  },
};
</script>
<style scoped>
.login_card{
  background-color: transparent!important;
}

</style>
