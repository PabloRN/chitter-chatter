import {
  getDatabase, ref, set, get, update,
} from 'firebase/database';
import { getAuth } from 'firebase/auth';

/**
 * Subscription Service
 * Handles all subscription-related operations with Stripe and Firebase
 */

// Stripe Price IDs - Replace with actual IDs from Stripe Dashboard
const STRIPE_PRICE_IDS = {
  landlord_monthly: 'price_1SWYYhBmoCe1wac3zCRqHSZE',
  landlord_annual: 'price_1SWYsdBmoCe1wac3jyDTLTzt',
  creator_monthly: 'price_1SWa3gBmoCe1wac3debRsl5V',
  creator_annual: 'price_1SWa6BBmoCe1wac3BFuOc9ob',
  room_slot: 'price_1SWaayBmoCe1wac3XEDCDgEQ', // One-time purchase
  owner_upgrade: 'price_1SWi1vBmoCe1wac3f43Olfqn', // One-time purchase
};

// Room slot pricing
const ROOM_SLOT_PRICE = 4.99;

/**
 * Create a Stripe Checkout Session
 * @param {string} tier - The subscription tier (landlord, creator)
 * @param {string} period - The billing period (monthly, annual)
 * @returns {Promise<string>} - The Stripe Checkout Session URL
 */
async function createCheckoutSession(tier, period) {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User must be authenticated');
    }

    const priceId = STRIPE_PRICE_IDS[`${tier}_${period}`];
    const idToken = await user.getIdToken();

    // Call Cloud Function to create Stripe Checkout Session
    const functionUrl = 'https://us-central1-chitter-chatter-f762a.cloudfunctions.net/createCheckoutSession';

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        priceId,
        userId: user.uid,
        email: user.email,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create checkout session');
    }

    const data = await response.json();

    // If subscription was updated (not a new checkout), return the data differently
    if (data.updated) {
      return {
        updated: true,
        subscriptionId: data.subscriptionId,
        message: data.message,
      };
    }

    // Return checkout URL for new subscription
    return {
      updated: false,
      url: data.url,
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Get user's current subscription status
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} - The subscription data
 */
async function getSubscriptionStatus(userId) {
  try {
    const db = getDatabase();
    const userRef = ref(db, `users/${userId}/subscription`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      return snapshot.val();
    }

    // Default free tier
    return {
      tier: 'free',
      status: 'active',
      stripeCustomerId: null,
      stripePriceId: null,
      stripeSubscriptionId: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    };
  } catch (error) {
    console.error('Error getting subscription status:', error);
    throw error;
  }
}

/**
 * Update user's subscription in Firebase
 * @param {string} userId - The user ID
 * @param {Object} subscriptionData - The subscription data from Stripe
 */
async function updateSubscription(userId, subscriptionData) {
  try {
    const db = getDatabase();
    const userRef = ref(db, `users/${userId}/subscription`);

    const updates = {
      tier: subscriptionData.tier,
      status: subscriptionData.status,
      stripeCustomerId: subscriptionData.stripeCustomerId,
      stripePriceId: subscriptionData.stripePriceId,
      stripeSubscriptionId: subscriptionData.stripeSubscriptionId,
      currentPeriodEnd: subscriptionData.currentPeriodEnd,
      cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd || false,
      updatedAt: Date.now(),
    };

    await set(userRef, updates);

    // Also update top-level subscription tier for easy access
    await update(ref(db, `users/${userId}`), {
      subscriptionTier: subscriptionData.tier,
      isCreator: subscriptionData.tier === 'creator',
    });

    console.log('Subscription updated successfully:', updates);
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

/**
 * Cancel subscription at period end
 * @param {string} userId - The user ID
 */
async function cancelSubscription(userId) {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user || user.uid !== userId) {
      throw new Error('Unauthorized');
    }

    // Note: Cancellation is typically handled through Stripe Customer Portal
    // For now, we'll update Firebase to reflect the intent
    // The actual cancellation will be processed by Stripe webhook

    // Update Firebase
    const db = getDatabase();
    await update(ref(db, `users/${userId}/subscription`), {
      cancelAtPeriodEnd: true,
      updatedAt: Date.now(),
    });

    console.log('Subscription cancellation requested');
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

/**
 * Reactivate a canceled subscription
 * @param {string} userId - The user ID
 */
async function reactivateSubscription(userId) {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user || user.uid !== userId) {
      throw new Error('Unauthorized');
    }

    // TODO: Call your backend endpoint to reactivate Stripe subscription
    // Example:
    // const response = await fetch('/api/reactivate-subscription', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ userId }),
    // });

    // Update Firebase
    const db = getDatabase();
    await update(ref(db, `users/${userId}/subscription`), {
      cancelAtPeriodEnd: false,
      updatedAt: Date.now(),
    });

    console.log('Subscription reactivated successfully');
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    throw error;
  }
}

/**
 * Create Stripe Customer Portal session for managing subscriptions
 * @returns {Promise<string>} - The Customer Portal URL
 */
async function createPortalSession() {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User must be authenticated');
    }

    const idToken = await user.getIdToken();

    // Call Cloud Function to create Customer Portal session
    const functionUrl = 'https://us-central1-chitter-chatter-f762a.cloudfunctions.net/createPortalSession';

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ userId: user.uid }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create portal session');
    }

    const { url } = await response.json();
    return url;
  } catch (error) {
    console.error('Error creating portal session:', error);
    throw error;
  }
}

/**
 * Check if user has access to a feature based on subscription tier
 * @param {string} tier - The user's subscription tier
 * @param {string} feature - The feature to check
 * @returns {boolean} - Whether the user has access
 */
