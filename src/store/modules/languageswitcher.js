import Vue from 'vue';
import { localize } from 'vee-validate';
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
        await Vue.ls.set('lang', lang);
        commit('SET_LANG', lang);
      } else {
        const value = await Vue.ls.get('lang') || process.env.VUE_APP_I18N_LOCALE;
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
    i18n.locale = data;
    localize(data, en);
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
