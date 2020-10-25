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
};
const actions = {

  async getRooms({ commit }) {
    commit('GET_ROOMS');
    try {
      const snapshot = await firebase.database().ref('rooms/').once('value');// Get ref to rooms folder
      // For each room created we will create a listener to each user's
      // folder listenning for new users that enter to the room
      Object.keys(snapshot.val())
        .map((singleRoom) => firebase.database()
          .ref(`rooms/${singleRoom}/users/`)
          .on('child_added', async (userSnap) => { // Get the user that enter to the room
            if (userSnap.val() !== null) {
              // roomUserKey is the key created after push an user into a room
              // const roomUsersKey = await firebase.database()
              //   .ref(`users/${userSnap.val().userId}/rooms/${singleRoom}`)
              //   .once('value');
              commit('ENTER_ROOM', { roomId: singleRoom, userId: userSnap.val(), roomUsersKey: userSnap.key });
              console.log('child_added', { singleRoom, ...userSnap.val(), roomUsersKey: userSnap.key });
            }
          }));
      Object.keys(snapshot.val()).map((singleRoom) => firebase.database().ref(`rooms/${singleRoom}/users`).on('child_removed', (roomSnap) => {
        console.log('child_removed', { singleRoom, ...roomSnap.val() });
      }));
      // const singleRoom = firebase.database().ref()
      commit('SET_ROOMS', await snapshot.val());
    } catch (error) {
      commit('SET_ROOMS_FAIL');
      console.log(error);
    }
  },
  async pushUser({ commit }, { roomId, userId }) {
    commit('PUSH_USER');
    console.log({ roomId, userId });
    try {
      const roomUsersKey = await firebase.database().ref().child(`rooms/${roomId}/users/`).push().key;
      const updates = {};
      updates[`/rooms/${roomId}/users/${roomUsersKey}`] = { userId };
      updates[`/users/${userId}/rooms/${roomId}`] = { roomUsersKey };
      await firebase.database().ref().update(updates);
      commit('PUSH_USER_SUCCESS');
    } catch (error) {
      console.log(error);
    }
  },
  async removeUser({ commit }, { roomId, userId }) {
    commit('EXIT_ROOM');
    try {
      const roomUsersKey = await firebase.database().ref().child(`rooms/${roomId}/users/`).push().key;
      const updates = {};
      updates[`/rooms/${roomId}/users/${roomUsersKey}`] = null;
      updates[`/users/${userId}/rooms/`] = null;
      firebase.database().ref().update(updates);
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
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};
