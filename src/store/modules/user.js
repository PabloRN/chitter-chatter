/* eslint-disable max-len */
/* eslint-disable no-shadow */
import Vue from 'vue';
import firebase from 'firebase/app';
import * as firebaseui from 'firebaseui';
import 'firebase/auth'; // Import the auth module explicitly if needed
import 'firebase/database'; // Import other Firebase modules as needed
import 'firebase/storage';
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
  signingInUpgraded: false,
  userUpgraded: false,
  usersSwitched: {},
};

const getters = {
  getCurrentUser(state) {
    return state.currentUser;
  },
};
const actions = {
  userSignOut() {
    // const auth = firebase.auth().getAuth();
    const { currentUser } = firebase.auth();
    const ref = firebase.database().ref(`users/${currentUser.uid}`);
    ref.update({ onlineState: false, status: 'offline' });
    firebase.auth().signOut().then(
      () => {
        router.push({ name: 'rooms' });
      },
    );
  },
  getUser({ commit, dispatch }) {
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        // eslint-disable-next-line no-template-curly-in-string
        const ref = firebase.database().ref(`users/${user.uid}`);
        console.log('onAuthStateChanged', user);
        if (user.isAnonymous) {
          const uidSnippet = user.uid.substring(0, 4);
          const nickname = `anon_${uidSnippet}`;
          const initialUser = {
            nickname,
            avatar: '',
            age: 0,
            miniAvatar: '',
            level: 'L1',
            userId: user.uid,
            onlineState: true,
            status: 'online',
            isAnonymous: true,
          };
          ref.set(initialUser);
          // ref.onDisconnect().remove();
        } else {
          ref.update({
            onlineState: true,
            status: 'online',
            isAnonymous: false,
          });
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
  async setFirebaseUiInstance({ commit, rootState, state }) {
    let data = null;
    const anonymousUser = firebase.auth().currentUser;
    console.log('Anonymous User:', anonymousUser);

    const ui = new firebaseui.auth.AuthUI(firebase.auth());

    try {
      const uiConfig = {
        callbacks: {
          async signInSuccessWithAuthResult(authResult, redirectUrl) {
            console.log({ redirectUrl, authResult });
            console.log('authResult.emailVerified:', authResult.user.emailVerified);

            if (authResult.user.emailVerified) {
              commit('USER_UPGRADED', { verifiedUser: authResult.user.uid, unverifiedUser: anonymousUser.uid });
            }

            await firebase.database().ref(`users/${anonymousUser.uid}`).set(null);
            const { roomUsersKey } = state.currentUser.rooms[rootState.route.params.roomId];
            await firebase.database().ref(`rooms/${rootState.route.params.roomId}/users/${roomUsersKey}/userId`).set(authResult.user.uid);
            await anonymousUser.delete();

            return false;
          },
          uiShown() {
            document.getElementById('loader').style.display = 'none';
          },
          async signInFailure(error) {
            console.log('1 signInFailure error:', error);
            if (error.code !== 'firebaseui/anonymous-upgrade-merge-conflict') {
              return Promise.resolve();
            }

            const cred = error.credential;
            console.log('2 credential:', cred);

            try {
              // Save anonymous user data
              const snapshot = await firebase.database().ref(`users/${anonymousUser.uid}`).once('value');
              data = snapshot.val();
              console.log('3 anonymous user data:', data);

              if (!data) {
                throw new Error('No anonymous user data found.');
              }

              // Sign in with the new credential
              const userCredential = await firebase.auth().signInWithCredential(cred);
              const { user } = userCredential;
              console.log('userCredential:', user);
              console.log('Anonymous User ID:', anonymousUser.uid);
              console.log('State Current User ID:', state.currentUser.userId);

              // Ensure the data being transferred belongs to the anonymous user
              if (data.userId !== anonymousUser.uid) {
                throw new Error('Data does not belong to the anonymous user.');
              }

              // Update the user data with the new user ID
              data.isAnonymous = false;
              data.userId = user.uid;

              // Transfer the user data to the new user ID
              await firebase.database().ref(`users/${user.uid}`).set(data);

              // Transfer the room user data
              const { roomUsersKey } = state.currentUser.rooms[rootState.route.params.roomId];
              await firebase.database().ref(`rooms/${rootState.route.params.roomId}/users/${roomUsersKey}/userId`).set(user.uid);

              // Delete the anonymous user and its data
              await anonymousUser.delete();
              await firebase.database().ref(`users/${anonymousUser.uid}`).set(null);

              // Commit the Vuex mutation
              commit('USER_UPGRADED', { verifiedUser: user.uid, unverifiedUser: anonymousUser.uid });

              return Promise.resolve(); // Return a resolved promise to indicate successful handling
            } catch (err) {
              console.error('Error during sign-in failure handling:', err);
              return Promise.reject(err); // Return a rejected promise to indicate an error
            }
          },
        },
        signInFlow: 'popup',
        signInOptions: [
          firebase.auth.GoogleAuthProvider.PROVIDER_ID,
          firebase.auth.EmailAuthProvider.PROVIDER_ID,
        ],
        credentialHelper: firebaseui.auth.CredentialHelper.GOOGLE_YOLO,
        autoUpgradeAnonymousUsers: true,
        tosUrl: '<your-tos-url>',
        privacyPolicyUrl: '<your-privacy-policy-url>',
      };

      ui.start('#firebaseui-auth-container', uiConfig);
    } catch (error) {
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
  updateUserNickName({ commit }, nickName) {
    commit('SET_USER_NICKNAME', nickName);
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
  USER_UPGRADED(state, { verifiedUser, unverifiedUser }) {
    // Update currentUser
    Vue.set(state.currentUser, 'isAnonymous', false);
    Vue.set(state.currentUser, 'userId', verifiedUser);

    // Transfer user data
    Vue.set(state.userData, verifiedUser, {
      ...state.userData[unverifiedUser],
      userId: verifiedUser,
      isAnonymous: false,
    });

    // Transfer user position
    Vue.set(state.usersPosition, verifiedUser, state.currentUser.position);
    Vue.set(state.avatarUpdated, 'url', state.currentUser.avatar);
    Vue.set(state.avatarUpdated, 'userId', state.currentUser.userId);

    // Object.assign(state.avatarUpdated, { url: state.userData[verifiedUser].avatar, userId: verifiedUser });

    // Remove unverified user data
    Vue.delete(state.userData, unverifiedUser);
    Vue.delete(state.usersPosition, unverifiedUser);
    state.usersSwitched = { verifiedUser, unverifiedUser };
    state.signingInUpgraded = true;
  },
  SET_USER_NICKNAME(state, nickName) {
    state.currentUser.nickname = nickName;
    state.userData[state.currentUser.userId].nickname = nickName;
    state.userUpgraded = true;
  },
  SET_USER_MINIAVATAR_SUCCESS(state, { userId, miniAvatarUrl }) {
    if (state.userData[userId]) {
      state.userData[userId].miniAvatar = miniAvatarUrl;
    }
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
