/* eslint no-shadow: ["error", { "allow": ["state"] }] */
import * as firebase from 'firebase';
// State object
const state = {
  dialogText: [],
};

// Getter functions
const getters = {
  getText(state) {
    return state.dialogText;
  },
};

// Actions
const actions = {
  async sendText({ commit }, text) {
    try {
      // TODO: send text to firebase

      commit('SEND_TEXT_SUCCESS', text);
    } catch (error) {
      console.error(error);
      commit('SEND_TEXT_ERROR');
    }
  },
  async sendMessage({ commit }, { message, roomId, userId }) {
    commit('SEND_MESSAGE');
    console.log({ roomId, userId, message });
    try {
      const roomMessagesKey = await firebase.database().ref().child(`rooms/${roomId}/messages/`).push().key;
      const updates = {};
      updates[`/rooms/${roomId}/messages/${roomMessagesKey}`] = { message, userId };
      updates[`/users/${userId}/messages/${roomId}`] = { roomMessagesKey, message };
      await firebase.database().ref().update(updates);
      commit('SEND_MESSAGE_SUCCESS');
    } catch (error) {
      console.log(error);
    }
  },
  async getDialogs({ commit }, roomId) {
    try {
      firebase.database()
        .ref(`rooms/${roomId}/messages/`)
        .on('child_added', async (messageSnap) => { // Get the message sended to the room
          console.log('message added', messageSnap.val());
          if (messageSnap.val() !== null) {
            commit('MESSAGE_ADDED_SUCCESS', {
              roomId,
              text: messageSnap.val().message,
              userId: messageSnap.val().userId,
              roomUsersKey: messageSnap.key,
            });
          }
        });
      // const singleRoom = firebase.database().ref()
      // commit('SET_ROOMS', await snapshot.val());
    } catch (error) {
      commit('SET_ROOMS_FAIL');
      console.log(error);
    }
  },
  removeDialogs({ commit }, roomId) {
    try {
      firebase.database()
        .ref(`rooms/${roomId}/messages/`)
        .off();
      // const singleRoom = firebase.database().ref()
      // commit('SET_ROOMS', await snapshot.val());
    } catch (error) {
      commit('SET_ROOMS_FAIL');
      console.log(error);
    }
  },
};

// Mutations
const mutations = {
  SEND_TEXT_SUCCESS(state, text) {
    state.dialogText = text;
  },
  SEND_TEXT_ERROR() {
    console.log('Error sending text');
  },
  MESSAGE_ADDED_SUCCESS(state, message) {
    state.dialogText.push(message);
  },
};
export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
