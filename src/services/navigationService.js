import tabCommunicationService from './tabCommunicationService.js';

/**
 * Navigation Service
 * Handles cross-tab navigation and window management
 */
class NavigationService {
  constructor() {
    this.tabCommunicationService = tabCommunicationService;
    this.focusListeners = new Set();
    this.setupEventListeners();
  }

  /**
   * Setup window focus event listeners
   */
  setupEventListeners() {
    // Listen for focus events
    window.addEventListener('focus', () => {
      this.notifyFocusListeners(true);
    });

    window.addEventListener('blur', () => {
      this.notifyFocusListeners(false);
    });

    // Listen for navigation requests
    this.tabCommunicationService.addAuthListener((message) => {
      this.handleNavigationMessage(message);
    });

    // Clean expired data on page load
    this.tabCommunicationService.cleanExpiredTabData();
  }

  /**
   * Handle navigation-related messages
   */
  handleNavigationMessage(message) {
    switch (message.type) {
      case 'FOCUS_REQUEST':
        this.handleFocusRequest(message);
        break;
      case 'CLOSE_REQUEST':
        this.handleCloseRequest(message);
        break;
      case 'AUTH_SUCCESS':
        this.handleAuthSuccessNavigation(message);
        break;
      case 'AUTH_FAILURE':
        this.handleAuthFailureNavigation(message);
        break;
    }
  }

  /**
   * Handle focus request from other tabs
   */
  handleFocusRequest(message) {
    const currentTabId = this.tabCommunicationService.getTabId();

    if (message.targetTabId === currentTabId
        || (message.originalTabContext && this.isCurrentTab(message.originalTabContext))) {
      console.log('🎯 Focusing this tab based on request');
      this.focusCurrentTab();

      // Navigate to the original context if provided
      if (message.originalTabContext) {
        this.navigateToContext(message.originalTabContext);
      }
    }
  }

  /**
   * Handle close request from other tabs
   */
  handleCloseRequest(message) {
    const currentTabId = this.tabCommunicationService.getTabId();

    if (message.targetTabId === currentTabId) {
      console.log(`🚪 Closing tab due to ${message.reason}`);

      // Give a small delay for any final operations
      setTimeout(() => {
        window.close();
      }, 1000);
    }
  }

  /**
   * Handle navigation after successful authentication
   */
  handleAuthSuccessNavigation(message) {
    if (message.originalTabContext) {
      // Check if this is the original tab
      if (this.isCurrentTab(message.originalTabContext)) {
        console.log('🏠 This is the original tab, staying here');
        this.focusCurrentTab();
      } else {
        // This might be the auth tab, request focus of original tab
        this.requestFocusOriginalTab(message.originalTabContext);
      }
    }
  }

  /**
   * Handle navigation after authentication failure
   */
  handleAuthFailureNavigation(message) {
    if (message.originalTabContext && this.isCurrentTab(message.originalTabContext)) {
      console.log('🏠 Authentication failed, staying on original tab');
      this.focusCurrentTab();
    }
  }

  /**
   * Check if current tab matches the provided tab context
   */
  isCurrentTab(tabContext) {
    const currentTabId = this.tabCommunicationService.getTabId();

    // First check by tab ID if available
    if (tabContext.tabId && currentTabId) {
      return tabContext.tabId === currentTabId;
    }

    // Fallback to URL matching
    const currentUrl = window.location.href;
    const contextUrl = tabContext.url;

    // Check if URLs match (excluding fragments for email link scenarios)
    const currentBase = currentUrl.split('#')[0];
    const contextBase = contextUrl.split('#')[0];

    return currentBase === contextBase;
  }

  /**
   * Focus current browser tab
   */
  focusCurrentTab() {
    try {
      window.focus();

      // Additional focus attempts for better cross-browser support
      if (document.hidden) {
        // Try to bring tab to front
        window.parent?.focus();
      }
    } catch (error) {
      console.error('Error focusing current tab:', error);
    }
  }

  /**
   * Request focus of original tab
   */
  requestFocusOriginalTab(originalTabContext) {
    console.log('📨 Requesting focus of original tab');

    this.tabCommunicationService.broadcastFocusRequest(
      originalTabContext.tabId,
      originalTabContext,
    );

    // If this is an auth tab, close it after a delay
    const currentUrl = window.location.href;
    if (this.isAuthActionUrl(currentUrl)) {
      const currentTabId = this.tabCommunicationService.getTabId();

      setTimeout(() => {
        this.tabCommunicationService.broadcastCloseRequest(
          currentTabId,
          'AUTH_COMPLETE',
        );
      }, 2000);
    }
  }

