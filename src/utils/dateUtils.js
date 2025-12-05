/**
 * Date utility functions for formatting timestamps
 */

/**
 * Format a timestamp into a human-readable date string
 * @param {number|null} timestamp - Unix timestamp in milliseconds
 * @returns {string} - Formatted date string (e.g., "November 25, 2025")
 */
export function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default {
  formatDate,
};
