/* eslint-disable max-len */
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
  usersPosition: {},
  userPositionModified: true,
  requestedBy: '',
  avatarUpdated: {},
  roomIn: {},
};

const getters = {
  getCurrentUser(state) {
    return state.currentUser;
  },
};
const actions = {
  userSignOut() {
    console.log('signOut');
    // const auth = firebase.auth().getAuth();
    firebase.auth().signOut().then(
      () => router.push({ name: 'login' }),
    );
  },
  getUser({ commit, dispatch, state }) {
    firebase.auth().onAuthStateChanged((user) => {
      console.log('ceck user', user);
      if (user) {
        // eslint-disable-next-line no-template-curly-in-string
        console.log('rooms/${state.roomIn.roomId}/users/${state.roomUsersKey}', `rooms/${state.roomIn.roomId}/users/${state.roomUsersKey}`);
        const ref = firebase.database().ref(`users/${user.uid}`);
        // const refRoom = firebase.database().ref(`rooms/${state.roomIn.roomId}/users/${state.roomUsersKey}`);

        if (user.isAnonymous) {
          ref.set({
            nickname: 'anonymous',
            avatar: 'https://firebasestorage.googleapis.com/v0/b/chitter-chatter-f762a.appspot.com/o/rooms%2Fyk7XJwBbTJPFkDJ92vZF9bv1Od45%2Favatars%2FL1%2Fbills-200-70.png?alt=media&token=cdb26e62-d3b6-4af1-9279-c0e733159008',
            age: 0,
            miniavatar: '',
            level: 'L1',
            userId: user.uid,
          });
          // ref.onDisconnect().remove();
        }
        ref.update({
          onlineState: true,
          status: "I'm online.",
        });

        ref.onDisconnect().update({
          onlineState: false,
          status: "I'm offline.",
        });
        firebase.database().ref(`users/${user.uid}`).once('value', (snapshot) => {
          console.log('snapshot from getUser', snapshot.val());
          commit('setCurrentUser', { data: snapshot.val(), userId: user.uid });
        });
      } else {
        dispatch('loginAnonymously');
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
    const snapshot = await firebase.database().ref(`users/${userId}`).once('value');
    const userDataTemp = snapshot.val();
    if (userDataTemp.position) {
      commit('SET_USER_POSITION', { position: userDataTemp.position, userId });
    }
    commit('setUserData', { ...userDataTemp, userId });
    const userPosition = firebase.database().ref(`users/${userId}/position/`);
    const privateMessage = firebase.database().ref(`users/${state.currentUser.userId}/privateMessage/requestedBy`);
    firebase.database().ref(`users/${userId}/avatar`).on('value', (snapAvatar) => {
      commit('SET_USER_AVATAR_SUCCESS', { url: snapAvatar.val(), userId });
    });
    userPosition.on('value', (snapPosition) => {
      commit('SET_USER_POSITION', { position: snapPosition.val(), userId });
    });
    privateMessage.on('value', (snapPrivate) => {
      commit('PRIVATE_REQUESTED', { requestedBy: state.userData[snapPrivate.val()], userId: snapPrivate.val() });
    });

    return { ...userDataTemp, userId };
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
  async changeAvatar({ state }, url) {
    // commit('SET_USER_AVATAR');
    try {
      const { currentUser } = state;
      // eslint-disable-next-line no-undef
      const tempUser = structuredClone(currentUser);
      console.log('tempUser before', tempUser);
      Object.assign(tempUser, { avatar: url });
      console.log('tempUser after', tempUser);
      await firebase.database().ref(`users/${state.currentUser.userId}`).set(tempUser);
    } catch (error) {
      // commit('SET_USER_AVATAR_FAILED');
      console.log(error);
    }
  },
  async loginAnonymously() {
    // commit('SET_USER_AVATAR');
    firebase.auth().signInAnonymously()
      // .then(() => {
      // // Signed in..
      // })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        if (errorCode === 'auth/operation-not-allowed') {
          alert('You must enable Anonymous auth in the Firebase Console.');
        } else {
          console.error(errorMessage);
        }
      });
  },
};

const mutations = {
  setEmail(state, data) { state.email = data; },
  setPassword(state, data) { state.password = data; },
  setCurrentUser(state, payload) {
    Object.assign(state.currentUser, { ...payload.data, userId: payload.userId });
  },
  setUserData(state, data) {
    Object.assign(state.userData, { [data.userId]: data });

    // Object.assign(state.currentUser, { [data.userId]: data });
  },
  SET_USER_POSITION(state, { position, userId }) {
    Object.assign(state.usersPosition, { [userId]: { position } });
    state.userPositionModified = position.left || position.right;
  },
  SET_USER_AVATAR_SUCCESS(state, { url, userId }) {
    state.avatarUpdated = { url, userId };
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
