/**
 * Tab Communication Service
 * Handles cross-tab communication using BroadcastChannel API
 */
class TabCommunicationService {
  constructor() {
    this.channels = new Map();
    this.listeners = new Map();
  }

  /**
   * Create or get existing broadcast channel
   */
  getChannel(channelName) {
    if (!this.channels.has(channelName)) {
      const channel = new BroadcastChannel(channelName);
      this.channels.set(channelName, channel);
      this.listeners.set(channelName, new Set());
    }
    return this.channels.get(channelName);
  }

  /**
   * Send message to specific channel
   */
  sendMessage(channelName, message) {
    try {
      const channel = this.getChannel(channelName);
      channel.postMessage(message);
      console.log(`📡 Sent message to ${channelName}:`, message);
    } catch (error) {
      console.error(`Error sending message to ${channelName}:`, error);
    }
  }

  /**
   * Listen for messages on specific channel
   */
  addListener(channelName, callback) {
    try {
      const channel = this.getChannel(channelName);
      const listeners = this.listeners.get(channelName);

      // Wrap callback to track it
      const wrappedCallback = (event) => {
        console.log(`📨 Received message on ${channelName}:`, event.data);
        callback(event.data);
      };

      channel.addEventListener('message', wrappedCallback);
      listeners.add({ original: callback, wrapped: wrappedCallback });

      return wrappedCallback;
    } catch (error) {
      console.error(`Error adding listener to ${channelName}:`, error);
      return null;
    }
  }

  /**
   * Remove listener from specific channel
   */
  removeListener(channelName, callback) {
    try {
      const channel = this.channels.get(channelName);
      const listeners = this.listeners.get(channelName);

      if (!channel || !listeners) return;

      // Find wrapped callback
      for (const listener of listeners) {
        if (listener.original === callback) {
          channel.removeEventListener('message', listener.wrapped);
          listeners.delete(listener);
          break;
        }
      }
    } catch (error) {
      console.error(`Error removing listener from ${channelName}:`, error);
    }
  }

  /**
   * Remove all listeners from a channel
   */
  clearChannelListeners(channelName) {
    try {
      const channel = this.channels.get(channelName);
      const listeners = this.listeners.get(channelName);

      if (!channel || !listeners) return;

      for (const listener of listeners) {
        channel.removeEventListener('message', listener.wrapped);
      }

      listeners.clear();
    } catch (error) {
      console.error(`Error clearing listeners from ${channelName}:`, error);
    }
  }

  /**
   * Close specific channel
   */
  closeChannel(channelName) {
    try {
      const channel = this.channels.get(channelName);
      if (channel) {
        this.clearChannelListeners(channelName);
        channel.close();
        this.channels.delete(channelName);
        this.listeners.delete(channelName);
      }
    } catch (error) {
      console.error(`Error closing channel ${channelName}:`, error);
    }
  }

  /**
   * Close all channels
   */
  closeAllChannels() {
    for (const channelName of this.channels.keys()) {
      this.closeChannel(channelName);
    }
  }

  // Auth-specific communication methods

  /**
   * Broadcast authentication success across tabs
   */
  broadcastAuthSuccess(authData) {
    this.sendMessage('chitter-auth', {
      type: 'AUTH_SUCCESS',
      timestamp: Date.now(),
      userId: authData.userId,
      isUpgrade: authData.isUpgrade || false,
      verifiedUser: authData.verifiedUser,
      unverifiedUser: authData.unverifiedUser,
      originalTabContext: authData.originalTabContext,
    });
  }

  /**
   * Broadcast authentication failure across tabs
   */
  broadcastAuthFailure(error, originalTabContext) {
    this.sendMessage('chitter-auth', {
      type: 'AUTH_FAILURE',
      timestamp: Date.now(),
      error: error.message || 'Authentication failed',
      originalTabContext,
    });
  }

  /**
   * Broadcast email storage request
   */
  broadcastEmailStoreRequest(email, tabId) {
    this.sendMessage('chitter-auth', {
      type: 'EMAIL_STORE_REQUEST',
      timestamp: Date.now(),
      email,
      requestingTabId: tabId,
    });
  }

