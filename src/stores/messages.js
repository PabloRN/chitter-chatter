import { defineStore } from 'pinia';
import {
  getDatabase, ref, push, update, onChildAdded, onChildRemoved, off, set,
} from 'firebase/database';
import useMainStore from './main';

const useMessagesStore = defineStore('messages', {
  state: () => ({
    roomMessages: [],
    roomMessagesToShow: [],
    privateMessage: [],
    privateUsers: '',
    showMessagesStatus: false,
  }),

  getters: {
    getText: (state) => state.roomMessagesToShow,
    getPrivateChannelName: () => (user1, user2) => (user1 < user2 ? `${user1}_${user2}` : `${user2}_${user1}`),
  },

  actions: {
    async sendText(text) {
      try {
        this.sendTextSuccess(text);
      } catch (error) {
        console.error(error);
        this.sendTextError();
      }
    },

    showMessages(payload) {
      this.setShowMessages(payload);
    },

    showUserMessages(userId) {
      this.setShowUserMessages(userId);
    },

    async sendMessage({
      message, roomId, userId, nickname, miniAvatar,
    }) {
      const db = getDatabase();
      const utcTimestamp = new Date().toISOString();

      try {
        const roomMessagesKey = push(ref(db, `rooms/${roomId}/messages/`)).key;
        const messageData = {
          message, userId, timestamp: utcTimestamp, nickname, miniAvatar,
        };

        const updates = {};
        updates[`/rooms/${roomId}/messages/${roomMessagesKey}`] = messageData;
        updates[`/users/${userId}/messages/${roomId}/${roomMessagesKey}`] = {
          roomMessagesKey, message, timestamp: utcTimestamp, nickname, miniAvatar,
        };

        await update(ref(db), updates);
      } catch (error) {
        console.error(error);
      }
    },

    async sendPrivateMessage({ message, userId }) {
      const db = getDatabase();
      this.setSendMessage();

      try {
        const roomMessagesKey = push(ref(db, `privateMessages/${this.privateUsers}`)).key;
        const updates = {};
        updates[`privateMessages/${this.privateUsers}/${roomMessagesKey}`] = { message, userId };
        await update(ref(db), updates);
      } catch (error) {
        console.error(error);
      }
    },

    async confirmPrivate({ requestedBy, currentUser }) {
      const db = getDatabase();
      try {
        const channelName = this.getPrivateChannelName(requestedBy, currentUser);
        // User B (accepter) also needs to listen to the channel
        onChildAdded(ref(db, `privateMessages/${channelName}`), (messageSnap) => {
          this.setPrivateUsers({ users: channelName });
          this.setSendPrivateMessage(messageSnap.val());
        });

        onChildRemoved(ref(db, `privateMessages/${channelName}`), () => {
          this.closePrivateMessageDialog();
          off(ref(db, `privateMessages/${channelName}`));
        });

        const privateMessagesKey = push(ref(db, `privateMessages/${channelName}`)).key;
        const updates = {};
        updates[`privateMessages/${channelName}/${privateMessagesKey}`] = {
          userId: currentUser,
          message: 'Hey let`s talk',
        };

        await update(ref(db), updates);

        // Clean up both requestedBy and requestedTo
        await set(ref(db, `users/${currentUser}/privateMessage/`), {
          requestedBy: null,
        });
        await set(ref(db, `users/${requestedBy}/privateMessage/`), {
          requestedTo: null,
        });
      } catch (error) {
        console.error('❌ Error in confirmPrivate:', error);
      }
    },
    async rejectPrivate({ requestedBy, currentUser }) {
      const mainStore = useMainStore();
      const db = getDatabase();
      try {
        const channelName = this.getPrivateChannelName(requestedBy, currentUser);

        const privateMessagesKey = push(ref(db, `privateMessages/${channelName}`)).key;
        const updates = {};
        updates[`privateMessages/${channelName}/${privateMessagesKey}`] = {
          userId: currentUser,
          message: 'NOT_INTERESTED',
        };
        await update(ref(db), updates);

        // Clean up both requestedBy and requestedTo
        await set(ref(db, `users/${currentUser}/privateMessage/`), {
          requestedBy: null,
        });
        await set(ref(db, `users/${requestedBy}/privateMessage/`), {
          requestedTo: null,
        });
        mainStore.setSnackbar({
          type: 'warning',
          msg: 'You had rejected the private request',
        });
      } catch (error) {
        console.error('❌ Error in confirmPrivate:', error);
      }
    },

    async sendPrivateMessageRequest({ currentUser, userId }) {
      const db = getDatabase();
      const mainStore = useMainStore();
      const currentId = currentUser;
      try {
        if (userId && currentId) {
          await set(ref(db, `users/${userId}/privateMessage/`), {
            requestedBy: currentId,
          });
          await set(ref(db, `users/${currentId}/privateMessage/`), {
            requestedTo: userId,
          });
          mainStore.setSnackbar({
            type: 'success',
            msg: 'Private message request successfully sent',
          });
          const channelName = this.getPrivateChannelName(currentId, userId);
          // Start listening immediately when request is sent
          onChildAdded(ref(db, `privateMessages/${channelName}`), (messageSnap) => {
            if (messageSnap.val().message === 'NOT_INTERESTED' && messageSnap.val().userId === userId) {
              off(ref(db, `privateMessages/${channelName}`));
              const updates = {};
              updates[`privateMessages/${this.privateUsers}/`] = null;
              update(ref(db), updates);
              mainStore.setSnackbar({
                type: 'warning',
                msg: 'The other user has rejected your request',
              });
              this.closePrivateMessageDialog();
            } else {
              this.setPrivateUsers({ users: channelName });
              this.setSendPrivateMessage(messageSnap.val());
            }
          });

          onChildRemoved(ref(db, `privateMessages/${channelName}`), () => {
            this.closePrivateMessageDialog();
            off(ref(db, `privateMessages/${channelName}`));
          });
        }
      } catch (error) {
        mainStore.setSnackbar({
          type: 'error',
          msg: 'Upss, something went wrong. Please try again after a few seconds',
        });
        console.error('❌ Error in sendPrivateMessageRequest:', error);
      }
    },

    async getDialogs(roomId) {
      const db = getDatabase();

      try {
        const messagesListRef = ref(db, `rooms/${roomId}/messages/`);

        onChildAdded(messagesListRef, (messageSnap) => {
          const messageVal = messageSnap.val();
          if (messageVal !== null && this.roomMessages.filter((m) => m.roomUsersKey === messageSnap.key).length === 0) {
            this.messageAddedSuccess({
              roomId,
              text: messageVal.message,
              userId: messageVal.userId,
              roomUsersKey: messageSnap.key,
              timestamp: messageVal.timestamp,
              nickname: messageVal?.nickname,
              miniAvatar: messageVal?.miniAvatar,
            });
          }
        });

        onChildRemoved(messagesListRef, (messageSnap) => {
          if (messageSnap.val() !== null) {
            this.messageRemovedSuccess(messageSnap.key);
          }
        });
      } catch (error) {
        this.setRoomsFail();
      }
    },

    async removeDialogs(roomId) {
      const db = getDatabase();
      const updates = {};
      updates[`/rooms/${roomId}/messages/`] = null;

      try {
        off(ref(db, `rooms/${roomId}/messages/`));
        await update(ref(db), updates);
        this.removeDialogsSuccess();
      } catch (error) {
        this.setRoomsFail();
      }
    },

    cleanMessages() {
      this.removeDialogsSuccess();
    },

    async closePrivate() {
      const db = getDatabase();
      const updates = {};
      updates[`privateMessages/${this.privateUsers}/`] = null;

      try {
        off(ref(db, `privateMessages/${this.privateUsers}`));
        await update(ref(db), updates);
        this.closePrivateMessageDialog();
      } catch (error) {
        this.setRoomsFail();
      }
    },

    cleanPrivateMessages() {
      const mainStore = useMainStore();

      this.closePrivateMessageDialog();
      mainStore.setSnackbar({
        type: 'info',
        msg: 'The other user has closed the dialog window',
      });
    },

    // Mutations converted to actions
    setSendPrivateMessage(message) {
      this.privateMessage = [...this.privateMessage, message];
    },

    setShowMessages(payload) {
      if (payload === true) this.roomMessagesToShow = this.roomMessages;
      this.showMessagesStatus = payload;
    },

    setShowUserMessages(payload) {
      this.roomMessagesToShow = this.roomMessages
        .filter(({ userId }) => userId === payload);
      this.showMessagesStatus = true;
    },

    sendTextError() { },

    sendTextSuccess(text) {
      console.log(text);
      // Implementation for successful text send
    },

    setSendMessage() {
      // Loading state for sending message
    },

    messageAddedSuccess(message) {
      this.roomMessages = [...this.roomMessages, message]; // Create new array for reactivity
    },

    messageRemovedSuccess(messageId) {
      this.roomMessages = this.roomMessages.filter((message) => message.roomUsersKey !== messageId);
    },

    removeDialogsSuccess() {
      this.roomMessages = [];
    },

    setPrivateUsers({ users }) {
      this.privateUsers = users;
    },

    closePrivateMessageDialog() {
      this.privateUsers = null;
      this.privateMessage = [];
    },

    setRoomsFail() {
    },
  },
});

export default useMessagesStore;
