# Complete Stripe Setup Guide for ToonsTalk Subscriptions

This guide will walk you through setting up your three subscription tiers in Stripe: **Free**, **Landlord**, and **Creator**.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Creating Products in Stripe Dashboard](#creating-products-in-stripe-dashboard)
3. [Getting Your Price IDs](#getting-your-price-ids)
4. [Updating Your Code with Price IDs](#updating-your-code-with-price-ids)
5. [Setting Up Firebase Cloud Functions](#setting-up-firebase-cloud-functions)
6. [Configuring Stripe Webhooks](#configuring-stripe-webhooks)
7. [Setting Up Customer Portal](#setting-up-customer-portal)
8. [Testing Your Integration](#testing-your-integration)
9. [Going Live](#going-live)

---

## Prerequisites

### 1. Create/Access Your Stripe Account
1. Go to https://stripe.com
2. Sign up or log in
3. Complete business verification (optional for testing, required for production)

### 2. Get Your API Keys
1. In Stripe Dashboard, click **Developers** → **API keys**
2. You'll see:
   - **Publishable key**: Starts with `pk_test_` (for frontend)
   - **Secret key**: Starts with `sk_test_` (for backend)
3. **IMPORTANT**: Keep secret keys secure, never commit to git

### 3. Install Stripe in Your Firebase Functions
```bash
cd functions
npm install stripe
```

---

## Creating Products in Stripe Dashboard

### Product 1: Landlord (Monthly & Annual)

#### Step 1: Create the Product
1. Go to **Products** → **Add Product**
2. Fill in the details:
   - **Name**: `Landlord`
   - **Description**: `For serious room creators - unlimited private rooms, custom backgrounds, and advanced moderation tools.`
   - **Image**: Upload a product image (optional but recommended)
   - **Statement descriptor**: `TOONSTALK LANDLORD` (what appears on credit card statements)

#### Step 2: Set Up Monthly Pricing
1. Under **Pricing**, click **Add pricing**
2. Configure:
   - **Price**: `9.99`
   - **Billing period**: `Monthly`
   - **Currency**: `USD` (or your currency)
   - **Pricing model**: `Standard pricing`
3. Click **Add pricing**
4. **Important**: Copy the **Price ID** (starts with `price_...`) - you'll need this!

#### Step 3: Set Up Annual Pricing
1. Click **Add another price** on the same product
2. Configure:
   - **Price**: `95.88` (20% discount: $9.99 × 12 × 0.8)
   - **Billing period**: `Yearly`
   - **Currency**: `USD`
   - **Pricing model**: `Standard pricing`
3. Click **Add pricing**
4. **Important**: Copy this **Price ID** too

#### Step 4: Add Product Metadata (Optional but Recommended)
1. Scroll to **Product metadata** section
2. Add key-value pairs:
   ```
   tier: landlord
   features: private_rooms,custom_backgrounds,moderation_tools,room_analytics,priority_support,no_ads,custom_urls
   max_private_rooms: unlimited
   ```
3. This helps track features and tier levels

---

### Product 2: Creator (Monthly & Annual)

#### Step 1: Create the Product
1. Go to **Products** → **Add Product**
2. Fill in:
   - **Name**: `Creator`
   - **Description**: `For professional creators - custom branding, API access, white-label options, and revenue sharing.`
   - **Statement descriptor**: `TOONSTALK CREATOR`

#### Step 2: Set Up Monthly Pricing
1. Click **Add pricing**
2. Configure:
   - **Price**: `29.99`
   - **Billing period**: `Monthly`
   - **Currency**: `USD`
3. **Copy the Price ID**

#### Step 3: Set Up Annual Pricing
1. Click **Add another price**
2. Configure:
   - **Price**: `287.88` (20% discount: $29.99 × 12 × 0.8)
   - **Billing period**: `Yearly`
   - **Currency**: `USD`
3. **Copy the Price ID**

#### Step 4: Add Product Metadata
```
tier: creator
features: all_landlord_features,custom_branding,api_access,white_label,revenue_sharing,account_manager,early_access,custom_domain
```

---

### Product 3: Free Tier (No Stripe Product Needed)

The Free tier doesn't require a Stripe product since it's not a paid subscription. Users are on the Free tier by default when they register.

---

### Product 4: Extra Room Slot (One-Time Payment)

This is a **one-time purchase** option that allows users to buy individual extra room slots without subscribing.

#### Step 1: Create the Product
1. Go to **Products** → **Add Product**
2. Fill in:
   - **Name**: `Extra Room Slot`
   - **Description**: `Purchase one additional room slot - no subscription required.`
   - **Statement descriptor**: `TOONSTALK ROOM`

#### Step 2: Set Up One-Time Pricing
1. Click **Add pricing**
2. Configure:
   - **Price**: `4.99`
   - **Billing period**: **One time** (NOT recurring!)
   - **Currency**: `USD`
   - **Pricing model**: `Standard pricing`
3. Click **Add pricing**
4. **Important**: Copy the **Price ID** - you'll need this!

#### Step 3: Add Product Metadata
```
type: room_slot
purchase_type: one_time
rooms_granted: 1
```

**Note**: Users can purchase multiple room slots. Each purchase grants +1 room to their limit.

---

## Getting Your Price IDs

After creating products, you should have **5 Price IDs**:

| Tier/Product | Period | Price | Price ID Example |
|--------------|--------|-------|------------------|
| Landlord | Monthly | $9.99 | `price_1ABCDefgh12345678` |
| Landlord | Annual | $95.88 | `price_2XYZabcde87654321` |
| Creator | Monthly | $29.99 | `price_3QRSTuvwx11223344` |
| Creator | Annual | $287.88 | `price_4MNOPqrst55667788` |
| Extra Room Slot | One-time | $4.99 | `price_5HIJKlmno99887766` |

### How to Find Your Price IDs Later
1. Go to **Products** in Stripe Dashboard
2. Click on a product name
3. Scroll to **Pricing** section
4. Price IDs are listed next to each price

---

## Updating Your Code with Price IDs

### 1. Update Subscription Service

Open `src/services/subscriptionService.js` and replace the placeholder Price IDs:

```javascript
// Replace these with your actual Price IDs from Stripe Dashboard
const STRIPE_PRICE_IDS = {
  landlord_monthly: 'price_YOUR_LANDLORD_MONTHLY_ID',
  landlord_annual: 'price_YOUR_LANDLORD_ANNUAL_ID',
  creator_monthly: 'price_YOUR_CREATOR_MONTHLY_ID',
  creator_annual: 'price_YOUR_CREATOR_ANNUAL_ID',
  room_slot: 'price_YOUR_ROOM_SLOT_ID', // One-time purchase
};
```

### 2. Update Subscription Page

Open `src/views/Subscription.vue` and find the `getPriceId` function (around line 256):

```javascript
function getPriceId(tier, period) {
  const STRIPE_PRICE_IDS = {
    landlord_monthly: 'price_YOUR_LANDLORD_MONTHLY_ID',
    landlord_annual: 'price_YOUR_LANDLORD_ANNUAL_ID',
    creator_monthly: 'price_YOUR_CREATOR_MONTHLY_ID',
    creator_annual: 'price_YOUR_CREATOR_ANNUAL_ID',
  };

  return STRIPE_PRICE_IDS[`${tier}_${period}`];
}
```

---

## Setting Up Firebase Cloud Functions

### 1. Create Stripe Configuration

Create or update `functions/src/stripe/stripe-config.js`:

```javascript
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
```

### 2. Set Stripe Secret Key in Environment File

For Firebase Functions v2, set environment variables in `functions/.env.chitter-chatter-f762a` (or your project's .env file):

```bash
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# For production, update to:
# STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY
# STRIPE_WEBHOOK_SECRET=whsec_YOUR_LIVE_WEBHOOK_SECRET
```

### 3. Create Checkout Session Endpoint

Create `functions/src/stripe/createCheckoutSession.js`:

```javascript
const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const getStripe = require('./stripe-config');

exports.createCheckoutSession = onRequest(
  {
    region: 'us-central1',
    cors: true,
  },
  async (req, res) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const { priceId, userId, email } = req.body;

      // Validate input
      if (!priceId || !userId || !email) {
        res.status(400).json({ error: 'Missing required parameters' });
        return;
      }

      // Verify user authentication
      const idToken = req.headers.authorization?.split('Bearer ')[1];
      if (!idToken) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const decodedToken = await admin.auth().verifyIdToken(idToken);
      if (decodedToken.uid !== userId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      // Check if user already has a Stripe customer ID
      const userRef = admin.database().ref(`users/${userId}`);
      const userSnapshot = await userRef.once('value');
      const userData = userSnapshot.val();

      let customerId = userData?.subscription?.stripeCustomerId;

      // Create or retrieve Stripe customer
      const stripe = getStripe();
      if (!customerId) {
        const customer = await stripe.customers.create({
          email,
          metadata: {
            firebaseUID: userId,
          },
        });
        customerId = customer.id;

        // Save customer ID to Firebase
        await userRef.child('subscription').update({
          stripeCustomerId: customerId,
        });
      }

      // Create Checkout Session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${req.headers.origin || 'http://localhost:8080'}/profile?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin || 'http://localhost:8080'}/pricing`,
        metadata: {
          userId,
        },
      });

      res.status(200).json({
        sessionId: session.id,
        url: session.url,
      });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({ error: error.message });
    }
  },
);
```

### 4. Create Customer Portal Session Endpoint

Create `functions/src/stripe/createPortalSession.js`:

```javascript
const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const getStripe = require('./stripe-config');

exports.createPortalSession = onRequest(
  {
    region: 'us-central1',
    cors: true,
  },
  async (req, res) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const { userId } = req.body;

      // Validate input
      if (!userId) {
        res.status(400).json({ error: 'Missing userId' });
        return;
      }

      // Verify user authentication
      const idToken = req.headers.authorization?.split('Bearer ')[1];
      if (!idToken) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const decodedToken = await admin.auth().verifyIdToken(idToken);
      if (decodedToken.uid !== userId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      // Get user's Stripe customer ID
      const userSnapshot = await admin.database().ref(`users/${userId}`).once('value');
      const userData = userSnapshot.val();
      const customerId = userData?.subscription?.stripeCustomerId;

      if (!customerId) {
        res.status(404).json({ error: 'No Stripe customer found' });
        return;
      }

      // Create portal session
      const stripe = getStripe();
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${req.headers.origin || 'http://localhost:8080'}/profile`,
      });

      res.status(200).json({ url: session.url });
    } catch (error) {
      console.error('Error creating portal session:', error);
      res.status(500).json({ error: error.message });
    }
  },
);
```

### 5. Create Room Slot Purchase Endpoint

Create `functions/src/stripe/purchaseRoomSlot.js`:

```javascript
const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const getStripe = require('./stripe-config');

/**
 * Create Stripe Checkout Session for one-time room slot purchase
 * Endpoint: POST /purchaseRoomSlot
 */
exports.purchaseRoomSlot = onRequest(
  {
    region: 'us-central1',
    cors: true,
  },
  async (req, res) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const { priceId, userId, email } = req.body;

      // Validate input
      if (!priceId || !userId || !email) {
        res.status(400).json({ error: 'Missing required parameters' });
        return;
      }

      // Verify user authentication
      const idToken = req.headers.authorization?.split('Bearer ')[1];
      if (!idToken) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const decodedToken = await admin.auth().verifyIdToken(idToken);
      if (decodedToken.uid !== userId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      // Check if user already has a Stripe customer ID
      const userRef = admin.database().ref(`users/${userId}`);
      const userSnapshot = await userRef.once('value');
      const userData = userSnapshot.val();

      let customerId = userData?.subscription?.stripeCustomerId;

      // Create or retrieve Stripe customer
      const stripe = getStripe();
      if (!customerId) {
        const customer = await stripe.customers.create({
          email,
          metadata: {
            firebaseUID: userId,
          },
        });
        customerId = customer.id;

        // Save customer ID to Firebase
        await userRef.child('subscription').update({
          stripeCustomerId: customerId,
        });
      }

      // Create Checkout Session for one-time payment
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'payment', // One-time payment instead of subscription
        success_url: `${req.headers.origin || 'http://localhost:8080'}/profile?purchase=success`,
        cancel_url: `${req.headers.origin || 'http://localhost:8080'}/profile?purchase=cancelled`,
        metadata: {
          userId,
          type: 'room_slot',
        },
      });

      res.status(200).json({
        sessionId: session.id,
        url: session.url,
      });
    } catch (error) {
      console.error('Error creating room slot checkout session:', error);
      res.status(500).json({ error: error.message });
    }
  },
);
```

### 6. Update Main Functions Index

Update `functions/index.js`:

```javascript
const admin = require('firebase-admin');
admin.initializeApp();

// Import Email functions
const { sendFeedbackEmail } = require('./src/email/sendFeedbackEmail');
const { sendWelcomeEmail } = require('./src/email/sendWelcomeEmail');
// ... other email functions

// Import Stripe functions
const { createCheckoutSession } = require('./src/stripe/createCheckoutSession');
const { createPortalSession } = require('./src/stripe/createPortalSession');
const { handleStripeWebhook } = require('./src/stripe/handleStripeWebhook');
const { purchaseRoomSlot } = require('./src/stripe/purchaseRoomSlot');

// Export Email functions
exports.sendFeedbackEmail = sendFeedbackEmail;
exports.sendWelcomeEmail = sendWelcomeEmail;
// ... other email functions

// Export Stripe functions
exports.createCheckoutSession = createCheckoutSession;
exports.createPortalSession = createPortalSession;
exports.handleStripeWebhook = handleStripeWebhook;
exports.purchaseRoomSlot = purchaseRoomSlot;
```

---

## Configuring Stripe Webhooks

Webhooks notify your backend when subscription and payment events occur (payment success, cancellation, one-time purchases, etc.).

### 1. Create Webhook Endpoint

Create `functions/src/stripe/handleStripeWebhook.js`:

```javascript
const { onRequest } = require('firebase-functions/v2/https');
const { defineString } = require('firebase-functions/params');
const admin = require('firebase-admin');
const getStripe = require('./stripe-config');

const stripeWebhookSecret = defineString('STRIPE_WEBHOOK_SECRET');

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
  const userId = subscription.metadata?.userId || await getUserIdFromCustomer(subscription.customer);
  if (!userId) {
    console.error('No userId found for subscription:', subscription.id);
    return;
  }

  // Determine tier from price ID
  const priceId = subscription.items.data[0].price.id;
  let tier = 'free';
  if (priceId.includes('landlord')) {
    tier = 'landlord';
  } else if (priceId.includes('creator')) {
    tier = 'creator';
  }

  // Update user subscription in Firebase
  await admin.database().ref(`users/${userId}/subscription`).update({
    tier,
    status: subscription.status,
    stripeCustomerId: subscription.customer,
    stripePriceId: priceId,
    stripeSubscriptionId: subscription.id,
    currentPeriodEnd: subscription.current_period_end * 1000,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    updatedAt: admin.database.ServerValue.TIMESTAMP,
  });

  // Update top-level fields
  await admin.database().ref(`users/${userId}`).update({
    subscriptionTier: tier,
    isCreator: tier === 'creator',
  });

  console.log(`Subscription updated for user ${userId}: ${tier}`);
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
```

### 2. Set Webhook Secret

First, you need to create a webhook endpoint in Stripe:

1. Go to **Developers** → **Webhooks** → **Add endpoint**
2. **Endpoint URL**: `https://YOUR-PROJECT-ID.cloudfunctions.net/handleStripeWebhook`
   - For local testing: Use Stripe CLI (see below)
3. **Events to listen to**: Select these events:
   - `checkout.session.completed` (for both subscriptions and one-time purchases)
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `payment_intent.succeeded` (for one-time payment confirmation)
   - `payment_intent.payment_failed`
4. Click **Add endpoint**
5. **Copy the Signing Secret** (starts with `whsec_...`)

Set the webhook secret in `functions/.env.chitter-chatter-f762a`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
```

---

## Handling One-Time Room Slot Purchases

Room slot purchases are handled differently than subscriptions since they are one-time payments.

### How It Works

1. User clicks "Buy 1 Extra Room" in their profile when they've reached their room limit
2. Frontend calls `purchaseRoomSlot` Cloud Function
3. User is redirected to Stripe Checkout (mode: 'payment', not 'subscription')
4. After successful payment, `checkout.session.completed` webhook fires
5. Webhook handler checks if `metadata.type === 'room_slot'`
6. If true, increments user's `purchasedRoomSlots` count in Firebase
7. Records purchase details in `users/{userId}/roomSlotPurchases/{purchaseId}`

### Database Structure for Room Purchases

```json
users/{userId}: {
  "purchasedRoomSlots": 3,  // Total extra slots purchased
  "roomSlotPurchases": {
    "purchase_1": {
      "purchaseId": "purchase_1",
      "stripeSessionId": "cs_test_...",
      "stripePaymentIntent": "pi_...",
      "amount": 4.99,
      "currency": "usd",
      "purchasedAt": 1234567890,
      "status": "completed"
    }
  }
}
```

### Room Limit Calculation

The total room limit is calculated as:
```
Base Limit (by tier) + Purchased Room Slots = Total Limit
```

Examples:
- Free user (1 room) + 3 purchased = 4 total rooms
- Landlord user (10 rooms) + 2 purchased = 12 total rooms
- Creator user (unlimited) = unlimited (purchases don't add to unlimited)

This logic is implemented in `src/utils/roomTypes.js:calculateTotalRoomLimit()`

---

## Setting Up Customer Portal

The Customer Portal allows users to manage their subscription, update payment methods, and view invoices.

### 1. Enable Customer Portal in Stripe

1. Go to **Settings** → **Customer Portal**
2. Click **Activate**
3. Configure settings:
   - **Customer cancellation**: Allow customers to cancel subscriptions
   - **Subscription changes**: Allow customers to switch between plans
   - **Payment method updates**: Allow
   - **Invoice history**: Allow customers to view invoices
4. **Brand settings**:
   - Upload your logo
   - Set brand colors
   - Customize links and terms
5. Click **Save changes**

### 2. Update Frontend to Use Portal

Update `src/services/subscriptionService.js`:

```javascript
async function createPortalSession(userId) {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user || user.uid !== userId) {
      throw new Error('Unauthorized');
    }

    // Call Firebase Cloud Function
    const functions = getFunctions();
    const createPortalSessionFunc = httpsCallable(functions, 'createPortalSession');
    const result = await createPortalSessionFunc();

    return result.data.url;
  } catch (error) {
    console.error('Error creating portal session:', error);
    throw error;
  }
}
```

---

## Testing Your Integration

### 1. Use Stripe Test Mode

Always test in **Test Mode** before going live:
- Test mode uses `pk_test_...` and `sk_test_...` keys
- No real money is charged
- You can use test card numbers

### 2. Stripe Test Cards

Use these test card numbers:

| Card Number | Scenario |
|-------------|----------|
| 4242 4242 4242 4242 | Successful payment |
| 4000 0000 0000 9995 | Declined card |
| 4000 0025 0000 3155 | Requires authentication (3D Secure) |

**Other test details:**
- Expiry: Any future date (e.g., 12/25)
- CVC: Any 3 digits (e.g., 123)
- ZIP: Any 5 digits (e.g., 12345)

### 3. Test the Flow

1. **Test Checkout**:
   - Go to your pricing page
   - Click "Subscribe Now" on Landlord or Creator
   - Use test card: 4242 4242 4242 4242
   - Verify redirect to success page
   - Check Firebase Database for updated subscription data

2. **Test Webhooks Locally** using Stripe CLI:
   ```bash
   # Install Stripe CLI
   brew install stripe/stripe-cli/stripe

   # Login
   stripe login

   # Forward webhooks to local functions
   stripe listen --forward-to http://localhost:5001/YOUR-PROJECT-ID/us-central1/handleStripeWebhook

   # Trigger test events
   stripe trigger checkout.session.completed
   ```

3. **Test Customer Portal**:
   - Subscribe to a plan
   - Navigate to profile
   - Click "Manage Subscription" button
   - Verify you can update payment method and cancel

4. **Test Room Slot Purchase**:
   - Create rooms until you reach your limit (1 for free users)
   - Navigate to profile → "My Rooms"
   - Verify you see the "Room Limit Reached" card with purchase options
   - Click "Buy 1 Extra Room" ($4.99)
   - Complete checkout with test card 4242 4242 4242 4242
   - Verify redirect to profile with success message
   - Check Firebase for updated `purchasedRoomSlots` count
   - Verify room limit chip shows new limit (e.g., "1/2 rooms")
   - Try creating another room - should now be allowed

---

## Going Live

### 1. Switch to Live Mode in Stripe Dashboard

Toggle from **Test mode** to **Live mode** in the Stripe Dashboard.

### 2. Get Live API Keys

1. Go to **Developers** → **API keys**
2. Copy your **live** keys (start with `pk_live_...` and `sk_live_...`)

### 3. Update Firebase Config with Live Keys

```bash
firebase functions:config:set stripe.secret_key="sk_live_YOUR_LIVE_SECRET_KEY"
firebase functions:config:set app.url="https://toonstalk.com"
```

### 4. Create Live Webhook Endpoint

1. In **Live mode**, go to **Developers** → **Webhooks**
2. Add endpoint with your production URL
3. Copy the new signing secret
4. Update config:
   ```bash
   firebase functions:config:set stripe.webhook_secret="whsec_YOUR_LIVE_WEBHOOK_SECRET"
   ```

### 5. Update Frontend with Live Keys

Update your frontend environment variables:
```javascript
// .env or .env.production
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY
```

### 6. Deploy Functions

```bash
firebase deploy --only functions
```

### 7. Final Tests

1. Make a real $1 test subscription (you can refund it)
2. Verify webhooks are received
3. Check subscription appears in Firebase
4. Test cancellation flow
5. Verify email notifications work

---

## Troubleshooting

### Webhook Not Firing
- Check webhook endpoint URL is correct
- Verify webhook secret is set correctly
- Check Cloud Functions logs: `firebase functions:log`
- Use Stripe Dashboard → **Events** to see webhook attempts

### Checkout Session Fails
- Verify Price IDs are correct
- Check API keys are set properly
- Look at browser console for errors
- Check Firebase Functions logs

### Subscription Not Updating in Firebase
- Verify webhook handler is processing events
- Check webhook signature verification passes
- Ensure metadata includes `firebaseUID`
- Check Firebase Realtime Database rules allow writes

### Common Errors
```
Error: No such price: 'price_...'
→ Price ID is wrong or doesn't exist in your Stripe account

Error: Webhook signature verification failed
→ Webhook secret is wrong or request is not from Stripe

Error: Function returned undefined
→ Cloud Function is not returning a response properly
```

---

## Security Best Practices

1. **Never commit API keys**: Use environment variables
2. **Verify webhook signatures**: Always validate webhook events
3. **Use HTTPS**: Required for production webhooks
4. **Validate user authentication**: Check `context.auth` in Cloud Functions
5. **Set up Firebase Security Rules**: Protect user subscription data
6. **Enable Stripe Radar**: Fraud detection (automatically enabled)
7. **Require 3D Secure**: Enable in Stripe Dashboard for European customers
8. **Log everything**: Monitor Cloud Functions logs for issues

---

## Next Steps

1. ✅ Create products in Stripe Dashboard
2. ✅ Update code with Price IDs
3. ✅ Deploy Firebase Cloud Functions
4. ✅ Configure webhooks
5. ✅ Test in Test Mode
6. ✅ Enable Customer Portal
7. ✅ Go live with real keys

## Need Help?

- **Stripe Documentation**: https://stripe.com/docs
- **Firebase Functions Docs**: https://firebase.google.com/docs/functions
- **Stripe Support**: https://support.stripe.com
- **Test Mode**: Always use test mode until you're ready to go live!

---

**Good luck with your subscription setup! 🚀**
