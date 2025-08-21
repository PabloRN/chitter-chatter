import { set } from '@/utils/vuex';

const state = {
  snackbar: false,
  drawer: false,
};

const actions = {
  // async setSnackbar({ commit }, payload) {
  //   try {
  //     commit('setSnackbar', payload);
  //   } catch (error) {
  //     console.error(error);
  //   }
  // },
};

const mutations = {
  setSnackbar: set('snackbar'),
  setDrawer: set('drawer'),
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
};
