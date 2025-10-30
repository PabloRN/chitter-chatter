const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

/**
 * On-demand function to remove ghost users
 * Ghost users are user records that only have onlineState and status fields,
 * created when onDisconnect fires after the user was deleted.
 *
 * This function should be called manually or scheduled as needed to clean up existing ghosts.
 *
 * A ghost user is identified by:
 * - Having ONLY 2-3 fields: onlineState, status, (optionally userId)
 * - onlineState is false
 * - status is 'offline'
 * - No other meaningful user data
 *
 * Can be called via HTTP:
 * curl -X POST https://REGION-PROJECT.cloudfunctions.net/removeGhostUsers \
 *   -H "Content-Type: application/json" \
 *   -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
 */
exports.removeGhostUsers = onRequest(
  {
    region: 'us-central1',
    cors: true,
  },
  async (req, res) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    // Optional: Add authentication check here
    // const idToken = req.headers.authorization?.split('Bearer ')[1];
    // if (!idToken) {
    //   res.status(401).json({ error: 'Unauthorized' });
    //   return;
    // }

    console.log('🧹 Starting ghost user removal task...');

    const db = admin.database();
    const auth = admin.auth();

    try {
      // Get all users from Realtime Database
      const usersRef = db.ref('users');
      const snapshot = await usersRef.once('value');

      if (!snapshot.exists()) {
        console.log('No users found in database');
        res.status(200).json({
          success: true,
          message: 'No users found in database',
          deleted: 0,
        });
        return;
      }

      const users = snapshot.val();
      let deletedCount = 0;
      let skippedCount = 0;
      const ghostUsers = [];
      const errors = [];

      // Process each user
      for (const [userId, userData] of Object.entries(users)) {
        try {
          // Check if this is a ghost user
          const userFields = Object.keys(userData);

          // A ghost user typically has only these fields
          const ghostFields = ['onlineState', 'status', 'userId'];
          const hasOnlyGhostFields = userFields.every((field) => ghostFields.includes(field));

          // Must have very few fields (2-3 max)
          const hasMinimalFields = userFields.length <= 3;

          // Must be offline
          const isOffline = userData.onlineState === false && userData.status === 'offline';

          // Check if this is a ghost user
          if (hasOnlyGhostFields && hasMinimalFields && isOffline) {
            console.log(`👻 Found ghost user ${userId} with fields: ${userFields.join(', ')}`);
            ghostUsers.push(userId);

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
                console.warn(`⚠️ Could not delete ${userId} from Auth: ${authError.message}`);
              }
            }

            deletedCount++;
          } else {
            // Not a ghost user - skip
            skippedCount++;
          }
        } catch (userError) {
          console.error(`❌ Error processing user ${userId}:`, userError);
          errors.push({ userId, error: userError.message });
        }
      }

      const result = {
        success: true,
        message: `Ghost user removal completed`,
        deleted: deletedCount,
        skipped: skippedCount,
        ghostUsers: ghostUsers.length > 0 ? ghostUsers : undefined,
        errors: errors.length > 0 ? errors : undefined,
      };

      console.log(`✅ Ghost user removal completed:`);
      console.log(`   - Deleted: ${deletedCount} ghost users`);
      console.log(`   - Skipped: ${skippedCount} regular users`);
      if (errors.length > 0) {
        console.log(`   - Errors: ${errors.length}`);
      }

      res.status(200).json(result);
    } catch (error) {
      console.error('❌ Fatal error in ghost user removal:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },
);
