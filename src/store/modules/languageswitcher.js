import i18n from '@/i18n';
import en from '@/locales/en.json';

/* eslint no-shadow: ["error", { "allow": ["state"] }] */

// State object
const state = {
  lang: '',
};

// Getter functions
const getters = {
  getLang(state) {
    return state.lang;
  },
};

// Actions
const actions = {
  async SET_LANG({ commit }, lang) {
    try {
      if (lang) {
        localStorage.setItem('lang', lang);
        commit('SET_LANG', lang);
      } else {
        const value = localStorage.getItem('lang') || import.meta.env.VITE_I18N_LOCALE || 'en';
        commit('SET_LANG', value);
      }
    } catch (error) {
      console.error(error);
      commit('SET_LANG_ERROR');
    }
  },
};
// Mutations
const mutations = {
  SET_LANG(state, data) {
    state.lang = data;
    i18n.global.locale.value = data;
  },
  SET_LANG_ERROR() {
    window.$messageGlobal('Error switching languages');
  },
};
export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
