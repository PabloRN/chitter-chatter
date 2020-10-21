<template>
    <v-container fluid style="max-height:100vh;">
      <v-row class="flex-column align-center align-content-center justify-center text-center"
       :style="{ heigth: breakpoint.mobile ? '45vh' : '50vh' }" no-gutters>
      </v-row>
      <v-row no-gutters class="flex-column justify-center align-center fill-height mt-sm-2">
        <v-col class="pa-5" cols="12">
          <transition name="slide-fade">
              <router-view />
          </transition>
        </v-col>
        <v-col cols="12" class="footer ">
          <template>
            <v-footer absolute bottom padless>
              <v-row no-gutters class="d-flex">
               <v-col class="text-start pl-3" sm="9" md="9" lg="11">
                <strong>© CHAVATAR {{ new Date().getFullYear() }}</strong>
              </v-col>
              <v-col class="text-end pr-3" sm="3" md="3" lg="1" >
                <language-switcher />
              </v-col>
              </v-row>
            </v-footer>
          </template>
        </v-col>
      </v-row>
    </v-container>
</template>
<script>
import {
  mapMutations,
  mapState,
} from 'vuex';

import LanguageSwitcher from '@/components/layout/LanguageSwitcher.vue';

export default {

  components: {
    LanguageSwitcher,
  },
  data: () => ({
    breakpoint: {},
  }),
  computed: {
    ...mapState('main', ['drawer']),
  },
  mounted() {
    // this.setDrawer(false);
    this.breakpoint = this.$vuetify.breakpoint;
  },
  methods: {
    ...mapMutations('main', ['setSnackbar']),
  },
};
</script>
<style scoped>
  .v-responsive__content{
    flex: none;
  }

.container{
  padding: 0;
}
/* Enter and leave animations can use different */
/* durations and timing functions.              */
.slide-fade-enter-active {
  transition: all .3s ease;
}
.slide-fade-leave-active {
  transition: all .8s cubic-bezier(1.0, 0.5, 0.8, 1.0);
}
.slide-fade-enter, .slide-fade-leave-to
/* .slide-fade-leave-active below version 2.1.8 */ {
  transform: translateX(10px);
  opacity: 0;
}
.v-footer{
  background-color: #575757;
  height: 48px;
  color: #e6e6e6;
}
</style>
