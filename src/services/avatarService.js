import {
  getDatabase,
  ref as dbRef,
  set,
} from 'firebase/database';
import {
  getStorage,
  ref as storageRef,
  getDownloadURL,
  uploadBytes,
} from 'firebase/storage';
import { getFirebaseApp } from '@/config/firebase';
import extractImageName from '@/utils/avatarName';

/**
 * Avatar Service
 * Handles all avatar-related Firebase operations
 */
class AvatarService {
  constructor() {
    this.storage = null;
    this.db = null;
  }

  /**
   * Get Firebase Storage instance
   */
  getStorage() {
    if (!this.storage) {
      getFirebaseApp(); // Ensure Firebase is initialized
      this.storage = getStorage();
    }
    return this.storage;
  }

  /**
   * Get Firebase Database instance
   */
  getDatabase() {
    if (!this.db) {
      getFirebaseApp(); // Ensure Firebase is initialized
      this.db = getDatabase();
    }
    return this.db;
  }

  /**
   * Upload user's personal avatar
   */
  async uploadPersonalAvatar(userId, file) {
    try {
      const storage = this.getStorage();
      const db = this.getDatabase();

      const imageRef = storageRef(storage, `users/${userId}/avatars/L1/useravatar.png`);
      const snapshot = await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      await set(dbRef(db, `users/${userId}/personalAvatar/`), downloadURL);
      console.log('User avatar uploaded:', downloadURL);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading user avatar:', error);
      throw error;
    }
  }

  /**
   * Change user's avatar (both avatar and mini avatar)
   */
  async changeAvatar(userId, avatarUrl, roomId) {
    try {
      const storage = this.getStorage();
      const db = this.getDatabase();

      const avatarNameWithExt = extractImageName(avatarUrl);
      const avatarName = avatarNameWithExt.replace('.png', '');
      const isPreloaded = avatarUrl.includes('preloaded');
      // Set the main avatar
      await set(dbRef(db, `users/${userId}/avatar/`), avatarUrl);
      let miniAvatarRef = null;
      // Get and set the mini avatar
      if (isPreloaded) {
        miniAvatarRef = storageRef(storage, `preloaded/avatars/L1/miniavatars/${avatarName}.png`);
      } else {
        miniAvatarRef = storageRef(storage, `rooms/${roomId}/avatars/L1/miniavatars/${avatarName}.png`);
      }

      console.log('miniAvatarRef', miniAvatarRef);

      const miniavatarRefUrl = await getDownloadURL(miniAvatarRef);
      console.log('miniavatarRefUrl', miniavatarRefUrl);
      await set(dbRef(db, `users/${userId}/miniAvatar/`), miniavatarRefUrl);

      return {
        avatar: avatarUrl,
        miniAvatar: miniavatarRefUrl,
      };
    } catch (error) {
      console.error('Error changing avatar:', error.code);
      throw error;
    }
  }
}

// Export singleton instance
export default new AvatarService();
