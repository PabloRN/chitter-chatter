<template>
  <v-scroll-y-reverse-transition>
    <div class="private-dialog text-body-2 pa-4" style="width:100%; height:80vh;">
            <v-btn
            @click="closedialogprivate"
            class="closedialog"
              color="grey lighten-2"
              fab
              small
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>
      <v-card id="dialogPrivate" class="pa-4" style="width:100%; height:65vh; overflow-y: scroll">
        <v-card-title class="text-body-2">

        </v-card-title>
        <v-card-text v-for="(t, idx) in text" :key="idx" style="height: 10vh;"
         :class="t.userId === getCurrentUser.userId
         ? 'd-flex justify-end align-center' : 'd-flex justify-start align-center' ">
          <v-avatar v-if="t.userId !== getCurrentUser.userId">
            <img :src="userData[t.userId].miniavatar" alt="avatar">
          </v-avatar>
          {{t.message}}
          <v-avatar v-if="t.userId === getCurrentUser.userId">
            <img :src="getCurrentUser.miniavatar" alt="avatar">
          </v-avatar>
        </v-card-text>
      </v-card>
      <PrivateTypeBox />

    </div>
  </v-scroll-y-reverse-transition>
</template>

<script>
import PrivateTypeBox from '@/components/PrivateTypeBox.vue';
import { mapGetters, mapState } from 'vuex';

export default {
  name: 'privatedialogbubble',
  components: {
    PrivateTypeBox,
  },
  props: {
    message: Array,
  },
  data: () => ({
    text: '',
  }),
  mounted() {
    console.log(this.message);
    this.text = this.message;
  },
  computed: {
    // ...mapGetters('messages', ['getText']),
    ...mapGetters('user', ['getCurrentUser']),
    ...mapState('user', ['userData']),
  },
  methods: {
    gotoBottom(element) {
      console.log(element);
      // eslint-disable-next-line no-param-reassign
      element.scrollTop = element.scrollHeight;
    },
    closedialogprivate() {
      this.$emit('privateMessageClosed');
    },
  },
  watch: {
    message(value) {
      console.log(value);
      if (value && value.length > 0) {
        this.text = value;
        this.avatar = value.avatar;
        const element = document.getElementById('dialogPrivate');
        this.gotoBottom(element);
      }
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
</style>
