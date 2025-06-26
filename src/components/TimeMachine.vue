<template>
  <div>
    <!-- Desktop: Navigation Drawer on the right -->
    <v-navigation-drawer v-if="!isMobileDevice" v-model="showHistory" location="right" temporary width="400"
      @update:model-value="onTransitionend">
      <v-card flat>
        <v-card-title class="d-flex justify-space-between align-center pa-4">
          <span>Message History</span>
          <v-btn icon size="small" @click="showHistory = false">
            <v-icon class="manga-icon">mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pa-2" style="height: calc(100vh - 80px); overflow-y: auto;">
          <v-list density="compact">
            <v-list-item v-for="(item, index) in getText" :key="index" class="mb-2">
              <template v-slot:prepend v-if="index % 2 === 0">
                <v-avatar color="grey darken-3" size="32">
                  <v-img contain class="elevation-2" alt="" :src="item.miniAvatar"></v-img>
                </v-avatar>
              </template>

              <div>
                <v-list-item-title style="font-size: 1rem;" class="chat-text"
                  :class="{ 'text-right': index % 2 !== 0 }">
                  {{ item.text }}
                </v-list-item-title>
                <v-list-item-subtitle style="font-size:0.7rem;color: darkgrey"
                  :class="{ 'text-right': index % 2 !== 0 }">
                  {{ item.nickname }} - {{ formattedDateTime(item.timestamp) }}
                </v-list-item-subtitle>
              </div>

              <template v-slot:append v-if="index % 2 !== 0">
                <v-avatar color="grey darken-3" size="32">
                  <v-img contain class="elevation-2" alt="" :src="item.miniAvatar"></v-img>
                </v-avatar>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-navigation-drawer>

    <!-- Mobile: Dialog overlay -->
    <v-dialog v-if="isMobileDevice" v-model="showHistory" max-width="500" scrollable
      @update:model-value="onTransitionend">
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          <span>Message History</span>
          <v-btn icon @click="showHistory = false">
            <v-icon class="manga-icon">mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text style="height: 400px;">
          <v-list density="compact">
            <v-list-item v-for="(item, index) in getText" :key="index">
              <template v-slot:prepend v-if="index % 2 === 0">
                <v-avatar color="grey darken-3" size="32">
                  <v-img contain class="elevation-2" alt="" :src="item.miniAvatar"></v-img>
                </v-avatar>
              </template>

              <div>
                <v-list-item-title style="font-size: 1rem;" class="chat-text"
                  :class="{ 'text-right': index % 2 !== 0 }">
                  {{ item.text }}
                </v-list-item-title>
                <v-list-item-subtitle style="font-size:0.7rem;color: darkgrey"
                  :class="{ 'text-right': index % 2 !== 0 }">
                  {{ item.nickname }} - {{ formattedDateTime(item.timestamp) }}
                </v-list-item-subtitle>
              </div>

              <template v-slot:append v-if="index % 2 !== 0">
                <v-avatar color="grey darken-3" size="32">
                  <v-img contain class="elevation-2" alt="" :src="item.miniAvatar"></v-img>
                </v-avatar>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import useMessagesStore from '@/stores/messages';
import formatDate from '@/utils/timeTools';
import isMobile from '@/utils/mobileDetection';

export default {
  name: 'TimeMachine',
  components: {
  },
  setup() {
    const messagesStore = useMessagesStore();

    return {
      messagesStore,
    };
  },
  props: {
    message: Array,
  },
  data: () => ({
    showHistory: false,
  }),
  mounted() {
    this.text = this.message;
  },
  computed: {
    getText() {
      const messages = this.messagesStore.getText;
      console.log('TimeMachine getText:', messages.length, 'messages');
      return messages;
    },
    showMessagesStatus() {
      const status = this.messagesStore.showMessagesStatus;
      console.log('TimeMachine showMessagesStatus:', status);
      return status;
    },
    isMobileDevice() {
      return isMobile();
    },
  },
  methods: {
    onTransitionend(value) {
      if (!value) this.messagesStore.showMessages(false);
    },
    formattedDateTime(timestamp) {
      return formatDate(timestamp);
    },
  },
  watch: {
    showMessagesStatus(value) {
      console.log('TimeMachine watch showMessagesStatus:', value);
      this.showHistory = value;
      console.log('TimeMachine showHistory set to:', this.showHistory);
    },
  },
};
</script>
<style scoped>
@import url(https://fonts.googleapis.com/css?family=Ubuntu:300,300italic,regular,italic,500,500italic,700,700italic);

.private-dialog {
  height: 100%;
  position: relative;
}

.closedialog {
  position: absolute;
  right: 1px;
  top: 1px;
  z-index: 1;

}

.text-right {
  text-align: right;
}

.v-list-item__title,
.v-list-item__subtitle {
  flex: 1 1 100%;
  overflow: hidden;
  text-overflow: inherit;
  white-space: inherit;
}

.v-list-item__title {
  font-family: 'Nanum Pen Script', cursive !important;
  font-size: 1.3rem;
  line-height: 1.1;
}

.chat-time {
  font-size: 1rem;
  color: darkgrey;
}

/* Simple Icon Styling */
.manga-icon {
  color: #666666 !important;

  &:hover {
    color: #333333 !important;
  }
}
</style>
