<!-- eslint-disable max-len -->
<template>
  <div class="subscription-page">
    <!-- App Bar -->
    <v-app-bar dense elevation="4" rounded shaped>
      <v-toolbar-title style="display: flex; justify-content: flex-start">
        <v-img src="/logo-206-70.png" class="my-3" contain width="6em" height="40" />
      </v-toolbar-title>

      <v-spacer></v-spacer>

      <!-- Back to Rooms button -->
      <v-btn text class="mr-2" @click="goToRooms">
        <v-icon left>mdi-arrow-left</v-icon>
        Back to Rooms
      </v-btn>
    </v-app-bar>

    <!-- Hero Section -->
    <div class="hero-section">
      <h1 class="hero-title">Choose Your Plan</h1>
      <p class="hero-subtitle">Join thousands of users creating amazing chat experiences</p>

      <!-- Billing Toggle -->
      <div class="billing-toggle">
        <span :class="{ active: billingPeriod === 'monthly' }">Monthly</span>
        <v-switch v-model="isAnnual" color="primary" hide-details density="compact" class="billing-switch"></v-switch>
        <span :class="{ active: billingPeriod === 'annual' }">
          Annual
          <v-chip size="x-small" color="success" class="ml-1">Save 20%</v-chip>
        </span>
      </div>
    </div>

    <!-- Pricing Cards -->
    <div class="pricing-container">
      <div class="pricing-grid">
        <!-- Free Tier / Owner Upgrade / Extra Room Slot -->
        <v-card class="pricing-card free-tier" elevation="2">
          <div class="card-content">
            <div class="tier-header">
              <!-- Show Owner upgrade for registered non-premium users -->
              <template
                v-if="userStore.getCurrentUser && !userStore.getCurrentUser.isAnonymous && userStore.canUpgradeToOwner">
                <h3 class="tier-name">Room Owner</h3>
                <div class="tier-price">
                  <span class="price-amount">$2.99</span>
                  <span class="price-period">/one-time</span>
                </div>
                <p class="tier-description">Unlock premium features for your room. Upload custom content, host more
                  users, and create private rooms.</p>
              </template>
              <!-- Show Extra Room Slot for existing Owners -->
              <template v-else-if="userStore.isOwner && !userStore.isLandlord && !userStore.isCreatorUser">
                <h3 class="tier-name">Extra Room Slot</h3>
                <div class="tier-price">
                  <span class="price-amount">$4.99</span>
                  <span class="price-period">/one-time</span>
                </div>
                <p class="tier-description">Expand your Toonstalk presence. Each purchase adds one more room slot to
                  your account.</p>
                <div style="text-align: center; margin-top: 8px;">
                  <v-chip :color="canPurchaseMoreSlots ? 'primary' : 'success'" size="small">
                    Extra Rooms: {{ slotCountText }}
                  </v-chip>
                </div>
              </template>
              <!-- Show Free tier for non-logged-in or existing premium users -->
              <template v-else>
                <h3 class="tier-name">Free</h3>
                <div class="tier-price">
                  <span class="price-amount">$0</span>
                  <span class="price-period">/forever</span>
                </div>
                <p class="tier-description">For registered newcomers exploring the Toonstalk universe.</p>
              </template>
            </div>

            <!-- Dynamic button based on user state -->
            <v-btn block size="large"
              :variant="(userStore.canUpgradeToOwner || (userStore.isOwner && !userStore.isLandlord && !userStore.isCreatorUser && canPurchaseMoreSlots)) ? 'flat' : 'outlined'"
              :color="(userStore.canUpgradeToOwner || (userStore.isOwner && !userStore.isLandlord && !userStore.isCreatorUser && canPurchaseMoreSlots)) ? 'primary' : undefined"
              :disabled="(userStore.isOwner && !userStore.isLandlord && !userStore.isCreatorUser && !canPurchaseMoreSlots)"
              class="subscribe-btn" @click="handleSubscribe('free')">
              {{
                (!userStore.getCurrentUser || userStore.getCurrentUser.isAnonymous) ? 'Register' :
                  userStore.canUpgradeToOwner ? 'Become an Owner' :
                    (userStore.isOwner && !userStore.isLandlord && !userStore.isCreatorUser) ?
                      (canPurchaseMoreSlots ? 'Buy Extra Room' : 'Maximum Rooms Purchased') :
                      'View Profile'
              }}
            </v-btn>

            <div class="features-list">
              <!-- Show Owner benefits for eligible users -->
              <template
                v-if="userStore.getCurrentUser && !userStore.getCurrentUser.isAnonymous && userStore.canUpgradeToOwner">
                <div class="features-header">Premium features included:</div>
                <div class="feature-item">
                  <v-icon color="primary" size="small">mdi-check-circle</v-icon>
                  <span>Upload custom backgrounds</span>
                </div>
                <div class="feature-item">
                  <v-icon color="primary" size="small">mdi-check-circle</v-icon>
                  <span>Upload custom avatars</span>
                </div>
                <div class="feature-item">
                  <v-icon color="primary" size="small">mdi-check-circle</v-icon>
                  <span>Up to 20 users per room</span>
                </div>
                <div class="feature-item">
                  <v-icon color="primary" size="small">mdi-check-circle</v-icon>
                  <span>Create private rooms</span>
                </div>
                <div class="feature-item">
                  <v-icon color="primary" size="small">mdi-check-circle</v-icon>
                  <span>Advanced moderation tools</span>
                </div>
                <div class="feature-item">
                  <v-icon color="primary" size="small">mdi-check-circle</v-icon>
                  <span>Priority support</span>
                </div>
              </template>
              <!-- Show Extra Room benefits for existing Owners -->
              <template v-else-if="userStore.isOwner && !userStore.isLandlord && !userStore.isCreatorUser">
                <div class="features-header">What you'll get:</div>
                <div class="feature-item">
                  <v-icon color="primary" size="small">mdi-check-circle</v-icon>
                  <span>Add one more room to your account</span>
                </div>
                <div class="feature-item">
                  <v-icon color="primary" size="small">mdi-check-circle</v-icon>
                  <span>Keep all your Owner benefits</span>
                </div>
                <div class="feature-item">
                  <v-icon color="primary" size="small">mdi-check-circle</v-icon>
                  <span>Custom backgrounds & avatars</span>
                </div>
                <div class="feature-item">
                  <v-icon color="primary" size="small">mdi-check-circle</v-icon>
                  <span>Up to 20 users per room</span>
                </div>
                <div class="feature-item">
                  <v-icon color="primary" size="small">mdi-check-circle</v-icon>
                  <span>Private room creation</span>
                </div>
              </template>
              <!-- Show Free tier features for others -->
              <template v-else>
                <div class="features-header">What's included:</div>
                <div v-for="feature in freeTierFeatures" :key="feature" class="feature-item">
                  <v-icon color="success" size="small">mdi-check-circle</v-icon>
                  <span>{{ feature }}</span>
                </div>
                <div v-for="feature in freeTierLimitations" :key="feature" class="feature-item disabled">
                  <v-icon color="grey" size="small">mdi-close-circle</v-icon>
                  <span>{{ feature }}</span>
                </div>
              </template>
            </div>
          </div>
        </v-card>

        <!-- Landlord Tier -->
        <v-card class="pricing-card landlord-tier popular" elevation="8">
          <div class="popular-badge">
            <v-chip color="primary" size="small">Most Popular</v-chip>
          </div>
          <div class="card-content">
            <div class="tier-header">
              <h3 class="tier-name">Landlord</h3>
              <div class="tier-price">
                <span class="price-amount">${{ landlordPrice }}</span>
                <span class="price-period">/{{ billingPeriod === 'annual' ? 'year' : 'month' }}</span>
              </div>
              <p class="tier-description">Perfect for creators who want to design and manage their own Toonstalk spaces.
              </p>
            </div>

            <v-btn block size="large" color="primary" variant="flat" class="subscribe-btn primary-cta"
              @click="handleSubscribe('landlord')">
              Subscribe Now
            </v-btn>

            <div class="features-list">
              <div class="features-header">Everything in Free, plus:</div>
              <div v-for="feature in landlordTierFeatures" :key="feature" class="feature-item">
                <v-icon color="primary" size="small">mdi-check-circle</v-icon>
                <span>{{ feature }}</span>
              </div>
            </div>
          </div>
        </v-card>

        <!-- Creator Tier -->
        <v-card class="pricing-card creator-tier" elevation="2">
          <div class="card-content">
            <div class="tier-header">
              <h3 class="tier-name">Creator</h3>
              <div class="tier-price">
                <span class="price-amount">${{ creatorPrice }}</span>
                <span class="price-period">/{{ billingPeriod === 'annual' ? 'year' : 'month' }}</span>
              </div>
              <p class="tier-description">For true community leaders and creators.</p>
            </div>

            <v-btn block size="large" color="purple" variant="flat" class="subscribe-btn"
              @click="handleSubscribe('creator')">
              Go Pro
            </v-btn>

            <div class="features-list">
              <div class="features-header">Everything in Landlord, plus:</div>
              <div v-for="feature in creatorTierFeatures" :key="feature" class="feature-item">
                <v-icon color="purple" size="small">mdi-check-circle</v-icon>
                <span>{{ feature }}</span>
              </div>
            </div>
          </div>
        </v-card>
      </div>
    </div>

    <!-- FAQ Section -->
    <div class="faq-section">
      <h2 class="faq-title">Frequently Asked Questions</h2>
      <v-expansion-panels variant="accordion" class="faq-panels">
        <v-expansion-panel>
          <v-expansion-panel-title>Can I upgrade or downgrade my plan?</v-expansion-panel-title>
          <v-expansion-panel-text>
            Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate
            any differences.
          </v-expansion-panel-text>
        </v-expansion-panel>
        <v-expansion-panel>
          <v-expansion-panel-title>What payment methods do you accept?</v-expansion-panel-title>
          <v-expansion-panel-text>
            We accept all major credit cards (Visa, Mastercard, American Express) through our secure Stripe payment
            processor.
          </v-expansion-panel-text>
        </v-expansion-panel>
        <v-expansion-panel>
          <v-expansion-panel-title>Can I cancel my subscription anytime?</v-expansion-panel-title>
          <v-expansion-panel-text>
            Absolutely! You can cancel your subscription at any time from your profile settings. You'll continue to have
            access until the end of your billing period.
          </v-expansion-panel-text>
        </v-expansion-panel>
        <v-expansion-panel>
          <v-expansion-panel-title>Is there a refund policy?</v-expansion-panel-title>
          <v-expansion-panel-text>
            We offer a 30-day money-back guarantee for annual plans. If you're not satisfied, contact us within 30 days
            for a full refund.
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>

    <!-- Footer -->
    <v-footer padless class="subscription-footer">
      <v-card flat tile width="100%" class="text-center">
        <v-divider></v-divider>
        <v-card-text>
          <div class="footer-content">
            <div class="footer-copyright">
              Copyright © {{ new Date().getFullYear() }} — <strong>toonstalk</strong>
            </div>
            <div class="footer-links">
              <router-link to="/privacy" class="footer-link">Privacy Policy</router-link>
              <span class="footer-separator">•</span>
              <router-link to="/terms" class="footer-link">Terms of Service</router-link>
              <span class="footer-separator">•</span>
              <router-link to="/cookies" class="footer-link">Cookie Policy</router-link>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-footer>

    <!-- Downgrade Confirmation Dialog -->
    <v-dialog v-model="showDowngradeDialog" max-width="600">
      <v-card>
        <v-card-title class="warning--text">
          <v-icon color="warning" class="mr-2">mdi-alert</v-icon>
          Confirm Subscription Change
        </v-card-title>
        <v-card-text v-if="pendingDowngrade">
          <p><strong>You're about to downgrade from {{ pendingDowngrade.from }} to {{ pendingDowngrade.to }}.</strong></p>

          <v-alert type="info" class="my-4">
            <strong>When does this take effect?</strong><br>
            This change will happen at the <strong>end of your current billing period</strong>.<br><br>
            You'll keep all your {{ pendingDowngrade.from }} features until then.
          </v-alert>

          <p><strong>What you'll lose:</strong></p>
          <ul v-if="pendingDowngrade.from === 'Creator'">
            <li>Unlimited rooms (reduced to 5 rooms on Landlord)</li>
            <li>Creator badge on your profile</li>
            <li>Host up to 30 users (reduced to 20)</li>
            <li>Unlimited custom avatars/backgrounds</li>
          </ul>

          <p class="mt-4"><strong>Note:</strong> If you currently have more than 5 rooms, you'll need to delete or archive some before creating new ones after the downgrade.</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showDowngradeDialog = false">Cancel</v-btn>
          <v-btn color="warning" @click="confirmDowngrade" :loading="loadingSubscription">Confirm Downgrade</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Auth Dialog for Registration -->
    <v-dialog v-model="showAuthDialog" max-width="400" persistent>
      <v-card class="auth-dialog">
        <v-card-title class="text-h6 text-center">
          Welcome to ToonsTalk
        </v-card-title>
        <v-card-text class="text-center">
          <p class="mb-4">
            Create an account to get started with your subscription!
          </p>
          <div id="firebaseui-auth-container"></div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeAuthDialog">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import useUserStore from '@/stores/user';
