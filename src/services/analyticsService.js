import { getAnalytics, logEvent, setAnalyticsCollectionEnabled } from 'firebase/analytics';

/**
 * Analytics Service
 * Handles Firebase Analytics with cookie consent
 */
class AnalyticsService {
  constructor() {
    this.analytics = null;
    this.isSupported = false;
    this.consentGiven = false;
    this.basicEventsOnly = true;
  }

  /**
   * Initialize analytics
   */
  async initialize() {
    try {
      this.analytics = getAnalytics();
      this.isSupported = true;

      // Check stored consent
      const consent = localStorage.getItem('analytics_consent');
      if (consent === 'full') {
        this.enableFullTracking();
      } else if (consent === 'basic') {
        this.enableBasicTracking();
      } else {
        // Default to basic only until user consents
        this.enableBasicTracking();
      }

      console.log('📊 Analytics initialized');
    } catch (error) {
      console.warn('⚠️ Analytics not supported:', error);
      this.isSupported = false;
    }
  }

  /**
   * Enable basic tracking (no user consent needed)
   */
  enableBasicTracking() {
    this.basicEventsOnly = true;
    this.consentGiven = false;
    if (this.analytics) {
      setAnalyticsCollectionEnabled(this.analytics, false);
    }
  }

  /**
   * Enable full tracking (requires user consent)
   */
  enableFullTracking() {
    this.consentGiven = true;
    this.basicEventsOnly = false;
    if (this.analytics) {
      setAnalyticsCollectionEnabled(this.analytics, true);
    }
    localStorage.setItem('analytics_consent', 'full');
  }

  /**
   * User declined advanced tracking
   */
  declineAdvancedTracking() {
    this.enableBasicTracking();
    localStorage.setItem('analytics_consent', 'basic');
  }

  /**
   * Check if consent popup should be shown
   */
  shouldShowConsent() {
    return !localStorage.getItem('analytics_consent');
  }

  /**
   * Log event (basic or advanced based on consent)
   */
  logEvent(eventName, params = {}) {
    if (!this.isSupported || !this.analytics) return;

    // Basic events that don't need consent
    const basicEvents = [
      'app_start',
      'first_visit',
      'user_registered',
      'room_entered',
      'room_created',
      'room_exited',
      'message_sent',
      'auth_method_used',
    ];

    // Only log if: it's a basic event OR user gave full consent
    if (basicEvents.includes(eventName) || this.consentGiven) {
      logEvent(this.analytics, eventName, params);
    }
  }

  // ===== Convenience methods for common events =====

  /**
   * Track first visit
   */
  trackFirstVisit() {
    const hasVisited = localStorage.getItem('has_visited');
    if (!hasVisited) {
      this.logEvent('first_visit');
      localStorage.setItem('has_visited', 'true');
    }
  }

  /**
   * Track user registration/upgrade
   */
  trackUserRegistered(method = 'unknown') {
    this.logEvent('user_registered', { method });
  }

  /**
   * Track room entry
   */
  trackRoomEntered(roomId) {
    this.logEvent('room_entered', { room_id: roomId });
  }

  /**
   * Track room creation
   */
  trackRoomCreated(roomId, roomName, creatorId) {
    this.logEvent('room_created', { room_id: roomId, room_name: roomName, creator_id: creatorId });
  }

  /**
   * Track room exit
   */
  trackRoomExited(roomId, duration) {
    this.logEvent('room_exited', { room_id: roomId, session_duration: duration });
  }

  /**
   * Track message sent (basic event)
   */
  trackMessageSent(roomId) {
    this.logEvent('message_sent', { room_id: roomId });
  }

  /**
   * Track authentication method used
   */
  trackAuthMethod(method) {
    this.logEvent('auth_method_used', { method });
  }
}

// Export singleton instance
export default new AnalyticsService();
