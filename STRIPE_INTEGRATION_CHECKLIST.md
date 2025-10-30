# Stripe Integration Checklist

## ✅ Code Implementation (COMPLETED)

### Frontend
- [x] **subscriptionService.js** - All Stripe functions implemented
  - `createCheckoutSession()` ✓
  - `createPortalSession()` ✓
  - `purchaseRoomSlot()` ✓
  - `getSubscriptionStatus()` ✓
  - Price IDs configured ✓

- [x] **Subscription.vue** - Updated to use subscriptionService
  - Import subscriptionService ✓
  - Call `createCheckoutSession()` on subscribe ✓
  - Redirect to Stripe Checkout ✓

### Backend (Firebase Functions)
- [x] **functions/src/stripe/** - All functions organized
  - `stripe-config.js` - Stripe initialization ✓
  - `createCheckoutSession.js` - Create checkout sessions ✓
  - `createPortalSession.js` - Create portal sessions ✓
  - `purchaseRoomSlot.js` - One-time room slot purchases ✓
  - `handleStripeWebhook.js` - Webhook handler ✓

- [x] **functions/src/email/** - All email functions organized
  - `nodemailer-config.js` ✓
  - `sendFeedbackEmail.js` ✓
  - `sendWelcomeEmail.js` ✓
  - `sendSurveyEmail.js` ✓
  - `sendReportUserEmail.js` ✓
  - `sendReportRoomEmail.js` ✓

- [x] **functions/index.js** - Clean imports/exports (38 lines)

- [x] **STRIPE_SETUP_GUIDE.md** - Complete guide with v2 API

---

## ⚠️ Configuration Needed (MANUAL STEPS)

### 1. Environment Variables

**File**: `functions/.env.chitter-chatter-f762a`

- [x] `GMAIL_EMAIL` - Set ✓
- [x] `GMAIL_PASSWORD` - Set ✓
- [ ] `STRIPE_SECRET_KEY` - **NEEDS UPDATE**
  - Current: `sk_test_XXXXXXXXXXXXXXXXXXXXX` (redacted)
  - Action: Verify this is your correct Stripe Secret Key from dashboard
  - Get it from: [Stripe Dashboard → Developers → API Keys](https://dashboard.stripe.com/test/apikeys)

- [ ] `STRIPE_WEBHOOK_SECRET` - **NEEDS REPLACEMENT**
  - Current: `whsec_YOUR_WEBHOOK_SECRET_HERE` (placeholder)
  - Action: Replace with actual webhook secret after setting up webhook endpoint
  - Get it from: Stripe Dashboard → Developers → Webhooks (after creating endpoint)

---

### 2. Stripe Dashboard Setup

#### A. Verify Products & Price IDs

Current Price IDs in code:
```
landlord_monthly: price_1SK4YXBmoCe1wac303G15iyR
landlord_annual:  price_1SK4YWBmoCe1wac3XfXnod9L
creator_monthly:  price_1SNCJoBmoCe1wac39auhID7K
creator_annual:   price_1SNCLtBmoCe1wac3TnZh9kjj
room_slot:        price_1SNCmmBmoCe1wac3qoB2lBIy
```

**Action Required:**
- [ ] Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/test/products)
- [ ] Verify all 5 Price IDs exist and match your products
- [ ] Ensure pricing matches:
  - Landlord Monthly: $9.99
  - Landlord Annual: $95.88 (20% discount)
  - Creator Monthly: $29.99
  - Creator Annual: $287.88 (20% discount)
  - Room Slot: $4.99 (one-time)

If products don't exist, create them following: **[STRIPE_SETUP_GUIDE.md → Creating Products](./STRIPE_SETUP_GUIDE.md#creating-products-in-stripe-dashboard)**

#### B. Configure Webhook Endpoint

- [ ] Deploy your Firebase Functions first:
  ```bash
  cd functions
  firebase deploy --only functions
  ```

- [ ] After deployment, get your function URL (it will be displayed in console):
  ```
  https://us-central1-chitter-chatter-f762a.cloudfunctions.net/handleStripeWebhook
  ```

- [ ] Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/test/webhooks)
- [ ] Click **Add endpoint**
- [ ] Enter your webhook URL: `https://us-central1-chitter-chatter-f762a.cloudfunctions.net/handleStripeWebhook`
- [ ] Select events to listen to:
  - [x] `checkout.session.completed`
  - [x] `customer.subscription.created`
  - [x] `customer.subscription.updated`
  - [x] `customer.subscription.deleted`
  - [x] `payment_intent.succeeded`
  - [x] `payment_intent.payment_failed`
- [ ] Click **Add endpoint**
- [ ] Copy the **Signing secret** (starts with `whsec_...`)
- [ ] Update `STRIPE_WEBHOOK_SECRET` in `functions/.env.chitter-chatter-f762a`

#### C. Enable Customer Portal

- [ ] Go to [Stripe Dashboard → Settings → Customer Portal](https://dashboard.stripe.com/test/settings/billing/portal)
- [ ] Click **Activate test link**
- [ ] Configure settings:
  - [x] Allow customers to cancel subscriptions
  - [x] Allow customers to switch between plans
  - [x] Allow customers to update payment methods
  - [x] Allow customers to view invoice history
- [ ] Customize branding (optional):
  - Upload logo
  - Set brand colors
  - Add custom links
- [ ] Click **Save changes**

---

### 3. Testing Checklist

#### Test Mode Testing (Required Before Going Live)

**Test Cards:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 9995`
- 3D Secure: `4000 0025 0000 3155`
- Expiry: Any future date (e.g., 12/25)
- CVC: Any 3 digits (e.g., 123)
- ZIP: Any 5 digits

**Test Scenarios:**

- [ ] **Subscribe to Landlord (Monthly)**
  1. Go to `/subscription` page
  2. Click "Subscribe Now" on Landlord card
  3. Use test card: `4242 4242 4242 4242`
  4. Complete checkout
  5. Verify redirect to profile
  6. Check Firebase Database: `users/{userId}/subscription/tier` = "landlord"
  7. Check Stripe Dashboard: Subscription created

- [ ] **Subscribe to Creator (Annual)**
  1. Click "Go Pro" on Creator card
  2. Toggle to "Annual" billing
  3. Complete checkout with test card
  4. Verify subscription in Firebase and Stripe

- [ ] **Purchase Extra Room Slot**
  1. Create rooms until limit reached (1 for free users)
  2. Go to Profile → My Rooms
  3. Click "Buy 1 Extra Room" ($4.99)
  4. Complete checkout with test card
  5. Verify: Firebase `users/{userId}/purchasedRoomSlots` incremented
  6. Verify: Room limit chip updated (e.g., "1/2 rooms")
  7. Verify: Can now create additional room

- [ ] **Manage Subscription (Customer Portal)**
  1. Have an active subscription
  2. Go to Profile
  3. Click "Manage Subscription" button
  4. Verify portal opens
  5. Try updating payment method
  6. Try canceling subscription
  7. Verify cancellation shows in Firebase

- [ ] **Webhook Testing**
  ```bash
  # Install Stripe CLI
  brew install stripe/stripe-cli/stripe

  # Login
  stripe login

  # Forward webhooks to local functions (if testing locally)
  stripe listen --forward-to http://localhost:5001/chitter-chatter-f762a/us-central1/handleStripeWebhook

  # Trigger test events
  stripe trigger checkout.session.completed
  stripe trigger customer.subscription.updated
  stripe trigger customer.subscription.deleted
  ```

  - [ ] Check Firebase Functions logs for webhook processing
  - [ ] Verify Firebase Database updates correctly

---

### 4. Deployment Steps

#### Deploy Functions
```bash
cd functions
firebase deploy --only functions
```

#### Expected Output:
```
✔  functions: Finished running predeploy script.
i  functions: ensuring required API cloudfunctions.googleapis.com is enabled...
✔  functions: required API cloudfunctions.googleapis.com is enabled
i  functions: preparing functions directory for uploading...
i  functions: packaged functions (XX.XX KB) for uploading
✔  functions: functions folder uploaded successfully

Functions deploy had errors with the following functions:
   or
✔  Deploy complete!

Functions:
  sendFeedbackEmail(us-central1)
  sendWelcomeEmail(us-central1)
  sendSurveyEmail(us-central1)
  sendReportUserEmail(us-central1)
  sendReportRoomEmail(us-central1)
  createCheckoutSession(us-central1)
  createPortalSession(us-central1)
  handleStripeWebhook(us-central1)
  purchaseRoomSlot(us-central1)
```

---

### 5. Going Live (When Ready)

- [ ] Switch Stripe to Live Mode
- [ ] Get Live API Keys from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
- [ ] Update `functions/.env.chitter-chatter-f762a`:
  ```
  STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
  STRIPE_WEBHOOK_SECRET=whsec_YOUR_LIVE_WEBHOOK_SECRET
  ```
- [ ] Create Live webhook endpoint in Stripe Dashboard
- [ ] Update Price IDs in code if needed (live products may have different IDs)
- [ ] Redeploy functions: `firebase deploy --only functions`
- [ ] Do final live test with real card (small amount)
- [ ] Refund test transaction

---

## 🚨 Critical Reminders

1. **Never commit sensitive keys** - `.env` files are in `.gitignore`
2. **Test thoroughly** in Test Mode before going live
3. **Monitor Firebase Functions logs** for errors
4. **Check Stripe Dashboard → Events** to see webhook delivery status
5. **Enable Stripe Radar** for fraud detection (auto-enabled)
6. **Set up Firebase Security Rules** to protect subscription data
7. **Document your Price IDs** somewhere safe

---

## 📊 Current Status Summary

### ✅ Completed
- All Firebase Functions written and organized
- All frontend integration complete
- subscriptionService fully implemented
- Subscription page ready
- Email functions organized
- Setup guide documentation complete

### ⚠️ Needs Action
- Replace placeholder `STRIPE_WEBHOOK_SECRET`
- Verify `STRIPE_SECRET_KEY` is correct
- Deploy Firebase Functions
- Set up webhook endpoint in Stripe
- Enable Customer Portal in Stripe
- Test all flows with test cards

### 📝 Next Steps
1. Deploy functions: `firebase deploy --only functions`
2. Set up webhook in Stripe Dashboard
3. Update `STRIPE_WEBHOOK_SECRET` in env file
4. Test with Stripe test cards
5. Go live when ready

---

## 🔗 Useful Links

- [Stripe Dashboard (Test)](https://dashboard.stripe.com/test/dashboard)
- [Stripe API Keys](https://dashboard.stripe.com/test/apikeys)
- [Stripe Webhooks](https://dashboard.stripe.com/test/webhooks)
- [Stripe Products](https://dashboard.stripe.com/test/products)
- [Stripe Customer Portal](https://dashboard.stripe.com/test/settings/billing/portal)
- [Firebase Console](https://console.firebase.google.com/project/chitter-chatter-f762a)
- [Firebase Functions Logs](https://console.firebase.google.com/project/chitter-chatter-f762a/functions/logs)

---

**Last Updated:** 2025-10-28
