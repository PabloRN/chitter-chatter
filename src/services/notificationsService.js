/**
 * Notifications Service
 * Handles notification management with Firebase Realtime Database
 * Supports auto-read strategies and real-time updates
 */
import {
  ref, push, update, remove, onValue, query, orderByChild, get, getDatabase,
} from 'firebase/database';
import { getFirebaseApp } from '@/config/firebase';

/**
 * Notification types enum
 */
const NOTIFICATION_TYPES = {
  FRIEND_REQUEST: 'friend_request',
  FRIEND_ACCEPTED: 'friend_accepted',
  FRIEND_ONLINE: 'friend_online',
  ROOM_INVITE: 'room_invite',
  SYSTEM: 'system',
  SUBSCRIPTION: 'subscription',
  ACHIEVEMENT: 'achievement',
};

/**
 * Priority levels
 */
const NOTIFICATION_PRIORITY = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
};

class NotificationsService {
  constructor() {
    this.listeners = new Map();
    this.autoReadTimers = new Map();
    this.settings = {
      enabled: true,
      autoMarkAsRead: true,
      autoMarkAsReadDelay: 3000, // 3 seconds default
    };
    this.TYPES = NOTIFICATION_TYPES;
    this.PRIORITY = NOTIFICATION_PRIORITY;
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
   * Create a new notification
   * @param {string} userId - Target user ID
   * @param {Object} notificationData - Notification details
   * @returns {Promise<string>} - Notification ID
   */
  async createNotification(userId, notificationData) {
    try {
      const {
        type = NotificationsService.TYPES.SYSTEM,
        title = '',
        message = '',
        data = {},
        priority = NotificationsService.PRIORITY.NORMAL,
        expiresInMs = null, // null = never expires
      } = notificationData;

      const notificationsRef = ref(this.db, `notifications/${userId}`);
      const newNotificationRef = push(notificationsRef);

      const notification = {
        id: newNotificationRef.key,
        type,
        title,
        message,
        data,
        read: false,
        clicked: false,
        createdAt: Date.now(),
        priority,
        expiresAt: expiresInMs ? Date.now() + expiresInMs : null,
      };

      await update(newNotificationRef, notification);
      console.log('✅ Notification created:', notification.id);

      return notification.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   * @param {string} userId - User ID
   * @param {string} notificationId - Notification ID
   */
  async markAsRead(userId, notificationId) {
    try {
      const notificationRef = ref(this.db, `notifications/${userId}/${notificationId}`);
      await update(notificationRef, {
        read: true,
        readAt: Date.now(),
      });
      console.log('📖 Notification marked as read:', notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark notification as clicked
   * @param {string} userId - User ID
   * @param {string} notificationId - Notification ID
   */
  async markAsClicked(userId, notificationId) {
    try {
      const notificationRef = ref(this.db, `notifications/${userId}/${notificationId}`);
      await update(notificationRef, {
        clicked: true,
        clickedAt: Date.now(),
        read: true, // Auto-mark as read when clicked
        readAt: Date.now(),
      });
      console.log('👆 Notification marked as clicked:', notificationId);
    } catch (error) {
      console.error('Error marking notification as clicked:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   * @param {string} userId - User ID
   */
  async markAllAsRead(userId) {
    try {
      const notificationsRef = ref(this.db, `notifications/${userId}`);
      const snapshot = await get(notificationsRef);

      if (!snapshot.exists()) return;

      const updates = {};
      const timestamp = Date.now();

      snapshot.forEach((child) => {
        const notification = child.val();
        if (!notification.read) {
          updates[`${child.key}/read`] = true;
          updates[`${child.key}/readAt`] = timestamp;
        }
      });

      if (Object.keys(updates).length > 0) {
        await update(notificationsRef, updates);
        console.log(`📖 Marked ${Object.keys(updates).length / 2} notifications as read`);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   * @param {string} userId - User ID
   * @param {string} notificationId - Notification ID
   */
  async deleteNotification(userId, notificationId) {
    try {
      const notificationRef = ref(this.db, `notifications/${userId}/${notificationId}`);
      await remove(notificationRef);
      console.log('🗑️ Notification deleted:', notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Delete all notifications for user
   * @param {string} userId - User ID
   */
  async deleteAllNotifications(userId) {
    try {
      const notificationsRef = ref(this.db, `notifications/${userId}`);
      await remove(notificationsRef);
      console.log('🗑️ All notifications deleted for user:', userId);
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      throw error;
    }
  }

  /**
   * Clean expired notifications
   * @param {string} userId - User ID
   */
  async cleanExpiredNotifications(userId) {
    try {
      const notificationsRef = ref(this.db, `notifications/${userId}`);
      const snapshot = await get(notificationsRef);

      if (!snapshot.exists()) return;

      const now = Date.now();
      const toDelete = [];

      snapshot.forEach((child) => {
        const notification = child.val();
        if (notification.expiresAt && now > notification.expiresAt) {
          toDelete.push(child.key);
        }
      });

      if (toDelete.length > 0) {
        const deletePromises = toDelete.map((id) => this.deleteNotification(userId, id));
        await Promise.all(deletePromises);
        console.log(`🗑️ Cleaned ${toDelete.length} expired notifications`);
      }
    } catch (error) {
      console.error('Error cleaning expired notifications:', error);
      throw error;
    }
  }

  /**
   * Listen to user notifications with real-time updates
   * @param {string} userId - User ID
   * @param {Function} callback - Callback function (receives notifications array)
   * @returns {Function} - Unsubscribe function
   */
  listenToNotifications(userId, callback) {
    try {
      const notificationsRef = ref(this.db, `notifications/${userId}`);
      const notificationsQuery = query(notificationsRef, orderByChild('createdAt'));

      const unsubscribe = onValue(
        notificationsQuery,
        (snapshot) => {
          const notifications = [];

          if (snapshot.exists()) {
            snapshot.forEach((child) => {
              const notification = child.val();

              // Filter out expired notifications
              if (!notification.expiresAt || Date.now() <= notification.expiresAt) {
                notifications.push(notification);
              }
            });
          }

          // Sort by createdAt descending (newest first)
          notifications.sort((a, b) => b.createdAt - a.createdAt);
          callback(notifications);
        },
        (error) => {
          console.error('Error listening to notifications:', error);
        },
      );

      this.listeners.set(userId, unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up notification listener:', error);
      throw error;
    }
  }

  /**
   * Stop listening to notifications
   * @param {string} userId - User ID
   */
  stopListening(userId) {
    const unsubscribe = this.listeners.get(userId);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(userId);
      console.log('🔕 Stopped listening to notifications for user:', userId);
    }
  }

  /**
   * Schedule auto-read for notification
   * Used when notification is displayed to user
   * @param {string} userId - User ID
   * @param {string} notificationId - Notification ID
   */
  scheduleAutoRead(userId, notificationId) {
    if (!this.settings.autoMarkAsRead) return;

    // Clear existing timer if any
    this.cancelAutoRead(notificationId);

    const timerId = setTimeout(async () => {
      try {
        await this.markAsRead(userId, notificationId);
        this.autoReadTimers.delete(notificationId);
      } catch (error) {
        console.error('Error in auto-read timer:', error);
      }
    }, this.settings.autoMarkAsReadDelay);

    this.autoReadTimers.set(notificationId, timerId);
  }

  /**
   * Cancel scheduled auto-read
   * @param {string} notificationId - Notification ID
   */
  cancelAutoRead(notificationId) {
    const timerId = this.autoReadTimers.get(notificationId);
    if (timerId) {
      clearTimeout(timerId);
      this.autoReadTimers.delete(notificationId);
    }
  }

  /**
   * Cancel all auto-read timers
   */
  cancelAllAutoReads() {
    this.autoReadTimers.forEach((timerId) => clearTimeout(timerId));
    this.autoReadTimers.clear();
  }

  /**
   * Load user notification settings
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Settings object
   */
  async loadSettings(userId) {
    try {
      const settingsRef = ref(this.db, `notificationSettings/${userId}`);
      const snapshot = await get(settingsRef);

      if (snapshot.exists()) {
        const settings = snapshot.val();
        this.settings = { ...this.settings, ...settings };
        console.log('⚙️ Notification settings loaded:', this.settings);
      }

      return this.settings;
    } catch (error) {
      console.error('Error loading notification settings:', error);
      throw error;
    }
  }

  /**
   * Update user notification settings
   * @param {string} userId - User ID
   * @param {Object} settings - Settings to update
   */
  async updateSettings(userId, settings) {
    try {
      const settingsRef = ref(this.db, `notificationSettings/${userId}`);
      await update(settingsRef, settings);

      this.settings = { ...this.settings, ...settings };
      console.log('⚙️ Notification settings updated:', this.settings);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  }

  /**
   * Get current settings
   * @returns {Object} - Current settings
   */
  getSettings() {
    return { ...this.settings };
  }

  /**
   * Get unread count
   * @param {Array} notifications - Notifications array
   * @returns {number} - Count of unread notifications
   */
  getUnreadCount(notifications) {
    return notifications.filter((n) => !n.read).length;
  }

  /**
   * Get notifications by type
   * @param {Array} notifications - Notifications array
   * @param {string} type - Notification type
   * @returns {Array} - Filtered notifications
   */
  getByType(notifications, type) {
    return notifications.filter((n) => n.type === type);
  }

  /**
   * Get notifications by priority
   * @param {Array} notifications - Notifications array
   * @param {string} priority - Priority level
   * @returns {Array} - Filtered notifications
   */
  getByPriority(notifications, priority) {
    return notifications.filter((n) => n.priority === priority);
  }

  /**
   * Cleanup service (call on logout/unmount)
   */
  cleanup() {
    // Stop all listeners
    this.listeners.forEach((unsubscribe) => unsubscribe());
    this.listeners.clear();

    // Cancel all auto-read timers
    this.cancelAllAutoReads();

    console.log('🧹 Notifications service cleaned up');
  }
}

// Export singleton instance
export default new NotificationsService();
