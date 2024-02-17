<!-- eslint-disable max-len -->
<template>
  <div class="text-center">
    <v-bottom-sheet v-model="sheet">
      <v-sheet class="text-center" height="200px">
        <v-btn class="mt-6" text color="red" @click="() => this.$emit('onClose')">
          close
        </v-btn>
        <div class="py-3">
          <VueSlickCarousel v-bind="settings">
            <div>
              <h3>1</h3>
            </div>
            <div>
              <h3>2</h3>
            </div>
            <div>
              <h3>3</h3>
            </div>
            <div>
              <h3>4</h3>
            </div>
            <div>
              <h3>5</h3>
            </div>
            <div>
              <h3>6</h3>
            </div>
            <div>
              <h3>7</h3>
            </div>
            <div>
              <h3>8</h3>
            </div>
            <div>
              <h3>9</h3>
            </div>
            <div>
              <h3>10</h3>
            </div>
            <div>
              <h3>11</h3>
            </div>
            <div>
              <h3>12</h3>
            </div>
            <div>
              <h3>13</h3>
            </div>
            <div>
              <h3>14</h3>
            </div>
          </VueSlickCarousel>
        </div>
      </v-sheet>
    </v-bottom-sheet>
  </div>
</template>

<script>
import { mapActions } from 'vuex';
import VueSlickCarousel from 'vue-slick-carousel';
import 'vue-slick-carousel/dist/vue-slick-carousel.css';
// optional style for arrows & dots
import 'vue-slick-carousel/dist/vue-slick-carousel-theme.css';

export default {

  components: {
    VueSlickCarousel,
  },
  props: {
    showAvatarSelector: Boolean,
  },
  data: () => ({
    isLoading: false,
    sheet: false,
    settings: {
      dots: true,
      arrows: true,
      focusOnSelect: true,
      infinite: true,
      speed: 500,
      slidesToShow: 6,
      slidesToScroll: 6,
      touchThreshold: 5,
    },
  }),
  computed: {

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
  },
  watch: {
    showAvatarSelector(newVal) {
      this.sheet = newVal;
    },
  },
};
</script>
<style >.login_card {
  background-color: transparent !important;
}</style>