import useMainStore from '@/stores/main';
import subscriptionService from '@/services/subscriptionService';
import { formatDate } from '@/utils/dateUtils';
import { TIER_RANKS } from '@/constants/tiers';

const router = useRouter();
const userStore = useUserStore();
const mainStore = useMainStore();

// Billing period toggle
const isAnnual = ref(false);
const billingPeriod = computed(() => (isAnnual.value ? 'annual' : 'monthly'));

// Room slot purchase limits
const purchasedRoomSlots = computed(() => userStore.getCurrentUser?.purchasedRoomSlots || 0);
const maxPurchasableSlots = subscriptionService.MAX_PURCHASABLE_SLOTS;
const canPurchaseMoreSlots = computed(() => purchasedRoomSlots.value < maxPurchasableSlots);
const slotCountText = computed(() => `${purchasedRoomSlots.value}/${maxPurchasableSlots}`);

// Auth dialog for registration
const showAuthDialog = ref(false);

// Downgrade confirmation dialog
const showDowngradeDialog = ref(false);
const pendingDowngrade = ref(null);
const loadingSubscription = ref(false);

// Pricing configuration
const PRICING = {
  landlord: {
    monthly: 9.99,
    annual: 95.88, // 20% discount ($9.99 * 12 * 0.8)
  },
  creator: {
    monthly: 29.99,
    annual: 287.88, // 20% discount ($29.99 * 12 * 0.8)
  },
};

