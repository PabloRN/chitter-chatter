<template>
  <div>
    <v-navigation-drawer
      v-model="showHistory"
      absolute
      bottom
      right
      temporary
      @update:model-value="onTransitionend"
    >
    <v-list dense>
        <v-list-item
          v-for="(item, index) in getText"
          :key="index"
        >
          <template v-slot:prepend v-if="index%2 === 0">
            <v-avatar color="grey darken-3">
              <v-img contain
                class="elevation-6 pa-1"
                alt=""
                :src="item.miniAvatar"
              ></v-img>
            </v-avatar>
          </template>

          <v-list-item-title style="font-size: 1.3rem;" class="chat-text" :class="{ 'text-right': index % 2 !== 0 }">
            {{ item.text }}
          </v-list-item-title>
          <v-list-item-subtitle style="font-size:0.8rem;color: darkgrey" :class="{ 'text-right': index % 2 !== 0 }">
            {{ item.nickname }}
          </v-list-item-subtitle>
          <v-list-item-subtitle style="font-size:0.8rem;color: darkgrey" class="chat-time" :class="{ 'text-right': index % 2 !== 0 }">
            {{ formattedDateTime(item.timestamp) }}
          </v-list-item-subtitle>

          <template v-slot:append v-if="index % 2 !== 0">
            <v-avatar color="grey darken-3">
              <v-img contain
                class="elevation-6 pa-1"
                alt=""
                :src="item.miniAvatar"
              ></v-img>
            </v-avatar>
          </template>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
  </div>
</template>

<script>
import { useMessagesStore } from '@/stores/messages';
import formatDate from '@/utils/timeTools';

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
      return this.messagesStore.getText;
    },
    showMessagesStatus() {
      return this.messagesStore.showMessagesStatus;
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
      this.showHistory = value;
    },
  },
};
</script>
<style scoped>
@import url(https://fonts.googleapis.com/css?family=Ubuntu:300,300italic,regular,italic,500,500italic,700,700italic);
.private-dialog{
  height:100%;
  position: relative;
}
.closedialog{
  position: absolute;
    right: 1px;
    top: 1px;
    z-index: 1;

}
.text-right {
  text-align: right;
}
.v-list-item__title, .v-list-item__subtitle {
    flex: 1 1 100%;
    overflow: hidden;
    text-overflow: inherit;
    white-space: inherit;
}
.v-list-item__title{
  font-family: 'Nanum Pen Script', cursive !important;
  font-size: 1.3rem ;
  line-height: 1.1;
}
.chat-time{
  font-size:  1rem;
  color: darkgrey;
}
</style>
