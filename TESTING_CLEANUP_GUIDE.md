# Testing & Manual Cleanup Guide

## 1. Test Subscription Replacement (No More Duplicates)

### Steps:
1. **Subscribe to Landlord Monthly**
   - Go to /pricing
   - Click "Subscribe" on Landlord plan
   - Complete Stripe checkout
   - ✅ Check: You should have ONE active subscription in Stripe

2. **Try to Subscribe to Creator While Landlord is Active**
   - Go back to /pricing
   - Click "Subscribe" on Creator plan
   - ✅ Expected: See "Subscription updated successfully!" message (NO checkout page)
   - ✅ Check Stripe Dashboard: Still only ONE subscription, now for Creator tier

3. **Cancel and Re-subscribe**
   - Go to Profile → "Manage Subscription"
   - Cancel your subscription (it will end at period end)
   - While still in the current period, go to /pricing and subscribe to same tier
   - ✅ Expected: "Subscription updated successfully!" (it reactivates the existing one)
   - ✅ Check Stripe: Still only ONE subscription

### What This Fixes:
Before: Each subscribe created a NEW subscription → accumulation in portal
After: Updates the EXISTING subscription → clean portal, no duplicates

---

## 2. Test Anonymous User Cleanup

### Automatic Cleanup (Every 30 Minutes):
The `cleanupAnonymousUsers` function runs automatically every 30 minutes via Cloud Scheduler.

**What it does:**
- Finds anonymous users that are offline for 30+ minutes
- Verifies 7 safety checks (no rooms, no subscriptions, truly anonymous, etc.)
- Deletes from BOTH Firebase Realtime Database AND Firebase Authentication

### Manual Testing (Don't Wait 30 Minutes):

#### Option A: Firebase CLI (Recommended)
```bash
# Call the scheduled function manually
firebase functions:shell

# In the shell, type:
cleanupAnonymousUsers({})
```

#### Option B: Create a Test HTTP Trigger (Quick Test)
Add a temporary HTTP endpoint to test:

```javascript
// Add to functions/src/cleanup/cleanupAnonymousUsers.js
exports.cleanupAnonymousUsersManual = onRequest(
  { region: 'us-central1', cors: true },
  async (req, res) => {
    // Copy the cleanup logic here and call it
    // This way you can trigger via HTTP instead of waiting for schedule
  }
);
```

#### Option C: Trigger via Cloud Console
1. Go to: https://console.firebase.google.com/project/chitter-chatter-f762a/functions
2. Find `cleanupAnonymousUsers` function
3. Click the 3-dot menu → "View in Cloud Console"
4. In Cloud Console, you can trigger it manually under "Testing" tab

#### Option D: Modify Schedule Temporarily (For Testing)
```javascript
// In cleanupAnonymousUsers.js, change schedule to:
schedule: 'every 5 minutes',  // Instead of 'every 30 minutes'
```
Then redeploy:
```bash
firebase deploy --only functions:cleanupAnonymousUsers
```
Wait 5 minutes, check logs, then change back to 30 minutes.

---

## 3. Manual Anonymous User Cleanup (One-Time)

### Create Anonymous Test Users:
1. Open incognito window
2. Visit your site (anonymous user created automatically)
3. Join a room (optional)
4. Close the browser
5. Repeat 5-10 times to create multiple test anonymous users

### Check Current Anonymous Users in Database:
Go to: https://console.firebase.google.com/project/chitter-chatter-f762a/database
- Navigate to `users/`
- Look for users with `isAnonymous: true` and `onlineState: false`

### Check Firebase Authentication Table:
Go to: https://console.firebase.google.com/project/chitter-chatter-f762a/authentication/users
- You'll see anonymous users (no email, no provider)

### Run Manual Cleanup:

#### Best Method: Create One-Time Cleanup Script

Create this file to test cleanup NOW (without waiting 30 min):