// Computed prices
const landlordPrice = computed(() => {
  return billingPeriod.value === 'annual'
    ? PRICING.landlord.annual.toFixed(2)
    : PRICING.landlord.monthly.toFixed(2);
});

const creatorPrice = computed(() => {
  return billingPeriod.value === 'annual'
    ? PRICING.creator.annual.toFixed(2)
    : PRICING.creator.monthly.toFixed(2);
});

// Feature lists
const freeTierFeatures = [
  'Join and chat in public rooms',
  'Access full chat history anytime',
  'Save your favorite rooms for quick access',
  'Invite others to private 1:1 chats',
  'Access other users public profile info',
  'Manage your own profile',
  'Create 1 public room of your own',
  'Add avatars from a list to your rooms(only 10)',
  'Limited users by room(only 10)',
  'Room will be inactive after 30 days(you can active it again by subscribing)',
  'Community support',
];

const freeTierLimitations = [
  'Private rooms',
  'Custom backgrounds',
  'Custom avatars',
];

const landlordTierFeatures = [
  'Create up to 5 rooms — public or private. Yes, FIVE!',
  'Upload custom room backgrounds (make it truly yours!)',
  'Add or upload avatars to your rooms (up to 10 custom avatars!)',
  'Host up to 20 users in each room',
  'Advanced moderation tools',
  'View detailed room analytics and insights',
  'Get priority support from the Toonstalk team',
];

