<!-- eslint-disable max-len -->
<template>
  <div class="text-center">
    <v-bottom-sheet v-model="sheet" width="50%" v-click-outside="clickedOutside">
      <v-sheet class="text-center" height="250px">
        <div class="py-1">
          <div style="width:95%;margin:20px auto;height:200px">
            <!-- Using the slider component -->
            <slider ref="slider" :options="options" @slide='slide' @tap='onTap' @init='onInit' style=" width:100%">
              <!-- slideritem wrapped package with the components you need -->
              <slideritem class="slider-item-custom" v-for="(item, index) in avatarsList" :key="index" style=" width:10%;margin-right: 2%;">
                <v-img class="chatter" height="200" width="70" :src="item.url"></v-img>
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
    showAvatarSelector: Boolean,
  },
  data: () => ({
    isLoading: false,
    sheet: true,
    someList: [
      {
        html: 'slider1',
        style: {
          background: '#4abf8a',
          width: '12%',
          'margin-right': '2%',
        },
      },
      {
        html: 'slider2',
        style: {
          background: '#4bbfc3',
          width: '12%',
          'margin-right': '2%',
        },
      },
      {
        html: 'slider3',
        style: {
          background: '#7baabe',
          width: '12%',
          'margin-right': '2%',
        },
      },
      {
        html: 'slider4',
        style: {
          background: '#7caabe',
          width: '12%',
          'margin-right': '2%',
        },
      },
      {
        html: 'slider5',
        style: {
          background: '#4abf8a',
          width: '12%',
          'margin-right': '2%',
        },
      },
      {
        html: 'slider6',
        style: {
          background: '#4bbfc3',
          width: '12%',
          'margin-right': '2%',
        },
      },
      {
        html: 'slider7',
        style: {
          background: '#7baabe',
          width: '12%',
          'margin-right': '2%',
        },
      },
      {
        html: 'slider8',
        style: {
          background: '#7caabe',
          width: '12%',
          'margin-right': '2%',
        },
      },
      {
        html: 'slider9',
        style: {
          background: '#7caabe',
          width: '12%',
          'margin-right': '2%',
        },
      },
      {
        html: 'slider10',
        style: {
          background: '#7caabe',
          width: '12%',
          'margin-right': '2%',
        },
      },
      {
        html: 'slider11',
        style: {
          background: '#7caabe',
          width: '12%',
          'margin-right': '2%',
        },
      },
      {
        html: 'slider12',
        style: {
          background: '#7caabe',
          width: '12%',
          'margin-right': '2%',
        },
      },
      {
        html: 'slider13',
        style: {
          background: '#7caabe',
          width: '12%',
          'margin-right': '2%',
        },
      },
      {
        html: 'slider14',
        style: {
          background: '#7caabe',
          width: '12%',
          'margin-right': '2%',
        },
      },
    ],
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
  },
  created() {
    this.avatars = this.avatarList;
    console.log('this.avatars', this.avatarsList);
  },
  mounted() {
    // this.setDrawer(false);
  },
  methods: {
    ...mapActions('user', ['signUserIn']),
    setIsLoading(val) {
      this.isLoading = val;
    },
    submit() {
      this.signUserIn();
    },
    slide(data) {
      console.log(data);
    },
    onTap(data) {
      console.log(data);
    },
    onInit(data) {
      console.log(data);
    },
    clickedOutside() {
      console.log('onClose clicked');
      this.$emit('onClose');
    },
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
  width: '12%'!important;
  margin-right: '2%'!important;
  border: 1px solid #000000
}</style>
