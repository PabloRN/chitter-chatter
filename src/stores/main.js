import { defineStore } from 'pinia';
import { getDatabase, ref, onValue } from 'firebase/database';

const useMainStore = defineStore('main', {
  state: () => ({
    snackbar: false,
    drawer: false,
    isConnected: true,
    connectionChecked: false,
  }),

  actions: {
    setSnackbar(payload) {
      this.snackbar = payload;
    },

    setDrawer(payload) {
      this.drawer = payload;
    },

    setConnectionStatus(status) {
      this.isConnected = status;
      this.connectionChecked = true;
    },

    startConnectionMonitoring() {
      const db = getDatabase();
      const connectedRef = ref(db, '.info/connected');

      onValue(connectedRef, (snapshot) => {
        const isConnected = snapshot.val();
        const wasConnected = this.isConnected;

        this.setConnectionStatus(isConnected);

        if (!isConnected && this.connectionChecked && wasConnected) {
          this.setSnackbar(false);
        } else if (isConnected && this.connectionChecked && !wasConnected) {
          this.setSnackbar({
            type: 'success',
            msg: 'Connection restored!',
            timeout: 3000,
          });
        }
      });
    },

    retryConnection() {
      window.location.reload();
    },
  },
});

export default useMainStore;
