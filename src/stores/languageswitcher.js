import { defineStore } from 'pinia';
import i18n from '@/i18n';
import en from '@/locales/en.json';

export const useLanguageSwitcherStore = defineStore('languageswitcher', {
  state: () => ({
    lang: '',
  }),

  getters: {
    getLang: (state) => state.lang,
  },

  actions: {
    async SET_LANG(lang) {
      try {
        if (lang) {
          localStorage.setItem('lang', lang);
          this.setLang(lang);
        } else {
          const value = localStorage.getItem('lang') || import.meta.env.VITE_I18N_LOCALE || 'en';
          this.setLang(value);
        }
      } catch (error) {
        console.error(error);
        this.setLangError();
      }
    },

    setLang(data) {
      this.lang = data;
      i18n.global.locale.value = data;
    },

    setLangError() {
      console.error('Error switching languages');
    },
  },
});
