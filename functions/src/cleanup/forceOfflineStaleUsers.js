const { onSchedule } = require('firebase-functions/v2/scheduler');
const { getDatabase } = require('firebase-admin/database');

/**
 * Forces users offline if they've been inactive for 10+ minutes
 * This is a safety net for when onDisconnect() doesn't fire
 *
 * Runs every 10 minutes
 */
exports.forceOfflineStaleUsers = onSchedule({
  schedule: 'every 10 minutes',
  timeZone: 'America/New_York',
  region: 'us-central1',
  memory: '256MiB',
  timeoutSeconds: 120,
}, async () => {
  console.log('Checking for stale users...');

  const db = getDatabase();
  const usersRef = db.ref('users');
  const now = Date.now();
  const staleThreshold = 10 * 60 * 1000; // 10 minutes

  try {
    const snapshot = await usersRef.once('value');

    if (!snapshot.exists()) {
      console.log('No users found');
      return { forcedOfflineCount: 0 };
    }

    const users = snapshot.val();
    const updates = {};
    let forcedOfflineCount = 0;

    Object.entries(users).forEach(([userId, userData]) => {
      // Only check users marked as online
      if (userData.onlineState !== true) {
        return;
      }

      // Check when user was last active (use whatever timestamp is available)
      const lastActive = userData.lastOnlineAt || userData.currentSessionStart || userData.createdAt || 0;

      // If last activity > 10 minutes ago, force offline
      if (now - lastActive > staleThreshold) {
        updates[`users/${userId}/onlineState`] = false;
        updates[`users/${userId}/status`] = 'offline';
        updates[`users/${userId}/lastOnline`] = now;
        forcedOfflineCount += 1;
      }
    });

    // Apply all updates in a single batch
    if (Object.keys(updates).length > 0) {
      await db.ref().update(updates);
      console.log(`✅ Forced ${forcedOfflineCount} stale users offline`);
    } else {
      console.log('✅ No stale users found');
    }

    return { forcedOfflineCount };
  } catch (error) {
    console.error('Error in forceOfflineStaleUsers:', error);
    throw error;
  }
});
