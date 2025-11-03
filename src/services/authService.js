import {
  getAuth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  signInWithCredential,
  linkWithCredential,
  EmailAuthProvider,
  signInWithEmailLink,
  isSignInWithEmailLink,
  applyActionCode,
  confirmPasswordReset,
  verifyPasswordResetCode,
} from 'firebase/auth';
import {
  getDatabase,
  ref as dbRef,
  set,
  update,
  get,
} from 'firebase/database';
import { getFirebaseApp } from '@/config/firebase';

/**
 * Authentication Service
 * Centralizes all Firebase authentication operations
 */
class AuthService {
  constructor() {
    this.authInstance = null;
    this.dbInstance = null;
  }

  /**
   * Get auth instance, initializing Firebase if needed
   */
  get auth() {
    if (!this.authInstance) {
      getFirebaseApp(); // Ensure Firebase is initialized
      this.authInstance = getAuth();
    }
    return this.authInstance;
  }

  /**
   * Get database instance, initializing Firebase if needed
   */
  get db() {
    if (!this.dbInstance) {
      getFirebaseApp(); // Ensure Firebase is initialized
      this.dbInstance = getDatabase();
    }
    return this.dbInstance;
  }

  /**
   * Sign in anonymously
   */
  async signInAnonymously() {
    try {
      return await signInAnonymously(this.auth);
    } catch (error) {
      console.error('Anonymous sign-in error:', error);
      throw AuthService.formatAuthError(error);
    }
  }

  /**
   * Create user with email and password
   */
  async createUserWithEmailAndPassword(email, password, userData = {}) {
    try {
      const credentials = await createUserWithEmailAndPassword(this.auth, email, password);

      // Set user data in database
      if (Object.keys(userData).length > 0) {
        await set(dbRef(this.db, `users/${credentials.user.uid}`), {
          ...userData,
          favoriteRooms: [],
          ownedRooms: [],
        });
      }

      return credentials;
    } catch (error) {
      console.error('User creation error:', error);
      throw AuthService.formatAuthError(error);
    }
  }

  /**
   * Sign in with email and password
   */
  async signInWithEmailAndPassword(email, password) {
    try {
      const credentials = await signInWithEmailAndPassword(this.auth, email, password);

      // Update online status
      await this.updateUserOnlineStatus(credentials.user.uid, true);

      return credentials;
    } catch (error) {
      console.error('Email sign-in error:', error);
      throw AuthService.formatAuthError(error);
    }
  }

