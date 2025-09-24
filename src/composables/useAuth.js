import {
  ref,
  computed,
  onMounted,
  onUnmounted,
} from 'vue';
import authService from '@/services/authService';
import tabCommunicationService from '@/services/tabCommunicationService';
import navigationService from '@/services/navigationService';

/**
 * Authentication Composable
 * Provides reactive authentication state and methods
 */
export function useAuth() {
  // Reactive state
  const currentUser = ref(null);
  const isLoading = ref(false);
  const error = ref(null);
  const isSigningIn = ref(false);

  // Computed properties
  const isAuthenticated = computed(() => !!currentUser.value);
  const isAnonymous = computed(() => currentUser.value?.isAnonymous || false);
  const isEmailVerified = computed(() => currentUser.value?.emailVerified || false);

  // Auth state listener
  let authStateUnsubscribe = null;
  let authMessageListener = null;

  /**
   * Initialize auth state listener
   */
  const initAuthListener = () => {
    authStateUnsubscribe = authService.auth.onAuthStateChanged(async (user) => {
      console.log('🔐 Auth state changed:', user?.uid || 'signed out');

      if (user) {
        // Get user data from database
        const userData = await authService.getCurrentUserData();
        currentUser.value = {
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
          isAnonymous: user.isAnonymous,
          ...userData,
        };
      } else {
        currentUser.value = null;
      }

      isLoading.value = false;
    });
  };

  /**
   * Handle cross-tab authentication messages
   */
  const handleAuthMessage = (message) => {
    switch (message.type) {
      case 'AUTH_SUCCESS':
        console.log('📨 Received auth success from another tab');
        // The auth state listener will handle the user update
        break;
      case 'AUTH_FAILURE':
        console.log('📨 Received auth failure from another tab');
        error.value = message.error;
        isSigningIn.value = false;
        break;
      case 'SIGN_OUT':
        console.log('📨 Received sign-out from another tab');
        // The auth state listener will handle the user update
        break;
      default:
        // Handle unknown message types
        break;
    }
  };

  /**
   * Initialize cross-tab communication listener
   */
  const initCrossTabListener = () => {
    authMessageListener = tabCommunicationService.addAuthListener((message) => {
      handleAuthMessage(message);
    });
  };

  /**
   * Sign in anonymously
   */
  const signInAnonymously = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      const result = await authService.signInAnonymously();
      console.log('✅ Anonymous sign-in successful');

      // Broadcast success for cross-tab communication
      tabCommunicationService.broadcastAuthSuccess({
        userId: result.user.uid,
        isUpgrade: false,
        originalTabContext: navigationService.getOriginalContext(),
      });

      return result;
    } catch (err) {
      console.error('❌ Anonymous sign-in failed:', err);
      error.value = err.message || 'Anonymous sign-in failed';

      // Broadcast failure for cross-tab communication
      tabCommunicationService.broadcastAuthFailure(
        err,
        navigationService.getOriginalContext(),
      );

      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Create user with email and password
   */
  const createUserWithEmailAndPassword = async (email, password, userData = {}) => {
    try {
      isLoading.value = true;
      error.value = null;

      const result = await authService.createUserWithEmailAndPassword(email, password, userData);
      console.log('✅ User creation successful');

      return result;
    } catch (err) {
      console.error('❌ User creation failed:', err);
      error.value = err.message || 'User creation failed';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Sign in with email and password
   */
  const signInWithEmailAndPassword = async (email, password) => {
    try {
      isLoading.value = true;
      isSigningIn.value = true;
      error.value = null;

      const result = await authService.signInWithEmailAndPassword(email, password);
      console.log('✅ Email sign-in successful');

      return result;
    } catch (err) {
      console.error('❌ Email sign-in failed:', err);
      error.value = err.message || 'Sign-in failed';
      throw err;
    } finally {
      isLoading.value = false;
      isSigningIn.value = false;
    }
  };

  /**
   * Sign out current user
   */
  const signOut = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      await authService.signOut();
      console.log('✅ Sign-out successful');

      // Clear any stored context
      navigationService.clearOriginalContext();

      // Broadcast sign-out for cross-tab communication
      tabCommunicationService.sendMessage('chitter-auth', {
        type: 'SIGN_OUT',
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error('❌ Sign-out failed:', err);
      error.value = err.message || 'Sign-out failed';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Handle email link authentication
   */
  const handleEmailLink = async (email, url) => {
    try {
      isLoading.value = true;
      isSigningIn.value = true;
      error.value = null;

      let result;
      const user = authService.getCurrentUser();

      if (user && user.isAnonymous) {
        // Upgrade anonymous user
        console.log('🔄 Upgrading anonymous user with email link');
        result = await authService.upgradeAnonymousUserWithEmailLink(user, email, url);

        // Broadcast success for cross-tab communication
        tabCommunicationService.broadcastAuthSuccess({
          userId: result.result.user.uid,
          isUpgrade: result.isUpgrade,
          verifiedUser: result.verifiedUser,
          unverifiedUser: result.unverifiedUser,
          originalTabContext: navigationService.getOriginalContext(),
        });
      } else {
        // Regular sign-in
        console.log('🔑 Signing in with email link');
        result = await authService.signInWithEmailLink(email, url);

        // Broadcast success for cross-tab communication
        tabCommunicationService.broadcastAuthSuccess({
          userId: result.user.uid,
          originalTabContext: navigationService.getOriginalContext(),
        });
      }

      console.log('✅ Email link authentication successful');
      return result;
    } catch (err) {
      console.error('❌ Email link authentication failed:', err);
      error.value = err.message || 'Email link authentication failed';

      // Broadcast failure for cross-tab communication
      tabCommunicationService.broadcastAuthFailure(
        err,
        navigationService.getOriginalContext(),
      );

      throw err;
    } finally {
      isLoading.value = false;
      isSigningIn.value = false;
    }
  };

  /**
   * Check if URL is an email link
   */
  const isEmailLink = (url) => authService.isSignInWithEmailLink(url);

  /**
   * Verify email action code
   */
  const verifyEmail = async (actionCode) => {
    try {
      isLoading.value = true;
      error.value = null;

      const result = await authService.verifyEmail(actionCode);
      console.log('✅ Email verification successful');

      return result;
    } catch (err) {
      console.error('❌ Email verification failed:', err);
      error.value = err.message || 'Email verification failed';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Complete password reset
   */
  const completePasswordReset = async (actionCode, newPassword) => {
    try {
      isLoading.value = true;
      error.value = null;

      const result = await authService.completePasswordReset(actionCode, newPassword);
      console.log('✅ Password reset successful');

      return result;
    } catch (err) {
      console.error('❌ Password reset failed:', err);
      error.value = err.message || 'Password reset failed';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Verify password reset code
   */
  const verifyPasswordResetCode = async (actionCode) => {
    try {
      isLoading.value = true;
      error.value = null;

      const result = await authService.verifyPasswordResetCode(actionCode);
      console.log('✅ Password reset code verified');

      return result;
    } catch (err) {
      console.error('❌ Password reset code verification failed:', err);
      error.value = err.message || 'Invalid or expired reset code';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Update user profile data
   */
  const updateUserProfile = async (updates) => {
    try {
      isLoading.value = true;
      error.value = null;

      const user = authService.getCurrentUser();
      if (!user) throw new Error('No authenticated user');

      await authService.updateUserStatus(user.uid, updates);

      // Update local state
      if (currentUser.value) {
        Object.assign(currentUser.value, updates);
      }

      console.log('✅ User profile updated');
    } catch (err) {
      console.error('❌ Profile update failed:', err);
      error.value = err.message || 'Profile update failed';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Clear error state
   */
  const clearError = () => {
    error.value = null;
  };

  /**
   * Refresh current user data
   */
  const refreshUser = async () => {
    const user = authService.getCurrentUser();
    if (user) {
      const userData = await authService.getCurrentUserData();
      currentUser.value = {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        isAnonymous: user.isAnonymous,
        ...userData,
      };
    }
  };

  // Lifecycle hooks
  onMounted(() => {
    isLoading.value = true;
    initAuthListener();
    initCrossTabListener();
  });

  onUnmounted(() => {
    if (authStateUnsubscribe) {
      authStateUnsubscribe();
    }
    if (authMessageListener) {
      tabCommunicationService.removeAuthListener(authMessageListener);
    }
  });

  // Return reactive state and methods
  return {
    // State
    currentUser: computed(() => currentUser.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    isSigningIn: computed(() => isSigningIn.value),

    // Computed
    isAuthenticated,
    isAnonymous,
    isEmailVerified,

    // Methods
    signInAnonymously,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    handleEmailLink,
    isEmailLink,
    verifyEmail,
    completePasswordReset,
    verifyPasswordResetCode,
    updateUserProfile,
    refreshUser,
    clearError,
  };
}

/**
 * Email Management Composable
 * Handles email storage and retrieval for cross-tab authentication
 */
export function useEmailManagement() {
  const storedEmail = ref('');
  const isRequestingEmail = ref(false);

  /**
   * Store email for sign-in
   */
  const storeEmailForSignIn = (email) => {
    try {
      // Use localStorage for cross-tab sharing
      const emailData = {
        email,
        timestamp: Date.now(),
        expires: Date.now() + 600000, // 10 minutes
      };
      localStorage.setItem('chitter_signin_email', JSON.stringify(emailData));
      storedEmail.value = email;
      console.log('📧 Email stored for cross-tab sign-in');
    } catch (error) {
      console.error('Error storing email:', error);
    }
  };

  /**
   * Get stored email for sign-in
   */
  const getStoredEmail = () => {
    try {
      const stored = localStorage.getItem('chitter_signin_email');
      if (stored) {
        const emailData = JSON.parse(stored);

        // Check if expired
        if (Date.now() > emailData.expires) {
          localStorage.removeItem('chitter_signin_email');
          return null;
        }

        storedEmail.value = emailData.email;
        return emailData.email;
      }
    } catch (error) {
      console.error('Error retrieving stored email:', error);
    }
    return null;
  };

  /**
   * Request email from other tabs
   */
  const requestEmailFromOtherTabs = () => new Promise((resolve, reject) => {
    isRequestingEmail.value = true;
    const currentTabId = tabCommunicationService.getTabId();
    let timeout;
    let listener;

    const cleanup = () => {
      if (timeout) clearTimeout(timeout);
      if (listener) tabCommunicationService.removeAuthListener(listener);
      isRequestingEmail.value = false;
    };

    // Listen for email response
    listener = tabCommunicationService.addAuthListener((message) => {
      if (message.type === 'EMAIL_STORE_RESPONSE'
            && message.requestingTabId === currentTabId) {
        cleanup();
        storedEmail.value = message.email;
        resolve(message.email);
      }
    });

    // Send request
    tabCommunicationService.broadcastEmailStoreRequest('', currentTabId);

    // Set timeout
    timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Email request timeout'));
    }, 5000);
  });

  /**
   * Clear stored email
   */
  const clearStoredEmail = () => {
    localStorage.removeItem('chitter_signin_email');
    storedEmail.value = '';
  };

  return {
    storedEmail: computed(() => storedEmail.value),
    isRequestingEmail: computed(() => isRequestingEmail.value),
    storeEmailForSignIn,
    getStoredEmail,
    requestEmailFromOtherTabs,
    clearStoredEmail,
  };
}
