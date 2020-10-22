/* eslint-disable no-shadow */
import * as firebase from 'firebase';

const state = {
  roomList: [],
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
      const snapshot = await firebase.database().ref('rooms/').once('value');
      console.log('snapshot', snapshot.val());
      commit('SET_ROOMS', await snapshot.val());
    } catch (error) {
      commit('SET_ROOMS_fail');
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
    Object.keys(data).forEach((key) => {
      state.roomList.push({ ...data[key], id: key });
    });
    state.getingRoomsLoading = false;
  },
  SET_ROOMS_fail(state) {
    state.getingRoomsLoading = false;
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};