const creatorTierFeatures = [
  'Display an exclusive Creator badge on your profile',
  'Create unlimited public and private rooms',
  'Upload unlimited custom avatars and backgrounds',
  'Add as many avatars as your imagination allows',
  'Host up to 30 users in each room',
  'Get early access to experimental features',
  'Claim your own custom room URLs',
  'Top-tier support and feature feedback priority',
];

// Methods
function goToRooms() {
  router.push({ name: 'rooms' });
}

async function handleSubscribe(tier) {
  const currentUser = userStore.getCurrentUser;

  if (tier === 'free') {
    // Case 1: Not logged in → Show registration dialog
    if (!currentUser || currentUser.isAnonymous) {
      mainStore.setSnackbar({
        type: 'info',
        msg: 'Please register to get started!',
      });
      showAuthDialog.value = true;
      return;
    }

    // Case 2: Registered but not Owner → Show Owner upgrade
    if (userStore.canUpgradeToOwner) {
      try {
        mainStore.setSnackbar({
          type: 'info',
          msg: 'Redirecting to Owner upgrade checkout...',
        });
        const checkoutUrl = await subscriptionService.purchaseOwnerUpgrade();
        window.location.href = checkoutUrl;
      } catch (error) {
        console.error('Error upgrading to Owner:', error);
        mainStore.setSnackbar({
          type: 'error',
          msg: error.message || 'Failed to process upgrade. Please try again.',
        });
      }
      return;
    }

    // Case 2.5: Existing Owner wanting to buy extra room slot
    if (userStore.isOwner && !userStore.isLandlord && !userStore.isCreatorUser) {
      try {
        mainStore.setSnackbar({
          type: 'info',
          msg: 'Redirecting to checkout for extra room slot...',
        });
        console.log('currentUser', currentUser);
        const checkoutUrl = await subscriptionService.purchaseRoomSlot(currentUser.userId);
        window.location.href = checkoutUrl;
      } catch (error) {
        console.error('Error purchasing room slot:', error);
        mainStore.setSnackbar({
          type: 'error',
          msg: error.message || 'Failed to process purchase. Please try again.',
        });
      }
      return;
    }

    // Case 3: Already has premium (Landlord/Creator) → Go to profile
    mainStore.setSnackbar({
      type: 'info',
      msg: 'You already have premium access!',
    });
    router.push({ name: 'profile' });
    return;
  }

  // Check if user is authenticated
  if (!currentUser || currentUser.isAnonymous) {
    mainStore.setSnackbar({
      type: 'warning',
      msg: 'Please sign in to subscribe to a paid plan',
    });
    router.push({ name: 'rooms' });
    return;
  }

  // Check if this is a downgrade
  const currentTier = currentUser.subscriptionTier || currentUser.subscription?.tier || 'free';
  const isDowngradeFlow = TIER_RANKS[tier] < TIER_RANKS[currentTier];

  if (isDowngradeFlow) {
    // Show downgrade confirmation dialog
    const tierNames = { landlord: 'Landlord', creator: 'Creator' };
    pendingDowngrade.value = {
      from: tierNames[currentTier] || currentTier,
      to: tierNames[tier] || tier,
      targetTier: tier,
    };
    showDowngradeDialog.value = true;
    return;
  }

  try {
    mainStore.setSnackbar({
      type: 'info',
      msg: 'Processing subscription...',
    });
    console.log('tier', tier);
    // Create or update subscription
    const result = await subscriptionService.createCheckoutSession(
      tier,
      billingPeriod.value,
    );
    console.log('result', result);
    // Handle subscription update (no checkout needed)
    if (result.updated) {
      mainStore.setSnackbar({
        type: 'success',
        msg: result.message || 'Subscription updated successfully!',
      });
      // Redirect to profile after a short delay
      setTimeout(() => {
        router.push({ name: 'profile' });
      }, 2000);
    } else {
      // Handle new subscription (redirect to checkout)
      mainStore.setSnackbar({
        type: 'info',
        msg: 'Redirecting to Stripe checkout...',
      });
      window.location.href = result.url;
    }
  } catch (error) {
    console.error('Error subscribing:', error);
    mainStore.setSnackbar({
      type: 'error',
      msg: error.message || 'Failed to process subscription. Please try again.',
    });
  }
}

