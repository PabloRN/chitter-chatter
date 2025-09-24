import {
  getDatabase,
  ref as dbRef,
  update,
  get,
} from 'firebase/database';
import { getFirebaseApp } from '@/config/firebase';

/**
 * Profile Service
 * Handles all user profile-related Firebase operations
 */
class ProfileService {
  constructor() {
    this.db = null;
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
   * Update user nickname
   */
  async updateNickname(userId, nickname) {
    try {
      const db = this.getDatabase();
      await update(
        dbRef(db, `users/${userId}`),
        { 
          nickname, 
          nickNameUpdatedAt: Date.now() 
        },
      );
      console.log('Nickname updated successfully');
    } catch (error) {
      console.error('Error updating nickname:', error);
      throw error;
    }
  }

  /**
   * Update user age
   */
  async updateAge(userId, age) {
    try {
      const db = this.getDatabase();
      await update(
        dbRef(db, `users/${userId}`),
        { age },
      );
      console.log('Age updated successfully');
    } catch (error) {
      console.error('Error updating age:', error);
      throw error;
    }
  }

  /**
   * Toggle room in user's favorites
   */
  async toggleFavorite(userId, roomId) {
    try {
      const db = this.getDatabase();
      const userRef = dbRef(db, `users/${userId}`);
      
      const snapshot = await get(userRef);
      const userData = snapshot.val();
      const currentFavorites = userData?.favoriteRooms || [];

      let newFavorites;
      let wasRemoved = false;
      
      if (currentFavorites.includes(roomId)) {
        newFavorites = currentFavorites.filter((currentRoomId) => roomId !== currentRoomId);
        wasRemoved = true;
      } else {
        newFavorites = [...currentFavorites, roomId];
        wasRemoved = false;
      }

      await update(userRef, { favoriteRooms: newFavorites });

      return {
        favoriteRooms: newFavorites,
        wasRemoved,
      };
    } catch (error) {
      console.error('Error updating favorites:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new ProfileService();