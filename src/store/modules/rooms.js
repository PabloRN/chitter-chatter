/* eslint-disable max-len */
/* eslint-disable no-shadow */
import firebase from 'firebase/app';
import 'firebase/auth'; // Import the auth module explicitly if needed
import 'firebase/database'; // Import other Firebase modules as needed
import 'firebase/storage';

const state = {
  roomList: {},
  userAdded: {},
  userExit: {},
  gettingRoomsLoading: false,
  avatarsList: [],
  userDisconnected: false,
  usersOnlineNow: 0,
  currentRoom: {},
};

const getters = {
  getAllRooms(state) {
    return state.roomList;
  },
  getUserPosition(state) {
    return state.usersPosition;
  },
  getAllAvatars(state) {
    return state.avatarsList;
  },
};
const actions = {

  async getRooms({ commit }) {
    commit('GET_ROOMS');
    try {
      const snapshot = await firebase.database().ref('rooms/').once('value');// Get ref to rooms folder
      // // Assume we have the following data in the Database:
      // {
      //   "name": {
      //     "first": "Ada",
      //     "last": "Lovelace"
      //   }
      // }

      // var ref = firebase.database().ref("users/ada");
      // ref.once("value")
      //   .then(function(snapshot) {
      //     var a = snapshot.numChildren(); // 1 ("name")
      //     var b = snapshot.child("name").numChildren(); // 2 ("first", "last")
      //     var c = snapshot.child("name/first").numChildren(); // 0
      //   });
      // For each room created we will create a listener to each user's
      // folder listenning for new users that enter to the room

      commit('SET_ROOMS', snapshot.val());
      Object.keys(snapshot.val())
        .map((singleRoom) => {
          const usersRoom = firebase.database()
            .ref(`rooms/${singleRoom}/users/`);

          usersRoom.on('child_added', async () => { // Get the user that enter to the room
            commit('ADD_ONLINE_1', { roomId: singleRoom });
          });
          usersRoom.on('child_removed', async () => { // Get the user that enter to the room
            commit('SUB_ONLINE_1', { roomId: singleRoom });
          });
          return Object.keys(snapshot.val()).length;
        });
      return 'rooms ready';
    } catch (error) {
      commit('SET_ROOMS_FAIL');
    }
    return 'ready';
  },
  async getRoomDetails({ commit, dispatch, rootState }, roomId) {
    // commit('GET_ROOM_DETAILS');
    try {
      const roomReference = await firebase.database().ref(`rooms/${roomId}`);
      const snapshot = await roomReference.once('value');

      const usersReference = firebase.database().ref(`rooms/${roomId}/users`);
      const usersUpgradedReference = firebase.database().ref(`rooms/${roomId}/usersUpgraded`);

      usersReference.on('child_added', async (userSnap) => { // Get the user that enter to the room
        if (userSnap.val() !== null) {
          commit('ENTER_ROOM', {

            roomId, userId: userSnap.val(), roomUsersKey: userSnap.key, rootState,
          });
        }
      });
      usersReference.on('child_removed', (userSnap) => { // Get the user that leaved the room
        const { userId } = userSnap.val();
        dispatch('removeUser', { roomId, userId, roomUsersKey: userSnap.key });
      });
      usersUpgradedReference.on('value', (userSnap) => {
        const userUpgraded = userSnap.val();
        if (userUpgraded !== null && userUpgraded.verifiedUser !== null && userUpgraded.unverifiedUser !== null && userUpgraded.verifiedUser !== rootState.user.currentUser.userId && userUpgraded.unverifiedUser !== rootState.user.currentUser.userId) {
          dispatch('user/upgradeNonCurrentUser', { verifiedUser: userUpgraded.verifiedUser, unverifiedUser: userUpgraded.unverifiedUser }, { root: true });
          usersUpgradedReference.set({ verifiedUser: null, unverifiedUser: null });
        }
      });
      commit('SET_ROOM_DETAILS_SUCCESS', snapshot.val());
      return snapshot.val();
    } catch (error) {
      commit('SET_ROOMS_FAIL');
      return error;
    }
  },
  async pushUser({ commit, rootState }, { roomId, userId }) {
    commit('PUSH_USER');
    try {
      const { currentUser } = rootState.user;
      const storageRef = firebase.storage().ref();
      const defaultAvatarRef = storageRef.child(`rooms/${roomId}/avatars/${currentUser.level}/defaultAvatar/defaultAvatar.png`);
      const defaultMiniAvatarRef = storageRef.child(`rooms/${roomId}/avatars/${currentUser.level}/miniavatars/defaultAvatar_head.png`);
      const defaultUrl = await defaultAvatarRef.getDownloadURL();
      const defaultMiniUrl = await defaultMiniAvatarRef.getDownloadURL();
      if (defaultUrl) {
        await firebase.database().ref(`users/${currentUser.userId}/avatar/`).set(defaultUrl);
      }
      if (defaultMiniUrl) {
        await firebase.database().ref(`users/${currentUser.userId}/miniAvatar/`).set(defaultMiniUrl);
      }
      const roomUsersKey = firebase.database().ref().child(`rooms/${roomId}/users/`).push().key;
      const updates = {};
      updates[`/rooms/${roomId}/users/${roomUsersKey}`] = { userId };
      updates[`/users/${userId}/rooms/${roomId}`] = { roomUsersKey };
      const refRoom = firebase.database().ref(`rooms/${roomId}/users/${roomUsersKey}/`);
      refRoom.onDisconnect().update({
        userId: null,
      });

      await firebase.database().ref().update(updates);

      commit('PUSH_USER_SUCCESS');
    } catch (error) {
      commit('PUSH_USER_FAIL');
    }
  },
  async removeUser({ commit, rootState }, {
    roomId, userId, roomUsersKey, isAnonymous,
  }) {
    try {
      const updates = {};
      updates[`/rooms/${roomId}/users/${roomUsersKey}`] = null;
      if (!isAnonymous) {
        updates[`/users/${userId}/rooms/${roomId}`] = null;
        updates[`/users/${userId}/messages/`] = null;
        updates[`/users/${userId}/privateMessage/`] = null;
        updates[`/users/${userId}/position/`] = null;
        updates[`privateMessages/${rootState.messages.privateUsers}/`] = null;
      } else {
        updates[`/users/${userId}`] = null;
      }

      // firebase.database().ref(`users/${userId}/position/`).off();
      if (rootState.user.currentUser.userId === userId) {
        firebase.database()
          .ref(`rooms/${roomId}/messages/`)
          .off();
        firebase.database()
          .ref(`privateMessages/${state.privateUsers}`)
          .off();
        firebase.database()
          .ref(`rooms/${roomId}/users`).off();
        firebase.database().ref('users/').off();
      }
      firebase.database().ref().update(updates);
      commit('EXIT_ROOM', {
        roomId, userId, roomUsersKey, rootState,
      });
      // commit('PUSH_USER_SUCCESS');
    } catch (error) {
      commit('PUSH_USER_FAIL');
    }
  },
  async getAvatars({ commit, rootState }, roomId) {
    commit('GET_AVATARS');
    try {
      const urlList = [];

      // Create a storage reference from our storage service
      const storageRef = firebase.storage().ref();
      const avatarsRef = storageRef.child(`rooms/${roomId}/avatars/${rootState.user.currentUser.level}`);
      const tempRefs = await avatarsRef.listAll();

      await Promise.all(tempRefs.items.map((async (ref, index) => {
        const starsRef = storageRef.child(ref.fullPath);
        // const metadata = await starsRef.getMetadata();
        const url = await starsRef.getDownloadURL();
        urlList.push({ avatarId: index, url });
      })));
      commit('GET_AVATARS_SUCCEED', urlList);
    } catch (error) {
      commit('GET_AVATARS_FAILED');
    }
  },
};

