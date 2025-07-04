<template>
  <v-snackbar v-model="model" :color="snackbar.type" :timeout="snackbar.persistent ? -1 : snackbar.timeout" right>
    <VIcon :dark="snackbar.type !== 'warning'" class="mr-2">
      {{ icon }}
    </VIcon>
    <span :class="snackbar.type === 'warning' ? 'black--text' : 'white--text'">{{ snackbar.msg }}</span>
    <template v-if="snackbar.action" v-slot:action="{ attrs }">
      <v-btn :color="snackbar.type === 'warning' ? 'black' : 'white'" text v-bind="attrs" @click="handleAction">
        {{ snackbar.action }}
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script>
// Utilities
import useMainStore from '@/stores/main';

const ICON_MAP = {
  error: 'mdi-alert-octagon',
  info: 'mdi-information',
  success: 'mdi-check-circle',
  warning: 'mdi-alert-circle',
};

export default {
  name: 'SnackBar',
  setup() {
    const mainStore = useMainStore();

    return {
      mainStore,
    };
  },
  data: () => ({
    model: false,
  }),

  computed: {
    snackbar() {
      return this.mainStore.snackbar;
    },
    icon() {
      return ICON_MAP[this.snackbar.type] || 'mdi-playlist-check';
    },
  },

  watch: {
    snackbar() {
      this.model = true;
    },
  },

  methods: {
    handleAction() {
      if (this.snackbar.action === 'RETRY') {
        this.mainStore.retryConnection();
      }
      this.model = false;
    },
  },
};
</script>
