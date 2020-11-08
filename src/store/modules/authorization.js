/* eslint-disable no-shadow */
import * as firebase from 'firebase';

const state = {
  avatarsList: [],
  email: '',
  getavatarsLoading: false,
  userDataReady: false,
  isLoading: false,
  isReady: false,
  password: '',
  code: '',
  userData: {},
  currentUser: {},
};

const getters = {
  getAllAvatars(state) {
    return state.avatarsList;
  },
  getCurrentUser(state) {
    return state.currentUser;
  },
};
const actions = {
  getUser({ commit }) {
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        firebase.database().ref(`users/${user.uid}`).on('value', (snapshot) => {
          commit('setCurrentUser', { data: snapshot.val(), userId: user.uid });
        });
      } else {
        this.$router.push({ name: 'login' });// No user is signed in.
      }
    });
  },
  initPosition(_, { left, top, userId }) {
    firebase.database().ref(`users/${userId}/position`).set({
      left,
      top,
    });
  },
  changePosition(_, { left, top, userId }) {
    firebase.database().ref(`users/${userId}/position`).set({
      left,
      top,
    });
  },
  async getUserData({ commit }, userId) {
    const snapshot = await firebase.database().ref(`users/${userId}`).once('value');
    commit('setUserData', await { ...snapshot.val(), userId });
    return { ...snapshot.val(), userId };
  },
  setEmailAction: async ({ commit }, payload) => {
    commit('setEmail', payload);
  },
  setPasswordAction: async ({ commit }, payload) => {
    commit('setPassword', payload);
  },
  // eslint-disable-next-line no-empty-pattern
  signUserUp({ commit, state }, data) {
    const { nickname, avatar, age } = data;
    firebase.auth().createUserWithEmailAndPassword(state.email, state.password)
      .then((credentials) => {
        firebase.database().ref(`users/${credentials.user.uid}`).set({
          nickname,
          avatar,
          age,
        });
        commit('main/setSnackbar',
          {
            type: 'success',
            msg: `Created user ${nickname} successfully`,
          },
          { root: true });
        commit('setUser', {
          nickname, avatar, age, userId: credentials.user.uid,
        });
      })
      .catch(
        (error) => {
          console.log(error);
        },
      );
  },
  async getAvatars({ commit }) {
    commit('GET_AVATARS');
    try {
      const urlList = [];
      const storage = firebase.storage();
      // Create a storage reference from our storage service
      const storageRef = await storage.ref();
      const listRef = await storageRef.child('avatars');
      const tempRefs = await listRef.listAll();
      await Promise.all(tempRefs.items.map((async (ref, index) => {
        const starsRef = await storageRef.child(ref.location.path);
        const url = await starsRef.getDownloadURL();
        urlList.push({ avatarId: index, url });
      })));
      commit('GET_AVATARS_SUCCESED', urlList);
    } catch (error) {
      commit('GET_AVATARS_FAILED');
    }
  },
  signUserIn({ commit, state }) {
    firebase.auth().setPersistence('local').then(() => {
      firebase.auth().signInWithEmailAndPassword(state.email, state.password)
        .then((credentials) => {
          if (credentials) {
            firebase.database().ref(`users/${credentials.user.uid}`).once('value').then((snapshot) => {
              commit('setUser', snapshot.val());
            });
          } else {
            // No user is signed in.
          }
          // console.log(user);

          commit('main/setSnackbar',
            {
              type: 'success',
              msg: `Created user ${credentials.user.email} successfully`,
            },
            { root: true });
          // commit('setUser', newUser);
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
    });
  },
};

const mutations = {
  setEmail(state, data) { state.email = data; },
  setPassword(state, data) { state.password = data; },
  setCurrentUser(state, data) {
    if (state.currentUser[data.userId]) {
      state.currentUser[data.userId] = data.data;
    } else {
      Object.assign(state.currentUser, { [data.userId]: data.data });
    }
  },
  setUserData(state, data) {
    if (state.userData[data.userId]) {
      state.userData[data.userId] = data.data;
    } else {
      Object.assign(state.userData, { [data.userId]: data });
    }
  },
  GET_AVATARS(state) {
    state.getavatarsLoading = true;
  },
  GET_AVATARS_SUCCESED(state, data) {
    state.avatarsList = data;
    state.getavatarsLoading = false;
  },
  GET_AVATARS_FAILED(state) {
    state.getavatarsLoading = false;
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};