// Confirm downgrade after user accepts the warning
async function confirmDowngrade() {
  try {
    loadingSubscription.value = true;
    showDowngradeDialog.value = false;

    mainStore.setSnackbar({
      type: 'info',
      msg: 'Processing downgrade...',
    });

    const result = await subscriptionService.createCheckoutSession(
      pendingDowngrade.value.targetTier,
      billingPeriod.value,
    );

    if (result.updated) {
      const currentUser = userStore.getCurrentUser;
      const currentPeriodEnd = currentUser.subscription?.currentPeriodEnd;

      mainStore.setSnackbar({
        type: 'success',
        msg: currentPeriodEnd
          ? `Downgrade scheduled for ${formatDate(currentPeriodEnd)}. Check your email for details.`
          : 'Downgrade scheduled. Check your email for details.',
        timeout: 7000,
      });

      // Redirect to profile after a short delay
      setTimeout(() => {
        router.push({ name: 'profile' });
      }, 3000);
    } else {
      window.location.href = result.url;
    }
  } catch (error) {
    console.error('Error processing downgrade:', error);
    mainStore.setSnackbar({
      type: 'error',
      msg: error.message || 'Failed to process downgrade. Please try again.',
    });
  } finally {
    loadingSubscription.value = false;
    pendingDowngrade.value = null;
  }
}