function hasFeatureAccess(tier, feature) {
  const FEATURES = {
    free: [
      'public_rooms',
      'basic_avatars',
      'real_time_chat',
      'community_support',
    ],
    landlord: [
      'public_rooms',
      'basic_avatars',
      'real_time_chat',
      'community_support',
      'private_rooms',
      'custom_backgrounds',
      'moderation_tools',
      'room_analytics',
      'priority_support',
      'no_ads',
      'custom_urls',
    ],
    creator: [
      'public_rooms',
      'basic_avatars',
      'real_time_chat',
      'community_support',
      'private_rooms',
      'custom_backgrounds',
      'moderation_tools',
      'room_analytics',
      'priority_support',
      'no_ads',
      'custom_urls',
      'custom_branding',
      'api_access',
      'white_label',
      'revenue_sharing',
      'account_manager',
      'early_access',
      'custom_domain',
    ],
  };

  return FEATURES[tier]?.includes(feature) || false;
}

/**
 * Purchase an extra room slot (one-time payment)
 * @param {string} userId - The user ID
 * @returns {Promise<string>} - The Stripe Checkout Session URL
 */
async function purchaseRoomSlot(userId) {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user || user.uid !== userId) {
      throw new Error('User must be authenticated');
    }

    const priceId = STRIPE_PRICE_IDS.room_slot;
    const idToken = await user.getIdToken();

    // Call Cloud Function to create Stripe Checkout Session for one-time payment
    const functionUrl = 'https://us-central1-chitter-chatter-f762a.cloudfunctions.net/purchaseRoomSlot';

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        priceId,
        userId: user.uid,
        email: user.email,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create checkout session for room slot');
    }

    const { url } = await response.json();
    return url;
  } catch (error) {
    console.error('Error purchasing room slot:', error);
    throw error;
  }
}

/**
 * Get user's room slot purchase history
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} - Array of purchase records
 */
async function getRoomPurchaseHistory(userId) {
  try {
    const db = getDatabase();
    const purchasesRef = ref(db, `users/${userId}/roomSlotPurchases`);
    const snapshot = await get(purchasesRef);

    if (snapshot.exists()) {
      const purchases = snapshot.val();
      return Object.keys(purchases).map((key) => ({
        id: key,
        ...purchases[key],
      }));
    }

    return [];
  } catch (error) {
    console.error('Error getting room purchase history:', error);
    throw error;
  }
}

/**
 * Get total purchased room slots for a user
 * @param {string} userId - The user ID
 * @returns {Promise<number>} - Number of purchased slots
 */
async function getPurchasedRoomSlots(userId) {
  try {
    const db = getDatabase();
    const userRef = ref(db, `users/${userId}/purchasedRoomSlots`);
    const snapshot = await get(userRef);

    return snapshot.exists() ? snapshot.val() : 0;
  } catch (error) {
    console.error('Error getting purchased room slots:', error);
    return 0;
  }
}

/**
 * Purchase Owner upgrade ($2.99 one-time)
 * Upgrades user to Owner tier with premium features
 * @returns {Promise<string>} - The Stripe Checkout Session URL
 */
async function purchaseOwnerUpgrade() {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      console.error('No authenticated user found');
      throw new Error('You must be logged in to upgrade. Please sign in and try again.');
    }

    console.log('Attempting Owner upgrade for user:', user.uid);

    const priceId = STRIPE_PRICE_IDS.owner_upgrade;
    const idToken = await user.getIdToken();

    // Call Cloud Function to create Stripe Checkout Session for Owner upgrade
    const functionUrl = 'https://us-central1-chitter-chatter-f762a.cloudfunctions.net/purchaseOwnerUpgrade';

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        priceId,
        userId: user.uid,
        email: user.email,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create checkout session for Owner upgrade');
    }

    const { url } = await response.json();
    return url;
  } catch (error) {
    console.error('Error purchasing Owner upgrade:', error);
    throw error;
  }
}

/**
 * Check if user has premium access (Owner, Landlord, or Creator)
 * @param {Object} user - The user object
 * @returns {boolean} - Whether user has premium access
 */
function hasPremiumAccess(user) {
  if (!user) return false;
  return user.isOwner || user.isLandlord || user.isCreator || user.isAdmin || false;
}

/**
 * Get max users allowed per room based on user tier
 * @param {Object} user - The user object
 * @returns {number} - Max users per room
 */
function getMaxUsersForRoom(user) {
  if (!user) return 10;
  if (user.isCreator) return 30;
  if (user.isLandlord || user.isOwner) return 20;
  return 10; // free tier
}

/**
 * Get room limit for user based on tier
 * @param {Object} user - The user object
 * @returns {number} - Room limit (-1 for unlimited)
 */
function getRoomLimit(user) {
  if (!user) return 1;
  if (user.isAdmin) return 100;
  if (user.isCreator) return -1; // unlimited
  if (user.isLandlord) return 5;
  if (user.isOwner) return 1 + (user.purchasedRoomSlots || 0);
  return 1; // free tier
}

export default {
  createCheckoutSession,
  getSubscriptionStatus,
  updateSubscription,
  cancelSubscription,
  reactivateSubscription,
  createPortalSession,
  hasFeatureAccess,
  purchaseRoomSlot,
  getRoomPurchaseHistory,
  getPurchasedRoomSlots,
  purchaseOwnerUpgrade,
  hasPremiumAccess,
  getMaxUsersForRoom,
  getRoomLimit,
  STRIPE_PRICE_IDS,
  ROOM_SLOT_PRICE,
};
