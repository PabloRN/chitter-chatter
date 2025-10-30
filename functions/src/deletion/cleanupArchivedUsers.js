const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');

/**
 * Scheduled function to permanently delete archived user data
 * Runs daily at 2:00 AM EST
 * Deletes archived users older than 30 days (GDPR compliance)
 */
exports.cleanupArchivedUsers = onSchedule(
  {
    schedule: '0 2 * * *', // Every day at 2:00 AM
    region: 'us-central1',
    timeZone: 'America/New_York',
  },
  async (event) => {
    console.log('🗑️ Starting archived user cleanup task...');

    const db = admin.database();
    const now = Date.now();

    try {
      // Get all archived users
      const deletedUsersRef = db.ref('deletedUsers');
      const snapshot = await deletedUsersRef.once('value');

      if (!snapshot.exists()) {
        console.log('No archived users found');
        return null;
      }

      const deletedUsers = snapshot.val();
      let permanentlyDeletedCount = 0;
      let skippedCount = 0;
      const errors = [];

      // Process each archived user
      for (const [userId, archiveData] of Object.entries(deletedUsers)) {
        try {
          const permanentDeletionDate = archiveData.permanentDeletionDate;

          // Check if 30 days have passed
          if (now >= permanentDeletionDate) {
            console.log(`🗑️ Permanently deleting archived user ${userId}`);

            // Delete from deletedUsers archive
            await db.ref(`deletedUsers/${userId}`).remove();
            permanentlyDeletedCount++;

            console.log(`✅ Permanently deleted ${userId} from archives`);
          } else {
            // Not yet time to delete
            const daysRemaining = Math.ceil((permanentDeletionDate - now) / (24 * 60 * 60 * 1000));
            console.log(`⏳ Skipping ${userId}: ${daysRemaining} days remaining until permanent deletion`);
            skippedCount++;
          }
        } catch (error) {
          console.error(`❌ Error processing archived user ${userId}:`, error);
          errors.push({ userId, error: error.message });
        }
      }

      console.log(`✅ Archived user cleanup completed:`);
      console.log(`   - Permanently deleted: ${permanentlyDeletedCount} users`);
      console.log(`   - Skipped (not ready): ${skippedCount} users`);
      if (errors.length > 0) {
        console.log(`   - Errors: ${errors.length}`);
        console.error('Errors encountered:', JSON.stringify(errors, null, 2));
      }

      return {
        success: true,
        permanentlyDeleted: permanentlyDeletedCount,
        skipped: skippedCount,
        errors: errors.length,
      };
    } catch (error) {
      console.error('❌ Fatal error in archived user cleanup:', error);
      throw error;
    }
  },
);
