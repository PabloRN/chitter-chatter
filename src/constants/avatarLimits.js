/**
 * Avatar limit constants by subscription tier
 * These limits apply to TOTAL avatars (uploaded + preloaded)
 */
export const AVATAR_LIMITS = {
  free: 10,
  owner: 20,
  landlord: 30,
  creator: 50,
};

/**
 * Get avatar limit for a user based on their tier
 * @param {Object} user - User object from store
 * @returns {number} - Maximum avatars allowed
 */
export function getAvatarLimit(user) {
  if (!user) return AVATAR_LIMITS.free;

  if (user.isCreator) return AVATAR_LIMITS.creator;
  if (user.isLandlord) return AVATAR_LIMITS.landlord;
  if (user.isOwner) return AVATAR_LIMITS.owner;

  return AVATAR_LIMITS.free;
}

export default {
  AVATAR_LIMITS,
  getAvatarLimit,
};
