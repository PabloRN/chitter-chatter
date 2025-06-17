import { defineStore } from 'pinia';
import {
  getDatabase, ref, push, update, onValue, onChildAdded, onChildRemoved, off, set, get,
} from 'firebase/database';
import { useMainStore } from './main';

export const useMessagesStore = defineStore('messages', {
  state: () => ({
    roomMessages: [],
    roomMessagesToShow: [],
    privateMessage: [],
    privateUsers: '',
    showMessagesStatus: false,
  }),

  getters: {
    getText: (state) => state.roomMessagesToShow,
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

    showUserMessages(payload) {
      this.setShowUserMessages(payload);
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
        console.log(error);
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
        console.log(error);
      }
    },

    async confirmPrivate({ requestedBy, currentUser }) {
      const db = getDatabase();

      try {
        const privateMessagesKey = push(ref(db, `privateMessages/${requestedBy}_${currentUser}`)).key;
        const updates = {};
        updates[`privateMessages/${requestedBy}_${currentUser}/${privateMessagesKey}`] = {
          userId: currentUser,
          message: 'Hey let`s talk',
        };

        await update(ref(db), updates);
        await set(ref(db, `users/${currentUser}/privateMessage/`), {
          requestedBy: null,
        });

        onChildAdded(ref(db, `privateMessages/${requestedBy}_${currentUser}`), (messageSnap) => {
          this.setPrivateUsers({ users: `${requestedBy}_${currentUser}` });
          this.setSendPrivateMessage(messageSnap.val());
        });

        onChildRemoved(ref(db, `privateMessages/${requestedBy}_${currentUser}`), () => {
          this.closePrivateMessageDialog();
        });
      } catch (error) {
        console.log(error);
      }
    },

    async sendPrivateMessageRequest({ currentUser, userId }) {
      const db = getDatabase();
      const mainStore = useMainStore();
      const currentId = currentUser;

      try {
        await set(ref(db, `users/${userId}/privateMessage/`), {
          requestedBy: currentId,
        });
        await set(ref(db, `users/${currentId}/privateMessage/`), {
          requestedTo: userId,
        });

        this.setPrivateUsers({ users: `${currentId}_${userId}` });
        mainStore.setSnackbar({
          type: 'success',
          msg: 'Private message request successfully sent',
        });

        onChildAdded(ref(db, `privateMessages/${currentId}_${userId}`), (messageSnap) => {
          this.setSendPrivateMessage(messageSnap.val());
        });

        const privateRef = ref(db, `privateMessages/${currentId}_${userId}`);
        const snapshot = await get(privateRef);
        if (snapshot.exists()) {
          await set(ref(db, `users/${currentId}/privateMessage/`), {
            requestedTo: null,
          });
        }

        onChildRemoved(privateRef, () => {
          this.closePrivateMessageDialog();
        });
      } catch (error) {
        console.log(error);
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
        console.log(error);
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
        console.log(error);
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
        console.log(error);
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
      this.privateMessage.push(message);
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

    sendTextError() {
      console.log('Error sending text');
    },

    sendTextSuccess(text) {
      // Implementation for successful text send
      console.log('Text sent successfully:', text);
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
      console.log('Rooms operation failed');
    },
  },
});
