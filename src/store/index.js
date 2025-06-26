// Lib imports
import { createStore } from 'vuex';

// Store functionality
// @ts-ignore
import main from './modules/store';
import languageswitcher from './modules/languageswitcher';
import user from './modules/user';
import messages from './modules/messages';
import rooms from './modules/rooms';

// Create a new store
const store = createStore({
  modules: {
    main, languageswitcher, user, messages, rooms,
  },
  strict: process.env.NODE_ENV !== 'production',
});

export default store;
