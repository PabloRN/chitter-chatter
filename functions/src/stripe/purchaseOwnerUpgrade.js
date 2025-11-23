const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const getStripe = require('./stripe-config');

/**
 * Create Stripe Checkout Session for Owner upgrade purchase
 * Endpoint: POST /purchaseOwnerUpgrade
 * One-time payment of $2.99 to upgrade user to Owner tier
 */
exports.purchaseOwnerUpgrade = onRequest(
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

      // Check if user is already Owner, Landlord, or Creator
      if (userData?.isOwner || userData?.isLandlord || userData?.isCreator) {
        res.status(400).json({ error: 'User already has premium access' });
        return;
      }

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
        mode: 'payment', // One-time payment
        success_url: `${req.headers.origin || 'http://localhost:8080'}/profile?upgrade=success`,
        cancel_url: `${req.headers.origin || 'http://localhost:8080'}/profile?upgrade=cancelled`,
        metadata: {
          userId,
          type: 'owner_upgrade',
        },
      });

      res.status(200).json({
        sessionId: session.id,
        url: session.url,
      });
    } catch (error) {
      console.error('Error creating owner upgrade checkout session:', error);
      res.status(500).json({ error: error.message });
    }
  },
);
