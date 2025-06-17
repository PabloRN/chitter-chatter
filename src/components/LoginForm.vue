<template>
  <transition name="fade">
    <ValidationObserver ref="obs" v-slot="{ invalid }">
      <v-col cols="4" class="mx-auto">
      <v-card class="elevation-0 login_card mb-1" transition="scale-transition">
        <v-card-text>
          <v-form>
            <Email class="pa-sm-1 pb-0" rules="required|email"  label="Email" />
            <Password
               label="Password" />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn :loading="isLoading" :disabled="invalid" class="ma-0" color="primary" tile
            depressed block ripple @click="submit">{{ $t("LOGIN_FORM_BUTTON_TEXT") }}
          </v-btn>
        </v-card-actions>
      </v-card>
        </v-col>

      <div class="" align="center" justify="center">
        <v-btn @click="$router.push({ name: 'forgotpassword'} )" class="text-capitalize" text small
          color="primary">
          {{$t('LOGIN_FORM_FORGOT_PASSWORD_LINK_TEXT')}}
        </v-btn>
      </div>
    </ValidationObserver>
  </transition>
</template>
<script>

// import { ValidationObserver } from 'vee-validate';
import Password from '@/components/inputs/Password.vue';
import Email from '@/components/inputs/Email.vue';
import { useUserStore } from '@/stores/user';

export default {

  components: {
    Password,
    Email,
    // ValidationObserver,
  },
  setup() {
    const userStore = useUserStore();

    return {
      userStore,
    };
  },
  data: () => ({
    isLoading: false,
  }),
  computed: {

  },
  mounted() {
    // this.setDrawer(false);
  },
  methods: {
    setIsLoading(val) {
      this.isLoading = val;
    },
    submit() {
      this.userStore.signUserIn();
    },
  },
};
</script>
<style scoped>
.login_card{
  background-color: transparent!important;
}

</style>
