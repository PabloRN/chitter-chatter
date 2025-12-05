const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const getStripe = require('./stripe-config');

// Import shared Stripe constants
const { MAX_PURCHASABLE_SLOTS } = require('./stripe-constants');

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

      // ✅ TIER VALIDATION: Only Owner users can purchase extra room slots
      const isOwner = userData?.isOwner === true;
      const isLandlord = userData?.isLandlord === true;
      const isCreator = userData?.isCreator === true;

      if (!isOwner || isLandlord || isCreator) {
        console.warn(`Room slot purchase denied for user ${userId} - Invalid tier (isOwner: ${isOwner}, isLandlord: ${isLandlord}, isCreator: ${isCreator})`);
        res.status(403).json({
          error: 'Only Owner tier users can purchase extra room slots. Landlord and Creator tiers have higher room limits included.',
        });
        return;
      }

      // ✅ MAXIMUM SLOT LIMIT: Users can only purchase up to 2 extra room slots
      const currentSlots = userData?.purchasedRoomSlots || 0;

      if (currentSlots >= MAX_PURCHASABLE_SLOTS) {
        console.warn(`Room slot purchase denied for user ${userId} - Maximum limit reached (${currentSlots}/${MAX_PURCHASABLE_SLOTS})`);
        res.status(400).json({
          error: `You have reached the maximum limit of ${MAX_PURCHASABLE_SLOTS} extra room slots. Consider upgrading to Landlord tier for 5 rooms.`,
        });
        return;
      }

      console.log(`✅ Room slot purchase approved for user ${userId} (current: ${currentSlots}/${MAX_PURCHASABLE_SLOTS})`);

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
