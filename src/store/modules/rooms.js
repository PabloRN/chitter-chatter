/* eslint-disable max-len */
/* eslint-disable no-shadow */
import * as firebase from 'firebase';

const state = {
  roomList: {},
  userAdded: {},
  userExit: {},
  getingRoomsLoading: false,
};

const getters = {
  getAllRooms(state) {
    return state.roomList;
  },
  getUserPosition(state) {
    return state.usersPosition;
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
    console.log('HYYYYYYY', { roomId, userId });
    try {
      const roomUsersKey = firebase.database().ref().child(`rooms/${roomId}/users/`).push().key;
      const updates = {};
      updates[`/rooms/${roomId}/users/${roomUsersKey}`] = { userId };
      updates[`/users/${userId}/rooms/${roomId}`] = { roomUsersKey };
      await firebase.database().ref().update(updates);

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
      commit('PUSH_USER_SUCCESS');
    } catch (error) {
      console.log(error);
    }
  },
  async removeUser({ commit, rootState }, { roomId, userId, roomUsersKey }) {
    console.log('XXXXXX', { roomId, userId, roomUsersKey });

    try {
      const updates = {};
      console.log(rootState);
      updates[`/rooms/${roomId}/users/${roomUsersKey}`] = null;
      updates[`/users/${userId}/rooms/${roomId}`] = null;
      updates[`/users/${userId}/messages/`] = null;
      updates[`/users/${userId}/privateMessage/`] = null;
      updates[`/users/${userId}/position/`] = null;
      updates[`privateMessages/${rootState.messages.privateUsers}/`] = null;
      firebase.database().ref().update(updates);
      if (rootState.user.currentUser.userId === userId) {
        firebase.database()
          .ref(`rooms/${roomId}/messages/`)
          .off();
        firebase.database()
          .ref(`privateMessages/${state.privateUsers}`)
          .off();
        firebase.database()
          .ref(`rooms/${roomId}/users`).off();
      }
      commit('EXIT_ROOM', {
        roomId, userId, roomUsersKey, rootState,
      });
      // commit('PUSH_USER_SUCCESS');
    } catch (error) {
      console.log(error);
    }
  },
};

const mutations = {

  GET_ROOMS(state) {
    state.getingRoomsLoading = true;
  },
  SET_ROOMS(state, data) {
    state.roomList = [];
    state.roomList = data;
    state.getingRoomsLoading = false;
  },
  SET_ROOMS_FAIL(state) {
    state.getingRoomsLoading = false;
  },
  PUSH_USER(state) {
    state.pushingUser = true;
  },
  PUSH_USER_SUCCESS(state) {
    state.pushingUser = false;
  },
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
    state.roomList[roomId].users[roomUsersKey] = null;
    this.state.user.userData[userId] = null;
    this.state.user.usersPosition[userId] = null;
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
