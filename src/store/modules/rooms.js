/* eslint-disable max-len */
/* eslint-disable no-shadow */
import * as firebase from 'firebase';

const state = {
  roomList: {},
  userAdded: {},
  userExit: {},
  getitngRoomsLoading: false,
  avatarsList: [],
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
      // For each room created we will create a listener to each user's
      // folder listenning for new users that enter to the room
      // Object.keys(snapshot.val())
      //   .map((singleRoom) => firebase.database()
      //     .ref(`rooms/${singleRoom}/users/`)
      //     .on('child_added', async (userSnap) => { // Get the user that enter to the room
      //       if (userSnap.val() !== null) {
      //         commit('ENTER_ROOM', { roomId: singleRoom, userId: userSnap.val(), roomUsersKey: userSnap.key });
      //         console.log('child_added', { singleRoom, ...userSnap.val(), roomUsersKey: userSnap.key }, snapshot.val());
      //       }
      //     }));
      // Object.keys(snapshot.val())
      //   .map((singleRoom) => firebase.database()
      //     .ref(`rooms/${singleRoom}/users`)
      //     .on('child_removed', (userSnap) => {
      //       console.log(singleRoom, userSnap.val()); // Get the user that exit to the room
      //       const { userId } = userSnap.val();
      //       dispatch('removeUser', { roomId: singleRoom, userId, roomUsersKey: userSnap.key });
      //       console.log('child_removed', { singleRoom, ...userSnap.val(), roomUsersKey: userSnap.key });
      //     }));
      // const singleRoom = firebase.database().ref()
      commit('SET_ROOMS', snapshot.val());
      return 'rooms ready';
    } catch (error) {
      commit('SET_ROOMS_FAIL');
      console.log(error);
    }
    return 'ready';
  },
  async pushUser({ commit, dispatch }, { roomId, userId }) {
    commit('PUSH_USER');
    try {
      const roomUsersKey = firebase.database().ref().child(`rooms/${roomId}/users/`).push().key;
      const updates = {};
      updates[`/rooms/${roomId}/users/${roomUsersKey}`] = { userId };
      updates[`/users/${userId}/rooms/${roomId}`] = { roomUsersKey };

      firebase.database()
        .ref(`rooms/${roomId}/users/`)
        .on('child_added', async (userSnap) => { // Get the user that enter to the room
          if (userSnap.val() !== null) {
            console.log('User enter room', { roomId, userId: userSnap.val(), roomUsersKey: userSnap.key });
            commit('ENTER_ROOM', { roomId, userId: userSnap.val(), roomUsersKey: userSnap.key });

            // console.log('child_added', { roomId, ...userSnap.val(), roomUsersKey: userSnap.key }, snapshot.val());
          }
        });

      firebase.database()
        .ref(`rooms/${roomId}/users`)
        .on('child_removed', (userSnap) => {
          const { userId } = userSnap.val();
          dispatch('removeUser', { roomId, userId, roomUsersKey: userSnap.key });
          console.log('child_removed', { roomId, user: userSnap.val(), roomUsersKey: userSnap.key });
        });
      await firebase.database().ref().update(updates);

      commit('PUSH_USER_SUCCESS');
    } catch (error) {
      console.log(error);
    }
  },
  async removeUser({ commit, rootState }, { roomId, userId, roomUsersKey }) {
    console.log('XXXXXX', { roomId, userId, roomUsersKey });

    try {
      const updates = {};
      updates[`/rooms/${roomId}/users/${roomUsersKey}`] = null;
      updates[`/users/${userId}/rooms/${roomId}`] = null;
      updates[`/users/${userId}/messages/`] = null;
      updates[`/users/${userId}/privateMessage/`] = null;
      updates[`/users/${userId}/position/`] = null;
      updates[`privateMessages/${rootState.messages.privateUsers}/`] = null;

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
      console.log(error);
    }
  },
  async getAvatars({ commit, rootState }, roomId) {
    commit('GET_AVATARS');
    try {
      const urlList = [];
      const storage = firebase.storage();
      // Create a storage reference from our storage service
      const storageRef = storage.ref();
      const avatarsRef = storageRef.child(`rooms/${roomId}/avatars/${rootState.user.currentUser.level}`);
      const tempRefs = await avatarsRef.listAll();
      await Promise.all(tempRefs.items.map((async (ref, index) => {
        const starsRef = storageRef.child(ref.location.path);
        // const miniavatarurl = await storageRef.child(`miniavatars/${ref.name}`);
        // const metadata = await starsRef.getMetadata();
        const url = await starsRef.getDownloadURL();
        // const miniurl = await miniavatarurl.getDownloadURL();
        urlList.push({ avatarId: index, url });
        console.log('urlList', urlList);
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
    state.getitngRoomsLoading = true;
  },
  SET_ROOMS(state, data) {
    state.roomList = [];
    state.roomList = data;
    state.getitngRoomsLoading = false;
  },
  SET_ROOMS_FAIL(state) {
    state.getitngRoomsLoading = false;
  },
  PUSH_USER(state) {
    state.pushingUser = true;
  },
  PUSH_USER_SUCCESS(state) {
    state.pushingUser = false;
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
  ENTER_ROOM(state, { roomId, userId, roomUsersKey }) {
    if (state.roomList[roomId].users) {
      Object.assign(state.roomList[roomId].users, { [roomUsersKey]: userId });
    } else {
      Object.assign(state.roomList[roomId], { users: { [roomUsersKey]: userId } });
    }
    state.userAdded = { roomId, ...userId };
  },
  EXIT_ROOM(state, { roomId, userId, roomUsersKey }) {
    console.log('EXIT ROOM', { roomId, userId, roomUsersKey });
    delete state.roomList[roomId].users[roomUsersKey];
    delete this.state.user.userData[userId];
    delete this.state.user.usersPosition[userId];
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
