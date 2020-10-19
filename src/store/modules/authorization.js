import * as firebase from 'firebase';

const actions = {

  setEmailAction: async ({ commit }, payload) => {
    commit('setEmail', payload);
  },
  setPasswordAction: async ({ commit }, payload) => {
    commit('setPassword', payload);
  },
  signUserUp({ commit, state }) {
    firebase.auth().createUserWithEmailAndPassword(state.email, state.password).then((user) => {
      console.log(user);
      const newUser = {
        id: user.uid,
        registeredGames: [],
      };
      commit('main/setSnackbar',
        {
          type: 'success',
          msg: `Created user ${user.email} successfully`,
        },
        { root: true });
      commit('setUser', newUser);
    })
      .catch(
        (error) => {
          console.log(error);
        },
      );
  },
  signUserIn({ commit, state }) {
    firebase.auth().signInWithEmailAndPassword(state.email, state.password)
      .then((user) => {
        console.log(user);
        const newUser = {
          id: user.uid,
          registeredGames: [],
        };
        commit('main/setSnackbar',
          {
            type: 'success',
            msg: `Created user ${user.email} successfully`,
          },
          { root: true });
        commit('setUser', newUser);
      })
      .catch(
        (error) => {
          commit('main/setSnackbar',
            {
              type: 'error',
              msg: `${error}`,
            },
            { root: true });
          console.log(error);
        },
      );
  },
};

const mutations = {
  setEmail(state, data) { state.email = data; },
  setPassword(state, data) { state.password = data; },
  setUser(state, data) { state.user = data; },
};
const state = {
  email: '',
  isLoading: false,
  isReady: false,
  password: '',
  code: '',
  user: '',
};
export default {
  namespaced: true,
  state,
  mutations,
  actions,
};
