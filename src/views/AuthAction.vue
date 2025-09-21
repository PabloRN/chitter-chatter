<template>
  <div class="auth-action-container">
    <div class="auth-action-card">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Processing your request...</p>
      </div>

      <div v-else-if="error" class="error">
        <h2>Authentication Error</h2>
        <p>{{ error }}</p>
        <button @click="goToRooms" class="btn btn-primary">Go to Rooms</button>
      </div>

      <div v-else-if="showPasswordReset" class="password-reset-form">
        <h2>Reset Your Password</h2>
        <p>Enter your new password below:</p>
        <form @submit.prevent="completePasswordReset">
          <div class="form-group">
            <label for="newPassword">New Password:</label>
            <input id="newPassword" v-model="newPassword" type="password" class="form-input"
              placeholder="Enter new password" required minlength="6" />
          </div>
          <div class="form-group">
            <label for="confirmPassword">Confirm Password:</label>
            <input id="confirmPassword" v-model="confirmPassword" type="password" class="form-input"
              placeholder="Confirm new password" required minlength="6" />
          </div>
          <div v-if="error" class="error-text">
            {{ error }}
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="loading">
              {{ loading ? 'Updating...' : 'Update Password' }}
            </button>
          </div>
        </form>
      </div>

      <div v-else-if="success" class="success">
        <h2>{{ successTitle }}</h2>
        <p>{{ successMessage }}</p>
        <button @click="goToRooms" class="btn btn-primary">Continue to Rooms</button>
      </div>

      <div v-else class="default">
        <h2>Authentication</h2>
        <p>Processing authentication request...</p>
      </div>
    </div>
  </div>
</template>

<script>
import {
  getAuth, applyActionCode, confirmPasswordReset, signInWithEmailLink, isSignInWithEmailLink, verifyPasswordResetCode,
} from 'firebase/auth';
import { useRouter, useRoute } from 'vue-router';
import { ref, onMounted } from 'vue';
import useMainStore from '@/stores/main';

