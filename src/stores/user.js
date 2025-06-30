import { defineStore } from 'pinia';
import {
  getAuth, onAuthStateChanged, signInAnonymously, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
} from 'firebase/auth';
import {
  getDatabase, ref, set, update, onValue, off, get, onDisconnect,
} from 'firebase/database';
import { getStorage, ref as storageRef, getDownloadURL } from 'firebase/storage';
import router from '@/router/index';
import extractImageName from '@/utils/avatarName';
import useMainStore from './main';

const useUserStore = defineStore('user', {
  state: () => ({
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
    updatedUser: false,
    usersSwitched: {},
  }),

  getters: {
    getCurrentUser: (state) => state.currentUser,
  },

  actions: {
    async userSignOut() {
      const auth = getAuth();
      const db = getDatabase();
      const { currentUser } = auth;

      if (currentUser) {
        const userRef = ref(db, `users/${currentUser.uid}`);
        await update(userRef, { onlineState: false, status: 'offline' });

        if (this.currentUser.unverified) {
          await update(ref(db, `users/${this.currentUser.unverified}`), { [this.currentUser.unverified]: null });
          off(ref(db, `users/${this.currentUser.unverified}`));
          await update(ref(db, `users/${this.usersSwitched.verifiedUser}`), { unverified: null });
          off(ref(db, `users/${this.usersSwitched.verifiedUser}`));
        }

        await update(userRef, { unverified: null });
        await signOut(auth);
        router.push({ name: 'rooms' });
        this.setUserSignedOut();
      }
    },

    async getUser() {
      const auth = getAuth();
      const db = getDatabase();

      console.log('getUser() called - setting up auth state listener');

      onAuthStateChanged(auth, async (user) => {
        console.log('Auth state changed:', user);
        if (user) {
          console.log('User authenticated:', user.uid, 'isAnonymous:', user.isAnonymous);
          const userRef = ref(db, `users/${user.uid}`);

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
            await set(userRef, initialUser);
          } else {
            await update(userRef, {
              onlineState: true,
              status: 'online',
              isAnonymous: false,
            });
          }

          onDisconnect(userRef).update({
            onlineState: false,
            status: 'offline',
          });

          onValue(userRef, (snapshot) => {
            console.log('User data from Firebase:', snapshot.val());
            this.setCurrentUser({ data: snapshot.val(), userId: user.uid });
            console.log('Current user set to:', this.currentUser);
          });
        } else {
          console.log('No user authenticated, logging in anonymously');
          this.loginAnonymously();
        }
      });
    },

    async initPosition({ left, top, userId }) {
      const db = getDatabase();
      const positionRef = ref(db, `users/${userId}/position`);
      await set(positionRef, { left, top });
    },

    async changePosition({ left, top, userId }) {
      const db = getDatabase();
      const positionRef = ref(db, `users/${userId}/position`);
      await set(positionRef, { left, top });
    },

    async getUserData(userId) {
      const db = getDatabase();
      const userRef = ref(db, `users/${userId}`);
      const snapshot = await get(userRef);
      const userDataTemp = snapshot.val();

      if (userDataTemp?.position) {
        this.setUserPosition({ position: userDataTemp.position, userId });
      }

      this.setUserData({ ...userDataTemp, userId });

      const userPosition = ref(db, `users/${userId}/position/`);
      const privateMessage = ref(db, `users/${this.currentUser.userId}/privateMessage/requestedBy`);
      const userAvatar = ref(db, `users/${userId}/avatar`);
      const userMiniAvatar = ref(db, `users/${userId}/miniAvatar`);
      const userSwitched = ref(db, `users/${userId}/unverified`);
      const userNickname = ref(db, `users/${userId}/nickname`);

      onValue(userAvatar, (snapAvatar) => {
        this.setUserAvatarSuccess({ url: snapAvatar.val(), userId });
      });

      onValue(userMiniAvatar, (snapMiniAvatar) => {
        this.setUserMiniAvatarSuccess({ miniAvatarUrl: snapMiniAvatar.val(), userId });
      });

      onValue(userPosition, (snapPosition) => {
        this.setUserPosition({ position: snapPosition.val(), userId });
      });

      onValue(privateMessage, (snapPrivate) => {
        this.privateRequested({ requestedBy: this.userData[snapPrivate.val()], userId: snapPrivate.val() });
      });

      onValue(userSwitched, (snapUnverified) => {
        if (snapUnverified.val()) this.setUserUpgradeSuccess({ userId: snapUnverified.val() });
      });

      onValue(userNickname, (snapNickname) => {
        this.setUserNickname({ nickname: snapNickname.val(), userId });
      });

      return { ...userDataTemp, userId };
    },

    setEmailAction(payload) {
      this.setEmail(payload);
    },

    setPasswordAction(payload) {
      this.setPassword(payload);
    },

    async signUserUp(data) {
      const {
        nickname, avatar, age, miniAvatar,
      } = data;
      const auth = getAuth();
      const db = getDatabase();
      const mainStore = useMainStore();

      try {
        const credentials = await createUserWithEmailAndPassword(auth, this.email, this.password);
        await set(ref(db, `users/${credentials.user.uid}`), {
          nickname,
          avatar,
          age,
          miniAvatar,
        });

        mainStore.setSnackbar({
          type: 'success',
          msg: `Created user ${nickname} successfully`,
        });

        this.setUser({
          nickname, avatar, age, userId: credentials.user.uid,
        });
      } catch (error) {
        console.log(error);
      }
    },

    async signUserIn() {
      const auth = getAuth();
      const db = getDatabase();
      const mainStore = useMainStore();

      try {
        const credentials = await signInWithEmailAndPassword(auth, this.email, this.password);

        if (credentials) {
          const snapshot = await get(ref(db, `users/${credentials.user.uid}`));
          this.setUser(snapshot.val());

          mainStore.setSnackbar({
            type: 'success',
            msg: `Signed in user ${credentials.user.email} successfully`,
          });

          router.push({ name: 'rooms' });
        }
      } catch (error) {
        mainStore.setSnackbar({
          type: 'error',
          msg: `${error}`,
        });
        console.log(error);
      }
    },

    async changeAvatar(url) {
      const storage = getStorage();
      const db = getDatabase();

      try {
        const { currentUser } = this;
        const avatarNameWithExt = extractImageName(url);
        const avatarName = avatarNameWithExt.replace('.png', '');

        await set(ref(db, `users/${currentUser.userId}/avatar/`), url);
        const { roomId } = router.currentRoute.value.params;
        const miniAvatarRef = storageRef(storage, `rooms/${roomId}/avatars/L1/miniavatars/${avatarName}_head.png`);
        const miniavatarRefUrl = await getDownloadURL(miniAvatarRef);
        await set(ref(db, `users/${currentUser.userId}/miniAvatar/`), miniavatarRefUrl);

        this.setCurrentUserAvatar({ avatar: url, miniAvatar: miniavatarRefUrl });
      } catch (error) {
        console.log(error);
      }
    },

    upgradeNonCurrentUser({ verifiedUser, unverifiedUser }) {
      this.userUpgraded({ verifiedUser, unverifiedUser, isCurrent: false });
    },

    async loginAnonymously() {
      const auth = getAuth();

      console.log('Starting anonymous login...');
      try {
        const result = await signInAnonymously(auth);
        console.log('Anonymous login successful:', result.user);
      } catch (error) {
        const errorCode = error.code;
        const errorMessage = error.message;

        if (errorCode === 'auth/operation-not-allowed') {
          console.error('You must enable Anonymous auth in the Firebase Console.');
        } else {
          console.error(errorMessage);
        }
      }
    },

    async updateUserNickName(nickName) {
      const db = getDatabase();
      await update(ref(db, `users/${this.currentUser.userId}`), { nickname: nickName });
    },

    // Placeholder for Firebase UI - TODO: Implement full Firebase UI integration
    async setFirebaseUiInstance() {
      console.log('Firebase UI instance setup - placeholder method');
      // This is a placeholder to prevent errors
      // The full implementation would require extensive Firebase UI setup
    },

    // Mutations converted to actions
    setEmail(data) {
      this.email = data;
    },

    setPassword(data) {
      this.password = data;
    },

    setCurrentUser(payload) {
      console.log('setCurrentUser called with payload:', payload);
      Object.assign(this.currentUser, { ...payload.data, userId: payload.userId });
      console.log('currentUser after assignment:', this.currentUser);
    },

    setUserData(data) {
      Object.assign(this.userData, { [data.userId]: data });
    },

    setUserPosition({ position, userId }) {
      Object.assign(this.usersPosition, { [userId]: { position } });
      this.userPositionModified = position?.left || position?.right;
    },

    setUserAvatarSuccess({ url, userId }) {
      this.avatarUpdated = { url, userId };
    },

    userUpgraded({ verifiedUser, unverifiedUser, isCurrent }) {
      if (isCurrent) {
        this.currentUser.isAnonymous = false;
        this.currentUser.userId = verifiedUser;
      }

      if (verifiedUser !== unverifiedUser && isCurrent) {
        this.currentUser.unverified = unverifiedUser;
      }

      this.userData[verifiedUser] = {
        ...this.userData[unverifiedUser],
        userId: verifiedUser,
        isAnonymous: false,
      };

      this.usersPosition[verifiedUser] = this.userData[verifiedUser].position;
      this.avatarUpdated.url = this.userData[verifiedUser].avatar;
      this.avatarUpdated.userId = this.userData[verifiedUser].userId;

      if (verifiedUser !== unverifiedUser) {
        delete this.userData[unverifiedUser];
        delete this.usersPosition[unverifiedUser];
      }

      this.usersSwitched = { verifiedUser, unverifiedUser };
      this.signingInUpgraded = true;
    },

    setUserNickname({ nickname, userId }) {
      if (this.currentUser.userId === userId) this.currentUser.nickname = nickname;
      this.userData[userId].nickname = nickname;
    },

    setUserSignedOut() {
      this.signingInUpgraded = false;
      this.userUpgraded = false;
      this.currentUser.unverified = null;
      this.usersSwitched = null;
    },

    setUserMiniAvatarSuccess({ userId, miniAvatarUrl }) {
      if (this.userData[userId]) {
        this.userData[userId].miniAvatar = miniAvatarUrl;
      }
    },

    setCurrentUserAvatar({ avatar, miniAvatar }) {
      this.currentUser.miniAvatar = miniAvatar;
      this.currentUser.avatar = avatar;
    },

    setUserUpgradeSuccess({ userId }) {
      if (this.userData[userId]) {
        this.otherUserUpdated = true;
      }
    },

    updateUser() {
      this.updatedUser = true;
    },

    privateRequested({ requestedBy, userId }) {
      this.requestedBy = requestedBy;
      if (requestedBy) {
        this.requestedBy.userId = '';
        this.requestedBy.userId = userId;
      }
    },

    setUser(userData) {
      Object.assign(this.currentUser, userData);
    },
  },
});

export default useUserStore;
