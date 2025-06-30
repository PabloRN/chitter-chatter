import { defineStore } from 'pinia';
import {
  getDatabase, ref, get, onValue, off, push, update, set, onDisconnect, onChildAdded, onChildRemoved,
} from 'firebase/database';
import {
  getStorage, ref as storageRef, getDownloadURL, listAll,
} from 'firebase/storage';
import useUserStore from './user';

const useRoomsStore = defineStore('rooms', {
  state: () => ({
    roomList: {},
    userAdded: {},
    userExit: {},
    gettingRoomsLoading: false,
    avatarsList: [],
    userDisconnected: false,
    usersOnlineNow: 0,
    currentRoom: {},
    pushingUser: false,
    getavatarsLoading: false,
  }),

  getters: {
    getAllRooms: (state) => state.roomList,
    getUserPosition: () => {
      const userStore = useUserStore();
      return userStore.usersPosition;
    },
    getAllAvatars: (state) => state.avatarsList,
  },

  actions: {
    async getRooms() {
      this.getRoomsLoading();
      const db = getDatabase();

      try {
        const snapshot = await get(ref(db, 'rooms/'));
        this.setRooms(snapshot.val());

        Object.keys(snapshot.val()).forEach((singleRoom) => {
          const usersRoom = ref(db, `rooms/${singleRoom}/users/`);

          onChildAdded(usersRoom, () => {
            this.addOnline1({ roomId: singleRoom });
          });

          onChildRemoved(usersRoom, () => {
            this.subOnline1({ roomId: singleRoom });
          });
        });

        return 'rooms ready';
      } catch (error) {
        this.setRoomsFail();
        console.log(error);
      }
      return 'ready';
    },

    async getRoomDetails(roomId) {
      const db = getDatabase();
      const userStore = useUserStore();

      try {
        const roomReference = ref(db, `rooms/${roomId}`);
        const snapshot = await get(roomReference);

        const usersReference = ref(db, `rooms/${roomId}/users`);
        const usersUpgradedReference = ref(db, `rooms/${roomId}/usersUpgraded`);

        onChildAdded(usersReference, (userSnap) => {
          if (userSnap.val() !== null) {
            this.enterRoom({
              roomId,
              userId: userSnap.val(),
              roomUsersKey: userSnap.key,
            });
          }
        });

        onChildRemoved(usersReference, (userSnap) => {
          const { userId } = userSnap.val();
          this.removeUser({ roomId, userId, roomUsersKey: userSnap.key });
        });

        onValue(usersUpgradedReference, (userSnap) => {
          const userUpgraded = userSnap.val();
          if (userUpgraded !== null
            && userUpgraded.verifiedUser !== null
            && userUpgraded.unverifiedUser !== null
            && userUpgraded.verifiedUser !== userStore.currentUser.userId
            && userUpgraded.unverifiedUser !== userStore.currentUser.userId) {
            userStore.upgradeNonCurrentUser({
              verifiedUser: userUpgraded.verifiedUser,
              unverifiedUser: userUpgraded.unverifiedUser,
            });
            set(usersUpgradedReference, { verifiedUser: null, unverifiedUser: null });
          }
        });

        this.setRoomDetailsSuccess(snapshot.val());
        return snapshot.val();
      } catch (error) {
        this.setRoomsFail();
        console.log(error);
        return error;
      }
    },

    async pushUser({ roomId, userId }) {
      this.setPushUser();
      const db = getDatabase();
      const storage = getStorage();
      const userStore = useUserStore();

      try {
        const { currentUser } = userStore;
        const userLevel = currentUser.level || 'L1'; // Default to L1 if level not set
        console.log('pushUser - currentUser:', currentUser);
        console.log('pushUser - userLevel:', userLevel);

        const defaultAvatarRef = storageRef(storage, `rooms/${roomId}/avatars/${userLevel}/defaultAvatar/defaultAvatar.png`);
        const defaultMiniAvatarRef = storageRef(storage, `rooms/${roomId}/avatars/${userLevel}/miniavatars/defaultAvatar_head.png`);

        let defaultUrl; let
          defaultMiniUrl;

        try {
          defaultUrl = await getDownloadURL(defaultAvatarRef);
          console.log('Got default avatar URL:', defaultUrl);
        } catch (error) {
          console.error('Failed to get default avatar:', error);
        }

        try {
          defaultMiniUrl = await getDownloadURL(defaultMiniAvatarRef);
          console.log('Got default mini avatar URL:', defaultMiniUrl);
        } catch (error) {
          console.error('Failed to get default mini avatar:', error);
        }

        if (defaultUrl) {
          await set(ref(db, `users/${currentUser.userId}/avatar/`), defaultUrl);
        }
        if (defaultMiniUrl) {
          await set(ref(db, `users/${currentUser.userId}/miniAvatar/`), defaultMiniUrl);
        }

        const roomUsersKey = push(ref(db, `rooms/${roomId}/users/`)).key;
        const updates = {};
        updates[`/rooms/${roomId}/users/${roomUsersKey}`] = { userId };
        updates[`/users/${userId}/rooms/${roomId}`] = { roomUsersKey };

        const refRoom = ref(db, `rooms/${roomId}/users/${roomUsersKey}/`);
        onDisconnect(refRoom).update({ userId: null });

        await update(ref(db), updates);
        this.pushUserSuccess();
      } catch (error) {
        console.log(error);
      }
    },

    async removeUser({
      roomId, userId, roomUsersKey, isAnonymous,
    }) {
      const db = getDatabase();
      const userStore = useUserStore();

      try {
        const updates = {};
        updates[`/rooms/${roomId}/users/${roomUsersKey}`] = null;

        if (!isAnonymous) {
          updates[`/users/${userId}/rooms/${roomId}`] = null;
          updates[`/users/${userId}/messages/`] = null;
          updates[`/users/${userId}/privateMessage/`] = null;
          updates[`/users/${userId}/position/`] = null;
        } else {
          updates[`/users/${userId}`] = null;
        }

        if (userStore.currentUser.userId === userId) {
          off(ref(db, `rooms/${roomId}/messages/`));
          off(ref(db, `rooms/${roomId}/users`));
          off(ref(db, 'users/'));
        }

        await update(ref(db), updates);
        this.exitRoom({ roomId, userId, roomUsersKey });
      } catch (error) {
        console.log(error);
      }
    },

    async getAvatars(roomId) {
      this.getAvatarsLoading();
      const storage = getStorage();
      const userStore = useUserStore();

      try {
        const urlList = [];
        const avatarsRef = storageRef(storage, `rooms/${roomId}/avatars/${userStore.currentUser.level}`);
        const tempRefs = await listAll(avatarsRef);

        await Promise.all(tempRefs.items.map(async (avatarRef, index) => {
          const starsRef = storageRef(storage, avatarRef.fullPath);
          const url = await getDownloadURL(starsRef);
          urlList.push({ avatarId: index, url });
        }));

        this.getAvatarsSucceed(urlList);
      } catch (error) {
        console.log(error);
        this.getAvatarsFailed();
      }
    },

    // Mutations converted to actions
    getAvatarsLoading() {
      this.getavatarsLoading = true;
    },

    getAvatarsSucceed(data) {
      this.avatarsList = data;
      this.getavatarsLoading = false;
    },

    getAvatarsFailed() {
      this.getavatarsLoading = false;
    },

    getRoomsLoading() {
      this.gettingRoomsLoading = true;
    },

    setRooms(data) {
      this.roomList = data || {};
      this.gettingRoomsLoading = false;
    },

    setRoomsFail() {
      this.gettingRoomsLoading = false;
    },

    setPushUser() {
      this.pushingUser = true;
    },

    pushUserSuccess() {
      this.pushingUser = false;
    },

    setRoomDetailsSuccess(roomDetails) {
      this.currentRoom = roomDetails;
    },

    addOnline1({ roomId }) {
      if (!this.roomList[roomId]) return;

      const currentOnline = this.roomList[roomId].usersOnline || 0;
      this.roomList[roomId].usersOnline = currentOnline + 1;
      this.usersOnlineNow += 1;
    },

    subOnline1({ roomId }) {
      if (!this.roomList[roomId]) return;

      const currentOnline = this.roomList[roomId].usersOnline || 1;
      this.roomList[roomId].usersOnline = Math.max(0, currentOnline - 1);
      this.usersOnlineNow = Math.max(0, this.usersOnlineNow - 1);
    },

    enterRoom({ roomId, userId, roomUsersKey }) {
      const userStore = useUserStore();

      if (this.currentRoom.users) {
        Object.assign(this.currentRoom.users, { [roomUsersKey]: userId });
      } else {
        Object.assign(this.currentRoom, { users: { [roomUsersKey]: userId } });
      }

      this.userAdded = { roomId, ...userId };
      userStore.roomIn = { roomId, roomUsersKey };
    },

    exitRoom({ roomId, userId, roomUsersKey }) {
      const userStore = useUserStore();

      if (userId === userStore.currentUser.userId) {
        userStore.userData = {};
        userStore.usersPosition = {};
        userStore.roomIn = {};
        this.currentRoom = {};
      } else {
        delete userStore.userData[userId];
        delete userStore.usersPosition[userId];
        if (this.currentRoom.users) {
          delete this.currentRoom.users[roomUsersKey];
        }
      }

      userStore.userPositionModified = true;
      this.userExit = { roomId, userId };
      this.userAdded = null;
    },
  },
});
export default useRoomsStore;
