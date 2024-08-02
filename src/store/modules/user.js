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
  userSignOut({ commit, state }) {
    // const auth = firebase.auth().getAuth();
    const { currentUser } = firebase.auth();
    const ref = firebase.database().ref(`users/${currentUser.uid}`);
    ref.update({ onlineState: false, status: 'offline' });
    firebase.auth().signOut().then(
      () => {
        firebase.database().ref(`users/${state.currentUser.unverified}`).update({ [state.currentUser.unverified]: null });
        firebase.database().ref(`users/${state.currentUser.unverified}`).off();
        firebase.database().ref(`users/${state.usersSwitched.verifiedUser}`).update({ unverified: null });
        ref.update({ unverified: null });
        commit('SET_USER_SIGNED_OUT');
        router.push({ name: 'rooms' });
      },
    );
  },
  getUser({ commit, dispatch }) {
    firebase.auth().onAuthStateChanged(async (user) => {
      if (user) {
        // eslint-disable-next-line no-template-curly-in-string
        const ref = firebase.database().ref(`users/${user.uid}`);
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
            console.log('No user is signed in.');
          }
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

    const ui = firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(firebase.auth());

    const handleUpgrade = async (user) => {
      try {
        // Save anonymous user data
        const snapshot = await firebase.database().ref(`users/${anonymousUser.uid}`).once('value');
        data = snapshot.val();

        if (!data) {
          throw new Error('No anonymous user data found.');
        }

        // Ensure the data being transferred belongs to the anonymous user
        if (data.userId !== anonymousUser.uid) {
          throw new Error('Data does not belong to the anonymous user.');
        }

        // Update the user data with the new user ID
        data.isAnonymous = false;
        data.userId = user.uid;

        // Transfer the user data to the new user ID
        await firebase.database().ref(`users/${user.uid}`).set(data);
        if (anonymousUser.uid !== user.uid) {
          await firebase.database().ref(`users/${user.uid}`).update({ unverified: anonymousUser.uid });
          // Delete the anonymous user and its data
          await firebase.database().ref(`users/${anonymousUser.uid}`).set(null);
          await anonymousUser.delete();
          // Transfer the room user data
          const { roomUsersKey } = state.currentUser.rooms[rootState.route.params.roomId];
          await firebase.database().ref(`rooms/${rootState.route.params.roomId}/users/${roomUsersKey}/userId`).set(user.uid);
        }
      } catch (error) {
        console.error('Error during user upgrade:', error);
        throw error;
      }
    };

    try {
      const uiConfig = {
        callbacks: {
          signInSuccessWithAuthResult: (authResult, redirectUrl) => {
            console.log({ redirectUrl });

            const { user } = authResult;

            // Call handleUpgrade without awaiting it to ensure we return false immediately
            handleUpgrade(user).then(() => {
              if (authResult && authResult.user.isAnonymous === false) {
                commit('USER_UPGRADED', { verifiedUser: authResult.user.uid, unverifiedUser: anonymousUser.uid });
              }
            }).catch((error) => {
              console.error('Error during user upgrade:', error);
            });

            return false; // Ensure this function returns false to prevent automatic redirection
          },

          uiShown() {
            document.getElementById('loader').style.display = 'none';
          },
          signInFailure: async (error) => {
            if (error.code !== 'firebaseui/anonymous-upgrade-merge-conflict') {
              return Promise.resolve();
            }

            const cred = error.credential;

            try {
              // Sign in with the new credential
              const userCredential = await firebase.auth().signInWithCredential(cred);
              const { user } = userCredential;

              // Call handleUpgrade with the user
              await handleUpgrade(user);
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
          {
            provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
            requireDisplayName: false,
            signInMethod: 'password',
          },
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
    if (verifiedUser !== unverifiedUser)Vue.set(state.currentUser, 'unverified', unverifiedUser);

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
    if (verifiedUser !== unverifiedUser) {
      Vue.delete(state.userData, unverifiedUser);
      Vue.delete(state.usersPosition, unverifiedUser);
    }
    state.usersSwitched = { verifiedUser, unverifiedUser };
    state.signingInUpgraded = true;
  },
  SET_USER_NICKNAME(state, nickName) {
    state.currentUser.nickname = nickName;
    firebase.database().ref(`users/${state.currentUser.userId}`).update({ nickname: nickName });
    state.userData[state.currentUser.userId].nickname = nickName;
    state.userUpgraded = true;
  },
  SET_USER_SIGNED_OUT(state) {
    state.signingInUpgraded = false;
    state.userUpgraded = false;
    state.currentUser.unverified = null;
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
