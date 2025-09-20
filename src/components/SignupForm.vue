<template>
  <transition name="fade">
    <Form @submit="onSignup" v-slot="{ errors, meta }">
      <v-row class="px-lg-15 mx-lg-15 px-md-0 mx-md-0">
        <v-col cols="6" xs="12" md="6">
          <v-card class="elevation-0 login_card mb-1 pa-lg-10
                 pa-md-0 px-lg-10 px-md-0" transition="scale-transition">
            <v-card-text>
              <v-form>
                <!-- nickname -->
                <Field name="nickname" rules="required" v-slot="{ field, errorMessage }">
                  <v-text-field v-bind="field" :error-messages="errorMessage" label="Nickname" outlined
                    v-model="userData.nickname" />
                </Field>

                <!-- email -->
                <Email class="pa-sm-1 pb-0" rules="required|email" label="Email" />

                <!-- password -->
                <PasswordConfirmed />
              </v-form>
            </v-card-text>

            <v-card-actions>
              <v-btn :loading="isLoading" :disabled="meta.valid === false" class="ma-0" color="primary" tile depressed
                block ripple type="submit">
                {{ $t("LOGIN_FORM_SIGN_BUTTON_TEXT") }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>

        <!-- avatars -->
        <v-col cols="6">
          <template>
            <v-carousel @change="checkAvatar" hide-delimiters>
              <v-carousel-item style="height:auto;" v-for="(item, i) in getAllAvatars" :key="i">
                <v-img :src="item.url" contain height="auto" />
              </v-carousel-item>
            </v-carousel>
          </template>
        </v-col>
      </v-row>
    </Form>
  </transition>
</template>

<script>
import { Form, Field, ErrorMessage } from 'vee-validate';
import * as yup from 'yup';
import useUserStore from '@/stores/user';
import useRoomsStore from '@/stores/rooms';
import useMainStore from '@/stores/main';
import PasswordConfirmed from '@/components/inputs/PasswordConfirmed';
import Email from '@/components/inputs/Email';

export default {
  components: {
    Form,
    Field,
    ErrorMessage,
    Email,
    PasswordConfirmed,
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
    isLoading: false,
    userData: {
      nickname: '',
      avatar: '',
      age: '',
    },
  }),
  computed: {
    getAllAvatars() {
      return this.roomsStore.getAllAvatars;
    },
  },
  mounted() {
    this.roomsStore.getAvatars('kimetsu_1');
  },
  methods: {
    async onSignup() {
      if (this.userData.avatar.length === 0) {
        this.userData.avatar = this.getAllAvatars[0].url;
      }
      await this.userStore.signUserUp(this.userData);
    },
    checkAvatar(index) {
      this.userData.avatar = this.getAllAvatars[index].url;
      this.userData.miniAvatar = this.getAllAvatars[index].miniurl;
    },
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
}
</style>
