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
