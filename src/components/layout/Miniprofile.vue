<template>
  <v-container class="mini-profile-container">
    <v-row>
      <v-col>
        <v-row>
          <v-col>
            <v-row align="center" justify="center">
              <v-icon center>
                mdi-account-circle
              </v-icon>
            </v-row>
            <v-row align="center" justify="center"><span>{{userName | limit(0,15)}}</span></v-row>
            <v-row align="center" justify="center"><span><b>{{userRole}}</b></span></v-row>
            <v-row v-if="!userName"
                   align="center"
                  justify="center">
                  <span><b>Guest</b></span>
            </v-row>
          </v-col>
        </v-row>
        <v-row class="d-flex flex-column justify-center align-center">
                <v-list-item
                   link @click="logout">
                    <v-list-item-icon class="d-flex flex-column justify-center align-center m-1">
                      <v-icon>mdi-logout</v-icon>
                      <span class="text-caption">{{ $t('LEFT_SIDEBAR_MINIPROFILE_LOGOUT') }}</span>
                    </v-list-item-icon>
                </v-list-item>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
// Utilities

export default {
  name: 'mini-profile',
  props: {
    opened: {
      type: Boolean,
      default: false,
      email: '',
    },
  },
  data: () => ({
  }),
  filters: {
    limit(value, start, end) {
      if (!value) return '';
      return value.substring(start, end);
    },
  },
  computed: {

    userName() {
      const { email } = this.userAttributes;
      return email;
    },
    userRole() {
      return this.userGroups[0];
    },
  },

  methods: {
    logout() {
      this.$router.push({ name: 'login' });
      this.$ls.set('isLoggedIn', false);
      this.signOut()
        .then(() => {
          this.setSnackbar({
            type: 'success',
            msg: 'Successfully signed out',
          });

          this.setEmail('');
          this.setPassword('');
          this.setUser('');
        });
    },
  },
};
</script>

<style scoped lang="scss">
  .mini-profile-container{
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
        border-radius: 4px;
      }

    color: white;
    font-size: 10px;
  }
</style>
