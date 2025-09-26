import { computed, ref } from 'vue';
import { useUserStore } from '@/stores/user';

/**
 * User Composable
 * Provides reactive user state and methods for user operations
 */
export function useUser() {
  const userStore = useUserStore();

  // Reactive state from store
  const currentUser = computed(() => userStore.currentUser);
  const userData = computed(() => userStore.userData);
  const isSignedIn = computed(() => userStore.isSignedIn);
  const isSigningInUpgraded = computed(() => userStore.signingInUpgraded);
  const showWelcomeForm = computed(() => userStore.showWelcomeForm);
  const isUserUpgraded = computed(() => userStore.isUserUpgraded);

  // Loading states
  const isLoading = ref(false);
  const error = ref(null);

  /**
   * Clear error state
   */
  const clearError = () => {
    error.value = null;
  };

  /**
   * Update user nickname
   */
  const updateNickname = async (nickname) => {
    try {
      isLoading.value = true;
      error.value = null;
      await userStore.updateUserNickName(nickname);
      console.log('✅ Nickname updated successfully');
    } catch (err) {
      console.error('❌ Error updating nickname:', err);
      error.value = err.message || 'Failed to update nickname';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Update user age
   */
  const updateAge = async (age) => {
    try {
      isLoading.value = true;
      error.value = null;
      await userStore.updateUserAge(age);
      console.log('✅ Age updated successfully');
    } catch (err) {
      console.error('❌ Error updating age:', err);
      error.value = err.message || 'Failed to update age';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Toggle room favorite status
   */
  const toggleFavorite = async (roomId) => {
    try {
      isLoading.value = true;
      error.value = null;
      const result = await userStore.toggleFavorite(roomId);
      console.log('✅ Favorite toggled successfully');
      return result;
    } catch (err) {
      console.error('❌ Error toggling favorite:', err);
      error.value = err.message || 'Failed to toggle favorite';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Get user data for specific user ID
   */
  const getUserData = (userId) => userStore.getUserData(userId);

  /**
   * Check if room is favorited by current user
   */
  const isRoomFavorited = (roomId) => {
    const user = currentUser.value;
    if (!user || !user.favoriteRooms) return false;
    return user.favoriteRooms.includes(roomId);
  };

  /**
   * Get user's favorite rooms
   */
  const favoriteRooms = computed(() => {
    const user = currentUser.value;
    return user?.favoriteRooms || [];
  });

  /**
   * Check if user has completed profile setup
   */
  const isProfileComplete = computed(() => {
    const user = currentUser.value;
    return user && user.nickname && user.age > 0;
  });

  /**
   * Get user's display information
   */
  const userDisplayInfo = computed(() => {
    const user = currentUser.value;
    if (!user) return null;

    return {
      nickname: user.nickname || 'Anonymous',
      avatar: user.avatar || '',
      personalAvatar: user.personalAvatar || '',
      miniAvatar: user.miniAvatar || '',
      level: user.level || 'L1',
      age: user.age || 0,
      userId: user.userId,
      isAnonymous: !userStore.isSignedIn,
      isVerified: userStore.isSignedIn && userStore.isUserUpgraded,
    };
  });

  /**
   * Initialize user session
   */
  const initializeUser = async () => {
    try {
      isLoading.value = true;
      error.value = null;
      await userStore.getUser();
      console.log('✅ User initialized successfully');
    } catch (err) {
      console.error('❌ Error initializing user:', err);
      error.value = err.message || 'Failed to initialize user';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Cleanup user session
   */
  const cleanup = () => {
    userStore.cleanupAuthUpgradeChannel();
    clearError();
  };

  return {
    // Reactive state
    currentUser,
    userData,
    isSignedIn,
    isSigningInUpgraded,
    showWelcomeForm,
    isUserUpgraded,
    favoriteRooms,
    userDisplayInfo,
    isProfileComplete,
    isLoading,
    error,

    // Methods
    updateNickname,
    updateAge,
    toggleFavorite,
    getUserData,
    isRoomFavorited,
    initializeUser,
    cleanup,
    clearError,
  };
}

/**
 * User Profile Composable
 * Provides methods specifically for user profile management
 */
export function useUserProfile() {
  const userStore = useUserStore();

  // Loading states
  const isUpdatingProfile = ref(false);
  const profileError = ref(null);

  /**
   * Update complete user profile
   */
  const updateProfile = async (profileData) => {
    try {
      isUpdatingProfile.value = true;
      profileError.value = null;

      const updates = [];

      if (profileData.nickname !== undefined) {
        updates.push(userStore.updateUserNickName(profileData.nickname));
      }

      if (profileData.age !== undefined) {
        updates.push(userStore.updateUserAge(profileData.age));
      }

      await Promise.all(updates);
      console.log('✅ Profile updated successfully');
    } catch (err) {
      console.error('❌ Error updating profile:', err);
      profileError.value = err.message || 'Failed to update profile';
      throw err;
    } finally {
      isUpdatingProfile.value = false;
    }
  };

  /**
   * Validate profile data
   */
  const validateProfile = (profileData) => {
    const errors = {};

    if (profileData.nickname !== undefined) {
      if (!profileData.nickname || profileData.nickname.trim().length === 0) {
        errors.nickname = 'Nickname is required';
      } else if (profileData.nickname.length > 20) {
        errors.nickname = 'Nickname must be 20 characters or less';
      }
    }

    if (profileData.age !== undefined) {
      if (!profileData.age || profileData.age < 1) {
        errors.age = 'Age must be a positive number';
      } else if (profileData.age > 120) {
        errors.age = 'Age must be realistic';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  };

  /**
   * Clear profile errors
   */
  const clearProfileError = () => {
    profileError.value = null;
  };

  return {
    // State
    isUpdatingProfile,
    profileError,

    // Methods
    updateProfile,
    validateProfile,
    clearProfileError,
  };
}
