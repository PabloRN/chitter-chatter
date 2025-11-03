<template>
  <div class="auth-action-container">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-container">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4">{{ loadingMessage }}</p>
    </div>

    <!-- Success State -->
    <div v-else-if="successMessage" class="success-container">
      <v-icon color="success" size="64" class="mb-4">mdi-check-circle</v-icon>
      <h2>{{ successMessage }}</h2>
      <p v-if="successDetails" class="mt-2">{{ successDetails }}</p>
      <v-btn v-if="showReturnButton" color="primary" class="mt-4" @click="returnToOriginalTab">
        Return to App
      </v-btn>
    </div>

    <!-- Error State -->
    <div v-else-if="errorMessage" class="error-container">
      <v-icon color="error" size="64" class="mb-4">mdi-alert-circle</v-icon>
      <h2>Authentication Error</h2>
      <p class="mt-2">{{ errorMessage }}</p>
      <v-btn color="primary" class="mt-4" @click="handleRetry">
        Try Again
      </v-btn>
    </div>

    <!-- Email Input Form (if needed) -->
    <div v-else-if="needsEmailInput" class="email-form-container">
      <v-card class="mx-auto" max-width="400">
        <v-card-title>
          <v-icon class="mr-2">mdi-email</v-icon>
          Complete Sign In
        </v-card-title>
        <v-card-text>
          <p class="mb-4">Please enter your email to complete the sign-in process.</p>
          <v-text-field v-model="emailInput" label="Email Address" type="email" outlined :error-messages="emailError"
            @keyup.enter="handleEmailSubmit"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" :loading="isProcessing" @click="handleEmailSubmit">
            Continue
          </v-btn>
        </v-card-actions>
      </v-card>
    </div>

    <!-- Password Reset Form -->
    <div v-else-if="showPasswordReset" class="password-reset-container">
      <v-card class="mx-auto" max-width="400">
        <v-card-title>
          <v-icon class="mr-2">mdi-lock-reset</v-icon>
          Reset Password
        </v-card-title>
        <v-card-text>
          <p class="mb-4">Enter your new password below.</p>
          <v-text-field v-model="newPassword" label="New Password" type="password" outlined
            :error-messages="passwordError"></v-text-field>
          <v-text-field v-model="confirmPassword" label="Confirm Password" type="password" outlined
            :error-messages="confirmPasswordError" @keyup.enter="handlePasswordReset"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" :loading="isProcessing" @click="handlePasswordReset">
            Reset Password
          </v-btn>
        </v-card-actions>
      </v-card>
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuth, useEmailManagement } from '@/composables/useAuth';
import navigationService from '@/services/navigationService';

// Composables
const route = useRoute();
const router = useRouter();
const {
  handleEmailLink,
  isEmailLink,
  verifyEmail,
  verifyPasswordResetCode,
  completePasswordReset,
  error: authError,
} = useAuth();

const {
  getStoredEmail,
  requestEmailFromOtherTabs,
  storeEmailForSignIn,
} = useEmailManagement();

// Reactive state
const isLoading = ref(false);
const isProcessing = ref(false);
const loadingMessage = ref('Processing...');
const successMessage = ref('');
const successDetails = ref('');
const errorMessage = ref('');
const needsEmailInput = ref(false);
const showPasswordReset = ref(false);
const showReturnButton = ref(false);

// Form inputs
const emailInput = ref('');
const emailError = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const passwordError = ref('');
const confirmPasswordError = ref('');

// Computed
const currentUrl = computed(() => window.location.href);

/**
 * Initialize authentication action handling
 */
onMounted(async () => {
  console.log('🚀 AuthAction component mounted');

  try {
    isLoading.value = true;
    loadingMessage.value = 'Processing authentication...';

    const { mode, oobCode } = route.query;

    if (!mode || !oobCode) {
      throw new Error('Invalid authentication link');
    }

    await handleAuthAction(mode, oobCode);
  } catch (error) {
    console.error('❌ Auth action initialization failed:', error);
    handleError(error);
  } finally {
    isLoading.value = false;
  }
});

/**
 * Handle different authentication actions
 */
const handleAuthAction = async (mode, oobCode) => {
  console.log(`🔧 Handling auth action: ${mode}`);

  switch (mode) {
    case 'signIn':
      await handleSignInWithEmailLink(oobCode);
      break;
    case 'verifyEmail':
      await handleEmailVerification(oobCode);
      break;
    case 'resetPassword':
      await handlePasswordResetVerification(oobCode);
      break;
    default:
      throw new Error(`Unknown auth action mode: ${mode}`);
  }
};

/**
 * Handle sign-in with email link
 */
const handleSignInWithEmailLink = async (oobCode) => {
  try {
    loadingMessage.value = 'Signing you in...';

    if (!isEmailLink(currentUrl.value)) {
      throw new Error('Invalid email link');
    }

    // Try to get email from storage first
    let email = getStoredEmail();

    // If no stored email, try requesting from other tabs
    if (!email) {
      console.log('📨 No stored email found, requesting from other tabs...');
      loadingMessage.value = 'Retrieving your email...';

      try {
        email = await requestEmailFromOtherTabs();
      } catch (error) {
        console.log('⚠️ Could not get email from other tabs, asking user');
        needsEmailInput.value = true;
        isLoading.value = false;
        return;
      }
    }

    // Perform sign-in
    const result = await handleEmailLink(email, currentUrl.value);

    // Handle success
    await handleSignInSuccess(result);
  } catch (error) {
    console.error('❌ Email link sign-in failed:', error);
    throw error;
  }
};

/**
 * Handle email verification
 */
