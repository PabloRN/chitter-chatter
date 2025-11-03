import { defineStore } from 'pinia';
// import * as firebaseui from 'firebaseui';
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  // deleteUser,
  // createUserWithEmailAndPassword,
  // signInWithEmailAndPassword,
  // signOut,
  signInWithCredential,
  // GoogleAuthProvider,
  // EmailAuthProvider,
} from 'firebase/auth';
import {
  getDatabase, ref, set, update, onValue, off, get, onDisconnect, serverTimestamp,
} from 'firebase/database';
// import {
//   getStorage, ref as storageRef, getDownloadURL, uploadBytes,
// } from 'firebase/storage';
import router from '@/router/index';
// Note: extractImageName moved to avatarService
import authService from '@/services/authService';
import tabCommunicationService from '@/services/tabCommunicationService';
import avatarService from '@/services/avatarService';
import profileService from '@/services/profileService';
import analyticsService from '@/services/analyticsService';
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
    authListener: null, // For cross-tab communication cleanup
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
      createdAt: null, // Timestamp of user creation (for cleanup purposes)
      lastOnlineAt: null, // Timestamp when user came online (session start)
      lastOnline: null, // Timestamp when user went offline (for cleanup)
      currentSessionStart: null, // Current session start timestamp
      totalOnlineTime: 0, // Total seconds online (for awards/gamification)
      favoriteRooms: [],
      ownedRooms: [],
      blocked: {},
      blockedBy: {},
      isActive: true,
      isCreator: false,
      subscriptionTier: 'free',
      purchasedRoomSlots: 0, // Number of extra room slots purchased
      roomSlotPurchases: {}, // History of room slot purchases
      subscription: {
        tier: 'free',
        status: 'active',
        stripeCustomerId: null,
        stripePriceId: null,
        stripeSubscriptionId: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      },
      privacySettings: {
        showAvatar: true,
        showNickname: true,
        showLevel: true,
        showAge: false,
        showHobbies: true,
        showDescription: true,
      },
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
    subscriptionTier: (state) => state.currentUser?.subscriptionTier || 'free',
    subscriptionStatus: (state) => state.currentUser?.subscription || {
      tier: 'free',
      status: 'active',
      stripeCustomerId: null,
      stripePriceId: null,
      stripeSubscriptionId: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    },
    isPremiumUser: (state) => {
      const tier = state.currentUser?.subscriptionTier || 'free';
      return tier === 'landlord' || tier === 'creator';
    },
    isCreatorUser: (state) => state.currentUser?.subscriptionTier === 'creator',
  },

  actions: {
    initAuthUpgradeChannel() {
      // Initialize cross-tab communication for auth upgrades using tabCommunicationService
      this.authListener = tabCommunicationService.addAuthListener((message) => {
        this.handleCrossTabMessage(message);
      });
    },

    handleCrossTabMessage(message) {
      switch (message.type) {
        case 'AUTH_SUCCESS':
          if (message.isUpgrade) {
            console.log('🔄 Received upgrade notification from other tab:', message);
            // Trigger user upgrade for this tab
            this.userUpgraded({
              verifiedUser: message.verifiedUser,
              unverifiedUser: message.unverifiedUser,
              isCurrent: true,
            });
          }
          break;
        case 'FOCUS_REQUEST':
          console.log('🏠 Received focus request from auth tab');
          // This is the original tab - gain focus and stay here
          try {
            window.focus();
            // Optionally navigate to a specific route if needed
            if (message.returnPath && window.location.pathname !== message.returnPath) {
              this.$router?.push(message.returnPath);
            }
            console.log('✅ Original tab focused successfully');
          } catch (e) {
            console.log('Could not focus original tab:', e);
          }
          break;
        default:
          // Handle other message types as needed
          break;
      }
    },

    cleanupAuthUpgradeChannel() {
      // Cleanup handled by tabCommunicationService
      if (this.authListener) {
        tabCommunicationService.removeAuthListener(this.authListener);
        this.authListener = null;
      }
    },

    cleanupExpiredEmailData() {
      // Email is now stored simply in localStorage without expiration
      // No cleanup needed since localStorage persists until manually cleared
    },

    initBlockListeners(userId) {
      const db = getDatabase();

      // Clean up old listeners (in case user switches account)
      this.blockListeners.forEach((unsubscribe) => unsubscribe());
      this.blockListeners = [];

      // 🔔 Listen to "blocked" (who I blocked)
      const blockedRef = ref(db, `users/${userId}/blocked`);
      const unsubscribeBlocked = onValue(blockedRef, (snap) => {
        this.currentUser.blocked = snap.val() || {};
      });
      this.blockListeners.push(() => off(blockedRef, 'value', unsubscribeBlocked));

      // 🔔 Listen to "blockedBy" (who blocked me)
      const blockedByRef = ref(db, `users/${userId}/blockedBy`);
      const unsubscribeBlockedBy = onValue(blockedByRef, (snap) => {
        this.currentUser.blockedBy = snap.val() || {};
      });
      this.blockListeners.push(() => off(blockedByRef, 'value', unsubscribeBlockedBy));
    },
    async uploadUserPersonalAvatar(file) {
      try {
        const downloadURL = await avatarService.uploadPersonalAvatar(this.currentUser.userId, file);
        this.setCurrentUserPersonalAvatar({ personalAvatar: downloadURL });
      } catch (error) {
        console.error('Error uploading user avatar:', error);
        throw error;
      } finally {
        this.roomUploadLoading = false;
      }
    },
    async updateUserHobbies(hobbies) {
      const db = getDatabase();
      await update(
        ref(db, `users/${this.currentUser.userId}`),
        { hobbies },
      );
    },
    async updateUserDescription(description) {
      const db = getDatabase();
      await update(
        ref(db, `users/${this.currentUser.userId}`),
        { description },
      );
    },
    async updatePrivacySettings(privacySettings) {
      const db = getDatabase();
      await update(
        ref(db, `users/${this.currentUser.userId}`),
        { privacySettings },
      );
      // Update local state
      this.currentUser.privacySettings = privacySettings;
      if (this.userData[this.currentUser.userId]) {
        this.userData[this.currentUser.userId].privacySettings = privacySettings;
      }
    },
    async toggleFavorite(roomId) {
      try {
        const mainStore = useMainStore();
        const result = await profileService.toggleFavorite(this.currentUser.userId, roomId);

        // Show success message
        if (result.wasRemoved) {
          mainStore.setSnackbar({
            type: 'success',
            msg: 'Removed from favorites successfully',
          });
        } else {
          mainStore.setSnackbar({
            type: 'success',
            msg: 'Added to favorites successfully',
          });
        }

        // Update local state
        this.currentUser.favoriteRooms = result.favoriteRooms;
      } catch (error) {
        console.error('Error updating favorites:', error);
        throw error;
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
      const { currentUser: authCurrentUser } = auth;

      if (authCurrentUser) {
        const userRef = ref(db, `users/${authCurrentUser.uid}`);

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
        await authService.signOut();
        router.push({ name: 'rooms' });
        this.setUserSignedOut();
      }
    },

    async getUser() {
      const auth = getAuth();
      const db = getDatabase();
      const { currentUser: authCurrentUser } = auth;

      // Initialize cross-tab communication
      this.initAuthUpgradeChannel();

      // Clean expired email data periodically
      this.cleanupExpiredEmailData();

      onAuthStateChanged(auth, async (user) => {
        if (user) {
          const userRef = ref(db, `users/${user.uid}`);
          if (user.isAnonymous) {
            // 🟢 Always seed anon with fresh data
            const uidSnippet = user.uid.substring(0, 4);
            const nickname = `anon_${uidSnippet}`;

            // Exclude subscription-related fields for anonymous users
            const {
              subscriptionTier,
              subscription,
              purchasedRoomSlots,
              roomSlotPurchases,
              isCreator,
              ...baseUserFields
            } = this.initialUser;

            const anonUser = {
              ...baseUserFields,
              nickname,
              userId: user.uid,
              isAnonymous: true,
              createdAt: serverTimestamp(), // For cleanup purposes
            };

            await set(userRef, anonUser);

            onDisconnect(userRef).update({
              onlineState: false,
              status: 'offline',
              lastOnline: serverTimestamp(),
            });
          } else {
            // 🧹 Step 1: clean up the old anon
            if (this.currentUser?.isAnonymous) {
              const oldAnonRef = ref(db, `users/${this.currentUser.userId}`);
              await onDisconnect(oldAnonRef).cancel();
              await set(oldAnonRef, null);
              // await deleteUser(authCurrentUser);
              console.log('authCurrentUser', authCurrentUser);
            }

            // Step 2: check if real user already exists
            const userSnapshot = await get(userRef);

            if (!userSnapshot.exists()) {
              // 🆕 First-time real user → seed from initialUser
              const newUser = {
                ...this.initialUser,
                userId: user.uid,
                isAnonymous: false,
                status: 'online',
                onlineState: true,
                lastOnlineAt: serverTimestamp(),
                currentSessionStart: serverTimestamp(),
              };
              await set(userRef, newUser);
              console.log('✅ Created new authenticated user in database');
            } else {
              // 🔄 Existing real user → just update presence/status
              const updates = {
                onlineState: true,
                status: 'online',
                isAnonymous: false,
                lastOnlineAt: serverTimestamp(),
                currentSessionStart: serverTimestamp(),
              };

              const existingUser = userSnapshot.val();
              if (!existingUser?.ownedRooms) {
                updates.ownedRooms = [];
              }

              await update(userRef, updates);
              console.log('✅ Updated existing authenticated user in database');

              // 🔍 FORCE DB CHECK: Verify isAnonymous was actually updated
              // This fixes race condition where DB might still show isAnonymous: true
              const verifySnapshot = await get(userRef);
              const verifiedData = verifySnapshot.val();

              if (verifiedData?.isAnonymous === true) {
                console.warn('⚠️ RACE CONDITION DETECTED: DB still shows isAnonymous=true, forcing update...');
                await update(userRef, { isAnonymous: false });
                console.log('✅ Force updated isAnonymous to false');
              } else {
                console.log('✅ Verified: isAnonymous correctly set to', verifiedData?.isAnonymous);
              }
            }

            // Step 3: attach disconnect for real user
            onDisconnect(userRef).update({
              onlineState: false,
              status: 'offline',
              lastOnline: serverTimestamp(),
            });
          }

          // Always sync state to your app
          onValue(userRef, (snapshot) => {
            const userData = snapshot.val();
            this.setCurrentUser({ data: userData, userId: user.uid });
            this.setupPrivateMessageListener();
            this.initBlockListeners(user.uid);
          });
        } else {
          // Signed out → login anonymously again
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
      try {
        const credentials = await authService.createUserWithEmailAndPassword(this.email, this.password, {
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
        const credentials = await authService.signInWithEmailAndPassword(auth, this.email, this.password);

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
      try {
        const { currentUser } = this;
        const { roomId } = router.currentRoute.value.params;

        const avatarData = await avatarService.changeAvatar(currentUser.userId, url, roomId);
        this.setCurrentUserAvatar(avatarData);
      } catch (error) {
        console.error('Error changing avatar:', error);
        throw error;
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
      try {
        await profileService.updateNickname(this.currentUser.userId, nickName);

        // Update local state
        this.currentUser.nickname = nickName;
        if (this.userData[this.currentUser.userId]) {
          this.userData[this.currentUser.userId].nickname = nickName;
        }

        // Reset flags after nickname update - this will allow dialog to close properly
        this.signingInUpgraded = false;
        this.showWelcomeForm = false;
      } catch (error) {
        console.error('Error updating nickname:', error);
        throw error;
      }
    },
    async updateUserAge(age) {
      try {
        await profileService.updateAge(this.currentUser.userId, age);

        // Update local state
        this.currentUser.age = age;
        if (this.userData[this.currentUser.userId]) {
          this.userData[this.currentUser.userId].age = age;
        }

        // Reset flags after age update - this will allow dialog to close properly
        this.signingInUpgraded = false;
        this.showWelcomeForm = false;
      } catch (error) {
        console.error('Error updating age:', error);
        throw error;
      }
    },

    async handleAnonymousUserUpgrade(anonymousUser, loggedUser, roomId) {
      const db = getDatabase();

      try {
        // Get anonymous user data
        const anonymousSnapshot = await get(ref(db, `users/${anonymousUser.uid}`));
        const anonymousData = anonymousSnapshot.val();

        if (!anonymousData) {
          throw new Error('No anonymous user data found.');
        }

        // Ensure the data being transferred belongs to the anonymous user
        if (anonymousData.userId !== anonymousUser.uid) {
          throw new Error('Data does not belong to the anonymous user.');
        }

        // Check if the logged user already exists in the database
        const loggedUserSnapshot = await get(ref(db, `users/${loggedUser.uid}`));
        const existingUserData = loggedUserSnapshot.val();

        console.log('🔄 Upgrading anonymous user:', anonymousUser.uid, 'to user:', loggedUser.uid);
        console.log('📊 Existing user data found:', !!existingUserData);

        if (existingUserData) {
          // User already exists - preserve ALL existing data, only update specific fields
          const updatesToExistingUser = {
            onlineState: true,
            status: 'online',
            isAnonymous: false,
            unverified: anonymousUser.uid,
          };

          // Preserve position from anonymous user (for room context)
          if (anonymousData.position) {
            updatesToExistingUser.position = anonymousData.position;
          }

          // Preserve rooms data from anonymous user (current room participation)
          if (anonymousData.rooms) {
            updatesToExistingUser.rooms = anonymousData.rooms;
          }

          // Add personal avatar from provider if not already set
          if (!existingUserData.personalAvatar && loggedUser.providerData[0]?.photoURL) {
            updatesToExistingUser.personalAvatar = loggedUser.providerData[0].photoURL;
          }

          // Update existing user with minimal changes
          await update(ref(db, `users/${loggedUser.uid}`), updatesToExistingUser);
        } else {
          // New user - transfer all anonymous data (existing behavior)
          const newUserData = {
            ...anonymousData,
            isAnonymous: false,
            userId: loggedUser.uid,
            personalAvatar: loggedUser.providerData[0]?.photoURL || '',
            unverified: anonymousUser.uid,
          };

          await set(ref(db, `users/${loggedUser.uid}`), newUserData);
        }

        // Handle room user transfer (if user was in a room)
        try {
          if (this.currentUser?.rooms?.[roomId]) {
            const { roomUsersKey } = this.currentUser.rooms[roomId];
            await set(ref(db, `rooms/${roomId}/users/${roomUsersKey}/userId`), loggedUser.uid);
            await update(ref(db, `rooms/${roomId}/usersUpgraded`), {
              verifiedUser: loggedUser.uid,
              unverifiedUser: anonymousUser.uid,
            });
          }
        } catch (roomError) {
          console.warn('Room transfer failed, but continuing with upgrade:', roomError);
        }

        // Cleanup anonymous user data from database
        try {
          // IMPORTANT: Cancel onDisconnect handler BEFORE deleting user
          // This prevents creating ghost users when disconnect fires after deletion
          const anonymousUserRef = ref(db, `users/${anonymousUser.uid}`);
          await onDisconnect(anonymousUserRef).cancel();
          console.log('✅ Cancelled onDisconnect handler for anonymous user');

          await set(anonymousUserRef, null);
          console.log('✅ Deleted anonymous user from database');
        } catch (cleanupError) {
          console.warn('Anonymous user database cleanup failed, but upgrade completed:', cleanupError);
        }

        console.log('✅ Anonymous user upgrade completed successfully');

        // 🔄 FORCE REFRESH: Re-read user data to ensure UI updates immediately
        // This prevents race conditions where onValue listener might fire before upgrade completes
        try {
          const refreshSnapshot = await get(ref(db, `users/${loggedUser.uid}`));
          const refreshedData = refreshSnapshot.val();

          if (refreshedData) {
            console.log('🔄 Force refreshing user data from database...');
            console.log('   - isAnonymous:', refreshedData.isAnonymous);
            console.log('   - userId:', refreshedData.userId);

            // Force update store with refreshed data
            this.setCurrentUser({ data: refreshedData, userId: loggedUser.uid });
            console.log('✅ Store updated with refreshed user data');
          } else {
            console.warn('⚠️ Could not refresh user data - user not found in database');
          }
        } catch (refreshError) {
          console.warn('⚠️ Error refreshing user data:', refreshError);
          // Non-fatal error - upgrade still succeeded
        }
      } catch (error) {
        console.error('❌ Error during anonymous user upgrade:', error);
        throw error;
      }
    },

    async setFirebaseUiInstance(roomId) {
      console.log('🚀 [INIT] setFirebaseUiInstance called with roomId:', roomId);

      const auth = getAuth();
      const anonymousUser = auth.currentUser;

      console.log('👤 [INIT] Current anonymous user:', anonymousUser?.uid);
      console.log('🔒 [INIT] Is anonymous:', anonymousUser?.isAnonymous);

      // Reset the signingInUpgraded state to ensure watchers can detect the change
      this.signingInUpgraded = false;

      const ui = window.firebaseui.auth.AuthUI.getInstance()
        || new window.firebaseui.auth.AuthUI(window.firebase.auth());

      console.log('🎨 [INIT] FirebaseUI instance created/retrieved');

      // Store anonymous user ID for potential cross-tab communication
      if (anonymousUser?.uid) {
        window.localStorage.setItem('anonymousUserForUpgrade', anonymousUser.uid);
        console.log('💾 [INIT] Stored anonymous user ID for upgrade:', anonymousUser.uid);
      }

      // Store original tab context for return navigation
      const originalTabContext = {
        url: window.location.href,
        origin: window.location.origin,
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
        timestamp: Date.now(),
        tabId: `tab_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      };

      window.localStorage.setItem('authOriginalTabContext', JSON.stringify(originalTabContext));
      window.sessionStorage.setItem('authOriginalTabContext', JSON.stringify(originalTabContext));
      console.log('🏠 Stored original tab context:', originalTabContext);

      // Override sendSignInLinkToEmail on the Firebase Auth prototype
      // This ensures ALL instances will use our override
      const firebaseAuthPrototype = Object.getPrototypeOf(window.firebase.auth());
      if (!firebaseAuthPrototype._originalSendSignInLinkToEmail) {
        console.log('🔧 Installing sendSignInLinkToEmail prototype override...');

        // Store original method
        firebaseAuthPrototype._originalSendSignInLinkToEmail = firebaseAuthPrototype.sendSignInLinkToEmail;

        // Override the method
        firebaseAuthPrototype.sendSignInLinkToEmail = function (email, actionCodeSettings) {
          console.log('🔐 [PROTOTYPE OVERRIDE] sendSignInLinkToEmail called with email:', email);

          try {
            // Store email in localStorage for cross-tab access
            window.localStorage.setItem('emailForSignIn', email);
            console.log('✅ [PROTOTYPE OVERRIDE] Email stored in localStorage:', window.localStorage.getItem('emailForSignIn'));
          } catch (error) {
            console.error('❌ [PROTOTYPE OVERRIDE] Error storing email in localStorage:', error);
          }

          // Call the original method
          console.log('📤 [PROTOTYPE OVERRIDE] Calling original sendSignInLinkToEmail');
          return firebaseAuthPrototype._originalSendSignInLinkToEmail.call(this, email, actionCodeSettings);
        };

        console.log('✅ sendSignInLinkToEmail prototype override installed');
      } else {
        console.log('ℹ️ sendSignInLinkToEmail prototype override already installed');
      }

      const uiConfig = {
        callbacks: {
          signInSuccessWithAuthResult: async (authResult) => {
            const { user } = authResult;

            // Only upgrade if the previous user was anonymous
            if (anonymousUser && anonymousUser.isAnonymous && user.uid !== anonymousUser.uid) {
              try {
                console.log('🔄 Starting anonymous user upgrade in FirebaseUI callback...');

                // Wait for upgrade to complete (replaced setTimeout with await)
                await this.handleAnonymousUserUpgrade(anonymousUser, user, roomId);

                if (authResult && !authResult.user.isAnonymous) {
                  this.userUpgraded({
                    verifiedUser: authResult.user.uid,
                    unverifiedUser: anonymousUser.uid,
                    isCurrent: true,
                  });
                }

                console.log('✅ FirebaseUI callback: Upgrade completed successfully');
              } catch (error) {
                console.error('❌ Error during anonymous user upgrade in FirebaseUI callback:', error);
              }
            }

            return false; // prevent redirect - popup will close immediately
          },
          uiShown() {
            console.log('👁️ [CALLBACK] FirebaseUI shown');
            console.log('📦 [CALLBACK] Current localStorage emailForSignIn:', window.localStorage.getItem('emailForSignIn'));

            const loader = document.getElementById('loader');
            if (loader) {
              loader.style.display = 'none';
              console.log('🔄 [CALLBACK] Loader hidden');
            }
          },
          signInFailure: async (error) => {
            console.log('❌ [CALLBACK] signInFailure called');
            console.log('🔍 [CALLBACK] Error code:', error.code);
            console.log('🔍 [CALLBACK] Error message:', error.message);

            if (error.code !== 'firebaseui/anonymous-upgrade-merge-conflict') {
              return Promise.resolve();
            }

            console.log('🔄 [CALLBACK] Handling anonymous upgrade merge conflict...');

            const cred = error.credential;
            try {
              const userCredential = await signInWithCredential(auth, cred);
              const { user } = userCredential;

              console.log('✅ [CALLBACK] Successfully signed in with credential:', user.uid);

              // Call handleAnonymousUserUpgrade with the user
              await this.handleAnonymousUserUpgrade(anonymousUser, user, roomId);

              this.userUpgraded({
                verifiedUser: user.uid,
                unverifiedUser: anonymousUser.uid,
                isCurrent: true,
              });

              console.log('✅ [CALLBACK] Merge conflict resolved successfully');

              return Promise.resolve();
            } catch (err) {
              console.error('❌ [CALLBACK] Error in signInFailure:', err);
              return Promise.reject(err);
            }
          },
        },
        signInFlow: 'popup',
        signInOptions: [
          {
            provider: window.firebase.auth.EmailAuthProvider.PROVIDER_ID,
            signInMethod: window.firebase.auth.EmailAuthProvider.EMAIL_LINK_SIGN_IN_METHOD,
            forceSameDevice: true,
          },
          window.firebase.auth.GoogleAuthProvider.PROVIDER_ID,
          {
            provider: 'yahoo.com',
            scopes: ['mail-r', 'sdps-r'],
            customParameters: {
              prompt: 'login',
            },
          },
          {
            provider: window.firebase.auth.FacebookAuthProvider.PROVIDER_ID,
            scopes: ['email', 'public_profile'],
          },

        ],
        credentialHelper: window.firebaseui.auth.CredentialHelper.GOOGLE_YOLO,
        autoUpgradeAnonymousUsers: true,
        tosUrl: 'https://toonstalk.com/terms',
        privacyPolicyUrl: 'https://toonstalk.com/privacy',
      };

      console.log('🎬 [INIT] Starting FirebaseUI with config...');
      ui.start('#firebaseui-auth-container', uiConfig);
      console.log('✅ [INIT] FirebaseUI started successfully');

      // FALLBACK: Capture email from FirebaseUI DOM as backup
      // This ensures we catch the email even if the override doesn't work
      setTimeout(() => {
        console.log('🔍 Setting up DOM-based email capture fallback...');

        const container = document.getElementById('firebaseui-auth-container');
        if (container) {
          // Monitor for form submissions using event delegation
          container.addEventListener('submit', () => {
            console.log('📝 [DOM FALLBACK] Form submission detected');

            // Find email input in the form
            const emailInput = container.querySelector('input[type="email"]');
            if (emailInput && emailInput.value) {
              const email = emailInput.value.trim();
              console.log('📧 [DOM FALLBACK] Captured email from input:', email);

              try {
                window.localStorage.setItem('emailForSignIn', email);
                console.log('✅ [DOM FALLBACK] Email stored in localStorage:', window.localStorage.getItem('emailForSignIn'));
              } catch (error) {
                console.error('❌ [DOM FALLBACK] Error storing email:', error);
              }
            } else {
              console.warn('⚠️ [DOM FALLBACK] No email input found or empty value');
            }
          }, true); // Use capture phase to ensure we catch it early

          console.log('✅ DOM-based email capture fallback installed');
        } else {
          console.error('❌ Could not find firebaseui-auth-container for DOM fallback');
        }
      }, 100);

      // Customize button text after FirebaseUI renders
      setTimeout(() => {
        const buttons = document.querySelectorAll('.firebaseui-idp-button');
        buttons.forEach((button) => {
          const text = button.querySelector('.firebaseui-idp-text');
          if (text && text.textContent.includes('Sign in with email')) {
            // Check if it's the password method (has password input) or link method
            const buttonList = button.closest('.firebaseui-list-item');
            const buttonIndex = Array.from(buttonList?.parentNode?.children || []).indexOf(buttonList);

            // First email button (index 1) = Email/Password
            // Second email button (index 4) = Email Link
            if (buttonIndex === 1) {
              text.textContent = 'Sign up / Sign in with email';
            } else if (buttonIndex === 4) {
              text.textContent = 'Sign in with magic link';
            }
          }
        });
      }, 100);
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

      // Track user registration/upgrade
      if (isCurrent) {
        analyticsService.trackUserRegistered('anonymous_upgrade');
      }

      // Broadcast auth success to other tabs
      if (isCurrent) {
        tabCommunicationService.broadcastAuthSuccess({
          userId: verifiedUser,
          isUpgrade: true,
          verifiedUser,
          unverifiedUser,
        });
      }

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