  /**
   * Sign out current user
   */
  async signOut() {
    try {
      const { currentUser } = this.auth;
      if (currentUser) {
        // Update offline status before signing out
        await this.updateUserOnlineStatus(currentUser.uid, false);
      }

      return await signOut(this.auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw AuthService.formatAuthError(error);
    }
  }

  /**
   * Handle email verification
   */
  async verifyEmail(actionCode) {
    try {
      await applyActionCode(this.auth, actionCode);
      return { success: true, message: 'Email verified successfully!' };
    } catch (error) {
      console.error('Email verification error:', error);
      throw AuthService.formatAuthError(error);
    }
  }

  /**
   * Verify password reset code
   */
  async verifyPasswordResetCode(actionCode) {
    try {
      await verifyPasswordResetCode(this.auth, actionCode);
      return { success: true };
    } catch (error) {
      console.error('Password reset verification error:', error);
      throw AuthService.formatAuthError(error);
    }
  }

  /**
   * Complete password reset
   */
  async completePasswordReset(actionCode, newPassword) {
    try {
      await confirmPasswordReset(this.auth, actionCode, newPassword);
      return { success: true, message: 'Password reset successfully!' };
    } catch (error) {
      console.error('Password reset completion error:', error);
      throw AuthService.formatAuthError(error);
    }
  }

  /**
   * Check if URL is a valid email link
   */
  isSignInWithEmailLink(url) {
    return isSignInWithEmailLink(this.auth, url);
  }

  /**
   * Sign in with email link (regular user)
   */
  async signInWithEmailLink(email, url) {
    try {
      const result = await signInWithEmailLink(this.auth, email, url);

      // Update user status in database
      await this.updateUserStatus(result.user.uid, {
        isAnonymous: false,
        status: 'online',
        onlineState: true,
      });

      return result;
    } catch (error) {
      console.error('Email link sign-in error:', error);
      throw AuthService.formatAuthError(error);
    }
  }

  /**
   * Upgrade anonymous user with email link
   */
  async upgradeAnonymousUserWithEmailLink(currentUser, email, url) {
    try {
      console.log('🔄 Upgrading anonymous user with email link');

      // Create email credential from the link
      const credential = EmailAuthProvider.credentialWithLink(email, url);

      // Link the credential to upgrade the anonymous user
      const result = await linkWithCredential(currentUser, credential);

      // Update user status in database
      await this.updateUserStatus(result.user.uid, {
        isAnonymous: false,
        status: 'online',
        onlineState: true,
      });

      return {
        result,
        isUpgrade: true,
        verifiedUser: result.user.uid,
        unverifiedUser: currentUser.uid,
      };
    } catch (linkError) {
      console.error('Anonymous user upgrade error:', linkError);

      // Handle account already exists scenario
      if (linkError.code === 'auth/email-already-in-use') {
        return this.handleExistingAccountSignIn(linkError.credential);
      }

      throw AuthService.formatAuthError(linkError);
    }
  }

  /**
   * Handle existing account sign-in when upgrade fails
   */
  async handleExistingAccountSignIn(credential) {
    try {
      const existingUserResult = await signInWithCredential(this.auth, credential);

      // Update user status in database
      await this.updateUserStatus(existingUserResult.user.uid, {
        isAnonymous: false,
        status: 'online',
        onlineState: true,
      });

      return {
        result: existingUserResult,
        isExistingAccount: true,
      };
    } catch (error) {
      console.error('Existing account sign-in error:', error);
      throw AuthService.formatAuthError(error);
    }
  }

  /**
   * Update user online status
   */
  async updateUserOnlineStatus(userId, isOnline) {
    try {
      await update(dbRef(this.db, `users/${userId}`), {
        onlineState: isOnline,
        status: isOnline ? 'online' : 'offline',
      });
    } catch (error) {
      console.error('Error updating online status:', error);
      // Don't throw here as it's not critical
    }
  }

  /**
   * Update user status in database
   */
  async updateUserStatus(userId, statusUpdates) {
    try {
      await update(dbRef(this.db, `users/${userId}`), statusUpdates);
    } catch (error) {
      console.error('Error updating user status:', error);
      // Don't throw here as it's not critical
    }
  }

  /**
   * Get current user data from database
   */
  async getCurrentUserData() {
    const { currentUser } = this.auth;
    if (!currentUser) return null;

    try {
      const snapshot = await get(dbRef(this.db, `users/${currentUser.uid}`));
      return snapshot.val();
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }

  /**
   * Format authentication errors for consistent handling
   */
  static formatAuthError(error) {
    const errorMessages = {
      'auth/invalid-action-code': 'The link is invalid or has expired.',
      'auth/expired-action-code': 'The link has expired. Please request a new one.',
      'auth/weak-password': 'Password is too weak. Please choose a stronger password.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/invalid-email': 'The email address provided does not match this sign-in link. Please enter the exact email address you used to request the link (case-insensitive).',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/argument-error': 'The email address does not match the link. Please double-check your email.',
      'auth/invalid-credential': 'The sign-in credentials are invalid or have expired. Please request a new sign-in link.',
    };

    return {
      code: error.code,
      message: errorMessages[error.code] || error.message || 'An authentication error occurred.',
      originalError: error,
    };
  }

  /**
 * Get current auth user
 */
  getCurrentUser() {
    return this.auth.currentUser;
  }

  /**
 * Check if user is anonymous
 */
  isAnonymous() {
    const user = this.getCurrentUser();
    return user?.isAnonymous || false;
  }
}

// Export singleton instance
export default new AuthService();
