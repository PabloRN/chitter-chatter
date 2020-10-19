import Vue from 'vue';
import Vuetify from 'vuetify/lib';

// import VueI18n from 'vue-i18n';
// import i18n from '@/i18n';
import en from '@/locales/en.json';
import es from '@/locales/es.json';

Vue.use(Vuetify);

export default new Vuetify({
  lang: {
    locales: { en, es },
    current: 'en',
  },
  breakpoint: {
    thresholds: {
      xs: 340,
      sm: 540,
      md: 800,
      lg: 1280,
    },
    scrollBarWidth: 24,
  },
});
