<template>
  <transition name="fade">
    <ValidationObserver ref="obs" v-slot="{ invalid }">
      <v-row class="px-lg-15 mx-lg-15 px-md-0 mx-md-0">
        <v-col cols="6" xs="12" md="6">
          <v-card class="elevation-0 login_card mb-1 pa-lg-10
                 pa-md-0 px-lg-10 px-md-0" transition="scale-transition">
            <v-card-text>
              <v-form>
                <ValidationProvider v-slot="{ errors }" rules="required">
                  <v-text-field :error-messages="errors" label="nickname" outlined v-model="userData.nickname" />
                </ValidationProvider>
                <Email class="pa-sm-1 pb-0" rules="required|email" label="Email" />
                <password-confirmed />
              </v-form>
            </v-card-text>
            <v-card-actions>
              <v-btn :loading="isLoading" :disabled="invalid" class="ma-0" color="primary" tile depressed block ripple
                @click="onSignup">{{ $t("LOGIN_FORM_SIGN_BUTTON_TEXT") }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
        <v-col cols="6">
          <template>
            <v-carousel @change="checkAvatar" hide-delimiters>
              <v-carousel-item style="height:auto;" v-for="(item, i) in getAllAvatars" :key="i">
                <v-img :src="item.url" :contain="true" height="auto">
                </v-img>
              </v-carousel-item>
            </v-carousel>
          </template>
        </v-col>
      </v-row>

    </ValidationObserver>
  </transition>
</template>

<script>
import useUserStore from '@/stores/user';
import useRoomsStore from '@/stores/rooms';
import useMainStore from '@/stores/main';
// import {
//   ValidationObserver,
//   ValidationProvider,
// } from 'vee-validate';
import PasswordConfirmed from '@/components/inputs/PasswordConfirmed';
import Email from '@/components/inputs/Email';

export default {

  components: {
    Email,
    // ValidationObserver,
    PasswordConfirmed,
    // ValidationProvider,
  },
  setup() {
    const userStore = useUserStore();
    const roomsStore = useRoomsStore();
    const mainStore = useMainStore();

    return {
      userStore,
      roomsStore,
      mainStore,
    };
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
    email() {
      return this.userStore.email;
    },
    password() {
      return this.userStore.password;
    },
    getAllAvatars() {
      return this.roomsStore.getAllAvatars;
    },
  },
  created() {

  },
  mounted() {
    // Use kimetsu_1 room for signup avatars (based on URL in default avatar)
    this.roomsStore.getAvatars('kimetsu_1');
  },
  methods: {
    setIsLoading(val) {
      this.isLoading = val;
    },
    onSignup() {
      if (this.userData.avatar.length === 0) {
        this.userData.avatar = this.getAllAvatars[0].url;
      }
      this.userStore.signUserUp(this.userData);
    },
    checkAvatar(index) {
      this.userData.avatar = this.getAllAvatars[index].url;
      this.userData.miniAvatar = this.getAllAvatars[index].miniurl;
      // console.log(this.getAllAvatars[index]);
    },
  },
  watch: {

  },
};
</script>

<style scoped>
.login_card {
  background-color: transparent !important;
}

.carrusel.v-image__image,
.v-image__placeholder {
  width: 27%;
  ;
}
</style>
