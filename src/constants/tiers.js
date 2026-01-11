/**
 * Subscription tier constants and utilities
 * Used across frontend components to maintain consistency
 */

/**
 * Tier hierarchy mapping (higher number = higher tier)
 * @type {Object<string, number>}
 */
export const TIER_RANKS = {
  free: 0,
  owner: 1,
  earlyCreator: 1,
  landlord: 2,
  creator: 3,
};

/**
 * Check if changing from currentTier to targetTier is a downgrade
 * @param {string} currentTier - The current subscription tier
 * @param {string} targetTier - The target subscription tier
 * @returns {boolean} - True if this is a downgrade
 */
export function isDowngrade(currentTier, targetTier) {
  const currentRank = TIER_RANKS[currentTier] || 0;
  const targetRank = TIER_RANKS[targetTier] || 0;
  return targetRank < currentRank;
}

/**
 * Check if changing from currentTier to targetTier is an upgrade
 * @param {string} currentTier - The current subscription tier
 * @param {string} targetTier - The target subscription tier
 * @returns {boolean} - True if this is an upgrade
 */
export function isUpgrade(currentTier, targetTier) {
  const currentRank = TIER_RANKS[currentTier] || 0;
  const targetRank = TIER_RANKS[targetTier] || 0;
  return targetRank > currentRank;
}

export default {
  TIER_RANKS,
  isDowngrade,
  isUpgrade,
};
