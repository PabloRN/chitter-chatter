const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

// Define system admin UID for room transfers
const SYSTEM_ADMIN_UID = 'SYSTEM_ADMIN';

/**
 * Approve and execute a pending account deletion
 * Can be called by admin to manually process deletion requests
 *
 * Usage:
 * curl -X POST https://REGION-PROJECT.cloudfunctions.net/approvePendingDeletion \
 *   -H "Content-Type: application/json" \
 *   -d '{"userId": "USER_ID_HERE"}'
 */
exports.approvePendingDeletion = onRequest(
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

    try {
      const { userId } = req.body;

      if (!userId) {
        res.status(400).json({ error: 'userId is required' });
        return;
      }

      console.log(`🔍 Approving pending deletion for user: ${userId}`);

      const db = admin.database();
      const userRef = db.ref(`users/${userId}`);
      const userSnapshot = await userRef.once('value');
      const userData = userSnapshot.val();

      if (!userData) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Check if user has pending deletion request
      if (userData.deletionStatus !== 'pending_review') {
        res.status(400).json({
          error: 'User does not have a pending deletion request',
          currentStatus: userData.deletionStatus || 'none',
        });
        return;
      }

      // Get user auth data
      let authUser;
      try {
        authUser = await admin.auth().getUser(userId);
      } catch (authError) {
        console.error('User not found in Firebase Auth:', authError);
        // Continue anyway - we can still clean up database
      }

      console.log(`✅ Pending deletion found. Processing deletion for ${userId}...`);

      // Update archive with approval info
      const archiveRef = db.ref(`deletedUsers/${userId}`);
      const archiveSnapshot = await archiveRef.once('value');
      if (archiveSnapshot.exists()) {
        await archiveRef.update({
          approvedAt: admin.database.ServerValue.TIMESTAMP,
          approvedBy: 'admin',
        });
      }

      // Transfer room ownership if user owns rooms
      const transferredRooms = await transferRoomOwnership(userId, userData);

      // IMPORTANT: Cancel onDisconnect handler BEFORE deleting
      // This prevents ghost user creation when disconnect fires after deletion
      await admin.database().ref(`users/${userId}`).onDisconnect().cancel();
      console.log(`✅ Cancelled onDisconnect handler for ${userId}`);

      // Delete from Realtime Database
      await userRef.remove();
      console.log(`✅ Deleted ${userId} from Realtime Database`);

      // Delete from Firebase Authentication
      if (authUser) {
        try {
          await admin.auth().deleteUser(userId);
          console.log(`✅ Deleted ${userId} from Firebase Authentication`);
        } catch (authError) {
          console.error(`Error deleting from Auth:`, authError);
        }
      }

      // Send completion notification to admin
      const sendDeletionNotification = require('../email/sendDeletionNotification');
      await sendDeletionNotification.sendEmail({
        type: 'instant',
        userId,
        userEmail: authUser?.email || 'N/A',
        userData,
        transferredRooms,
      });

      // Send confirmation email to user
      if (authUser?.email) {
        const sendDeletionConfirmation = require('../email/sendDeletionConfirmation');
        await sendDeletionConfirmation.sendEmail(authUser.email, {
          userId,
          deletionType: 'instant',
        });
      }

      res.status(200).json({
        success: true,
        message: 'User account deleted successfully',
        userId,
        transferredRooms: transferredRooms.length,
      });
    } catch (error) {
      console.error('❌ Error approving deletion:', error);
      res.status(500).json({
        error: 'Failed to approve deletion',
        message: error.message,
      });
    }
  },
);

/**
 * Transfer room ownership to system admin
 * @returns {Array} Array of transferred room IDs
 */
async function transferRoomOwnership(userId, userData) {
  const db = admin.database();
  const transferredRooms = [];

  if (!userData.ownedRooms || !Array.isArray(userData.ownedRooms) || userData.ownedRooms.length === 0) {
    return transferredRooms;
  }

  console.log(`🏠 Transferring ${userData.ownedRooms.length} rooms to system admin`);

  for (const roomId of userData.ownedRooms) {
    try {
      const roomRef = db.ref(`rooms/${roomId}`);
      const roomSnapshot = await roomRef.once('value');

      if (roomSnapshot.exists()) {
        // Update room owner to system admin
        await roomRef.update({
          createdBy: SYSTEM_ADMIN_UID,
          ownerTransferred: true,
          ownerTransferredAt: admin.database.ServerValue.TIMESTAMP,
          previousOwner: userId,
        });

        transferredRooms.push(roomId);
        console.log(`✅ Transferred room ${roomId} to system admin`);
      }
    } catch (error) {
      console.error(`❌ Error transferring room ${roomId}:`, error);
    }
  }

  return transferredRooms;
}