  /**
   * Broadcast email storage response
   */
  broadcastEmailStoreResponse(email, requestingTabId, respondingTabId) {
    this.sendMessage('chitter-auth', {
      type: 'EMAIL_STORE_RESPONSE',
      timestamp: Date.now(),
      email,
      requestingTabId,
      respondingTabId,
    });
  }

  /**
   * Broadcast tab focus request
   */
  broadcastFocusRequest(targetTabId, originalTabContext) {
    this.sendMessage('chitter-auth', {
      type: 'FOCUS_REQUEST',
      timestamp: Date.now(),
      targetTabId,
      originalTabContext,
    });
  }

  /**
   * Broadcast tab close request
   */
  broadcastCloseRequest(targetTabId, reason = 'AUTH_COMPLETE') {
    this.sendMessage('chitter-auth', {
      type: 'CLOSE_REQUEST',
      timestamp: Date.now(),
      targetTabId,
      reason,
    });
  }

  /**
   * Listen for authentication-related messages
   */
  addAuthListener(callback) {
    return this.addListener('chitter-auth', callback);
  }

  /**
   * Remove authentication listener
   */
  removeAuthListener(callback) {
    this.removeListener('chitter-auth', callback);
  }

  // Storage utilities for cross-tab data persistence

  /**
   * Store data for cross-tab access
   */
  storeTabData(key, data, expiresInMs = 300000) { // 5 minutes default
    try {
      const storageData = {
        data,
        timestamp: Date.now(),
        expires: Date.now() + expiresInMs,
      };
      sessionStorage.setItem(`chitter_${key}`, JSON.stringify(storageData));
    } catch (error) {
      console.error(`Error storing tab data for key ${key}:`, error);
    }
  }

  /**
   * Retrieve data from cross-tab storage
   */
  getTabData(key, removeAfterRead = false) {
    try {
      const stored = sessionStorage.getItem(`chitter_${key}`);
      if (!stored) return null;

      const storageData = JSON.parse(stored);

      // Check if expired
      if (Date.now() > storageData.expires) {
        sessionStorage.removeItem(`chitter_${key}`);
        return null;
      }

      // Remove after reading if requested
      if (removeAfterRead) {
        sessionStorage.removeItem(`chitter_${key}`);
      }

      return storageData.data;
    } catch (error) {
      console.error(`Error retrieving tab data for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove tab data
   */
  removeTabData(key) {
    try {
      sessionStorage.removeItem(`chitter_${key}`);
    } catch (error) {
      console.error(`Error removing tab data for key ${key}:`, error);
    }
  }

  /**
   * Clean expired tab data
   */
  cleanExpiredTabData() {
    try {
      const keys = Object.keys(sessionStorage);
      const chitterKeys = keys.filter((key) => key.startsWith('chitter_'));

      for (const key of chitterKeys) {
        const stored = sessionStorage.getItem(key);
        if (stored) {
          const storageData = JSON.parse(stored);
          if (Date.now() > storageData.expires) {
            sessionStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning expired tab data:', error);
    }
  }

  // Tab identification utilities

  /**
   * Generate unique tab ID
   */
  generateTabId() {
    return `tab_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Get or create tab ID for current tab
   */
  getTabId() {
    let tabId = sessionStorage.getItem('chitter_tab_id');
    if (!tabId) {
      tabId = this.generateTabId();
      sessionStorage.setItem('chitter_tab_id', tabId);
    }
    return tabId;
  }

  /**
   * Store original tab context for return navigation
   */
  storeOriginalTabContext(additionalData = {}) {
    const tabContext = {
      url: window.location.href,
      origin: window.location.origin,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      timestamp: Date.now(),
      tabId: this.getTabId(),
      ...additionalData,
    };

    this.storeTabData('original_context', tabContext);
    return tabContext;
  }

  /**
   * Get original tab context
   */
  getOriginalTabContext() {
    return this.getTabData('original_context');
  }

  /**
   * Clear original tab context
   */
  clearOriginalTabContext() {
    this.removeTabData('original_context');
  }
}

// Export singleton instance
export default new TabCommunicationService();