**functions/src/cleanup/manualCleanupNow.js:**
```javascript
const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

/**
 * TESTING ONLY: Manual cleanup of anonymous users
 * Ignores the 30-minute wait time for testing purposes
 */
exports.manualCleanupNow = onRequest(
  { region: 'us-central1', cors: true },
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
        res.status(200).json({ success: true, message: 'No users found', deleted: 0 });
        return;
      }

      const users = snapshot.val();
      let deletedCount = 0;
      let skippedCount = 0;
      const errors = [];

      for (const [userId, userData] of Object.entries(users)) {
        try {
          // Check if anonymous
          if (userData.isAnonymous !== true) {
            continue;
          }

          // Check if offline
          if (userData.onlineState !== false || userData.status !== 'offline') {
            skippedCount++;
            continue;
          }

          // Safety: Must have free tier
          if (userData.subscriptionTier !== 'free' && userData.subscriptionTier !== undefined) {
            console.log(`⚠️ Skipping ${userId}: Has subscription ${userData.subscriptionTier}`);
            skippedCount++;
            continue;
          }

          // Safety: Must not own rooms
          if (userData.ownedRooms && Array.isArray(userData.ownedRooms) && userData.ownedRooms.length > 0) {
            console.log(`⚠️ Skipping ${userId}: Owns ${userData.ownedRooms.length} rooms`);
            skippedCount++;
            continue;
          }

          // Safety: Must not be in rooms
          if (userData.rooms && Object.keys(userData.rooms).length > 0) {
            console.log(`⚠️ Skipping ${userId}: In ${Object.keys(userData.rooms).length} rooms`);
            skippedCount++;
            continue;
          }

          // Verify in Auth
          let authUserIsAnonymous = false;
          try {
            const authUser = await auth.getUser(userId);
            authUserIsAnonymous = authUser.providerData.length === 0;
          } catch (authError) {
            console.log(`⚠️ User ${userId} not found in Auth`);
            authUserIsAnonymous = true;
          }

          if (!authUserIsAnonymous) {
            console.log(`⚠️ Skipping ${userId}: Not anonymous in Auth`);
            skippedCount++;
            continue;
          }

          // DELETE - all checks passed
          console.log(`✅ Deleting anonymous user ${userId}`);

          // Delete from Database
          await db.ref(`users/${userId}`).remove();

          // Delete from Auth
          try {
            await auth.deleteUser(userId);
            console.log(`✅ Deleted ${userId} from Auth`);
          } catch (authError) {
            if (authError.code !== 'auth/user-not-found') {
              console.error(`❌ Auth delete error for ${userId}:`, authError.message);
            }
          }

          deletedCount++;
        } catch (error) {
          console.error(`❌ Error processing ${userId}:`, error);
          errors.push({ userId, error: error.message });
        }
      }

      const result = {
        success: true,
        deleted: deletedCount,
        skipped: skippedCount,
        errors: errors.length > 0 ? errors : undefined,
      };

      console.log(`✅ Manual cleanup completed: Deleted ${deletedCount}, Skipped ${skippedCount}`);
      res.status(200).json(result);
    } catch (error) {
      console.error('❌ Fatal error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);
```

**Add to functions/index.js:**
```javascript
const { manualCleanupNow } = require('./src/cleanup/manualCleanupNow');
exports.manualCleanupNow = manualCleanupNow;
```

**Deploy:**
```bash
firebase deploy --only functions:manualCleanupNow
```

**Call it:**
```bash
curl -X POST https://us-central1-chitter-chatter-f762a.cloudfunctions.net/manualCleanupNow
```

---

## 4. Test Ghost User Cleanup

### Create Ghost Users (Reproduce the Bug - Old Code):
Ghost users are created when onDisconnect fires AFTER user deletion. With our fix, NEW ghost users shouldn't be created, but you might have OLD ones.

### Check for Existing Ghost Users:
Go to Firebase Database → users/
Look for users with ONLY these fields:
- `onlineState: false`
- `status: "offline"`
- (optionally `userId`)

### Clean Up Ghost Users:
```bash
curl -X POST https://us-central1-chitter-chatter-f762a.cloudfunctions.net/removeGhostUsers
```

**Response:**
```json
{
  "success": true,
  "message": "Ghost user removal completed",
  "deleted": 5,
  "skipped": 120,
  "ghostUsers": ["uid1", "uid2", "uid3"]
}
```

---

## 5. Monitoring & Logs

### View Cleanup Logs:
```bash
# View cleanupAnonymousUsers logs
firebase functions:log --only cleanupAnonymousUsers

# View all function logs
firebase functions:log
```

### Or in Console:
https://console.firebase.google.com/project/chitter-chatter-f762a/functions/logs

### What to Look For:
```
✅ Anonymous user cleanup completed:
   - Deleted: 3 users
   - Skipped: 15 users (safety checks failed)
```

---

## Quick Testing Checklist

- [ ] **Subscription Test**: Subscribe → Cancel → Re-subscribe (should update, not create new)
- [ ] **Anonymous Cleanup Test**: Create anon user → Disconnect → Run manual cleanup → Verify deleted from Database & Auth
- [ ] **Ghost Cleanup Test**: Run removeGhostUsers → Check logs for deleted count
- [ ] **Safety Test**: Create anon user in a room → Run cleanup → Verify NOT deleted (safety check works)
- [ ] **Email Test**: Subscribe → Check toonstalk.contact@gmail.com for admin notification

---

## Important Notes

### The Cleanup Function DOES Clean Authentication Table!
Looking at the code:
```javascript
// Delete from Firebase Auth (if exists)
try {
  await auth.deleteUser(userId);
  console.log(`✅ Deleted ${userId} from Firebase Auth`);
```

Both `cleanupAnonymousUsers` and `removeGhostUsers` delete from:
1. ✅ Firebase Realtime Database
2. ✅ Firebase Authentication

### Schedule Information:
- **cleanupAnonymousUsers**: Runs every 30 minutes automatically
- **removeGhostUsers**: On-demand only (call manually when needed)

### Safety First:
The cleanup functions have EXTENSIVE safety checks. They will NOT delete:
- Users who own rooms
- Users currently in rooms
- Users with active subscriptions
- Users with linked providers (Google, email, etc.)
- Users who are online

### Temporary Test Function:
After testing, you can remove `manualCleanupNow` function to keep your codebase clean:
```bash
# Delete the function
firebase functions:delete manualCleanupNow
```
