import Vue from 'vue';
import { sync } from 'vuex-router-sync';
import lodash from 'lodash';
import Storage from 'vue-ls';
import * as firebase from 'firebase';
import App from './App.vue';
import './registerServiceWorker';
import router from './router';
import store from './store';
import vuetify from './plugins/vuetify';
import i18n from './i18n';
import './utils/vee-validate';
import './assets/scss/main.scss';

// Sync store with router
sync(store, router);
const options = {
  name: 'ls', // name variable Vue.[ls] or this.[$ls],
  storage: 'local', // storage name session, local, memory
};
Vue.use(Storage, options);
Vue.config.productionTip = false;
Vue.prototype._ = lodash;

new Vue({

  async created() {
    firebase.initializeApp(
      {
        apiKey: 'AIzaSyAcSF4KWLbqqfc3EJDOBgJrHBbUR4D-5hg',
        authDomain: 'chitter-chatter-f762a.firebaseapp.com',
        databaseURL: 'https://chitter-chatter-f762a.firebaseio.com',
        projectId: 'chitter-chatter-f762a',
        storageBucket: 'chitter-chatter-f762a.appspot.com',
        messagingSenderId: '63563490823',
        appId: '1:63563490823:web:a6b6dc9011861f6d0d2ca2',
        measurementId: 'G-JCDBMEBPZZ',
      },
    );
  },
  router,
  store,
  vuetify,
  i18n,
  render: (h) => h(App),
}).$mount('#app');
