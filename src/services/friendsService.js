/**
 * Friends Service
 * Handles friend requests, friends list, and friend-related operations
 */
import {
  ref, push, update, remove, get, onValue, query, orderByChild, equalTo, getDatabase,
} from 'firebase/database';
import { getFirebaseApp } from '@/config/firebase';
import notificationsService from './notificationsService';

/**
 * Friend request status enum
 */
const FRIEND_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
};

class FriendsService {
  constructor() {
    this.listeners = new Map();
    this.STATUS = FRIEND_STATUS;
    this.dbInstance = null;
  }

  /**
   * Get Firebase Database instance
   */
  get db() {
    if (!this.dbInstance) {
      getFirebaseApp(); // Ensure Firebase is initialized
      this.dbInstance = getDatabase();
    }
    return this.dbInstance;
  }

  /**
   * Get user data including isAnonymous status
   * @param {string} userId - User ID to fetch
   * @returns {Promise<Object|null>} - User data or null
   */
  async getUserData(userId) {
    try {
      const userRef = ref(this.db, `users/${userId}`);
      const snapshot = await get(userRef);
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  /**
   * Check if sender has already sent a request to receiver
   * Checks sender's own "sent" requests (respects security rules)
   * @param {string} fromUserId - Sender user ID
   * @param {string} toUserId - Receiver user ID
   * @returns {Promise<Object|null>} - Existing request or null
   */
  async checkExistingSentRequest(fromUserId, toUserId) {
    try {
      const sentRef = ref(this.db, `friendRequests/${fromUserId}/sent`);
      const snapshot = await get(sentRef);

      if (snapshot.exists()) {
        const requests = snapshot.val();
        const existingRequest = Object.values(requests).find(
          (req) => req.to === toUserId && req.status === FRIEND_STATUS.PENDING,
        );
        if (existingRequest) return existingRequest;
      }

      return null;
    } catch (error) {
      console.error('Error checking sent requests:', error);
      return null;
    }
  }

  /**
   * Check if receiver has already sent a request to sender (reverse request)
   * Checks sender's own "received" requests (respects security rules)
   * @param {string} fromUserId - Current user ID
   * @param {string} toUserId - Target user ID
   * @returns {Promise<Object|null>} - Existing reverse request or null
   */
  async checkExistingReceivedRequest(fromUserId, toUserId) {
    try {
      const receivedRef = ref(this.db, `friendRequests/${fromUserId}/received`);
      const snapshot = await get(receivedRef);

      if (snapshot.exists()) {
        const requests = snapshot.val();
        const reverseRequest = Object.values(requests).find(
          (req) => req.from === toUserId && req.status === FRIEND_STATUS.PENDING,
        );
        if (reverseRequest) return reverseRequest;
      }

      return null;
    } catch (error) {
      console.error('Error checking received requests:', error);
      return null;
    }
  }

  /**
   * Send friend request with bidirectional tracking
   * @param {string} fromUserId - Requesting user ID
   * @param {string} toUserId - Target user ID
   * @param {Object} userData - User data (nickname, avatar) for caching
   * @returns {Promise<string>} - Request ID
   */
  async sendFriendRequest(fromUserId, toUserId, userData = {}) {
    try {
      // 1. VALIDATE: Both users must not be anonymous
      const [fromUserData, toUserData] = await Promise.all([
        this.getUserData(fromUserId),
        this.getUserData(toUserId),
      ]);

      if (fromUserData?.isAnonymous) {
        throw new Error('You must be signed in to send friend requests');
      }

      if (toUserData?.isAnonymous) {
        throw new Error('Cannot send friend request to anonymous users');
      }

      // 2. CHECK DUPLICATES: Check sender's own "sent" requests
      const existingRequest = await this.checkExistingSentRequest(fromUserId, toUserId);
      if (existingRequest) {
        throw new Error('Friend request already sent');
      }

      // 3. CHECK: Already friends?
      const areFriends = await this.areFriends(fromUserId, toUserId);
      if (areFriends) {
        throw new Error('Already friends');
      }

      // 4. CHECK: Reverse request exists?
      const reverseRequest = await this.checkExistingReceivedRequest(fromUserId, toUserId);
      if (reverseRequest) {
        throw new Error('This user has already sent you a friend request. Check your requests!');
      }

      // 5. CREATE REQUEST: Write to BOTH paths atomically
      const requestId = push(ref(this.db, 'friendRequests')).key;
      const timestamp = Date.now();

      const receivedRequest = {
        id: requestId,
        from: fromUserId,
        fromUserNickname: userData.nickname || 'Unknown',
        fromUserAvatar: userData.personalAvatar || userData.miniAvatar || '',
        status: FRIEND_STATUS.PENDING,
        createdAt: timestamp,
      };

      const sentRequest = {
        id: requestId,
        to: toUserId,
        toUserNickname: toUserData.nickname || 'Unknown',
        toUserAvatar: toUserData.personalAvatar || toUserData.miniAvatar || '',
        status: FRIEND_STATUS.PENDING,
        createdAt: timestamp,
      };

      // Atomic write to both locations
      const updates = {};
      updates[`friendRequests/${toUserId}/received/${requestId}`] = receivedRequest;
      updates[`friendRequests/${fromUserId}/sent/${requestId}`] = sentRequest;

      await update(ref(this.db), updates);

      console.log('✅ Friend request sent:', requestId);

      // 6. NOTIFY: Create notification for recipient
      await notificationsService.createNotification(toUserId, {
        type: notificationsService.TYPES.FRIEND_REQUEST,
        title: 'New Friend Request',
        message: `${userData.nickname || 'Someone'} wants to be your friend`,
        priority: notificationsService.PRIORITY.HIGH,
        data: {
          requestId,
          fromUserId,
          fromUserNickname: userData.nickname,
          fromUserAvatar: userData.personalAvatar || userData.miniAvatar,
        },
      });

      return requestId;
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }
  }

  /**
   * Accept friend request - Updates BOTH sender and receiver
   * @param {string} userId - Current user ID (receiver)
   * @param {string} requestId - Request ID
   * @param {Object} userData - Current user data for caching
   */
  async acceptFriendRequest(userId, requestId, userData = {}) {
    try {
      const receivedRef = ref(this.db, `friendRequests/${userId}/received/${requestId}`);
      const snapshot = await get(receivedRef);

      if (!snapshot.exists()) {
        throw new Error('Friend request not found');
      }

      const request = snapshot.val();
      const fromUserId = request.from;

      // Get the friend's data
      const friendRef = ref(this.db, `users/${fromUserId}`);
      const friendSnapshot = await get(friendRef);
      const friendData = friendSnapshot.val() || {};

      const timestamp = Date.now();

      // Atomic update: Update both received and sent requests + add to friends lists
      const updates = {};

      // Update receiver's received request
      updates[`friendRequests/${userId}/received/${requestId}/status`] = FRIEND_STATUS.ACCEPTED;
      updates[`friendRequests/${userId}/received/${requestId}/acceptedAt`] = timestamp;

      // Update sender's sent request
      updates[`friendRequests/${fromUserId}/sent/${requestId}/status`] = FRIEND_STATUS.ACCEPTED;
      updates[`friendRequests/${fromUserId}/sent/${requestId}/responseAt`] = timestamp;

      // Add to both users' friends lists
      updates[`friends/${userId}/${fromUserId}`] = {
        userId: fromUserId,
        status: FRIEND_STATUS.ACCEPTED,
        addedAt: timestamp,
        nickname: friendData.nickname || 'Unknown',
        personalAvatar: friendData.personalAvatar || friendData.miniAvatar || '',
      };

      updates[`friends/${fromUserId}/${userId}`] = {
        userId,
        status: FRIEND_STATUS.ACCEPTED,
        addedAt: timestamp,
        nickname: userData.nickname || 'Unknown',
        personalAvatar: userData.personalAvatar || userData.miniAvatar || '',
      };

      await update(ref(this.db), updates);

      console.log('✅ Friend request accepted');

      // Create notification for requester
      await notificationsService.createNotification(fromUserId, {
        type: notificationsService.TYPES.FRIEND_ACCEPTED,
        title: 'Friend Request Accepted',
        message: `${userData.nickname || 'Someone'} accepted your friend request`,
        priority: notificationsService.PRIORITY.NORMAL,
        data: {
          friendUserId: userId,
          friendNickname: userData.nickname,
          friendAvatar: userData.personalAvatar || userData.miniAvatar,
        },
      });

      // Delete the requests after a delay (allow UI to show accepted state)
      setTimeout(async () => {
        const deleteUpdates = {};
        deleteUpdates[`friendRequests/${userId}/received/${requestId}`] = null;
        deleteUpdates[`friendRequests/${fromUserId}/sent/${requestId}`] = null;
        await update(ref(this.db), deleteUpdates);
      }, 2000);
    } catch (error) {
      console.error('Error accepting friend request:', error);
      throw error;
    }
  }

  /**
   * Decline friend request - Removes from BOTH sender and receiver
   * @param {string} userId - Current user ID (receiver)
   * @param {string} requestId - Request ID
   */
  async declineFriendRequest(userId, requestId) {
    try {
      const receivedRef = ref(this.db, `friendRequests/${userId}/received/${requestId}`);
      const snapshot = await get(receivedRef);

      if (!snapshot.exists()) {
        throw new Error('Friend request not found');
      }

      const request = snapshot.val();
      const fromUserId = request.from;

      // Atomic delete from both locations
      const updates = {};
      updates[`friendRequests/${userId}/received/${requestId}`] = null;
      updates[`friendRequests/${fromUserId}/sent/${requestId}`] = null;

      await update(ref(this.db), updates);

      console.log('✅ Friend request declined');
    } catch (error) {
      console.error('Error declining friend request:', error);
      throw error;
    }
  }

  /**
   * Remove friend
   * @param {string} userId - Current user ID
   * @param {string} friendId - Friend user ID
   */
  async removeFriend(userId, friendId) {
    try {
      const friendRef1 = ref(this.db, `friends/${userId}/${friendId}`);
      const friendRef2 = ref(this.db, `friends/${friendId}/${userId}`);

      await Promise.all([remove(friendRef1), remove(friendRef2)]);

      console.log('✅ Friend removed');
    } catch (error) {
      console.error('Error removing friend:', error);
      throw error;
    }
  }

  /**
   * Check if two users are friends
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @returns {Promise<boolean>} - True if friends
   */
  async areFriends(userId1, userId2) {
    try {
      const friendRef = ref(this.db, `friends/${userId1}/${userId2}`);
      const snapshot = await get(friendRef);
      return snapshot.exists();
    } catch (error) {
      console.error('Error checking friendship:', error);
      return false;
    }
  }

  /**
   * Get friends list
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Friends array
   */
  async getFriendsList(userId) {
    try {
      const friendsRef = ref(this.db, `friends/${userId}`);
      const snapshot = await get(friendsRef);

      if (!snapshot.exists()) {
        return [];
      }

      const friendsData = snapshot.val();
      const friends = Object.entries(friendsData).map(([friendId, data]) => ({
        userId: friendId,
        ...data,
      }));

      return friends;
    } catch (error) {
      console.error('Error getting friends list:', error);
      return [];
    }
  }

  /**
   * Get pending friend requests for user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Pending requests array
   */
  async getPendingRequests(userId) {
    try {
      const requestsRef = ref(this.db, `friendRequests/${userId}`);
      const snapshot = await get(requestsRef);

      if (!snapshot.exists()) {
        return [];
      }

      const requestsData = snapshot.val();
      const requests = Object.values(requestsData)
        .filter((req) => req.status === FRIEND_STATUS.PENDING)
        .sort((a, b) => b.createdAt - a.createdAt);

      return requests;
    } catch (error) {
      console.error('Error getting pending requests:', error);
      return [];
    }
  }

  /**
   * Listen to friends list with real-time updates
   * @param {string} userId - User ID
   * @param {Function} callback - Callback function (receives friends array)
   * @returns {Function} - Unsubscribe function
   */
  listenToFriends(userId, callback) {
    try {
      const friendsRef = ref(this.db, `friends/${userId}`);

      const unsubscribe = onValue(
        friendsRef,
        (snapshot) => {
          const friends = [];

          if (snapshot.exists()) {
            const friendsData = snapshot.val();
            Object.entries(friendsData).forEach(([friendId, data]) => {
              friends.push({
                userId: friendId,
                ...data,
              });
            });
          }

          console.log(`👥 Friends list updated: ${friends.length} friends`);
          callback(friends);
        },
        (error) => {
          console.error('Error listening to friends:', error);
        },
      );

      this.listeners.set(`friends_${userId}`, unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up friends listener:', error);
      throw error;
    }
  }

  /**
   * Listen to friend requests (received) with real-time updates
   * @param {string} userId - User ID
   * @param {Function} callback - Callback function (receives requests array)
   * @returns {Function} - Unsubscribe function
   */
  listenToFriendRequests(userId, callback) {
    try {
      const receivedRef = ref(this.db, `friendRequests/${userId}/received`);

      const unsubscribe = onValue(
        receivedRef,
        (snapshot) => {
          const requests = [];

          if (snapshot.exists()) {
            const requestsData = snapshot.val();
            Object.values(requestsData)
              .filter((req) => req.status === FRIEND_STATUS.PENDING)
              .sort((a, b) => b.createdAt - a.createdAt)
              .forEach((req) => requests.push(req));
          }

          console.log(`📬 Friend requests updated: ${requests.length} pending`);
          callback(requests);
        },
        (error) => {
          console.error('Error listening to friend requests:', error);
        },
      );

      this.listeners.set(`requests_${userId}`, unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up friend requests listener:', error);
      throw error;
    }
  }

  /**
   * Stop listening to friends
   * @param {string} userId - User ID
   */
  stopListeningToFriends(userId) {
    const unsubscribe = this.listeners.get(`friends_${userId}`);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(`friends_${userId}`);
      console.log('🔕 Stopped listening to friends for user:', userId);
    }
  }

  /**
   * Stop listening to friend requests
   * @param {string} userId - User ID
   */
  stopListeningToRequests(userId) {
    const unsubscribe = this.listeners.get(`requests_${userId}`);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(`requests_${userId}`);
      console.log('🔕 Stopped listening to friend requests for user:', userId);
    }
  }

  /**
   * Check if a user is in a room (for green indicator)
   * @param {string} friendId - Friend user ID
   * @param {string} roomId - Room ID
   * @param {Object} usersInRoom - Object of users currently in room
   * @returns {boolean} - True if friend is in room
   */
  isFriendInRoom(friendId, roomId, usersInRoom = {}) {
    const userIds = Object.values(usersInRoom).map((user) => user.userId);
    return userIds.includes(friendId);
  }

  /**
   * Get friends who are currently in a specific room
   * @param {Array} friends - Friends list
   * @param {Object} usersInRoom - Object of users currently in room
   * @returns {Array} - Friends in room
   */
  getFriendsInRoom(friends, usersInRoom = {}) {
    const userIds = Object.values(usersInRoom).map((user) => user.userId);
    return friends.filter((friend) => userIds.includes(friend.userId));
  }

  /**
   * Cleanup service (call on logout/unmount)
   */
  cleanup() {
    // Stop all listeners
    this.listeners.forEach((unsubscribe) => unsubscribe());
    this.listeners.clear();

    console.log('🧹 Friends service cleaned up');
  }
}

// Export singleton instance
export default new FriendsService();
