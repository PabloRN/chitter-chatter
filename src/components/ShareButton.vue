<template>
  <v-menu offset-y>
    <template v-slot:activator="{ props: menuProps }">
      <v-btn key="4" class="mx-2 speed-dial-menu-item" fab dark small v-bind="menuProps">
        <v-icon color="white">{{ iconName }}</v-icon>
        <v-tooltip activator="parent" location="left">
          Share
        </v-tooltip>
      </v-btn>
    </template>

    <v-list density="compact">
      <v-list-item v-if="canShare" key="native-share" @click="shareNative" prepend-icon="mdi-share-variant">
        <v-list-item-title>Share</v-list-item-title>
      </v-list-item>

      <v-divider v-if="canShare" key="divider-native" />

      <v-list-item key="twitter" @click="shareTwitter" prepend-icon="mdi-twitter">
        <v-list-item-title>Share on Twitter</v-list-item-title>
      </v-list-item>

      <v-list-item key="reddit" @click="shareReddit" prepend-icon="mdi-reddit">
        <v-list-item-title>Share on Reddit</v-list-item-title>
      </v-list-item>

      <v-list-item key="facebook" @click="shareFacebook" prepend-icon="mdi-facebook">
        <v-list-item-title>Share on Facebook</v-list-item-title>
      </v-list-item>

      <v-list-item key="discord" @click="shareDiscord" prepend-icon="mdi-discord">
        <v-list-item-title>Share on Discord</v-list-item-title>
      </v-list-item>

      <v-divider key="divider-copy" />

      <v-list-item key="copy" @click="copyLink" prepend-icon="mdi-content-copy">
        <v-list-item-title>Copy Link</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>

  <!-- Snackbar for copy confirmation -->
  <v-snackbar v-model="showCopySnackbar" :timeout="2000" color="success">
    Link copied to clipboard!
  </v-snackbar>
</template>

<script setup>
import { ref, computed } from 'vue';
import analyticsService from '@/services/analyticsService';

const { trackCustomEvent } = analyticsService

const props = defineProps({
  url: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  icon: {
    type: Boolean,
    default: true,
  },
  variant: {
    type: String,
    default: 'text',
  },
  size: {
    type: String,
    default: 'default',
  },
  ariaLabel: {
    type: String,
    default: 'Share this content',
  },
});

const canShare = ref('share' in navigator);
const showCopySnackbar = ref(false);

const iconName = computed(() => 'mdi-share-variant');

/**
 * Share using native Web Share API
 */
function shareNative() {
  try {
    navigator.share({
      title: props.title,
      text: props.description,
      url: props.url,
    });
    trackCustomEvent('share', { method: 'native', content: props.url });
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Error sharing:', error);
    }
  }
}

/**
 * Share on Twitter
 */
function shareTwitter() {
  const text = props.description
    ? `${props.title} - ${props.description}`
    : props.title;

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(props.url)}`;

  window.open(twitterUrl, '_blank', 'width=550,height=420');
  trackCustomEvent('share', { method: 'twitter', content: props.url });
}

/**
 * Share on Reddit
 */
function shareReddit() {
  const redditUrl = `https://reddit.com/submit?url=${encodeURIComponent(props.url)}&title=${encodeURIComponent(props.title)}`;

  window.open(redditUrl, '_blank', 'width=800,height=600');
  trackCustomEvent('share', { method: 'reddit', content: props.url });
}

/**
 * Share on Facebook
 */
function shareFacebook() {
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(props.url)}`;

  window.open(facebookUrl, '_blank', 'width=550,height=420');
  trackCustomEvent('share', { method: 'facebook', content: props.url });
}

/**
 * Share on Discord (copies link optimized for Discord embeds)
 */
function shareDiscord() {
  copyToClipboard(props.url);
  trackCustomEvent('share', { method: 'discord', content: props.url });

  // Show custom message for Discord
  alert('Link copied! Paste it in Discord and the room preview will appear automatically.');
}

/**
 * Copy link to clipboard
 */
async function copyLink() {
  try {
    await copyToClipboard(props.url);
    showCopySnackbar.value = true;
    trackCustomEvent('share', { method: 'copy_link', content: props.url });
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    // Fallback: try older method
    fallbackCopyToClipboard(props.url);
  }
}

/**
 * Modern clipboard API
 */
async function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
  } else {
    fallbackCopyToClipboard(text);
  }
}

/**
 * Fallback clipboard method for older browsers
 */
function fallbackCopyToClipboard(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    document.execCommand('copy');
    showCopySnackbar.value = true;
  } catch (error) {
    console.error('Fallback: Could not copy text', error);
  }

  document.body.removeChild(textArea);
}
</script>

<style scoped>
.v-btn.speed-dial-menu-item {
  background: var(--button-background) !important;
  border: var(--border-width) solid var(--button-border) !important;
  border-radius: 50% !important;
  width: 40px !important;
  height: 40px !important;
  min-width: 40px !important;

  .manga-icon {
    color: var(--button-text) !important;
    font-size: 18px !important;
  }

  &:hover {
    background: var(--button-background-hover) !important;
    border: var(--border-width-hover) solid var(--button-border) !important;

    .manga-icon {
      color: var(--button-text) !important;
    }
  }
}

/* Add any custom styles here */
</style>
