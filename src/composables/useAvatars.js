import { computed, ref } from 'vue';
import { useUserStore } from '@/stores/user';

/**
 * Avatars Composable
 * Provides reactive avatar state and methods for avatar operations
 */
export function useAvatars() {
  const userStore = useUserStore();
  
  // Loading states
  const isUploadingAvatar = ref(false);
  const isChangingAvatar = ref(false);
  const avatarError = ref(null);

  /**
   * Get current user's avatar information
   */
  const currentUserAvatar = computed(() => {
    const user = userStore.currentUser;
    if (!user) return null;

    return {
      avatar: user.avatar || '',
      personalAvatar: user.personalAvatar || '', 
      miniAvatar: user.miniAvatar || '',
      level: user.level || 'L1',
    };
  });

  /**
   * Clear avatar error state
   */
  const clearAvatarError = () => {
    avatarError.value = null;
  };

  /**
   * Upload personal avatar
   */
  const uploadPersonalAvatar = async (file) => {
    try {
      isUploadingAvatar.value = true;
      avatarError.value = null;

      // Validate file
      const validation = validateAvatarFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const result = await userStore.uploadUserPersonalAvatar(file);
      console.log('✅ Personal avatar uploaded successfully');
      return result;
    } catch (err) {
      console.error('❌ Error uploading personal avatar:', err);
      avatarError.value = err.message || 'Failed to upload avatar';
      throw err;
    } finally {
      isUploadingAvatar.value = false;
    }
  };

  /**
   * Change user's current avatar
   */
  const changeAvatar = async (avatarUrl, roomId) => {
    try {
      isChangingAvatar.value = true;
      avatarError.value = null;

      if (!avatarUrl) {
        throw new Error('Avatar URL is required');
      }

      if (!roomId) {
        throw new Error('Room ID is required');
      }

      const result = await userStore.changeAvatar(avatarUrl, roomId);
      console.log('✅ Avatar changed successfully');
      return result;
    } catch (err) {
      console.error('❌ Error changing avatar:', err);
      avatarError.value = err.message || 'Failed to change avatar';
      throw err;
    } finally {
      isChangingAvatar.value = false;
    }
  };

  /**
   * Set current user avatar (for room entry)
   */
  const setCurrentUserAvatar = async (avatarUrl, roomId) => {
    try {
      isChangingAvatar.value = true;
      avatarError.value = null;

      const result = await userStore.setCurrentUserAvatar(avatarUrl, roomId);
      console.log('✅ Current user avatar set successfully');
      return result;
    } catch (err) {
      console.error('❌ Error setting current user avatar:', err);
      avatarError.value = err.message || 'Failed to set avatar';
      throw err;
    } finally {
      isChangingAvatar.value = false;
    }
  };

  /**
   * Validate avatar file
   */
  const validateAvatarFile = (file) => {
    if (!file) {
      return {
        isValid: false,
        error: 'No file selected',
      };
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Please select a valid image file (JPEG, PNG, or WebP)',
      };
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size must be less than 5MB',
      };
    }

    // Check image dimensions (optional validation)
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // You can add dimension checks here if needed
        resolve({
          isValid: true,
          width: img.width,
          height: img.height,
        });
      };
      img.onerror = () => {
        resolve({
          isValid: false,
          error: 'Invalid image file',
        });
      };
      img.src = URL.createObjectURL(file);
    });
  };

  /**
   * Get avatar URL for a specific user
   */
  const getUserAvatar = (userId) => {
    const userData = userStore.getUserData(userId);
    return userData?.avatar || '';
  };

  /**
   * Get mini avatar URL for a specific user
   */
  const getUserMiniAvatar = (userId) => {
    const userData = userStore.getUserData(userId);
    return userData?.miniAvatar || '';
  };

  /**
   * Get personal avatar URL for a specific user
   */
  const getUserPersonalAvatar = (userId) => {
    const userData = userStore.getUserData(userId);
    return userData?.personalAvatar || '';
  };

  /**
   * Check if user has a personal avatar
   */
  const hasPersonalAvatar = computed(() => {
    const avatar = currentUserAvatar.value;
    return !!(avatar && avatar.personalAvatar);
  });

  /**
   * Check if user has any avatar set
   */
  const hasAvatar = computed(() => {
    const avatar = currentUserAvatar.value;
    return !!(avatar && avatar.avatar);
  });

  /**
   * Get avatar display URL (prefers personal avatar)
   */
  const avatarDisplayUrl = computed(() => {
    const avatar = currentUserAvatar.value;
    if (!avatar) return '';
    
    return avatar.personalAvatar || avatar.avatar || '';
  });

  /**
   * Get mini avatar display URL
   */
  const miniAvatarDisplayUrl = computed(() => {
    const avatar = currentUserAvatar.value;
    return avatar?.miniAvatar || '';
  });

  return {
    // Reactive state
    currentUserAvatar,
    hasPersonalAvatar,
    hasAvatar,
    avatarDisplayUrl,
    miniAvatarDisplayUrl,
    isUploadingAvatar,
    isChangingAvatar,
    avatarError,

    // Methods
    uploadPersonalAvatar,
    changeAvatar,
    setCurrentUserAvatar,
    validateAvatarFile,
    getUserAvatar,
    getUserMiniAvatar,
    getUserPersonalAvatar,
    clearAvatarError,
  };
}