// Close auth dialog
function closeAuthDialog() {
  showAuthDialog.value = false;
}

// Watchers

// Initialize Firebase UI when auth dialog opens
watch(showAuthDialog, (newVal) => {
  if (newVal) {
    nextTick(() => {
      userStore.setFirebaseUiInstance('subscription');
    });
  }
});

// Watch for successful authentication and redirect
watch(
  () => userStore.currentUser?.isAnonymous,
  (newVal, oldVal) => {
    // User upgraded from anonymous to registered
    if (oldVal === true && newVal === false && showAuthDialog.value) {
      showAuthDialog.value = false;
      mainStore.setSnackbar({
        type: 'success',
        msg: 'Registration successful! Redirecting to rooms...',
      });
      // Redirect to rooms after successful registration
      setTimeout(() => {
        router.push({ name: 'rooms' });
      }, 1000);
    }
  },
);

// Watch for new authenticated user (non-anonymous)
watch(
  () => userStore.currentUser?.userId,
  (newVal, oldVal) => {
    // New user logged in (not anonymous)
    if (!oldVal && newVal && !userStore.currentUser?.isAnonymous && showAuthDialog.value) {
      showAuthDialog.value = false;
      mainStore.setSnackbar({
        type: 'success',
        msg: 'Welcome! Redirecting to rooms...',
      });
      // Redirect to rooms after successful registration
      setTimeout(() => {
        router.push({ name: 'rooms' });
      }, 1000);
    }
  },
);

// Watch for signing in upgrade event
watch(
  () => userStore.signingInUpgraded,
  (newVal) => {
    if (newVal && showAuthDialog.value) {
      showAuthDialog.value = false;
      mainStore.setSnackbar({
        type: 'success',
        msg: 'Account upgraded! Redirecting to rooms...',
      });
      // Redirect to rooms after successful upgrade
      setTimeout(() => {
        router.push({ name: 'rooms' });
      }, 1000);
    }
  },
);
</script>

