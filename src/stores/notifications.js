import { defineStore } from 'pinia';
import notificationsService from '@/services/notificationsService';

const useNotificationsStore = defineStore('notifications', {
  state: () => ({
    notifications: [],
    loading: false,
    error: null,
    settings: {
      enabled: true,
      autoMarkAsRead: true,
      autoMarkAsReadDelay: 3000,
    },
    isListening: false,
    unsubscribe: null,
  }),

  getters: {
    /**
     * Get unread notifications count
     */
    unreadCount: (state) => state.notifications.filter((n) => !n.read).length,

    /**
     * Get unread notifications
     */
    unreadNotifications: (state) => state.notifications.filter((n) => !n.read),

    /**
     * Get read notifications
     */
    readNotifications: (state) => state.notifications.filter((n) => n.read),

    /**
     * Get notifications by type
     */
    getByType: (state) => (type) => state.notifications.filter((n) => n.type === type),

    /**
     * Get notifications by priority
     */
    getByPriority: (state) => (priority) => state.notifications.filter((n) => n.priority === priority),

    /**
     * Get friend request notifications
     */
    friendRequestNotifications: (state) => state.notifications.filter(
      (n) => n.type === notificationsService.constructor.TYPES.FRIEND_REQUEST && !n.read,
    ),

    /**
     * Get friend request count
     */
    friendRequestCount() {
      return this.friendRequestNotifications.length;
    },

    /**
     * Check if notifications are enabled
     */
    isEnabled: (state) => state.settings.enabled,

    /**
     * Get most recent notification
     */
    latestNotification: (state) => (state.notifications.length > 0 ? state.notifications[0] : null),

    /**
     * Get urgent notifications
     */
    urgentNotifications: (state) => state.notifications.filter(
      (n) => n.priority === notificationsService.constructor.PRIORITY.URGENT && !n.read,
    ),
  },

  actions: {
    /**
     * Initialize notifications for user
     * @param {string} userId - User ID
     */
    async initialize(userId) {
      if (!userId) {
        console.warn('⚠️ Cannot initialize notifications without userId');
        return;
      }

      if (this.isListening) {
        return;
      }

      try {
        this.loading = true;
        this.error = null;

        // Load user settings
        await notificationsService.loadSettings(userId);
        this.settings = notificationsService.getSettings();

        // Clean expired notifications
        await notificationsService.cleanExpiredNotifications(userId);

        // Start listening to notifications
        this.unsubscribe = notificationsService.listenToNotifications(userId, (notifications) => {
          this.notifications = notifications;
          this.loading = false;
        });

        this.isListening = true;
      } catch (error) {
        console.error('Error initializing notifications:', error);
        this.error = error.message || 'Failed to initialize notifications';
        this.loading = false;
      }
    },

    /**
     * Stop listening to notifications
     */
    stopListening(userId) {
      if (this.unsubscribe) {
        this.unsubscribe();
        this.unsubscribe = null;
      }

      if (userId) {
        notificationsService.stopListening(userId);
      }

      this.isListening = false;
      console.log('🔕 Stopped listening to notifications');
    },

    /**
     * Create a new notification
     * @param {string} userId - Target user ID
     * @param {Object} notificationData - Notification details
     */
    async createNotification(userId, notificationData) {
      try {
        const notificationId = await notificationsService.createNotification(userId, notificationData);
        return notificationId;
      } catch (error) {
        console.error('Error creating notification:', error);
        this.error = error.message || 'Failed to create notification';
        throw error;
      }
    },

    /**
     * Mark notification as read
     * @param {string} userId - User ID
     * @param {string} notificationId - Notification ID
     */
    async markAsRead(userId, notificationId) {
      try {
        await notificationsService.markAsRead(userId, notificationId);
      } catch (error) {
        console.error('Error marking notification as read:', error);
        this.error = error.message || 'Failed to mark notification as read';
        throw error;
      }
    },

    /**
     * Mark notification as clicked
     * @param {string} userId - User ID
     * @param {string} notificationId - Notification ID
     */
    async markAsClicked(userId, notificationId) {
      try {
        await notificationsService.markAsClicked(userId, notificationId);
      } catch (error) {
        console.error('Error marking notification as clicked:', error);
        this.error = error.message || 'Failed to mark notification as clicked';
        throw error;
      }
    },

    /**
     * Mark all notifications as read
     * @param {string} userId - User ID
     */
    async markAllAsRead(userId) {
      try {
        await notificationsService.markAllAsRead(userId);
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
        this.error = error.message || 'Failed to mark all notifications as read';
        throw error;
      }
    },

    /**
     * Delete notification
     * @param {string} userId - User ID
     * @param {string} notificationId - Notification ID
     */
    async deleteNotification(userId, notificationId) {
      try {
        await notificationsService.deleteNotification(userId, notificationId);
      } catch (error) {
        console.error('Error deleting notification:', error);
        this.error = error.message || 'Failed to delete notification';
        throw error;
      }
    },

    /**
     * Delete all notifications
     * @param {string} userId - User ID
     */
    async deleteAllNotifications(userId) {
      try {
        await notificationsService.deleteAllNotifications(userId);
      } catch (error) {
        console.error('Error deleting all notifications:', error);
        this.error = error.message || 'Failed to delete all notifications';
        throw error;
      }
    },

    /**
     * Schedule auto-read for displayed notification
     * @param {string} userId - User ID
     * @param {string} notificationId - Notification ID
     */
    scheduleAutoRead(userId, notificationId) {
      if (this.settings.autoMarkAsRead) {
        notificationsService.scheduleAutoRead(userId, notificationId);
      }
    },

    /**
     * Cancel auto-read timer
     * @param {string} notificationId - Notification ID
     */
    cancelAutoRead(notificationId) {
      notificationsService.cancelAutoRead(notificationId);
    },

    /**
     * Update notification settings
     * @param {string} userId - User ID
     * @param {Object} settings - Settings to update
     */
    async updateSettings(userId, settings) {
      try {
        await notificationsService.updateSettings(userId, settings);
        this.settings = notificationsService.getSettings();
      } catch (error) {
        console.error('Error updating notification settings:', error);
        this.error = error.message || 'Failed to update settings';
        throw error;
      }
    },

    /**
     * Toggle notifications enabled/disabled
     * @param {string} userId - User ID
     */
    async toggleEnabled(userId) {
      try {
        const newState = !this.settings.enabled;
        await this.updateSettings(userId, { enabled: newState });
      } catch (error) {
        console.error('Error toggling notifications:', error);
        throw error;
      }
    },

    /**
     * Toggle auto-read feature
     * @param {string} userId - User ID
     */
    async toggleAutoRead(userId) {
      try {
        const newState = !this.settings.autoMarkAsRead;
        await this.updateSettings(userId, { autoMarkAsRead: newState });
      } catch (error) {
        console.error('Error toggling auto-read:', error);
        throw error;
      }
    },

    /**
     * Set auto-read delay
     * @param {string} userId - User ID
     * @param {number} delay - Delay in milliseconds
     */
    async setAutoReadDelay(userId, delay) {
      try {
        await this.updateSettings(userId, { autoMarkAsReadDelay: delay });
      } catch (error) {
        console.error('Error setting auto-read delay:', error);
        throw error;
      }
    },

    /**
     * Clear error state
     */
    clearError() {
      this.error = null;
    },

    /**
     * Reset store state
     */
    reset() {
      this.notifications = [];
      this.loading = false;
      this.error = null;
      this.isListening = false;

      if (this.unsubscribe) {
        this.unsubscribe();
        this.unsubscribe = null;
      }

      notificationsService.cleanup();
    },

    /**
     * Cleanup on logout
     */
    cleanup() {
      this.stopListening();
      notificationsService.cleanup();
      this.reset();
      console.log('🧹 Notifications store cleaned up');
    },
  },
});

export default useNotificationsStore;