export default {
  name: 'AuthAction',
  setup() {
    const router = useRouter();
    const route = useRoute();
    const mainStore = useMainStore();

    const loading = ref(true);
    const error = ref('');
    const success = ref(false);
    const successTitle = ref('');
    const successMessage = ref('');
    const showPasswordReset = ref(false);
    const newPassword = ref('');
    const confirmPassword = ref('');
    const resetActionCode = ref('');

    const goToRooms = () => {
      router.push({ name: 'rooms' });
    };

    const handleEmailVerification = async (actionCode) => {
      const auth = getAuth();
      try {
        await applyActionCode(auth, actionCode);
        success.value = true;
        successTitle.value = 'Email Verified!';
        successMessage.value = 'Your email has been successfully verified. You can now use all features of the application.';

        mainStore.setSnackbar({
          type: 'success',
          msg: 'Email verified successfully!',
        });
      } catch (err) {
        console.error('Email verification error:', err);
        error.value = 'Failed to verify email. The link may be expired or invalid.';
      }
    };

    const handlePasswordReset = async (actionCode) => {
      const auth = getAuth();
      try {
        // First verify the reset code is valid
        await verifyPasswordResetCode(auth, actionCode);
        // Store the action code for later use
        resetActionCode.value = actionCode;
        // Show password reset form instead of success message
        showPasswordReset.value = true;
        loading.value = false;
        mainStore.setSnackbar({
          type: 'info',
          msg: 'Please enter your new password below.',
        });
      } catch (err) {
        console.error('Password reset verification error:', err);
        if (err.code === 'auth/invalid-action-code') {
          error.value = 'The password reset link is invalid or has expired.';
        } else if (err.code === 'auth/expired-action-code') {
          error.value = 'The password reset link has expired. Please request a new one.';
        } else {
          error.value = 'Failed to verify password reset link. Please try again.';
        }
      }
    };

    const completePasswordReset = async () => {
      if (newPassword.value !== confirmPassword.value) {
        error.value = 'Passwords do not match.';
        return;
      }

      if (newPassword.value.length < 6) {
        error.value = 'Password must be at least 6 characters long.';
        return;
      }

      const auth = getAuth();
      loading.value = true;
      try {
        await confirmPasswordReset(auth, resetActionCode.value, newPassword.value);
        success.value = true;
        showPasswordReset.value = false;
        successTitle.value = 'Password Reset Complete!';
        successMessage.value = 'Your password has been successfully updated. You can now sign in with your new password.';
        mainStore.setSnackbar({
          type: 'success',
          msg: 'Password reset successfully! You can now sign in.',
        });
      } catch (err) {
        console.error('Password reset completion error:', err);
        if (err.code === 'auth/weak-password') {
          error.value = 'Password is too weak. Please choose a stronger password.';
        } else if (err.code === 'auth/expired-action-code') {
          error.value = 'The reset link has expired. Please request a new password reset.';
        } else {
          error.value = 'Failed to reset password. Please try again.';
        }
      } finally {
        loading.value = false;
      }
    };

    const handleEmailSignIn = async () => {
      const auth = getAuth();
      const url = window.location.href;
      try {
        const isValidLink = isSignInWithEmailLink(auth, url);
        if (isValidLink) {
          let email = window.localStorage.getItem('emailForSignIn');

          if (!email) {
            email = window.prompt('Please provide your email for confirmation');
          }

          if (email) {
            await signInWithEmailLink(auth, email, url);
            window.localStorage.removeItem('emailForSignIn');

            success.value = true;
            successTitle.value = 'Sign In Successful!';
            successMessage.value = 'You have been successfully signed in with your email link.';

            mainStore.setSnackbar({
              type: 'success',
              msg: 'Successfully signed in!',
            });
          } else {
            error.value = 'Email is required to complete sign in.';
          }
        } else {
          error.value = 'Invalid sign-in link.';
        }
      } catch (err) {
        console.error('Email sign-in error:', err);
        if (err.code === 'auth/invalid-action-code') {
          error.value = 'The sign-in link is invalid or has expired.';
        } else if (err.code === 'auth/expired-action-code') {
          error.value = 'The sign-in link has expired. Please request a new one.';
        } else {
          error.value = 'Failed to sign in with email link. Please try again.';
        }
      }
    };

    onMounted(async () => {
      const { mode } = route.query;
      const actionCode = route.query.oobCode;
      const { continueUrl } = route.query;

      console.log('Auth action params:', { mode, actionCode, continueUrl });

      if (!mode || !actionCode) {
        error.value = 'Invalid authentication link parameters.';
        loading.value = false;
        return;
      }

      try {
        switch (mode) {
          case 'verifyEmail':
            await handleEmailVerification(actionCode);
            break;
          case 'resetPassword':
            await handlePasswordReset(actionCode);
            break;
          case 'signIn':
            await handleEmailSignIn();
            break;
          default:
            error.value = 'Unknown authentication mode.';
        }
      } catch (err) {
        console.error('Auth action error:', err);
        error.value = 'An error occurred while processing your request.';
      } finally {
        loading.value = false;
      }
    });

    return {
      loading,
      error,
      success,
      successTitle,
      successMessage,
      showPasswordReset,
      newPassword,
      confirmPassword,
      goToRooms,
      completePasswordReset,
    };
  },
};
</script>

<style scoped>
.auth-action-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.auth-action-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  max-width: 500px;
  width: 100%;
  text-align: center;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.error {
  color: #e74c3c;
}

.success {
  color: #27ae60;
}

.error h2,
.success h2 {
  margin-bottom: 20px;
  font-size: 24px;
}

.error p,
.success p,
.loading p,
.default p {
  margin-bottom: 30px;
  font-size: 16px;
  line-height: 1.5;
}

.btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.btn:hover {
  background: #5a6fd8;
}

.btn-primary {
  background: #667eea;
}

.btn-primary:hover {
  background: #5a6fd8;
}

.password-reset-form {
  text-align: left;
}

.password-reset-form h2 {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
}

.password-reset-form>p {
  text-align: center;
  margin-bottom: 30px;
  color: #666;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e1e1e1;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s ease;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
}

.form-input:invalid {
  border-color: #e74c3c;
}

.error-text {
  color: #e74c3c;
  font-size: 14px;
  margin-bottom: 20px;
  padding: 10px;
  background: #ffeaea;
  border-radius: 4px;
  border-left: 4px solid #e74c3c;
}

.form-actions {
  text-align: center;
  margin-top: 30px;
}

.btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn:disabled:hover {
  background: #ccc;
}
</style>
