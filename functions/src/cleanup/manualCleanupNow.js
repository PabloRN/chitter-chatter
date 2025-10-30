const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

/**
 * MANUAL TRIGGER: Cleanup anonymous users NOW (for testing)
 * This is identical to cleanupAnonymousUsers but can be called via HTTP anytime
 * Ignores the 30-minute creation time check for faster testing
 */
exports.manualCleanupNow = onRequest(
  {
    region: 'us-central1',
    cors: true,
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    console.log('🧪 MANUAL CLEANUP: Starting immediate anonymous user cleanup...');
    const db = admin.database();
    const auth = admin.auth();

    try {
      const usersRef = db.ref('users');
      const snapshot = await usersRef.once('value');

      if (!snapshot.exists()) {
        res.status(200).json({
          success: true,
          message: 'No users found in database',
          deleted: 0,
          deletedFromDatabase: 0,
          deletedFromAuth: 0,
        });
        return;
      }

      const users = snapshot.val();
      let deletedFromDatabase = 0;
      let deletedFromAuth = 0;
      let ghostCount = 0;
      let skippedCount = 0;
      const errors = [];
      const deletedUsers = [];

      for (const [userId, userData] of Object.entries(users)) {
        try {
          // ====== GHOST USER CHECK (Priority - check first) ======
          // Ghost users are created when onDisconnect fires after user deletion
          // They have ONLY minimal fields: onlineState, status, userId, and possibly welcome email metadata
          const userFields = Object.keys(userData);
          const ghostFields = [
            'onlineState',
            'status',
            'userId',
            'lastOnline',
            'welcomeEmailSent',
            'welcomeEmailAttemptedAt',
            'welcomeEmailError',
            'welcomeEmailSentAt',
            'welcomeEmailMessageId',
          ];
          const hasOnlyGhostFields = userFields.every((field) => ghostFields.includes(field));
          const hasMinimalFields = userFields.length <= 9; // Increased from 3 to account for welcome email fields
          const isOffline = userData.onlineState === false && userData.status === 'offline';

          if (hasOnlyGhostFields && hasMinimalFields && isOffline) {
            console.log(`👻 Found ghost user ${userId} with fields: ${userFields.join(', ')}`);

            // Delete from Realtime Database
            await db.ref(`users/${userId}`).remove();
            deletedFromDatabase++;
            console.log(`✅ Deleted ghost user ${userId} from DATABASE`);

            // Delete from Firebase Auth
            try {
              await auth.deleteUser(userId);
              deletedFromAuth++;
              console.log(`✅ Deleted ghost user ${userId} from AUTHENTICATION`);
            } catch (authError) {
              if (authError.code === 'auth/user-not-found') {
                console.log(`ℹ️ Ghost user ${userId} not found in Auth`);
              }
            }

            ghostCount++;
            deletedUsers.push(userId);
            continue; // Skip to next user
          }

          // SAFETY CHECK 1: Must be marked as anonymous
          if (userData.isAnonymous !== true) {
            continue;
          }

          // SAFETY CHECK 2: Must be disconnected
          if (userData.onlineState !== false || userData.status !== 'offline') {
            skippedCount++;
            continue;
          }

          // SAFETY CHECK 3: Must not have active subscription
          // Anonymous users don't have subscriptionTier field (undefined) - this is OK
          // Only skip if user has a PAID subscription (landlord, creator, etc.)
          if (userData.subscriptionTier && userData.subscriptionTier !== 'free') {
            console.log(`⚠️ Skipping ${userId}: Has active subscription tier ${userData.subscriptionTier}`);
            skippedCount++;
            continue;
          }

          // SAFETY CHECK 4: Must not own any rooms
          if (userData.ownedRooms && Array.isArray(userData.ownedRooms) && userData.ownedRooms.length > 0) {
            console.log(`⚠️ Skipping ${userId}: Owns ${userData.ownedRooms.length} rooms`);
            skippedCount++;
            continue;
          }

          // SAFETY CHECK 5: Must not be currently in any rooms
          if (userData.rooms && Object.keys(userData.rooms).length > 0) {
            console.log(`⚠️ Skipping ${userId}: Currently in ${Object.keys(userData.rooms).length} rooms`);
            skippedCount++;
            continue;
          }

          // SAFETY CHECK 6: Verify in Firebase Auth that user is anonymous
          let authUserIsAnonymous = false;
          try {
            const authUser = await auth.getUser(userId);
            authUserIsAnonymous = authUser.providerData.length === 0;
          } catch (authError) {
            console.log(`⚠️ User ${userId} not found in Firebase Auth (will clean database only)`);
            authUserIsAnonymous = true;
          }

          if (!authUserIsAnonymous) {
            console.log(`⚠️ Skipping ${userId}: Firebase Auth shows user is NOT anonymous`);
            skippedCount++;
            continue;
          }

          // ALL CHECKS PASSED - DELETE
          console.log(`✅ Deleting anonymous user ${userId}`);
          deletedUsers.push(userId);

          // Delete from Realtime Database
          await db.ref(`users/${userId}`).remove();
          deletedFromDatabase++;
          console.log(`✅ Deleted ${userId} from DATABASE`);

          // Delete from Firebase Auth
          try {
            await auth.deleteUser(userId);
            deletedFromAuth++;
            console.log(`✅ Deleted ${userId} from AUTHENTICATION`);
          } catch (authError) {
            if (authError.code === 'auth/user-not-found') {
              console.log(`ℹ️ User ${userId} already deleted from Auth`);
            } else {
              console.error(`❌ Error deleting ${userId} from Auth:`, authError.message);
              errors.push({ userId, error: authError.message, location: 'auth' });
            }
          }
        } catch (error) {
          console.error(`❌ Error processing ${userId}:`, error);
          errors.push({ userId, error: error.message });
        }
      }

      const result = {
        success: true,
        message: 'Manual cleanup completed',
        deleted: deletedUsers.length,
        ghostsDeleted: ghostCount,
        anonymousDeleted: deletedUsers.length - ghostCount,
        deletedFromDatabase,
        deletedFromAuth,
        skipped: skippedCount,
        deletedUsers: deletedUsers.length > 0 ? deletedUsers : undefined,
        errors: errors.length > 0 ? errors : undefined,
      };

      console.log(`✅ Manual cleanup completed:`);
      console.log(`   - Ghost users deleted: ${ghostCount}`);
      console.log(`   - Anonymous users deleted: ${deletedUsers.length - ghostCount}`);
      console.log(`   - Total deleted from Database: ${deletedFromDatabase}`);
      console.log(`   - Total deleted from Auth: ${deletedFromAuth}`);
      console.log(`   - Skipped: ${skippedCount}`);

      res.status(200).json(result);
    } catch (error) {
      console.error('❌ Fatal error in manual cleanup:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },
);