const handleEmailVerification = async (oobCode) => {
  try {
    loadingMessage.value = 'Verifying your email...';

    const result = await verifyEmail(oobCode);

    successMessage.value = 'Email Verified!';
    successDetails.value = `${result.message || 'Your email has been successfully verified.'} This tab will close automatically in 5 seconds.`;
    showReturnButton.value = false;

    // Auto-close tab after delay
    setTimeout(() => {
      console.log('🏠 Auto-closing verification tab');
      try {
        window.close();
      } catch (error) {
        console.warn('Could not auto-close tab, showing return button:', error);
        showReturnButton.value = true;
        successDetails.value += ' Please close this tab manually or click the button below.';
      }
    }, 5000);
  } catch (error) {
    console.error('❌ Email verification failed:', error);
    throw error;
  }
};

/**
 * Handle password reset verification
 */
const handlePasswordResetVerification = async (oobCode) => {
  try {
    loadingMessage.value = 'Verifying reset code...';

    await verifyPasswordResetCode(oobCode);

    // Show password reset form
    showPasswordReset.value = true;
    isLoading.value = false;
  } catch (error) {
    console.error('❌ Password reset verification failed:', error);
    throw error;
  }
};

/**
 * Handle successful sign-in
 */
const handleSignInSuccess = async (result) => {
  console.log('✅ Sign-in successful:', result);

  if (result.isUpgrade) {
    successMessage.value = 'Account Upgraded!';
    successDetails.value = 'Your anonymous account has been successfully upgraded. This tab will close automatically.';
  } else {
    successMessage.value = 'Sign In Successful!';
    successDetails.value = 'You have been successfully signed in. This tab will close automatically.';
  }

  showReturnButton.value = false; // Hide return button since we're auto-closing

  // Auto-close tab after short delay
  setTimeout(() => {
    console.log('🏠 Auto-closing authentication tab');
    try {
      // Attempt to close the tab
      window.close();
    } catch (error) {
      console.warn('Could not auto-close tab, showing return button:', error);
      // If auto-close fails, show the return button as fallback
      showReturnButton.value = true;
      successDetails.value += ' Please close this tab manually or click the button below.';
    }
  }, 2000);
};

/**
 * Handle email input submission
 */
const handleEmailSubmit = async () => {
  if (!emailInput.value) {
    emailError.value = 'Please enter your email address';
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value)) {
    emailError.value = 'Please enter a valid email address';
    return;
  }

  emailError.value = '';

  try {
    isProcessing.value = true;

    // Normalize email to lowercase for better matching (especially for Yahoo, Gmail, etc.)
    const normalizedEmail = emailInput.value.trim().toLowerCase();

    // Store email for future use
    storeEmailForSignIn(normalizedEmail);

    // Perform sign-in with normalized email
    const result = await handleEmailLink(normalizedEmail, currentUrl.value);

    // Handle success
    needsEmailInput.value = false;
    await handleSignInSuccess(result);
  } catch (error) {
    console.error('❌ Email sign-in failed:', error);
    handleError(error);
  } finally {
    isProcessing.value = false;
  }
};

/**
 * Handle password reset submission
 */
const handlePasswordReset = async () => {
  // Validate passwords
  if (!newPassword.value) {
    passwordError.value = 'Please enter a new password';
    return;
  }

  if (newPassword.value.length < 6) {
    passwordError.value = 'Password must be at least 6 characters';
    return;
  }

  if (newPassword.value !== confirmPassword.value) {
    confirmPasswordError.value = 'Passwords do not match';
    return;
  }

  passwordError.value = '';
  confirmPasswordError.value = '';

  try {
    isProcessing.value = true;

    const result = await completePasswordReset(route.query.oobCode, newPassword.value);

    showPasswordReset.value = false;
    successMessage.value = 'Password Reset Complete!';
    successDetails.value = result.message || 'Your password has been successfully reset.';
    showReturnButton.value = true;

    // Auto-navigate after delay
    setTimeout(() => {
      returnToOriginalTab();
    }, 2000);
  } catch (error) {
    console.error('❌ Password reset failed:', error);
    handleError(error);
  } finally {
    isProcessing.value = false;
  }
};

/**
 * Handle retry action
 */
const handleRetry = () => {
  // Reset error state
  errorMessage.value = '';
  needsEmailInput.value = false;
  showPasswordReset.value = false;

  // Retry the original action
  const { mode, oobCode } = route.query;
  handleAuthAction(mode, oobCode);
};

/**
 * Return to original tab/context
 */
const returnToOriginalTab = () => {
  console.log('🔄 Returning to original context');

  const originalContext = navigationService.getOriginalContext();

  if (originalContext) {
    // Request focus of original tab
    navigationService.requestFocusOriginalTab(originalContext);
  } else {
    // Fallback: navigate to home
    router.push('/');
  }
};

/**
 * Handle errors
 */
const handleError = (error) => {
  console.error('❌ AuthAction error:', error);

  errorMessage.value = error.message || 'An authentication error occurred.';

  // Clear other states
  needsEmailInput.value = false;
  showPasswordReset.value = false;
  successMessage.value = '';
};

// Watch for auth errors
const unwatchAuthError = computed(() => {
  if (authError.value) {
    handleError({ message: authError.value });
  }
});

// Cleanup
onUnmounted(() => {
  if (unwatchAuthError.value) {
    unwatchAuthError();
  }
});
</script>

<style scoped>
.auth-action-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.loading-container,
.success-container,
.error-container {
  text-align: center;
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 100%;
}

.email-form-container,
.password-reset-container {
  width: 100%;
  max-width: 400px;
}

.v-card {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

h2 {
  color: #333;
  margin-bottom: 16px;
}

p {
  color: #666;
  line-height: 1.6;
}

.v-icon {
  opacity: 0.9;
}

.v-btn {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 500;
}
</style>
