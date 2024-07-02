/* eslint no-shadow: ["error", { "allow": ["state"] }] */
import * as firebase from 'firebase';
// State object
const state = {
  roomMessages: [],
  privateMessage: [],
  privateUsers: '',
  showMessagesStatus: false,
};

// Getter functions
const getters = {
  getText(state) {
    return state.roomMessages;
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
  showMessages({ commit }, payload) {
    commit('SHOW_MESSAGES', payload);
  },
  async sendMessage(state, {
    message, roomId, userId, nickname,
  }) {
    // commit('SEND_MESSAGE');
    const utcTimestamp = new Date().toISOString();
    try {
      const roomMessagesKey = firebase.database().ref().child(`rooms/${roomId}/messages/`).push().key;
      const messageData = {
        message, userId, timestamp: utcTimestamp, nickname,
      };
      const updates = {};
      updates[`/rooms/${roomId}/messages/${roomMessagesKey}`] = messageData;
      updates[`/users/${userId}/messages/${roomId}`] = {
        roomMessagesKey, message, timestamp: utcTimestamp, nickname,
      };
      await firebase.database().ref().update(updates);
      // commit('SEND_MESSAGE_SUCCESS');
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
      // commit('SEND_MESSAGE_SUCCESS');
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
    const currentId = currentUser;
    // commit('SEND_PRIVATE_MESSAGE_REQUEST');
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
          msg: 'Private message request successfully sent',
        },
        { root: true });
      // commit('SEND_PRIVATE_MESSAGE_REQUEST_SUCCESS');
      firebase.database()
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
  async getDialogs({ commit, state }, roomId) {
    try {
      const messagesListRef = firebase.database().ref(`rooms/${roomId}/messages/`);
      const messagesListRefVals = (await messagesListRef.once('value')).val();
      console.log('messagesListRefVals', messagesListRefVals);
      messagesListRef.on('child_added', async (messageSnap) => { // Get the message sent to the room
        if (messageSnap.val() !== null && state.roomMessages.filter((m) => {
          console.log(m.roomUsersKey, messageSnap.key);
          return m.roomUsersKey === messageSnap.key;
        }).length === 0) {
          commit('MESSAGE_ADDED_SUCCESS', {
            roomId,
            text: messageSnap.val().message,
            userId: messageSnap.val().userId,
            roomUsersKey: messageSnap.key,
            timestamp: messageSnap.val().timestamp,
            nickname: messageSnap.val()?.nickname,
          });
        }
        let extraMessages = state.roomMessages.length - 10;
        if (extraMessages > 0) {
          const updateMessage = {};
          while (extraMessages !== 0) {
            updateMessage[`rooms/${roomId}/messages/${state.roomMessages[extraMessages - 1].roomUsersKey}`] = null;
            extraMessages -= 1;
          }
          await firebase.database().ref().update(updateMessage);
        }
      });
      messagesListRef.on('child_removed', async (messageSnap) => { // Get the message sended to the room
        if (messageSnap.val() !== null) {
          commit('MESSAGE_REMOVED_SUCCESS', messageSnap.key);
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
      await firebase.database()
        .ref(`privateMessages/${state.privateUsers}`)
        .off();
      await firebase.database().ref().update(updates);
      commit('CLOSE_PRIVATE_MESSAGE_DIALOG');
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
  //   state.roomMessages = text;
  // },
  SEND_PRIVATE_MESSAGE(state, message) {
    state.privateMessage.push(message);
  },
  SHOW_MESSAGES(state, payload) {
    state.showMessagesStatus = payload;
  },
  SEND_TEXT_ERROR() {
    console.log('Error sending text');
  },
  MESSAGE_ADDED_SUCCESS(state, message) {
    state.roomMessages.push(message);
  },
  MESSAGE_REMOVED_SUCCESS(state, messageId) {
    state.roomMessages = state.roomMessages.filter((message) => message.roomUsersKey !== messageId);
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
