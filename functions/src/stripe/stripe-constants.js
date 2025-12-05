/**
 * Shared Stripe constants and utilities
 * Used across Cloud Functions to maintain consistency
 */

// Stripe Price ID to Tier mapping (must match subscriptionService.js)
const STRIPE_PRICE_IDS = {
  price_1SWYYhBmoCe1wac3zCRqHSZE: 'landlord', // landlord_monthly
  price_1SWYsdBmoCe1wac3jyDTLTzt: 'landlord', // landlord_annual
  price_1SWa3gBmoCe1wac3debRsl5V: 'creator', // creator_monthly
  price_1SWa6BBmoCe1wac3BFuOc9ob: 'creator', // creator_annual
  price_1SWi1vBmoCe1wac3f43Olfqn: 'owner', // owner
};

// Tier hierarchy for upgrade/downgrade detection
const TIER_HIERARCHY = {
  free: 0,
  owner: 1,
  landlord: 2,
  creator: 3,
};

// Maximum number of extra room slots that can be purchased
const MAX_PURCHASABLE_SLOTS = 2;

/**
 * Get numeric rank for a tier
 * @param {string} tier - The subscription tier
 * @returns {number} - The tier rank (higher = better)
 */
function getTierRank(tier) {
  return TIER_HIERARCHY[tier] || 0;
}

/**
 * Check if changing from previousTier to newTier is an upgrade
 * @param {string} previousTier - The previous subscription tier
 * @param {string} newTier - The new subscription tier
 * @returns {boolean} - True if this is an upgrade
 */
function isUpgrade(previousTier, newTier) {
  return getTierRank(newTier) > getTierRank(previousTier);
}

/**
 * Check if changing from previousTier to newTier is a downgrade
 * @param {string} previousTier - The previous subscription tier
 * @param {string} newTier - The new subscription tier
 * @returns {boolean} - True if this is a downgrade
 */
function isDowngrade(previousTier, newTier) {
  return getTierRank(newTier) < getTierRank(previousTier);
}

/**
 * Get tier name from Stripe price ID
 * @param {string} priceId - The Stripe price ID
 * @returns {string} - The tier name ('free', 'owner', 'landlord', 'creator')
 */
function getTierFromPriceId(priceId) {
  return STRIPE_PRICE_IDS[priceId] || 'free';
}

module.exports = {
  STRIPE_PRICE_IDS,
  TIER_HIERARCHY,
  MAX_PURCHASABLE_SLOTS,
  getTierRank,
  isUpgrade,
  isDowngrade,
  getTierFromPriceId,
};