const mutations = {
  GET_AVATARS(state) {
    state.getavatarsLoading = true;
  },
  GET_AVATARS_SUCCEED(state, data) {
    state.avatarsList = data;
    state.getavatarsLoading = false;
  },
  GET_AVATARS_FAILED(state) {
    state.getavatarsLoading = false;
  },
  GET_ROOMS(state) {
    state.gettingRoomsLoading = true;
  },
  SET_ROOMS(state, data) {
    state.roomList = [];
    state.roomList = data;
    state.gettingRoomsLoading = false;
  },
  SET_ROOMS_FAIL(state) {
    state.gettingRoomsLoading = false;
  },
  PUSH_USER(state) {
    state.pushingUser = true;
  },
  PUSH_USER_SUCCESS(state) {
    state.pushingUser = false;
  },
  SET_ROOM_DETAILS_SUCCESS(state, roomDetails) {
    state.currentRoom = roomDetails;
  },
  ADD_ONLINE_1(state, { roomId }) {
    Object.assign(state.roomList[roomId], { usersOnline: state.roomList[roomId].usersOnline ? state.roomList[roomId].usersOnline += 1 : 1 });
    state.usersOnlineNow += 1;
  },
  SUB_ONLINE_1(state, { roomId }) {
    Object.assign(state.roomList[roomId], { usersOnline: state.roomList[roomId].usersOnline ? state.roomList[roomId].usersOnline -= 1 : 1 });
    state.usersOnlineNow -= 1;
  },
  // SET_USER_POSITION(state, { position, userId }) {
  //   console.log(this.state);
  //   if (this.state.user.usersPosition[userId]) {
  //     this.state.user.usersPosition[userId].position = position;
  //   } else {
  //     Object.assign(this.state.user.usersPosition, { [userId]: { position } });
  //   }
  //   this.state.user.userPositionModified = !this.state.user.userPositionModified;
  // },
  ENTER_ROOM(state, {
    roomId, userId, roomUsersKey,
  }) {
    // if (state.roomList[roomId].users) {
    //   Object.assign(state.roomList[roomId].users, { [roomUsersKey]: userId });
    // } else {
    //   Object.assign(state.roomList[roomId], { users: { [roomUsersKey]: userId } });
    // }
    if (state.currentRoom.users) {
      Object.assign(state.currentRoom.users, { [roomUsersKey]: userId });
    } else {
      Object.assign(state.currentRoom, { users: { [roomUsersKey]: userId } });
    }
    state.userAdded = { roomId, ...userId };
    this.state.user.roomIn = { roomId, roomUsersKey };
  },
  EXIT_ROOM(state, { roomId, userId, roomUsersKey }) {
    if (userId === this.state.user.currentUser.userId) {
      this.state.user.userData = {};
      this.state.user.usersPosition = {};
      this.state.user.roomIn = {};
      state.currentRoom = {};
    } else {
      delete this.state.user.userData[userId];
      delete this.state.user.usersPosition[userId];
      delete state.currentRoom.users[roomUsersKey];
    }

    this.state.user.userPositionModified = true;
    state.userExit = { roomId, userId };
    state.userAdded = null;
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};
