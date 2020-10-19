/* eslint-disable no-underscore-dangle */
import { extend } from 'vee-validate';
import {
  required, email, confirmed, regex,
} from 'vee-validate/dist/rules';
import i18n from '@/i18n';

extend('required', {
  ...required,
  message: (_, values) => i18n.t('GENERAL_VALIDATION_MESSAGES_REQUIRED', values),
});
extend('regex', {
  ...regex,
  // message: (_, values) => i18n.t('GENERAL_VALIDATION_MESSAGES_REQUIRED', values),
});

extend('email', {
  ...email,
  message: (_, values) => i18n.t('LOGIN_FORM_EMAIL_VALID_MESSAGE', values),
});
extend('confirmed', {
  ...confirmed,
  message: (_, values) => i18n.t('CHANGE_PASSWORD_FORM_CONFIRMATION_VALID_MESSAGE', values),
});
