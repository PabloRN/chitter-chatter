import { useHead } from '@unhead/vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

/**
 * SEO Composable for managing meta tags, Open Graph, Twitter Cards, and structured data
 * @param {Object} config - SEO configuration object
 * @param {string} config.title - Page title
 * @param {string} config.description - Page description
 * @param {string} [config.image] - OG/Twitter image URL (defaults to site default)
 * @param {string} [config.url] - Canonical URL (defaults to current page)
 * @param {string} [config.type='website'] - OG type (website, article, etc.)
 * @param {Object} [config.schema] - Schema.org JSON-LD structured data
 * @param {Array} [config.keywords] - Meta keywords array
 */
export function useSeo(config) {
  const { locale } = useI18n();

  // Default values
  const baseUrl = 'https://toonstalk.com';
  const defaultImage = `${baseUrl}/og-default.png`;
  const defaultTitle = 'Toonstalk - Create Animated Chat Rooms for Your Community';
  const defaultDescription = 'Join thousands creating real-time animated chat rooms. Perfect for gamers, creators, educators, and friend groups. Customize avatars, backgrounds, and chat with unlimited users. Free to start!';

  // Compute final values
  const title = computed(() => config.title || defaultTitle);
  const description = computed(() => config.description || defaultDescription);
  const image = computed(() => config.image || defaultImage);
  const url = computed(() => config.url || (typeof window !== 'undefined' ? window.location.href : baseUrl));
  const type = computed(() => config.type || 'website');

  // Build meta tags
  const meta = [
    // Basic meta tags
    { name: 'description', content: description.value },

    // Open Graph tags
    { property: 'og:title', content: title.value },
    { property: 'og:description', content: description.value },
    { property: 'og:image', content: image.value },
    { property: 'og:url', content: url.value },
    { property: 'og:type', content: type.value },
    { property: 'og:site_name', content: 'Toonstalk' },

    // Twitter Card tags
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title.value },
    { name: 'twitter:description', content: description.value },
    { name: 'twitter:image', content: image.value },
    { name: 'twitter:site', content: '@toonstalk' },

    // Additional SEO meta tags
    { name: 'robots', content: 'index, follow' },
    { name: 'googlebot', content: 'index, follow' },
  ];

  // Add keywords if provided
  if (config.keywords && config.keywords.length > 0) {
    meta.push({ name: 'keywords', content: config.keywords.join(', ') });
  }

  // Build links
  const link = [
    { rel: 'canonical', href: url.value },
  ];

  // Build script tags for structured data
  const script = [];
  if (config.schema) {
    script.push({
      type: 'application/ld+json',
      children: JSON.stringify(config.schema),
    });
  }

  // Set HTML lang attribute
  const htmlAttrs = {
    lang: locale.value || 'en',
  };

  // Apply head tags
  useHead({
    title: title.value,
    htmlAttrs,
    meta,
    link,
    script,
  });
}

/**
 * Helper function to generate Schema.org CreativeWork for rooms
 * @param {Object} roomData - Room data object
 * @returns {Object} Schema.org JSON-LD object
 */
export function createRoomSchema(roomData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: roomData.name,
    description: roomData.description || 'Join this animated chat room on Toonstalk',
    creator: {
      '@type': 'Person',
      name: roomData.ownerName || 'Toonstalk User',
    },
    image: roomData.thumbnail || 'https://toonstalk.com/og-default.png',
    url: `https://toonstalk.com/rooms/${roomData.id}`,
    dateCreated: roomData.createdAt ? new Date(roomData.createdAt).toISOString() : undefined,
    interactionStatistic: {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/JoinAction',
      userInteractionCount: roomData.userCount || 0,
    },
  };
}

/**
 * Helper function to generate BreadcrumbList schema
 * @param {Array} breadcrumbs - Array of breadcrumb objects {name, url}
 * @returns {Object} Schema.org JSON-LD object
 */
export function createBreadcrumbSchema(breadcrumbs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

/**
 * Helper function to generate Organization schema
 * @returns {Object} Schema.org JSON-LD object
 */
export function createOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Toonstalk',
    url: 'https://toonstalk.com',
    logo: 'https://toonstalk.com/logo.png',
    sameAs: [
      'https://twitter.com/toonstalk',
      'https://discord.gg/toonstalk',
      'https://instagram.com/toonstalk',
    ],
    description: 'Create and join animated chat rooms with friends, gamers, and communities worldwide.',
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@toonstalk.com',
      contactType: 'Customer Support',
    },
  };
}
