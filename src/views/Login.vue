<template>
  <v-container fluid style="max-height:100vh;">
    <v-row class="flex-column align-center align-content-center justify-center text-center"
      :style="{ height: display.mobile ? '45vh' : '50vh' }" gutter="0">
    </v-row>

    <v-row no-gutters class="flex-column justify-center align-center fill-height mt-sm-2">
      <v-col class="pa-5" cols="12">
        <transition name="slide-fade">
          <router-view />
        </transition>
      </v-col>
      <v-col cols="12" class="footer">
        <v-footer absolute bottom padless>
          <v-row class="d-flex" gutter="0">
            <v-col class="text-start pl-3" sm="9" md="9" lg="11">
              <strong>© TOONSTALK {{ new Date().getFullYear() }}</strong>
            </v-col>
            <v-col class="text-end pr-3" sm="3" md="3" lg="1">
              <language-switcher />
            </v-col>
          </v-row>
        </v-footer>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { useDisplay } from 'vuetify';
import useMainStore from '@/stores/main';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';

const mainStore = useMainStore();
const display = useDisplay(); // reactive breakpoint object
</script>

<style scoped>
.v-responsive__content {
  flex: none;
}

.container {
  padding: 0;
}

.slide-fade-enter-active {
  transition: all .3s ease;
}

.slide-fade-leave-active {
  transition: all .8s cubic-bezier(1.0, 0.5, 0.8, 1.0);
}

.slide-fade-enter,
.slide-fade-leave-to {
  transform: translateX(10px);
  opacity: 0;
}

.v-footer {
  background-color: #575757;
  height: 48px;
  color: #e6e6e6;
}
</style>