/**
 * Avatar Selector Composable
 * Provides functionality for avatar selection interfaces
 */
export function useAvatarSelector() {
  const { changeAvatar, isChangingAvatar, avatarError } = useAvatars();
  
  const selectedAvatar = ref('');
  const isSelectionMode = ref(false);

  /**
   * Enter avatar selection mode
   */
  const enterSelectionMode = () => {
    isSelectionMode.value = true;
    selectedAvatar.value = '';
  };

  /**
   * Exit avatar selection mode
   */
  const exitSelectionMode = () => {
    isSelectionMode.value = false;
    selectedAvatar.value = '';
  };

  /**
   * Select an avatar
   */
  const selectAvatar = (avatarUrl) => {
    selectedAvatar.value = avatarUrl;
  };

  /**
   * Confirm avatar selection
   */
  const confirmSelection = async (roomId) => {
    if (!selectedAvatar.value) {
      throw new Error('No avatar selected');
    }

    try {
      const result = await changeAvatar(selectedAvatar.value, roomId);
      exitSelectionMode();
      return result;
    } catch (err) {
      throw err;
    }
  };

  /**
   * Cancel avatar selection
   */
  const cancelSelection = () => {
    exitSelectionMode();
  };

  return {
    // State
    selectedAvatar,
    isSelectionMode,
    isChangingAvatar,
    avatarError,

    // Methods
    enterSelectionMode,
    exitSelectionMode,
    selectAvatar,
    confirmSelection,
    cancelSelection,
  };
}

/**
 * Avatar Upload Composable
 * Provides functionality for avatar upload interfaces
 */
export function useAvatarUpload() {
  const { uploadPersonalAvatar, isUploadingAvatar, avatarError } = useAvatars();
  
  const dragOver = ref(false);
  const previewUrl = ref('');

  /**
   * Handle drag over event
   */
  const handleDragOver = (e) => {
    e.preventDefault();
    dragOver.value = true;
  };

  /**
   * Handle drag leave event
   */
  const handleDragLeave = () => {
    dragOver.value = false;
  };

  /**
   * Handle file drop
   */
  const handleDrop = async (e) => {
    e.preventDefault();
    dragOver.value = false;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  /**
   * Handle file input change
   */
  const handleFileInput = async (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  /**
   * Handle file upload
   */
  const handleFileUpload = async (file) => {
    try {
      // Create preview
      previewUrl.value = URL.createObjectURL(file);
      
      // Upload file
      const result = await uploadPersonalAvatar(file);
      
      // Clear preview after successful upload
      clearPreview();
      
      return result;
    } catch (err) {
      clearPreview();
      throw err;
    }
  };

  /**
   * Clear preview
   */
  const clearPreview = () => {
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value);
      previewUrl.value = '';
    }
  };

  return {
    // State
    dragOver,
    previewUrl,
    isUploadingAvatar,
    avatarError,

    // Methods
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInput,
    handleFileUpload,
    clearPreview,
  };
}