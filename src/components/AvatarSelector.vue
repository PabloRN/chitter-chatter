<!-- eslint-disable max-len -->
<template>
  <div class="text-center">
    <v-bottom-sheet v-model="sheet" width="50%">
      <v-sheet class="text-center" height="250px">
        <div class="py-1">
          <div style="width:95%;margin:20px auto;height:200px">
            <v-dialog
      v-model="showLoginDialog"
      persistent
      max-width="290"
    >
      <v-card>
        <v-card-title class="text-h5">
          Use Google's location service?
        </v-card-title>
        <v-card-text>Let Google help apps determine location. This means sending anonymous location data to Google, even when no apps are running.</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="green darken-1"
            text
            @click="() => { showLoginDialog = false; $emit('onClose'); }"
          >
            Disagree
          </v-btn>
          <v-btn
            color="green darken-1"
            text
            @click="() => { showLoginDialog = false; $emit('onShowLoginDialog'); }"
          >
            Agree
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
            <!-- Using the slider component -->
            <slider ref="slider" :options="options" style=" width:100%">
              <!-- slideritem wrapped package with the components you need -->
              <slideritem class="slider-item-custom" v-for="(item, index) in avatarsList" :key="index"
                 style="width:10%;margin-right: 2%;">
                <v-img contain style="background-size: contain;"
                 @click="(event) => { avatarSelected(event, item) }" class="chatter" height="200" width="70" :src="item.url"></v-img>
              </slideritem>
              <!-- Customizable loading -->
              <div slot="loading">loading...</div>
            </slider>
          </div>
        </div>
      </v-sheet>
    </v-bottom-sheet>
  </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import { slider, slideritem } from 'vue-concise-slider';

export default {

  components: {
    slider,
    slideritem,
  },
  props: {
    showAvatarSelector: {
      default: false,
      type: Boolean,
    },
  },
  data: () => ({
    showLoginDialog: false,
    isLoading: false,
    sheet: false,
    // Slider configuration [obj]
    options: {
      currentPage: 0,
      tracking: true,
      thresholdDistance: 50,
      thresholdTime: 500,
      infinite: 7,
      loopedSlides: 7,
      slidesToScroll: 7,
      loop: false,
      itemAnimation: false,

    },
    avatars: [],
  }),
  computed: {
    ...mapState('rooms', ['avatarsList']),
    ...mapState('user', ['currentUser']),
  },
  created() {
    this.avatars = this.avatarsList;
  },
  mounted() {
    this.avatars = this.avatarsList;
  },
  methods: {
    ...mapActions('user', ['signUserIn', 'changeAvatar']),
    setIsLoading(val) {
      this.isLoading = val;
    },
    submit() {
      this.signUserIn();
    },
    // slide(data) {
    //   console.log('slide', data);
    // },
    // onTap(data) {
    //   console.log('tap', data);
    // },
    avatarSelected(e, itemSelected) {
      e.stopPropagation();
      e.preventDefault();
      if (!this.currentUser.isAnonymous) {
        this.changeAvatar(itemSelected.url);
        this.$emit('onClose');
      } else {
        this.showLoginDialog = true;
      }
    },
    // onInit(data) {
    //   console.log(data);
    // },
  },
  watch: {
    showAvatarSelector(newVal) {
      this.sheet = newVal;
    },
  },
};
</script>
<style >
.login_card {
  background-color: transparent !important;
}

.slider-item-custom {
  width: '12%' !important;
  margin-right: '2%' !important;
  border: 1px solid #000000;
  cursor: pointer!important;
}
</style>
