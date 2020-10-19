<template>
  <div class="text-center">
    <v-menu open-on-hover top offset-y>
      <template v-slot:activator="{ on }">
        <v-btn
          color="white"
          dark
          small
          outlined
          tile
          v-on="on"
        >
          {{ getLang | allCapital }} <v-icon right>mdi-menu-down</v-icon>
        </v-btn>
      </template>

      <v-list
        dense>
        <v-list-item
          ripple
          dense
          v-for="(item, index) in items"
          :key="index"
          @click="changeLanguage(item)"
        >
          <v-list-item-title>{{ item.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script>
// Utilities
import {
  mapMutations,
  mapState,
  mapActions,
  mapGetters,
} from 'vuex';

export default {
  name: 'language-switcher',
  props: {
    position: String,
  },
  data: () => ({
    items: [
      { title: 'EN', lang: 'en' },
      { title: '和', lang: 'jp' },
    ],
    top: 'left',
    on: '',
  }),
  filters: {
    allCapital(string) {
      return string.toUpperCase();
    },
  },
  computed: {
    ...mapState('cognito', ['user']),
    ...mapState('authorization', ['password', 'email']),
    ...mapGetters('cognito', ['userAttributes']),
    ...mapGetters('cognito', ['userGroups']),
    ...mapGetters('languageswitcher', ['getLang']),
    userName() {
      const { email } = this.userAttributes;
      return email;
    },
    userRole() {
      return this.userGroups[0];
    },
  },
  mounted() {
    // this.$vuetify.lang.current = this.getLang;
  },
  methods: {

    ...mapActions('languageswitcher', ['SET_LANG']),
    ...mapMutations('main', ['setSnackbar']),
    changeLanguage({ lang }) {
      this.$vuetify.lang.current = lang;
      this.SET_LANG(lang);
    },
  },
  watch: {
    getLang() {
      this.$vuetify.lang.current = this.getLang;
    },
  },
};
</script>

<style scoped lang="scss">
.v-btn:not(.v-btn--round).v-size--small{
          border: thin solid rgba(255, 255, 255, 0.12);
    }
  .mini-profile-container{
    .v-footer{
      padding: 0;
      margin-top: 10px;
      background-color: transparent;
    }
      padding-bottom: 0px;
    .v-list__tile {
      border-radius: 4px;

      &--buy {
        margin-top: auto;
        margin-bottom: 17px;
      }
    }
      .v-list-item{
        .v-list-item__icon{
          margin-bottom: 3px;
          margin-top: 3px;
        }
        .v-list-item__title{
          margin-bottom: 3px;
           font-size: 10px;
           color: white;
           overflow: inherit;
        }
        border: thin solid rgba(255, 255, 255, 0.12);
        display: flex;
        align-items: center;
        flex-direction: row;
        flex-wrap: wrap;
        border-radius: 4px;
      }

    color: white;
    font-size: 10px;
  }
</style>
