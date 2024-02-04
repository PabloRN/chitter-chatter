/* eslint no-shadow: ["error", { "allow": ["state"] }] */
import * as firebase from 'firebase';
// State object
const state = {
  dialogText: [],
  privateMessage: [],
  privateUsers: '',
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
    // commit('SEND_MESSAGE');
    try {
      const roomMessagesKey = firebase.database().ref().child(`rooms/${roomId}/messages/`).push().key;
      const updates = {};
      updates[`/rooms/${roomId}/messages/${roomMessagesKey}`] = { message, userId };
      updates[`/users/${userId}/messages/${roomId}`] = { roomMessagesKey, message };
      await firebase.database().ref().update(updates);
      commit('SEND_MESSAGE_SUCCESS');
    } catch (error) {
      console.log(error);
    }
  },
  async sendPrivateMessage({ commit, state }, { message, userId }) {
    commit('SEND_MESSAGE');
    try {
      const roomMessagesKey = await firebase.database().ref().child(`privateMessages/${state.privateUsers}`).push().key;
      const updates = {};
      updates[`privateMessages/${state.privateUsers}/${roomMessagesKey}`] = { message, userId };
      await firebase.database().ref().update(updates);
      commit('SEND_MESSAGE_SUCCESS');
    } catch (error) {
      console.log(error);
    }
  },
  async confirmPrivate({ commit }, { requestedBy, currentUser }) {
    commit('CONFIRM_REQUEST');
    try {
      const privateMessagesKey = await firebase.database().ref().child(`privateMessages/${requestedBy}_${currentUser}`).push().key;
      const updates = {};
      updates[`privateMessages/${requestedBy}_${currentUser}/${privateMessagesKey}`] = {
        userId: currentUser,
        message: 'Hey let`s talk',
      };
      await firebase.database().ref().update(updates);
      await firebase.database().ref(`users/${currentUser}/privateMessage/`).set({
        requestedBy: null,
      });
      firebase.database()
        .ref(`privateMessages/${requestedBy}_${currentUser}`)
        .on('child_added', async (messageSnap) => { // Get the private message sent
          console.log('message added', messageSnap.val());
          commit('SET_PRIVATE_USERS', { users: `${requestedBy}_${currentUser}` });
          commit('SEND_PRIVATE_MESSAGE', messageSnap.val());
        });
      firebase.database()
        .ref(`privateMessages/${requestedBy}_${currentUser}`)
        .on('child_removed', async () => { // Get the private message sent
          // commit('CLOSE_PRIVATE_MESSAGE_DIALOG', `${requestedBy}_${currentUser}`);
          commit('CLOSE_PRIVATE_MESSAGE_DIALOG');
        });
      commit('CONFIRM__REQUEST_SUCCESS');
    } catch (error) {
      console.log(error);
    }
  },
  async sendPrivateMessageRequest({ commit }, { currentUser, userId }) {
    const currentId = currentUser.userId;
    commit('SEND_PRIVATE_MESSAGE_REQUEST');
    try {
      await firebase.database().ref(`users/${userId}/privateMessage/`).set({
        requestedBy: currentId,
      });
      await firebase.database().ref(`users/${currentId}/privateMessage/`).set({
        requestedTo: userId,
      });
      commit('SET_PRIVATE_USERS', { users: `${currentId}_${userId}` });
      commit('main/setSnackbar',
        {
          type: 'success',
          msg: 'Private message resquest successfuly sent',
        },
        { root: true });
      commit('SEND_PRIVATE_MESSAGE_REQUEST_SUCCESS');
      await firebase.database()
        .ref(`privateMessages/${currentId}_${userId}`)
        .on('child_added', (messageSnap) => { // Get the private message sent
          commit('SEND_PRIVATE_MESSAGE', messageSnap.val());
        });
      await firebase.database()
        .ref(`privateMessages/${currentId}_${userId}`)
        .once('child_added', async () => { // Get the private message sent
          await firebase.database().ref(`users/${currentId}/privateMessage/`).set({
            requestedTo: null,
          });
        });
      await firebase.database()
        .ref(`privateMessages/${currentId}_${userId}`)
        .on('child_removed', async () => { // Get the private message sent
          commit('CLOSE_PRIVATE_MESSAGE_DIALOG');
        });
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
    const updates = {};
    updates[`/rooms/${roomId}/messages/`] = null;
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
  async closePrivate({ commit, state }) {
    const updates = {};
    updates[`privateMessages/${state.privateUsers}/`] = null;
    try {
      console.log('off', state.privateUsers);
      await firebase.database()
        .ref(`privateMessages/${state.privateUsers}`)
        .off();
      await firebase.database().ref().update(updates);
      // const singleRoom = firebase.database().ref()
      // commit('SET_ROOMS', await snapshot.val());
    } catch (error) {
      commit('SET_ROOMS_FAIL');
      console.log(error);
    }
  },
  cleanPrivateMessages({ commit }) {
    commit('CLOSE_PRIVATE_MESSAGE_DIALOG');
    commit('main/setSnackbar',
      {
        type: 'info',
        msg: 'The other user has close the dialog window',
      },
      { root: true });
  },
};

// Mutations
const mutations = {
  // SEND_MESSAGE_SUCCESS(state, text) {
  //   state.dialogText = text;
  // },
  SEND_PRIVATE_MESSAGE(state, message) {
    state.privateMessage.push(message);
  },
  SEND_TEXT_ERROR() {
    console.log('Error sending text');
  },
  MESSAGE_ADDED_SUCCESS(state, message) {
    state.dialogText.push(message);
  },
  SET_PRIVATE_USERS(state, { users }) {
    state.privateUsers = users;
  },
  CLOSE_PRIVATE_MESSAGE_DIALOG(state) {
    state.privateUsers = null;
    state.privateMessage = [];
  },
};
export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
