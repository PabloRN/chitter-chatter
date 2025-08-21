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
  linkWithCredential,
  // GoogleAuthProvider,
  // EmailAuthProvider,
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

      onAuthStateChanged(auth, async (user) => {
        console.log('🔍 onAuthStateChanged triggered:', {
          user,
          uid: user?.uid,
          isAnonymous: user?.isAnonymous,
          email: user?.email,
          displayName: user?.displayName,
          photoURL: user?.photoURL,
        });

        if (user) {
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
            // For verified users, just update online status
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
            const userData = snapshot.val();
            this.setCurrentUser({ data: userData, userId: user.uid });
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
        const miniAvatarRef = storageRef(storage, `rooms/${roomId}/avatars/L1/miniavatars/${avatarName}_head.png`);
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
    },

    async setFirebaseUiInstance(roomId) {
      const auth = getAuth();
      const anonymousUser = auth.currentUser;

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

          // Update the user data with the new user ID
          data.isAnonymous = false;
          data.userId = user.uid;

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
              console.warn('⚠️ Room data transfer failed (continuing anyway):', roomError.message);
              // Continue with the upgrade even if room transfer fails
            }

            // Set the new user data first (most important step)
            await set(ref(db, `users/${user.uid}`), data);

            // Only cleanup the database data, NOT the user account
            // (Firebase should handle the account upgrade automatically)
            try {
              await set(ref(db, `users/${anonymousUser.uid}`), null);
            } catch (cleanupError) {
              console.warn('⚠️ Anonymous database cleanup failed (continuing anyway):', cleanupError.message);
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
              const { user } = authResult;
              console.log('✅ Successfully upgraded anonymous user:', user);
              // Call handleUpgrade without awaiting to ensure we return false immediately
              handleUpgrade(user).then(() => {
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
              console.error('Error during sign-in failure handling:', error);
              if (
                error.code !== 'firebaseui/anonymous-upgrade-merge-conflict'
              ) {
                return Promise.resolve();
              }

              const cred = error.credential;
              try {
                const userCredential = await signInWithCredential(auth, cred);
                const { user } = userCredential;

                // Call handleUpgrade with the user
                await handleUpgrade(user);
                this.userUpgraded({
                  verifiedUser: user.uid,
                  unverifiedUser: anonymousUser.uid,
                  isCurrent: true,
                });

                return Promise.resolve();
              } catch (err) {
                console.error('Error during sign-in failure handling:', err);
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

    async handleUserUpgrade(user, anonymousUser, roomId) {
      const db = getDatabase();
      let data = null;

      try {
        // load anonymous data
        const snapshot = await get(ref(db, `users/${anonymousUser.uid}`));
        data = snapshot.val();

        if (!data) {
          console.warn('No anonymous user data found, creating basic profile');
          data = {
            nickname: `user_${user.uid.substring(0, 4)}`,
            avatar: '',
            age: 0,
            miniAvatar: '',
            level: 'L1',
            onlineState: true,
            status: 'online',
          };
        }

        // Preserve all anonymous user data and update for verified user
        const upgradeData = {
          ...data,
          isAnonymous: false,
          userId: user.uid,
          email: user.email || '',
          displayName: user.displayName || data.nickname,
          onlineState: true,
          status: 'online',
        };

        if (anonymousUser.uid !== user.uid) {
          upgradeData.unverified = anonymousUser.uid;

          // Save upgraded user data BEFORE deleting anonymous data
          await set(ref(db, `users/${user.uid}`), upgradeData);

          // transfer room data if exists
          if (this.currentUser?.rooms?.[roomId]) {
            const { roomUsersKey } = this.currentUser.rooms[roomId];

            await set(
              ref(db, `rooms/${roomId}/users/${roomUsersKey}/userId`),
              user.uid,
            );

            await update(
              ref(db, `rooms/${roomId}/usersUpgraded`),
              { verifiedUser: user.uid, unverifiedUser: anonymousUser.uid },
            );
          }

          // delete anon data AFTER copying
          await set(ref(db, `users/${anonymousUser.uid}`), null);

          // delete anon account
          try {
            await anonymousUser.delete();
          } catch (deleteError) {
            console.warn('Could not delete anonymous account:', deleteError);
          }
        } else {
          // Same user, just update the existing data
          await set(ref(db, `users/${user.uid}`), upgradeData);
        }

        data = upgradeData;
      } catch (error) {
        console.error('Error during user upgrade:', error);
        throw error;
      }

      return data;
    },

    async handlePotentialRedirectUpgrade(verifiedUser) {
      const db = getDatabase();

      // Try to find anonymous user data that might need upgrading
      // This is a simplified approach - in a real app you might store this info differently
      try {
        const redirectResult = await window.firebase.auth().getRedirectResult();
        if (redirectResult.user && redirectResult.additionalUserInfo?.isNewUser === false) {
          console.log('🔄 User has existing data, processing upgrade...');

          // Check for any anonymous users that might belong to this session
          // For now, create a basic profile if none exists
          const userRef = ref(db, `users/${verifiedUser.uid}`);
          const existingData = await get(userRef);

          if (!existingData.val()) {
            // Create verified user profile
            const verifiedProfile = {
              nickname: verifiedUser.displayName || `user_${verifiedUser.uid.substring(0, 4)}`,
              avatar: verifiedUser.photoURL || '',
              age: 0,
              miniAvatar: '',
              level: 'L1',
              userId: verifiedUser.uid,
              email: verifiedUser.email || '',
              displayName: verifiedUser.displayName || '',
              onlineState: true,
              status: 'online',
              isAnonymous: false,
            };

            await set(userRef, verifiedProfile);

            // Trigger the upgrade flow
            this.setCurrentUser({
              data: verifiedProfile,
              userId: verifiedUser.uid,
            });

            this.userUpgraded({
              verifiedUser: verifiedUser.uid,
              unverifiedUser: null, // No anonymous user to transfer from
              isCurrent: true,
            });

            console.log('✅ Created new verified user profile');
          }
        }
      } catch (error) {
        console.log('❌ Error in handlePotentialRedirectUpgrade:', error);
      }
    },

    async handleManualUpgrade(anonymousUser, upgradeInfo) {
      const auth = getAuth();
      const db = getDatabase();

      console.log('🔗 Starting manual anonymous user upgrade');

      try {
        // Get the anonymous user data before linking
        const anonymousUserRef = ref(db, `users/${anonymousUser.uid}`);
        const anonymousDataSnapshot = await get(anonymousUserRef);
        const anonymousData = anonymousDataSnapshot.val();

        console.log('📦 Anonymous user data to preserve:', anonymousData);

        // Link the anonymous account with the Google credential
        const linkedUser = await linkWithCredential(anonymousUser, upgradeInfo.credential);

        console.log('✅ Successfully linked anonymous user with Google:', linkedUser.user);

        // Update the user data with verified information
        const upgradeData = {
          ...anonymousData,
          isAnonymous: false,
          userId: linkedUser.user.uid,
          email: linkedUser.user.email || '',
          displayName: linkedUser.user.displayName || anonymousData.nickname,
          photoURL: linkedUser.user.photoURL || '',
          onlineState: true,
          status: 'online',
        };

        // Update the database
        await set(anonymousUserRef, upgradeData);

        // Update the store state
        this.setCurrentUser({
          data: upgradeData,
          userId: linkedUser.user.uid,
        });

        // Trigger the upgrade notification
        this.userUpgraded({
          verifiedUser: linkedUser.user.uid,
          unverifiedUser: anonymousUser.uid, // Same UID since we linked
          isCurrent: true,
        });

        console.log('🎉 Manual upgrade completed successfully');
      } catch (error) {
        console.error('❌ Error during manual upgrade:', error);

        // If linking fails, we might need to handle account exists error
        if (error.code === 'auth/credential-already-in-use') {
          console.log('🔄 Account exists, trying to sign in and merge data');

          try {
            // Get the existing user data first
            const anonymousUserRef = ref(db, `users/${anonymousUser.uid}`);
            const anonymousDataSnapshot = await get(anonymousUserRef);
            const anonymousData = anonymousDataSnapshot.val();

            // Sign in with the credential
            const existingUser = await signInWithCredential(auth, error.credential);

            // Merge the anonymous data into the existing account
            const existingUserRef = ref(db, `users/${existingUser.user.uid}`);
            const existingDataSnapshot = await get(existingUserRef);
            const existingData = existingDataSnapshot.val() || {};

            const mergedData = {
              ...existingData,
              ...anonymousData, // Anonymous data takes precedence for avatar, etc.
              isAnonymous: false,
              userId: existingUser.user.uid,
              email: existingUser.user.email || '',
              displayName: existingUser.user.displayName || anonymousData.nickname,
              photoURL: existingUser.user.photoURL || '',
              onlineState: true,
              status: 'online',
            };

            await set(existingUserRef, mergedData);

            // Delete the anonymous user data
            await set(anonymousUserRef, null);

            // Update store state
            this.setCurrentUser({
              data: mergedData,
              userId: existingUser.user.uid,
            });

            this.userUpgraded({
              verifiedUser: existingUser.user.uid,
              unverifiedUser: anonymousUser.uid,
              isCurrent: true,
            });

            console.log('🎉 Account merge completed successfully');
          } catch (mergeError) {
            console.error('❌ Error during account merge:', mergeError);
          }
        }
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
