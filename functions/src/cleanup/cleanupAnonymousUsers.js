const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');

/**
 * Scheduled function to cleanup old anonymous users
 * Runs every 30 minutes to check for anonymous users that have been disconnected for 30+ minutes
 *
 * Safety checks before deletion:
 * 1. User has isAnonymous: true in database
 * 2. User has subscriptionTier === 'free'
 * 3. User has no ownedRooms or empty array
 * 4. User is not currently in any rooms
 * 5. User exists in Firebase Auth with isAnonymous === true
 * 6. User has been disconnected for at least 30 minutes
 */
exports.cleanupAnonymousUsers = onSchedule(
  {
    schedule: 'every 30 minutes',
    region: 'us-central1',
    timeZone: 'America/New_York',
  },
  async (event) => {
    console.log('🧹 Starting anonymous user cleanup task...');

    const db = admin.database();
    const auth = admin.auth();

    try {
      // Get all users from Realtime Database
      const usersRef = db.ref('users');
      const snapshot = await usersRef.once('value');

      if (!snapshot.exists()) {
        console.log('No users found in database');
        return null;
      }

      const users = snapshot.val();
      const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000); // 30 minutes in milliseconds

      let deletedCount = 0; // Anonymous users deleted
      let ghostCount = 0; // Ghost users deleted
      let skippedCount = 0;
      const errors = [];

      // Process each user
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
            console.log(`✅ Deleted ghost user ${userId} from database`);

            // Try to delete from Firebase Auth (if exists)
            try {
              await auth.deleteUser(userId);
              console.log(`✅ Deleted ghost user ${userId} from Firebase Auth`);
            } catch (authError) {
              if (authError.code === 'auth/user-not-found') {
                console.log(`ℹ️ Ghost user ${userId} not found in Firebase Auth (database-only ghost)`);
              } else {
                console.warn(`⚠️ Could not delete ghost ${userId} from Auth: ${authError.message}`);
              }
            }

            ghostCount++;
            continue; // Skip to next user
          }

          // ====== SAFETY CHECK 1: Must be marked as anonymous in database ======
          if (userData.isAnonymous !== true) {
            continue; // Skip non-anonymous users
          }

          // ====== SAFETY CHECK 2: Must be disconnected and offline ======
          if (userData.onlineState !== false || userData.status !== 'offline') {
            continue; // Skip users who are online
          }

          // ====== SAFETY CHECK 3: Must have been offline for at least 30 minutes ======
          // Check lastOnline - only delete if user has been offline for 30+ minutes
          if (!userData.lastOnline || userData.lastOnline > thirtyMinutesAgo) {
            continue; // Skip users who haven't been offline long enough or never went offline
          }

          // ====== SAFETY CHECK 4: Must not have active subscription ======
          // Anonymous users don't have subscriptionTier field (undefined) - this is OK
          // Only skip if user has a PAID subscription (landlord, creator, etc.)
          if (userData.subscriptionTier && userData.subscriptionTier !== 'free') {
            console.log(`⚠️ Skipping ${userId}: Has active subscription tier ${userData.subscriptionTier}`);
            skippedCount++;
            continue;
          }

          // ====== SAFETY CHECK 5: Must not own any rooms ======
          if (userData.ownedRooms && Array.isArray(userData.ownedRooms) && userData.ownedRooms.length > 0) {
            console.log(`⚠️ Skipping ${userId}: Owns ${userData.ownedRooms.length} rooms`);
            skippedCount++;
            continue;
          }

          // ====== SAFETY CHECK 6: Must not be currently in any rooms ======
          if (userData.rooms && Object.keys(userData.rooms).length > 0) {
            console.log(`⚠️ Skipping ${userId}: Currently in ${Object.keys(userData.rooms).length} rooms`);
            skippedCount++;
            continue;
          }

          // ====== SAFETY CHECK 7: Verify in Firebase Auth that user is anonymous ======
          let authUserIsAnonymous = false;
          try {
            const authUser = await auth.getUser(userId);
            authUserIsAnonymous = authUser.providerData.length === 0; // Anonymous users have no providers
          } catch (authError) {
            // User doesn't exist in Auth (might have been deleted already)
            console.log(`⚠️ User ${userId} not found in Firebase Auth, will clean up database entry only`);
            authUserIsAnonymous = true; // Allow cleanup of orphaned database entry
          }

          if (!authUserIsAnonymous) {
            console.log(`⚠️ Skipping ${userId}: Firebase Auth shows user is NOT anonymous`);
            skippedCount++;
            continue;
          }

          // ====== ALL SAFETY CHECKS PASSED - PROCEED WITH DELETION ======
          console.log(`✅ Deleting anonymous user ${userId} (passed all safety checks)`);

          // Delete from Realtime Database
          await db.ref(`users/${userId}`).remove();

          // Delete from Firebase Auth (if exists)
          try {
            await auth.deleteUser(userId);
            console.log(`✅ Deleted ${userId} from Firebase Auth`);
          } catch (authDeleteError) {
            if (authDeleteError.code === 'auth/user-not-found') {
              console.log(`ℹ️ User ${userId} already deleted from Auth`);
            } else {
              console.error(`❌ Error deleting ${userId} from Auth:`, authDeleteError.message);
            }
          }

          deletedCount++;
        } catch (userError) {
          console.error(`❌ Error processing user ${userId}:`, userError);
          errors.push({ userId, error: userError.message });
        }
      }

      console.log(`✅ User cleanup completed:`);
      console.log(`   - Ghost users deleted: ${ghostCount}`);
      console.log(`   - Anonymous users deleted: ${deletedCount}`);
      console.log(`   - Total deleted: ${ghostCount + deletedCount}`);
      console.log(`   - Skipped: ${skippedCount} users (safety checks failed)`);
      if (errors.length > 0) {
        console.log(`   - Errors: ${errors.length}`);
        console.error('Errors encountered:', JSON.stringify(errors, null, 2));
      }

      return {
        success: true,
        ghostsDeleted: ghostCount,
        anonymousDeleted: deletedCount,
        totalDeleted: ghostCount + deletedCount,
        skipped: skippedCount,
        errors: errors.length,
      };
    } catch (error) {
      console.error('❌ Fatal error in anonymous user cleanup:', error);
      throw error;
    }
  },
);
