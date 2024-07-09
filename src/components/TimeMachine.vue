<template>
  <v-scroll-y-reverse-transition>
    <v-navigation-drawer
      v-model="showHistory"
      absolute
      bottom
      right
      temporary
      @input="(object) => { onTransitionend(object) }"
    >
    <v-list dense>
        <v-list-item
          v-for="(item, index) in getText"
          :key="index"
        >
          <v-list-item-avatar v-if="index%2 === 0" color="grey darken-3">
          <v-img contain
            class="elevation-6 pa-1"
            alt=""
            :src="item.miniAvatar"
          ></v-img>
        </v-list-item-avatar>

          <v-list-item-content :class="{ 'text-right': index % 2 !== 0 }">
            <v-list-item-title style="font-size: 1.3rem;" class="chat-text">
            {{ item.text }}</v-list-item-title>
            <v-list-item-subtitle style="font-size:0.8rem;color: darkgrey">
            {{ item.nickname }}</v-list-item-subtitle>
            <v-list-item-subtitle style="font-size:0.8rem;color: darkgrey" class="chat-time">
             {{ formattedDateTime(item.timestamp) }}
           </v-list-item-subtitle>
          </v-list-item-content>

          <v-list-item-avatar  v-if="index % 2 !== 0" color="grey darken-3">
          <v-img contain
            class="elevation-6  pa-1"
            alt=""
            :src="item.miniAvatar"
          ></v-img>
        </v-list-item-avatar>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
  </v-scroll-y-reverse-transition>
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex';
import formatDate from '@/utils/timeTools';

export default {
  name: 'timeMachine',
  components: {
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
    ...mapGetters('messages', ['getText']),
    ...mapState('messages', ['showMessagesStatus']),

  },
  methods: {
    ...mapActions('messages', ['showMessages']),
    onTransitionend(value) {
      if (!value) this.showMessages(false);
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
