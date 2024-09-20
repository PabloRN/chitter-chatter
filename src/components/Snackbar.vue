<template>
  <v-snackbar
    v-model="model"
    :color="snackbar.type"
    :timeout="snackbar.timeout"
    right
  >
  <VIcon :dark="snackbar.type !== 'warning'" class="mr-2">
  {{ icon }}
</VIcon>
    <span
      :class="snackbar.type === 'warning' ? 'black--text' : 'white--text'"
    >{{ snackbar.msg }}</span>
  </v-snackbar>
</template>

<script>
// Utilities
import {
  mapState,
} from 'vuex';

const ICON_MAP = {
  error: 'mdi-alert-octagon',
  info: 'mdi-information',
  success: 'mdi-check-circle',
  warning: 'mdi-alert-circle',
};

export default {
  name: 'SnackBar',
  data: () => ({
    model: false,
  }),

  computed: {
    ...mapState('main', ['snackbar']),
    icon() {
      return ICON_MAP[this.snackbar.type] || 'mdi-playlist-check';
    },
  },

  watch: {
    snackbar() {
      this.model = true;
    },
  },
};
</script>
