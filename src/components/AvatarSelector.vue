<!-- eslint-disable max-len -->
<template>
  <div class="text-center">
    <v-bottom-sheet v-model="sheet" width="50%">
      <v-sheet class="text-center" height="250px">
        <div class="py-1">
          <div style="width: 95%; margin: 20px auto; height: 200px">
            <!-- Using the slider component -->
            <slider ref="slider" :options="options" style="width: 100%">
              <!-- slideritem wrapped package with the components you need -->
              <slideritem
                class="slider-item-custom"
                v-for="(item, index) in avatarsList"
                :key="index"
                style="width: 10%; margin-right: 2%"
              >
                <v-img
                  contain
                  style="background-size: contain"
                  @click="
                    (event) => {
                      avatarSelected(event, item);
                    }
                  "
                  class="chatter"
                  height="200"
                  width="70"
                  :src="item.url"
                ></v-img>
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
    itemSelectedUrl: '',
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
    ...mapState('user', ['currentUser', 'signingInUpgraded']),
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
      if (this.currentUser.isAnonymous) {
        this.changeAvatar(itemSelected.url);
        this.$emit('onClose');
      } else {
        this.itemSelectedUrl = itemSelected.url;
        this.$emit('onShowLoginDialog');
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
    async signingInUpgraded(newVal) {
      setTimeout(() => {
        if (newVal === true && this.itemSelectedUrl !== '') {
          this.changeAvatar(this.itemSelectedUrl);
        }
      }, 1000);
    },
  },
};
</script>
<style>
.login_card {
  background-color: transparent !important;
}

.slider-item-custom {
  width: '12%' !important;
  margin-right: '2%' !important;
  border: 1px solid #000000;
  cursor: pointer !important;
}
</style>
