const { onValueUpdated } = require('firebase-functions/v2/database');
const admin = require('firebase-admin');

/**
 * Cloud Function to track user online time
 * Triggers when onlineState changes from true → false
 * Calculates session duration and adds to totalOnlineTime
 */
exports.trackOnlineTime = onValueUpdated(
  {
    ref: '/users/{userId}/onlineState',
    region: 'us-central1',
  },
  async (event) => {
    const { userId } = event.params;
    const beforeState = event.data.before.val();
    const afterState = event.data.after.val();

    // Only track when user goes offline (true → false)
    if (beforeState !== true || afterState !== false) {
      return null;
    }

    console.log(`📊 Tracking session end for user ${userId}`);

    const db = admin.database();
    const userRef = db.ref(`users/${userId}`);

    try {
      // Get user data to find currentSessionStart
      const userSnapshot = await userRef.once('value');
      const userData = userSnapshot.val();

      if (!userData || !userData.currentSessionStart) {
        console.log(`⚠️ No session start found for ${userId}, skipping tracking`);
        return null;
      }

      const sessionStart = userData.currentSessionStart;
      const sessionEnd = Date.now();
      const sessionDuration = Math.floor((sessionEnd - sessionStart) / 1000); // Convert to seconds

      // Only track if session duration is positive and reasonable (less than 24 hours)
      if (sessionDuration > 0 && sessionDuration < 86400) {
        // Get current totalOnlineTime or default to 0
        const currentTotal = userData.totalOnlineTime || 0;
        const newTotal = currentTotal + sessionDuration;

        await userRef.update({
          totalOnlineTime: newTotal,
          currentSessionStart: null, // Clear session start since user is now offline
        });

        console.log(`✅ Updated ${userId}: +${sessionDuration}s (total: ${newTotal}s)`);
      } else {
        console.log(`⚠️ Invalid session duration ${sessionDuration}s for ${userId}, skipping`);
      }

      return { success: true, sessionDuration };
    } catch (error) {
      console.error(`❌ Error tracking online time for ${userId}:`, error);
      return { success: false, error: error.message };
    }
  },
);
