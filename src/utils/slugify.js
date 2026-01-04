/**
  * Convert text to URL-safe slug
  * @param {string} text - Text to slugify
  * @returns {string} - URL-safe slug
  */
/**
  * Convert text to URL-safe slug
  * @param {string} text - Text to slugify
  * @returns {string} - URL-safe slug
  */
export default function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove non-word chars (except -)
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start
    .replace(/-+$/, ''); // Trim - from end
}
