/* eslint no-shadow: ["error", { "allow": ["state"] }] */

// State object
const state = {
  dialogText: '',
};

// Getter functions
const getters = {
  getText(state) {
    return state.dialogText;
  },
};

// Actions
const actions = {
  async sendText({ commit }, text) {
    try {
      // TODO: send text to firebase
      commit('SEND_TEXT_SUCCESS', text);
    } catch (error) {
      console.error(error);
      commit('SEND_TEXT_ERROR');
    }
  },
};
// Mutations
const mutations = {
  SEND_TEXT_SUCCESS(state, text) {
    state.dialogText = text;
  },
  SEND_TEXT_ERROR() {
    console.log('Error sending text');
  },
};
export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
