/**
 * Avatar Helper Utilities
 * Simplified utilities for displaying colored initials based on subscription tier
 */

/**
 * Get subscription tier color for avatar backgrounds
 * @param {string} tier - Subscription tier name
 * @returns {string} Vuetify color name
 */
export function getTierColor(tier) {
  if (!tier) return 'grey';

  switch (tier.toLowerCase()) {
    case 'creator':
      return 'purple';
    case 'landlord':
      return 'primary';
    case 'owner':
      return 'blue-grey';
    case 'free':
    default:
      return 'grey';
  }
}

/**
 * Generate initials from nickname (max 2 characters)
 * @param {string} name - User's name or nickname
 * @returns {string} Uppercase initials (max 2 characters)
 */
export function getInitials(name) {
  if (!name?.trim()) {
    return '??';
  }

  const cleaned = name.trim();

  // Single word: take first 2 characters
  if (!cleaned.includes(' ')) {
    return cleaned.substring(0, 2).toUpperCase();
  }

  // Multiple words: take first letter of first two words
  const words = cleaned.split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }

  return (words[0][0] + words[1][0]).toUpperCase();
}
