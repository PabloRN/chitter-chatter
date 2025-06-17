import { defineStore } from 'pinia';

export const useMainStore = defineStore('main', {
  state: () => ({
    snackbar: false,
    drawer: false,
  }),

  actions: {
    setSnackbar(payload) {
      this.snackbar = payload;
    },

    setDrawer(payload) {
      this.drawer = payload;
    },
  },
});
