<template>
  <transition name="fade">
    <ValidationObserver ref="obs" v-slot="{ invalid }">
      <v-row class="px-15 mx-15">
        <v-col cols="6">
          <v-card class="elevation-0 login_card mb-1 pa-10 px-10" transition="scale-transition">
            <v-card-text>
              <v-form>
                <ValidationProvider v-slot="{ errors }" rules="required">
                <v-text-field :error-messages="errors"
                 label="nickname" outlined v-model="userData.nickname" />
                </ValidationProvider>
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
        </v-col>
        <v-col cols="6">
          <template>
            <v-carousel @change="checkAvatar" hide-delimiters>
              <v-carousel-item v-for="(item,i) in getAllAvatars"
               :key="i" :src="item.url" ></v-carousel-item>
            </v-carousel>
          </template>
        </v-col>
      </v-row>

    </ValidationObserver>
  </transition>
</template>
<script>
import {
  mapMutations,
  mapState,
  mapActions,
  mapGetters,

} from 'vuex';
import { ValidationObserver, ValidationProvider } from 'vee-validate';
import PasswordConfirmed from '@/components/inputs/PasswordConfirmed.vue';
import Email from '@/components/inputs/Email.vue';

export default {

  components: {
    Email,
    ValidationObserver,
    PasswordConfirmed,
    ValidationProvider,
  },
  data: () => ({
    carVal: '',
    isLoading: false,
    userData: {
      nickname: '',
      avatar: '',
      age: '',
    },
  }),
  computed: {
    ...mapState('authorization', ['email', 'password']),
    ...mapGetters('authorization', ['getAllAvatars']),
  },
  created() {

  },
  mounted() {
    this.getAvatars();
  },
  methods: {
    ...mapMutations('store', ['setSnackbar']),
    ...mapActions('authorization', ['signUserUp', 'getAvatars']),
    setIsLoading(val) {
      this.isLoading = val;
    },
    onSignup() {
      console.log(this.userData.avatar);
      if (this.userData.avatar.length === 0) {
        this.userData.avatar = this.getAllAvatars[0].url;
      }
      this.signUserUp(this.userData);
    },
    checkAvatar(index) {
      console.log(index);
      this.userData.avatar = this.getAllAvatars[index].url;
      // console.log(this.getAllAvatars[index]);
    },
  },
  watch: {

  },
};
</script>
<style scoped>
.login_card{
  background-color: transparent!important;
}
.carrusel.v-image__image, .v-image__placeholder{
  width: 27%;;
}

</style>
