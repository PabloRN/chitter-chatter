import { defineStore } from 'pinia';
// import * as firebaseui from 'firebaseui';
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  signInWithCredential,
  // GoogleAuthProvider,
  // EmailAuthProvider,
} from 'firebase/auth';
import {
  getDatabase, ref, set, update, onValue, off, get, onDisconnect,
} from 'firebase/database';
import {
  getStorage, ref as storageRef, getDownloadURL, uploadBytes,
} from 'firebase/storage';
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
    isUserUpgraded: false,
    updatedUser: false,
    usersSwitched: {},
    otherUserUpgraded: null, // For tracking other users' upgrades
    showWelcomeForm: false, // For controlling welcome form visibility
    blockListeners: [], // cleanup functions
    initialUser: {
      nickname: '',
      avatar: '',
      personalAvatar: '',
      age: 0,
      miniAvatar: '',
      level: 'L1',
      userId: '',
      onlineState: true,
      status: 'online',
      isAnonymous: true,
      favoriteRooms: [],
      ownedRooms: [],
      blocked: {},
      blockedBy: {},
      isActive: true,
      isCreator: false,
    },
  }),

  getters: {
    getCurrentUser: (state) => state.currentUser,
    blockedUsers: (state) => state.currentUser?.blocked || {},
    blockedByUsers: (state) => state.currentUser?.blockedBy || {},
    isBlocked: (state) => (userId) => !!state.currentUser?.blocked?.[userId],
    isBlockedBy: (state) => (userId) => !!state.currentUser?.blockedBy?.[userId],
    linkedProviders() {
      const user = this.getCurrentUser;
      return user?.providerData?.map((p) => p.providerId) || [];
    },
  },

  actions: {

    initBlockListeners(userId) {
      const db = getDatabase();
      const userStore = useUserStore();

      // Clean up old listeners (in case user switches account)
      this.blockListeners.forEach((unsubscribe) => unsubscribe());
      this.blockListeners = [];

      // 🔔 Listen to "blocked" (who I blocked)
      const blockedRef = ref(db, `users/${userId}/blocked`);
      const unsubscribeBlocked = onValue(blockedRef, (snap) => {
        userStore.currentUser.blocked = snap.val() || {};
      });
      this.blockListeners.push(() => off(blockedRef, 'value', unsubscribeBlocked));

      // 🔔 Listen to "blockedBy" (who blocked me)
      const blockedByRef = ref(db, `users/${userId}/blockedBy`);
      const unsubscribeBlockedBy = onValue(blockedByRef, (snap) => {
        userStore.currentUser.blockedBy = snap.val() || {};
      });
      this.blockListeners.push(() => off(blockedByRef, 'value', unsubscribeBlockedBy));
    },
    async uploadUserPersonalAvatar(file) {
      const storage = getStorage();
      const db = getDatabase();
      const { currentUser } = this;

      try {
        const imageRef = storageRef(storage, `users/${currentUser.userId}/avatars/L1/useravatar.png`);
        const snapshot = await uploadBytes(imageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        await set(ref(db, `users/${currentUser.userId}/personalAvatar/`), downloadURL);
        console.log('User avatar uploaded:', downloadURL);
        this.setCurrentUserPersonalAvatar({ personalAvatar: downloadURL });
      } catch (error) {
        console.error('Error uploading user avatar:', error);
        throw error;
      } finally {
        this.roomUploadLoading = false;
      }
    },
    async toggleFavorite(roomId) {
      const auth = getAuth();
      const db = getDatabase();
      const { currentUser } = auth;
      const userRef = ref(db, `users/${currentUser.uid}`);

      try {
        const mainStore = useMainStore();
        const snapshot = await get(userRef);
        const userData = snapshot.val();
        const currentFavorites = userData?.favoriteRooms || [];

        let newFavorites;
        if (currentFavorites.includes(roomId)) {
          newFavorites = currentFavorites.filter((currentRoomId) => roomId !== currentRoomId);
          mainStore.setSnackbar({
            type: 'success',
            msg: 'Removed from favorites successfully',
          });
        } else {
          mainStore.setSnackbar({
            type: 'success',
            msg: 'Added to favorites successfully',
          });
          newFavorites = [...currentFavorites, roomId];
        }

        await update(userRef, { favoriteRooms: newFavorites });

        // Update local state
        this.currentUser.favoriteRooms = newFavorites;
      } catch (error) {
        console.error('Error updating favorites:', error);
      }
    },
    async toggleBlockUser(targetUserId) {
      const db = getDatabase();
      const mainStore = useMainStore();

      try {
        if (this.currentUser.blocked?.[targetUserId]) {
          // UNBLOCK: remove entries
          await update(ref(db), {
            [`users/${this.currentUser.userId}/blocked/${targetUserId}`]: null,
            [`users/${targetUserId}/blockedBy/${this.currentUser.userId}`]: null,
          });

          mainStore.setSnackbar({
            type: 'success',
            msg: 'User unblocked successfully',
          });
        } else {
          // BLOCK: add entries
          await update(ref(db), {
            [`users/${this.currentUser.userId}/blocked/${targetUserId}`]: true,
            [`users/${targetUserId}/blockedBy/${this.currentUser.userId}`]: true,
          });

          mainStore.setSnackbar({
            type: 'warning',
            msg: 'User has been blocked',
          });
        }
      } catch (error) {
        console.error('❌ Error in toggleBlockUser:', error);
        mainStore.setSnackbar({
          type: 'error',
          msg: 'Something went wrong. Please try again',
        });
      }
    },
    async userSignOut() {
      const auth = getAuth();
      const db = getDatabase();
      const { currentUser } = auth;

      if (currentUser) {
        const userRef = ref(db, `users/${currentUser.uid}`);

        // await update(userRef, { onlineState: false, status: 'offline' });

        if (this.currentUser.unverified) {
          await update(ref(db, `users/${this.currentUser.unverified}`), { [this.currentUser.unverified]: null });
          off(ref(db, `users/${this.currentUser.unverified}`));
          await update(ref(db, `users/${this.usersSwitched.verifiedUser}`), { unverified: null });
          off(ref(db, `users/${this.usersSwitched.verifiedUser}`));
        }

        await update(userRef, {
          unverified: null,
          position: null,
          onlineState: false,
          status: 'offline',
        });
        await signOut(auth);
        router.push({ name: 'rooms' });
        this.setUserSignedOut();
      }
    },

    async getUser() {
      const auth = getAuth();
      const db = getDatabase();

      onAuthStateChanged(auth, async (user) => {
        console.log('🔍 onAuthStateChanged triggered', user);

        if (user) {
          const userRef = ref(db, `users/${user.uid}`);

          if (user.isAnonymous) {
            const uidSnippet = user.uid.substring(0, 4);
            const nickname = `anon_${uidSnippet}`;
            this.initialUser.nickname = nickname;
            await set(userRef, this.initialUser);
          } else {
            // For verified users, update online status and ensure ownedRooms exists
            const userSnapshot = await get(userRef);
            const existingUser = userSnapshot.val();

            const updates = {
              onlineState: true,
              status: 'online',
              isAnonymous: false,
              // personalAvatar: user.providerData[0].photoURL || '',
            };

            // Migration: Add ownedRooms array if it doesn't exist
            if (!existingUser?.ownedRooms) {
              updates.ownedRooms = [];
            }

            await update(userRef, updates);
          }

          onDisconnect(userRef).update({
            onlineState: false,
            status: 'offline',
          });

          onValue(userRef, (snapshot) => {
            const userData = snapshot.val();
            this.setCurrentUser({ data: userData, userId: user.uid });
            this.setupPrivateMessageListener();
            this.initBlockListeners(user.uid);
          });
        } else {
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

      onValue(userSwitched, (snapUnverified) => {
        if (snapUnverified.val()) this.setUserUpgradeSuccess({ userId: snapUnverified.val() });
      });

      onValue(userNickname, (snapNickname) => {
        this.setUserNickname({ nickname: snapNickname.val(), userId });
      });

      return { ...userDataTemp, userId };
    },

    setupPrivateMessageListener() {
      const db = getDatabase();
      const privateMessage = ref(db, `users/${this.currentUser.userId}/privateMessage/requestedBy`);
      onValue(privateMessage, (snapPrivate) => {
        if (snapPrivate.val()) {
          this.privateRequested({ requestedBy: this.userData[snapPrivate.val()], userId: snapPrivate.val() });
        }
      });
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

      try {
        const credentials = await createUserWithEmailAndPassword(auth, this.email, this.password);
        await set(ref(db, `users/${credentials.user.uid}`), {
          nickname,
          avatar,
          age,
          miniAvatar,
          favoriteRooms: [],
          ownedRooms: [],
        });
        const mainStore = useMainStore();
        mainStore.setSnackbar({
          type: 'success',
          msg: `Created user ${nickname} successfully`,
        });

        this.setUser({
          nickname, avatar, age, userId: credentials.user.uid,
        });
      } catch (error) {
        const mainStore = useMainStore();
        mainStore.setSnackbar({
          type: 'error',
          msg: `${error}`,
        });
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
        const miniAvatarRef = storageRef(storage, `rooms/${roomId}/avatars/L1/miniavatars/${avatarName}.png`);
        const miniavatarRefUrl = await getDownloadURL(miniAvatarRef);
        await set(ref(db, `users/${currentUser.userId}/miniAvatar/`), miniavatarRefUrl);

        this.setCurrentUserAvatar({ avatar: url, miniAvatar: miniavatarRefUrl });
      } catch (error) {
        console.error(error);
      }
    },

    upgradeNonCurrentUser({ verifiedUser, unverifiedUser }) {
      this.userUpgraded({ verifiedUser, unverifiedUser, isCurrent: false });
    },

    async loginAnonymously() {
      const auth = getAuth();

      try {
        await signInAnonymously(auth);
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
      // Reset flags after nickname update - this will allow dialog to close properly
      this.signingInUpgraded = false;
      this.showWelcomeForm = false;
    },

    async setFirebaseUiInstance(roomId) {
      const auth = getAuth();
      const anonymousUser = auth.currentUser;

      // Reset the signingInUpgraded state to ensure watchers can detect the change
      console.log('🔄 Resetting signingInUpgraded to false before authentication');
      this.signingInUpgraded = false;

      const ui = window.firebaseui.auth.AuthUI.getInstance()
        || new window.firebaseui.auth.AuthUI(window.firebase.auth());

      const handleUpgrade = async (user) => {
        const db = getDatabase();
        let data = null;

        try {
          // Save anonymous user data (adapted from old working code)
          const snapshot = await get(ref(db, `users/${anonymousUser.uid}`));
          data = snapshot.val();

          if (!data) {
            throw new Error('No anonymous user data found.');
          }

          // Ensure the data being transferred belongs to the anonymous user
          if (data.userId !== anonymousUser.uid) {
            throw new Error('Data does not belong to the anonymous user.');
          }
          console.log('User Data', user);
          // Update the user data with the new user ID
          data.isAnonymous = false;
          data.userId = user.uid;
          data.personalAvatar = user.providerData[0].photoURL || '';

          // Transfer the user data to the new user ID
          if (anonymousUser.uid !== user.uid) {
            data.unverified = anonymousUser.uid;

            // Try to transfer room user data (but don't fail if permissions don't allow it)
            try {
              if (this.currentUser?.rooms?.[roomId]) {
                const { roomUsersKey } = this.currentUser.rooms[roomId];
                await set(ref(db, `rooms/${roomId}/users/${roomUsersKey}/userId`), user.uid);
                await update(ref(db, `rooms/${roomId}/usersUpgraded`), {
                  verifiedUser: user.uid,
                  unverifiedUser: anonymousUser.uid,
                });
              }
            } catch (roomError) {
              // Continue with the upgrade even if room transfer fails
            }

            // Set the new user data first (most important step)
            await set(ref(db, `users/${user.uid}`), data);

            // Only cleanup the database data, NOT the user account
            // (Firebase should handle the account upgrade automatically)
            try {
              await set(ref(db, `users/${anonymousUser.uid}`), null);
            } catch (cleanupError) {
              // Continue even if cleanup fails
            }
          } else {
            // Same UID, just update the data
            await set(ref(db, `users/${user.uid}`), data);
          }
        } catch (error) {
          console.error('Error during user upgrade:', error);
          throw error;
        }
      };

      try {
        const uiConfig = {
          callbacks: {
            signInSuccessWithAuthResult: (authResult) => {
              console.log('🚀 signInSuccessWithAuthResult called:', { authResult, anonymousUser });
              const { user } = authResult;
              // Call handleUpgrade without awaiting to ensure we return false immediately
              handleUpgrade(user).then(() => {
                console.log('🎯 handleUpgrade completed, calling userUpgraded');
                if (authResult && !authResult.user.isAnonymous) {
                  this.userUpgraded({
                    verifiedUser: authResult.user.uid,
                    unverifiedUser: anonymousUser.uid,
                    isCurrent: true,
                  });
                }
              }).catch((error) => {
                console.error('Error during user upgrade:', error);
              });

              return false; // prevent redirect
            },
            uiShown() {
              const loader = document.getElementById('loader');
              if (loader) loader.style.display = 'none';
            },
            signInFailure: async (error) => {
              console.log('⚠️ signInFailure called:', error);
              if (
                error.code !== 'firebaseui/anonymous-upgrade-merge-conflict'
              ) {
                return Promise.resolve();
              }

              console.log('🔄 Handling anonymous upgrade merge conflict');
              const cred = error.credential;
              try {
                const userCredential = await signInWithCredential(auth, cred);
                const { user } = userCredential;

                // Call handleUpgrade with the user
                await handleUpgrade(user);
                console.log('🎯 Calling userUpgraded from signInFailure');
                this.userUpgraded({
                  verifiedUser: user.uid,
                  unverifiedUser: anonymousUser.uid,
                  isCurrent: true,
                });

                return Promise.resolve();
              } catch (err) {
                console.error('Error in signInFailure:', err);
                return Promise.reject(err);
              }
            },
          },
          signInFlow: 'popup',
          signInOptions: [
            window.firebase.auth.GoogleAuthProvider.PROVIDER_ID,
            {
              provider: window.firebase.auth.EmailAuthProvider.PROVIDER_ID,
              requireDisplayName: false,
              signInMethod: 'password',
            },
          ],
          credentialHelper: window.firebaseui.auth.CredentialHelper.GOOGLE_YOLO,
          autoUpgradeAnonymousUsers: true,
          tosUrl: '<your-tos-url>',
          privacyPolicyUrl: '<your-privacy-policy-url>',
        };

        ui.start('#firebaseui-auth-container', uiConfig);
      } catch (error) {
        console.error('Error starting Firebase UI:', error);
      }
    },

    // Mutations converted to actions
    setEmail(data) {
      this.email = data;
    },

    setPassword(data) {
      this.password = data;
    },

    setCurrentUser(payload) {
      Object.assign(this.currentUser, { ...payload.data, userId: payload.userId });
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
      // Also update the userData to ensure consistency
      if (this.userData[userId]) {
        this.userData[userId].avatar = url;
      }
    },

    userUpgraded({ verifiedUser, unverifiedUser, isCurrent }) {
      console.log('🔄 userUpgraded called:', { verifiedUser, unverifiedUser, isCurrent });

      if (isCurrent) {
        this.currentUser.isAnonymous = false;
        this.currentUser.userId = verifiedUser;
      }

      if (verifiedUser !== unverifiedUser && isCurrent) {
        this.currentUser.unverified = unverifiedUser;
      }

      // Check if unverifiedUser data exists before copying
      if (this.userData[unverifiedUser]) {
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
      }

      this.usersSwitched = { verifiedUser, unverifiedUser };
      // Handle different upgrade types
      if (isCurrent) {
        this.signingInUpgraded = true;
        // Add small delay to ensure everything is ready before showing welcome form
        setTimeout(() => {
          this.showWelcomeForm = true;
        }, 100);
      } else {
        this.otherUserUpgraded = { verifiedUser, unverifiedUser, timestamp: Date.now() };
      }
    },

    setUserNickname({ nickname, userId }) {
      if (this.currentUser.userId === userId) this.currentUser.nickname = nickname;
      this.userData[userId].nickname = nickname;
    },

    setUserSignedOut() {
      this.signingInUpgraded = false;
      this.isUserUpgraded = false;
      this.currentUser.unverified = null;
      this.usersSwitched = null;
      this.otherUserUpgraded = null;
      this.showWelcomeForm = false;
      this.avatarUpdated = {};
      this.currentUser.rooms = {};
      this.currentUser.position = {};
    },

    setUserMiniAvatarSuccess({ userId, miniAvatarUrl }) {
      if (this.userData[userId]) {
        this.userData[userId].miniAvatar = miniAvatarUrl;
      }
      // Also update current user if applicable
      if (this.currentUser.userId === userId) {
        this.currentUser.miniAvatar = miniAvatarUrl;
      }
    },

    setCurrentUserAvatar({ avatar, miniAvatar }) {
      this.currentUser.miniAvatar = miniAvatar;
      this.currentUser.avatar = avatar;
      // Also update userData to ensure consistency
      if (this.userData[this.currentUser.userId]) {
        this.userData[this.currentUser.userId].avatar = avatar;
        this.userData[this.currentUser.userId].miniAvatar = miniAvatar;
      }
    },
    setCurrentUserPersonalAvatar({ personalAvatar }) {
      this.currentUser.personalAvatar = personalAvatar;
      // Also update userData to ensure consistency
      if (this.userData[this.currentUser.userId]) {
        this.userData[this.currentUser.userId].personalAvatar = personalAvatar;
      }
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
