/* eslint-disable max-len */
/* eslint-disable no-shadow */
import * as firebase from 'firebase';
import router from '@/router/index';
import extractImageName from '@/utils/avatarName';

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
    // const auth = firebase.auth().getAuth();
    firebase.auth().signOut().then(
      () => router.push({ name: 'login' }),
    );
  },
  getUser({ commit, dispatch }) {
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        // eslint-disable-next-line no-template-curly-in-string
        const ref = firebase.database().ref(`users/${user.uid}`);

        if (user.isAnonymous) {
          const uidSnippet = user.uid.substring(0, 4);
          const nickname = `anon_${uidSnippet}`;
          ref.set({
            nickname,
            avatar: '',
            age: 0,
            miniAvatar: '',
            level: 'L1',
            userId: user.uid,
            onlineState: true,
            status: 'online',
          });
          // ref.onDisconnect().remove();
        }

        ref.onDisconnect().update({
          onlineState: false,
          status: 'offline',
        });
        firebase.database().ref(`users/${user.uid}`).on('value', (snapshot) => {
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
    const userAvatar = firebase.database().ref(`users/${userId}/avatar`);
    const userMiniAvatar = firebase.database().ref(`users/${userId}/miniAvatar`);
    userAvatar.on('value', async (snapAvatar) => {
      commit('SET_USER_AVATAR_SUCCESS', { url: snapAvatar.val(), userId });
    });
    userMiniAvatar.on('value', async (snapMiniAvatar) => {
      commit('SET_USER_MINIAVATAR_SUCCESS', { miniAvatarUrl: snapMiniAvatar.val(), userId });
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
      miniAvatar,
    } = data;
    firebase.auth().createUserWithEmailAndPassword(state.email, state.password)
      .then((credentials) => {
        firebase.database().ref(`users/${credentials.user.uid}`).set({
          nickname,
          avatar,
          age,
          miniAvatar,
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
  async changeAvatar({ state, rootState, commit }, url) {
    // commit('SET_USER_AVATAR');
    const storageRef = firebase.storage().ref();
    const miniAvatarsRef = storageRef.child(`${rootState.route.fullPath}/avatars/L1/miniavatars`);
    try {
      const { currentUser } = state;
      const avatarNameWithExt = extractImageName(url);
      const avatarName = avatarNameWithExt.replace('.png', '');
      await firebase.database().ref(`users/${currentUser.userId}/avatar/`).set(url);
      const miniavatarRefUrl = await miniAvatarsRef.child(`${avatarName}_head.png`).getDownloadURL();
      await firebase.database().ref(`users/${currentUser.userId}/miniAvatar/`).set(miniavatarRefUrl);
      commit('SET_CURRENT_USER_AVATAR', { avatar: url, miniAvatar: miniavatarRefUrl });
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
    state.userPositionModified = position?.left || position?.right;
  },
  SET_USER_AVATAR_SUCCESS(state, { url, userId }) {
    state.avatarUpdated = { url, userId };
  },
  SET_USER_MINIAVATAR_SUCCESS(state, { userId, miniAvatarUrl }) {
    state.userData[userId].miniAvatar = miniAvatarUrl;
  },
  SET_CURRENT_USER_AVATAR(state, { avatar, miniAvatar }) {
    state.currentUser.miniAvatar = miniAvatar;
    state.currentUser.avatar = avatar;
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