<style scoped>
.subscription-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-attachment: fixed;
}

/* Hero Section */
.hero-section {
  text-align: center;
  padding: 60px 20px 40px;
  color: white;
}

.hero-title {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 16px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.hero-subtitle {
  font-size: 1.25rem;
  font-weight: 400;
  opacity: 0.95;
  margin-bottom: 40px;
}

/* Billing Toggle */
.billing-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 32px;
  font-size: 1.1rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
}

.billing-toggle span {
  transition: all 0.3s ease;
}

.billing-toggle span.active {
  color: white;
  font-weight: 600;
  transform: scale(1.05);
}

.billing-switch {
  margin: 0 8px;
}

/* Pricing Container */
.pricing-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px 80px;
}

.pricing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 32px;
  align-items: start;
}

/* Pricing Cards */
.pricing-card {
  position: relative;
  border-radius: 24px !important;
  overflow: visible;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  background: white;
  height: 100%;
  margin-top: 24px;
  /* Add space for the badge */
}

.pricing-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2) !important;
}

.pricing-card.popular {
  border: 3px solid var(--v-primary-base);
  transform: scale(1.05);
}

.pricing-card.popular:hover {
  transform: scale(1.05) translateY(-8px);
}

.popular-badge {
  position: absolute;
  top: -16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  background: white;
  border-radius: 20px;
  padding: 2px 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card-content {
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Tier Header */
.tier-header {
  text-align: center;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.tier-name {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.tier-price {
  margin-bottom: 12px;
}

.price-amount {
  font-size: 3rem;
  font-weight: 800;
  color: var(--text-primary);
}

.price-period {
  font-size: 1rem;
  font-weight: 400;
  color: var(--text-secondary);
  margin-left: 4px;
}

.tier-description {
  font-size: 0.95rem;
  color: var(--text-secondary);
  margin: 0;
}

/* Subscribe Button */
.subscribe-btn {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  font-weight: 600 !important;
  text-transform: none !important;
  border-radius: 12px !important;
  padding: 12px 24px !important;
  font-size: 1rem !important;
  transition: all 0.3s ease !important;
}

.subscribe-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.primary-cta {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
}

/* Features List */
.features-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.features-header {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.95rem;
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.feature-item:hover {
  transform: translateX(4px);
}

.feature-item.disabled {
  color: var(--text-secondary);
  opacity: 0.6;
}

.feature-item span {
  flex: 1;
}

/* FAQ Section */
.faq-section {
  max-width: 800px;
  margin: 0 auto 80px;
  padding: 0 20px;
}

.faq-title {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  color: white;
  margin-bottom: 32px;
}

.faq-panels {
  border-radius: 16px !important;
  overflow: hidden;
}

/* Footer */
.subscription-footer {
  background: transparent !important;
  margin-top: auto;
}

.subscription-footer .v-card {
  background: transparent !important;
  box-shadow: none !important;
}

.subscription-footer .v-divider {
  border-color: rgba(255, 255, 255, 0.2) !important;
  opacity: 1 !important;
}

.footer-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  color: white !important;
}

.footer-copyright {
  font-size: 14px;
  color: white !important;
}

.footer-copyright strong {
  color: white !important;
}

.footer-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  align-items: center;
}

.footer-link {
  color: rgba(255, 255, 255, 0.95) !important;
  text-decoration: none;
  font-size: 13px;
  transition: color 0.2s;
}

.footer-link:hover {
  color: white !important;
  text-decoration: underline;
}

.footer-separator {
  color: rgba(255, 255, 255, 0.7) !important;
  font-size: 13px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .pricing-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .pricing-card.popular {
    transform: scale(1);
  }

  .pricing-card.popular:hover {
    transform: translateY(-8px);
  }

  .price-amount {
    font-size: 2.5rem;
  }

  .footer-links {
    flex-direction: column;
    gap: 4px;
  }

  .footer-separator {
    display: none;
  }
}
</style>
