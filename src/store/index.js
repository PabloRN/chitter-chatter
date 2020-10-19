// Lib imports
import Vue from 'vue';
import Vuex from 'vuex';

// Store functionality
// @ts-ignore
import main from './modules/store';
import languageswitcher from './modules/languageswitcher';
import authorization from './modules/authorization';
import dialog from './modules/dialog';

Vue.use(Vuex);

// Create a new store
const store = new Vuex.Store({
  modules: {
    main, languageswitcher, authorization, dialog,
  },
  strict: process.env.NODE_ENV !== 'production',
});

export default store;
