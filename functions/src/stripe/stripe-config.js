const { defineString } = require('firebase-functions/params');

// Define Stripe secret key parameter
const stripeSecretKey = defineString('STRIPE_SECRET_KEY');

// Lazy-load Stripe only when needed
let stripe;
const getStripe = () => {
  if (!stripe) {
    stripe = require('stripe')(stripeSecretKey.value());
  }
  return stripe;
};

module.exports = getStripe;
