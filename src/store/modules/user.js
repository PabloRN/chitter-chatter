/* eslint-disable no-shadow */
import * as firebase from 'firebase';
import router from '@/router/index';

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
  currentUserId: '',
  usersPosition: {},
  userPositionModified: false,
  requestedBy: '',
};

const getters = {
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
        // router.push({ name: 'login' });// No user is signed in.
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
  async getUserData({ commit, state }, userId) {
    console.log('getUserData');
    const snapshot = await firebase.database().ref(`users/${userId}`).once('value');
    commit('setUserData', await { ...snapshot.val(), userId });
    const userPosition = firebase.database().ref(`users/${userId}/position/`);
    const privateMessage = firebase.database().ref(`users/${state.currentUser.userId}/privateMessage/requestedBy`);

    userPosition.on('value', (snapPosition) => {
      commit('SET_USER_POSITION', { position: snapPosition.val(), userId });
    });
    privateMessage.on('value', (snapPrivate) => {
      commit('PRIVATE_REQUESTED', { requestedBy: state.userData[snapPrivate.val()], userId: snapPrivate.val() });
    });

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
    const {
      nickname,
      avatar,
      age,
      miniavatar,
    } = data;
    firebase.auth().createUserWithEmailAndPassword(state.email, state.password)
      .then((credentials) => {
        firebase.database().ref(`users/${credentials.user.uid}`).set({
          nickname,
          avatar,
          age,
          miniavatar,
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
  signUserIn({ commit, state }) {
    firebase.auth().setPersistence('local').then(() => {
      firebase.auth().signInWithEmailAndPassword(state.email, state.password)
        .then((credentials) => {
          if (credentials) {
            firebase.database().ref(`users/${credentials.user.uid}`).once('value').then((snapshot) => {
              commit('setUser', snapshot.val());
            });
            commit('main/setSnackbar',
              {
                type: 'success',
                msg: `Created user ${credentials.user.email} successfully`,
              },
              { root: true });
            router.push({ name: 'rooms' });
          } else {
            // No user is signed in.
          }
          // console.log(user);
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
    // console.log('DDDDDDD', data);
    if (state.currentUser[data.userId]) {
      state.currentUser = data.data;
      state.currentUser.userId = data.userId;
      state.currentUserId = data.userId;
    } else {
      Object.assign(state.currentUser, { [data.userId]: data.data, userId: data.userId });
    }
  },
  setUserData(state, data) {
    if (state.userData[data.userId]) {
      state.userData[data.userId] = data.data;
    } else {
      Object.assign(state.userData, { [data.userId]: data });
    }
  },
  SET_USER_POSITION(state, { position, userId }) {
    console.log('SET_USER_POSITION', state.usersPosition[userId]);
    console.log('state.userPositionModified = !state.userPositionModified;', state.userPositionModified);
    if (state.usersPosition[userId]) {
      state.usersPosition[userId].position = position;
    } else {
      Object.assign(state.usersPosition, { [userId]: { position } });
    }
    state.userPositionModified = !state.userPositionModified;
  },
  PRIVATE_REQUESTED(state, { requestedBy, userId }) {
    state.requestedBy = requestedBy;
    if (requestedBy) {
      state.requestedBy.userId = '';
      state.requestedBy.userId = userId;
    }
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};
