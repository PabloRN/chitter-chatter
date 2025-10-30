const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

// Define system admin UID for room transfers
// TODO: Update this with your actual admin user UID or create a dedicated system user
const SYSTEM_ADMIN_UID = 'SYSTEM_ADMIN';

/**
 * Request account deletion
 * Implements hybrid approach:
 * - Instant deletion for simple cases (free tier, no active subscription)
 * - Admin review for complex cases (active subscription, special circumstances)
 */
exports.requestAccountDeletion = onRequest(
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

      // Verify authentication
      const idToken = req.headers.authorization?.split('Bearer ')[1];
      if (!idToken) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const decodedToken = await admin.auth().verifyIdToken(idToken);
      if (decodedToken.uid !== userId) {
        res.status(403).json({ error: 'Forbidden: Can only delete your own account' });
        return;
      }

      console.log(`🗑️ Account deletion requested for user: ${userId}`);

      // Get user data from database
      const db = admin.database();
      const userRef = db.ref(`users/${userId}`);
      const userSnapshot = await userRef.once('value');
      const userData = userSnapshot.val();

      if (!userData) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Get user auth data
      const authUser = await admin.auth().getUser(userId);

      // Check if user qualifies for instant deletion
      const canInstantDelete = await checkInstantDeletionEligibility(userData, authUser);

      if (canInstantDelete.eligible) {
        // INSTANT DELETION PATH
        console.log(`✅ User ${userId} qualifies for instant deletion`);

        // Archive user data first (30-day retention)
        await archiveUserData(userId, userData, authUser, 'user_request');

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
        await admin.auth().deleteUser(userId);
        console.log(`✅ Deleted ${userId} from Firebase Authentication`);

        // Send notification email to admin (FYI)
        const sendDeletionNotification = require('../email/sendDeletionNotification');
        await sendDeletionNotification.sendEmail({
          type: 'instant',
          userId,
          userEmail: authUser.email,
          userData,
          transferredRooms,
        });

        // Send confirmation email to user
        if (authUser.email) {
          const sendDeletionConfirmation = require('../email/sendDeletionConfirmation');
          await sendDeletionConfirmation.sendEmail(authUser.email, {
            userId,
            deletionType: 'instant',
          });
        }

        res.status(200).json({
          success: true,
          deletionType: 'instant',
          message: 'Your account has been deleted successfully.',
        });
      } else {
        // ADMIN REVIEW PATH
        console.log(`⏳ User ${userId} requires admin review: ${canInstantDelete.reason}`);

        // Mark user for deletion review
        await userRef.update({
          deletionRequested: admin.database.ServerValue.TIMESTAMP,
          deletionStatus: 'pending_review',
          deletionReason: canInstantDelete.reason,
        });

        // Archive user data
        await archiveUserData(userId, userData, authUser, 'pending_review');

        // Send notification email to admin (ACTION REQUIRED)
        const sendDeletionNotification = require('../email/sendDeletionNotification');
        await sendDeletionNotification.sendEmail({
          type: 'review_required',
          userId,
          userEmail: authUser.email,
          userData,
          reason: canInstantDelete.reason,
        });

        // Send pending confirmation to user
        if (authUser.email) {
          const sendDeletionConfirmation = require('../email/sendDeletionConfirmation');
          await sendDeletionConfirmation.sendEmail(authUser.email, {
            userId,
            deletionType: 'pending_review',
            reason: canInstantDelete.reason,
          });
        }

        res.status(200).json({
          success: true,
          deletionType: 'pending_review',
          message: 'Your deletion request has been submitted. We will review it within 24 hours and send you a confirmation email.',
          reason: canInstantDelete.reason,
        });
      }
    } catch (error) {
      console.error('❌ Error processing deletion request:', error);
      res.status(500).json({
        error: 'Failed to process deletion request',
        message: error.message,
      });
    }
  },
);

/**
 * Check if user qualifies for instant deletion
 * @returns {Object} { eligible: boolean, reason: string }
 */
async function checkInstantDeletionEligibility(userData, authUser) {
  // Check 1: Must have free tier (no active subscription)
  const subscriptionTier = userData.subscriptionTier || userData.subscription?.tier || 'free';
  if (subscriptionTier !== 'free') {
    return {
      eligible: false,
      reason: `Active ${subscriptionTier} subscription. Please cancel your subscription first or we will review your request.`,
    };
  }

  // Check 2: Must not be anonymous (anonymous users shouldn't reach here anyway)
  if (userData.isAnonymous) {
    return {
      eligible: false,
      reason: 'Anonymous users require special handling',
    };
  }

  // Check 3: Account should exist for more than 7 days (fraud prevention)
  // This is optional - you can remove if not needed
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const accountCreated = authUser.metadata.creationTime;
  if (new Date(accountCreated).getTime() > sevenDaysAgo) {
    // Allow instant deletion even for new accounts (commenting out this check)
    // Uncomment below if you want to enforce 7-day waiting period
    // return {
    //   eligible: false,
    //   reason: 'Account is less than 7 days old. Please contact support.',
    // };
  }

  // All checks passed - eligible for instant deletion
  return {
    eligible: true,
    reason: null,
  };
}

/**
 * Archive user data for 30-day retention
 */
async function archiveUserData(userId, userData, authUser, reason) {
  const db = admin.database();
  const thirtyDaysFromNow = Date.now() + (30 * 24 * 60 * 60 * 1000);

  // Helper function to remove undefined values
  const removeUndefined = (obj) => {
    const cleaned = {};
    Object.keys(obj).forEach((key) => {
      if (obj[key] !== undefined) {
        cleaned[key] = obj[key];
      }
    });
    return cleaned;
  };

  // Create authData with only defined values (Firebase doesn't allow undefined)
  const authData = removeUndefined({
    email: authUser.email,
    displayName: authUser.displayName,
    photoURL: authUser.photoURL,
    createdAt: authUser.metadata.creationTime,
    lastSignIn: authUser.metadata.lastSignInTime,
  });

  const archiveData = {
    userData: userData,
    authData,
    deletedAt: admin.database.ServerValue.TIMESTAMP,
    permanentDeletionDate: thirtyDaysFromNow,
    deletedBy: 'user',
    reason,
    status: 'archived',
  };

  await db.ref(`deletedUsers/${userId}`).set(archiveData);
  console.log(`📦 Archived user data for ${userId} (30-day retention)`);
}

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
