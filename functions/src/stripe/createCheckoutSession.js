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

      // Check if customer already has an active subscription
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 1,
      });

      // If customer has an active subscription, update it instead of creating new one
      if (subscriptions.data.length > 0) {
        const existingSubscription = subscriptions.data[0];
        console.log(`Found active subscription ${existingSubscription.id}, updating to price ${priceId}`);

        // Update the subscription to the new price
        const updatedSubscription = await stripe.subscriptions.update(
          existingSubscription.id,
          {
            items: [
              {
                id: existingSubscription.items.data[0].id,
                price: priceId,
              },
            ],
            proration_behavior: 'create_prorations', // Prorate the charges
            metadata: {
              userId,
            },
          },
        );

        console.log(`✅ Subscription updated successfully: ${updatedSubscription.id}`);

        // Return success - webhook will handle Firebase updates
        res.status(200).json({
          subscriptionId: updatedSubscription.id,
          updated: true,
          message: 'Subscription updated successfully',
        });
      } else {
        // No active subscription - create new checkout session
        console.log(`No active subscription found for customer ${customerId}, creating new checkout session`);

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
          updated: false,
        });
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({ error: error.message });
    }
  },
);