  /**
   * Check if current URL is an auth action URL
   */
  isAuthActionUrl(url) {
    return url.includes('/authaction')
           || url.includes('mode=signIn')
           || url.includes('mode=verifyEmail')
           || url.includes('mode=resetPassword');
  }

  /**
   * Navigate to specific tab context
   */
  navigateToContext(tabContext) {
    const currentPath = window.location.pathname + window.location.search + window.location.hash;
    const targetPath = tabContext.pathname + (tabContext.search || '') + (tabContext.hash || '');

    if (currentPath !== targetPath) {
      console.log(`🧭 Navigating to original context: ${targetPath}`);

      // Use history.pushState for same-origin navigation
      if (window.location.origin === tabContext.origin) {
        history.pushState({}, '', targetPath);

        // Dispatch popstate event to notify Vue Router
        window.dispatchEvent(new PopStateEvent('popstate'));
      } else {
        window.location.href = tabContext.url;
      }
    }
  }

  /**
   * Store current context before navigation
   */
  storeCurrentContext(additionalData = {}) {
    return this.tabCommunicationService.storeOriginalTabContext({
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      ...additionalData,
    });
  }

  /**
   * Get stored original context
   */
  getOriginalContext() {
    return this.tabCommunicationService.getOriginalTabContext();
  }

  /**
   * Clear stored context
   */
  clearOriginalContext() {
    this.tabCommunicationService.clearOriginalTabContext();
  }

  /**
   * Open URL in new tab with context storage
   */
  openInNewTab(url, storeContext = true) {
    if (storeContext) {
      this.storeCurrentContext();
    }

    const newTab = window.open(url, '_blank');

    if (!newTab) {
      console.warn('Failed to open new tab - popup blocker may be active');
      return null;
    }

    return newTab;
  }

  /**
   * Handle email link opening (for Firebase Auth)
   */
  handleEmailLinkOpen(emailLinkUrl) {
    console.log('📧 Handling email link open');

    // Store current context
    const context = this.storeCurrentContext({
      triggeredBy: 'email_link',
      emailLinkUrl,
    });

    // Open in same tab (forceSameDevice: true behavior)
    window.location.href = emailLinkUrl;

    return context;
  }

  /**
   * Add focus listener
   */
  addFocusListener(callback) {
    this.focusListeners.add(callback);
    return () => this.focusListeners.delete(callback);
  }

  /**
   * Notify all focus listeners
   */
  notifyFocusListeners(isFocused) {
    for (const listener of this.focusListeners) {
      try {
        listener(isFocused);
      } catch (error) {
        console.error('Error in focus listener:', error);
      }
    }
  }

  /**
   * Get current tab info
   */
  getCurrentTabInfo() {
    return {
      id: this.tabCommunicationService.getTabId(),
      url: window.location.href,
      origin: window.location.origin,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      isVisible: !document.hidden,
      hasFocus: document.hasFocus(),
      timestamp: Date.now(),
    };
  }

  /**
   * Check if tab is currently visible
   */
  isTabVisible() {
    return !document.hidden && document.hasFocus();
  }

  /**
   * Wait for tab to become visible
   */
  waitForTabVisible(timeout = 5000) {
    return new Promise((resolve) => {
      if (this.isTabVisible()) {
        resolve(true);
        return;
      }

      let timeoutId;
      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
        document.removeEventListener('visibilitychange', visibilityHandler);
        window.removeEventListener('focus', focusHandler);
      };

      const visibilityHandler = () => {
        if (this.isTabVisible()) {
          cleanup();
          resolve(true);
        }
      };

      const focusHandler = () => {
        if (this.isTabVisible()) {
          cleanup();
          resolve(true);
        }
      };

      document.addEventListener('visibilitychange', visibilityHandler);
      window.addEventListener('focus', focusHandler);

      // Set timeout
      timeoutId = setTimeout(() => {
        cleanup();
        resolve(false);
      }, timeout);
    });
  }

  /**
   * Cleanup method
   */
  cleanup() {
    this.focusListeners.clear();
    // Note: tabCommunicationService handles its own cleanup
  }
}

// Export singleton instance
export default new NavigationService();
