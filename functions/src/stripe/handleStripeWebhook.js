const { onRequest } = require('firebase-functions/v2/https');
const { defineString } = require('firebase-functions/params');
const admin = require('firebase-admin');
const getStripe = require('./stripe-config');

const stripeWebhookSecret = defineString('STRIPE_WEBHOOK_SECRET');

// Stripe Price ID to Tier mapping (must match subscriptionService.js)
const STRIPE_PRICE_IDS = {
  'price_1SK4YXBmoCe1wac303G15iyR': 'landlord', // landlord_monthly
  'price_1SK4YWBmoCe1wac3XfXnod9L': 'landlord', // landlord_annual
  'price_1SNCJoBmoCe1wac39auhID7K': 'creator',   // creator_monthly
  'price_1SNCLtBmoCe1wac3TnZh9kjj': 'creator',   // creator_annual
};

exports.handleStripeWebhook = onRequest(
  {
    region: 'us-central1',
  },
  async (req, res) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const sig = req.headers['stripe-signature'];
    let event;

    try {
      const stripe = getStripe();
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        stripeWebhookSecret.value(),
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // Handle the event
    try {
      switch (event.type) {
        // Subscription events
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await handleSubscriptionUpdate(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event.data.object);
          break;

        // Checkout and payment events (for both subscriptions and one-time purchases)
        case 'checkout.session.completed':
          await handleCheckoutCompleted(event.data.object);
          break;

        case 'payment_intent.succeeded':
          await handlePaymentSucceeded(event.data.object);
          break;

        case 'payment_intent.payment_failed':
          await handlePaymentFailed(event.data.object);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Error handling webhook event:', error);
      res.status(500).json({ error: 'Webhook handler failed' });
    }
  },
);

/**
 * Handle subscription creation/update
 */
async function handleSubscriptionUpdate(subscription) {
  try {
    console.log('Processing subscription update:', subscription.id);

    const userId = subscription.metadata?.userId || await getUserIdFromCustomer(subscription.customer);
    if (!userId) {
      console.error('No userId found for subscription:', subscription.id);
      return;
    }

    // Determine tier from price ID using mapping
    const priceId = subscription.items.data[0].price.id;
    const tier = STRIPE_PRICE_IDS[priceId] || 'free';

    console.log(`Subscription details - userId: ${userId}, priceId: ${priceId}, tier: ${tier}, status: ${subscription.status}, cancel_at_period_end: ${subscription.cancel_at_period_end}, cancel_at: ${subscription.cancel_at}`);

    // Check if subscription is canceled via either method
    const isCanceled = subscription.cancel_at_period_end || !!subscription.cancel_at;

    // Get previous subscription data to detect new subscriptions
    const previousSubSnapshot = await admin.database().ref(`users/${userId}/subscription`).once('value');
    const previousSub = previousSubSnapshot.val();
    const isNewSubscription = !previousSub || !previousSub.stripeSubscriptionId || previousSub.tier === 'free';

    // Prepare update data with null checks
    const updateData = {
      tier,
      status: subscription.status,
      stripeCustomerId: subscription.customer,
      stripePriceId: priceId,
      stripeSubscriptionId: subscription.id,
      updatedAt: admin.database.ServerValue.TIMESTAMP,
    };

    // Only add currentPeriodEnd if it exists (avoid NaN)
    if (subscription.current_period_end) {
      updateData.currentPeriodEnd = subscription.current_period_end * 1000;
    }

    // Add cancelAtPeriodEnd (boolean flag)
    if (subscription.cancel_at_period_end !== undefined) {
      updateData.cancelAtPeriodEnd = subscription.cancel_at_period_end;
    }

    // Add cancelAt (timestamp) - handles scheduled cancellations
    if (subscription.cancel_at) {
      updateData.cancelAt = subscription.cancel_at * 1000;
      updateData.cancelAtPeriodEnd = true; // Also set flag for UI
    } else {
      updateData.cancelAt = null;
    }

    // Update user subscription in Firebase
    await admin.database().ref(`users/${userId}/subscription`).update(updateData);

    // Update top-level fields
    await admin.database().ref(`users/${userId}`).update({
      subscriptionTier: tier,
      isCreator: tier === 'creator',
    });

    console.log(`✅ Subscription updated successfully for user ${userId}: ${tier}, cancelAtPeriodEnd: ${updateData.cancelAtPeriodEnd !== undefined ? updateData.cancelAtPeriodEnd : 'not set'}, cancelAt: ${updateData.cancelAt || 'not set'}`);

    // Get user email from Firebase Auth (not Realtime Database)
    let userEmail = null;
    try {
      const userRecord = await admin.auth().getUser(userId);
      userEmail = userRecord.email;
    } catch (authError) {
      console.error('Error getting user from Firebase Auth:', authError);
    }

    console.log(`User email found: ${userEmail || 'NOT FOUND'}`);
    console.log(`isNewSubscription: ${isNewSubscription}, isCanceled: ${isCanceled}`);

    if (!userEmail) {
      console.warn('⚠️ No email found for user, skipping email notifications');
    }

    if (userEmail) {
      // Detect if this is a new subscription (user just subscribed)
      if (isNewSubscription && tier !== 'free') {
        console.log(`📧 Sending subscription confirmation email to ${userEmail}`);
        const sendSubscriptionConfirmation = require('../email/sendSubscriptionConfirmationEmail');
        await sendSubscriptionConfirmation.sendEmail(userEmail, {
          tier,
          userId,
          subscriptionId: subscription.id,
        });

        // Send admin notification for new subscription
        console.log(`📧 Sending admin notification for new ${tier} subscription`);
        const sendAdminSubscriptionNotification = require('../email/sendAdminSubscriptionNotification');
        await sendAdminSubscriptionNotification.sendEmail({
          tier,
          userId,
          userEmail,
          subscriptionId: subscription.id,
        });
      }

      // Detect if subscription was just canceled
      const wasCanceled = previousSub && !previousSub.cancelAtPeriodEnd && isCanceled;
      if (wasCanceled) {
        console.log(`📧 Sending cancellation email to ${userEmail}`);
        const sendCancellationEmail = require('../email/sendSubscriptionCancellationEmail');
        await sendCancellationEmail.sendEmail(userEmail, {
          tier,
          userId,
          subscriptionId: subscription.id,
          cancelAt: updateData.cancelAt,
          currentPeriodEnd: updateData.currentPeriodEnd,
        });

        // Send admin notification for cancellation with full details
        console.log(`📧 Sending admin notification for ${tier} cancellation`);
        const sendAdminCancellationNotification = require('../email/sendAdminCancellationNotification');
        await sendAdminCancellationNotification.sendEmail({
          tier,
          userId,
          userEmail,
          subscriptionId: subscription.id,
          cancelAt: updateData.cancelAt,
          currentPeriodEnd: updateData.currentPeriodEnd,
          cancellationDetails: subscription.cancellation_details || null,
        });
      }
    }
  } catch (error) {
    console.error('❌ Error in handleSubscriptionUpdate:', error);
    console.error('Subscription object:', JSON.stringify(subscription, null, 2));
    throw error; // Re-throw to return 500 to Stripe for retry
  }
}

/**
 * Handle successful checkout (for both subscriptions and one-time payments)
 */
async function handleCheckoutCompleted(session) {
  const userId = session.metadata?.userId;
  const type = session.metadata?.type;

  if (!userId) {
    console.error('No userId in checkout session metadata:', session.id);
    return;
  }

  // If it's a room slot purchase
  if (type === 'room_slot' && session.mode === 'payment') {
    const userRef = admin.database().ref(`users/${userId}`);
    const userSnapshot = await userRef.once('value');
    const userData = userSnapshot.val();

    const currentSlots = userData?.purchasedRoomSlots || 0;
    const newSlotCount = currentSlots + 1;

    // Update purchased room slots
    await userRef.update({
      purchasedRoomSlots: newSlotCount,
    });

    // Record the purchase
    const purchaseId = admin.database().ref().push().key;
    await userRef.child('roomSlotPurchases').child(purchaseId).set({
      purchaseId,
      stripeSessionId: session.id,
      stripePaymentIntent: session.payment_intent,
      amount: session.amount_total / 100,
      currency: session.currency,
      purchasedAt: admin.database.ServerValue.TIMESTAMP,
      status: 'completed',
    });

    console.log(`Room slot purchased for user ${userId}. New total: ${newSlotCount}`);
  }
}

/**
 * Handle subscription deletion
 */
async function handleSubscriptionDeleted(subscription) {
  const userId = subscription.metadata?.userId || await getUserIdFromCustomer(subscription.customer);
  if (!userId) {
    console.error('No userId found for deleted subscription:', subscription.id);
    return;
  }

  // Revert to free tier
  await admin.database().ref(`users/${userId}/subscription`).update({
    tier: 'free',
    status: 'canceled',
    cancelAtPeriodEnd: false,
    updatedAt: admin.database.ServerValue.TIMESTAMP,
  });

  await admin.database().ref(`users/${userId}`).update({
    subscriptionTier: 'free',
    isCreator: false,
  });

  console.log(`Subscription deleted for user ${userId}`);
}

/**
 * Handle successful payment intent
 */
async function handlePaymentSucceeded(paymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id);
  // Additional logging or processing if needed
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent) {
  console.error('Payment failed:', paymentIntent.id);
  // You might want to notify the user or log this for follow-up
}

/**
 * Helper function to get userId from Stripe customer ID
 */
async function getUserIdFromCustomer(customerId) {
  const usersRef = admin.database().ref('users');
  const snapshot = await usersRef.orderByChild('subscription/stripeCustomerId').equalTo(customerId).once('value');

  if (snapshot.exists()) {
    const users = snapshot.val();
    return Object.keys(users)[0];
  }

  return null;
}
