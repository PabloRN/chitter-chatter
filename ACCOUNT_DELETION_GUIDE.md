# Account Deletion System - Complete Guide

## ✅ Deployment Status

All functions have been successfully deployed:

### New Functions Created:
1. **requestAccountDeletion** - Main deletion handler
   - URL: `https://us-central1-chitter-chatter-f762a.cloudfunctions.net/requestAccountDeletion`

2. **cleanupArchivedUsers** - Scheduled (daily at 2 AM)
   - Permanently deletes archives after 30 days

3. **approvePendingDeletion** - Admin approval endpoint
   - URL: `https://us-central1-chitter-chatter-f762a.cloudfunctions.net/approvePendingDeletion`

4. **manualCleanupNow** - Manual anonymous user cleanup
   - URL: `https://us-central1-chitter-chatter-f762a.cloudfunctions.net/manualCleanupNow`

---

## 🎯 How It Works

### Hybrid Approach:

**Instant Deletion** (Automatic):
- ✅ User has free tier (no subscription)
- ✅ User owns rooms → Rooms transferred to system admin
- ✅ User deleted from Database + Authentication
- ✅ Data archived for 30 days

**Admin Review Required**:
- ⚠️ User has active subscription (Landlord or Creator)
- ⚠️ Complex account issues
- 📧 Email sent to you (toonstalk.contact@gmail.com)
- ⏳ You approve manually within 24 hours

---

## 📧 Email Notifications

You'll receive 2 types of emails at **toonstalk.contact@gmail.com**:

### Type 1: Instant Deletion (FYI)
```
Subject: ✅ Account Deleted - user@example.com

Details:
- User ID
- Subscription Tier: Free
- Rooms Transferred: 2
- Data Archived Until: [Date + 30 days]
- Status: No action required
```

### Type 2: Admin Review (ACTION REQUIRED)
```
Subject: 🔔 Account Deletion Review Required - user@example.com

Details:
- User ID
- Subscription Tier: Landlord/Creator
- Subscription Ends: [Date]
- Review Reason: Active subscription
- Action Required: Review within 24 hours
- Links: Stripe Dashboard, Firebase Console
```

---

## 🧪 Testing Instructions

### Test 1: Instant Deletion (Free User)

1. **Create Test User:**
   - Register a new account
   - Stay on free tier (don't subscribe)
   - Optionally create 1-2 rooms

2. **Delete Account:**
   - Go to Profile → Scroll to bottom
   - Click "Delete Account" button
   - Confirm in dialog
   - ✅ Should see success message: "Your account has been deleted successfully."
   - ✅ Automatically signed out

3. **Verify Deletion:**
   - **Firebase Database**: User should be gone from `/users/`
   - **Firebase Auth**: User should be deleted
   - **Firebase Database**: Check `/deletedUsers/` → User archived for 30 days
   - **Your Email**: Should receive "✅ Account Deleted" notification

4. **Verify Room Transfer:**
   - Check rooms owned by deleted user
   - Should show `createdBy: "SYSTEM_ADMIN"`
   - Should have `ownerTransferred: true`

---

### Test 2: Admin Review (Subscribed User)

1. **Create Subscribed User:**
   - Register new account
   - Subscribe to Landlord or Creator
   - Active subscription should exist

2. **Request Deletion:**
   - Go to Profile → Click "Delete Account"
   - Confirm in dialog
   - ✅ Should see: "Your deletion request has been submitted for review."

3. **Verify Request:**
   - **Firebase Database**: User still exists
   - User should have:
     - `deletionRequested: [timestamp]`
     - `deletionStatus: "pending_review"`
   - **Your Email**: Should receive "🔔 Action Required" email

4. **Approve Deletion Manually:**
   ```bash
   curl -X POST https://us-central1-chitter-chatter-f762a.cloudfunctions.net/approvePendingDeletion \
     -H "Content-Type: application/json" \
     -d '{"userId": "USER_ID_HERE"}'
   ```

5. **Verify Approval:**
   - User deleted from Database + Auth
   - User archived in `/deletedUsers/`
   - Admin receives "✅ Account Deleted" email
   - User receives deletion confirmation email

---

### Test 3: 30-Day Archive Cleanup

**Automatic (Scheduled):**
- Runs daily at 2:00 AM EST
- Checks all archived users
- Permanently deletes archives older than 30 days

**Manual Trigger (For Testing):**
```bash
# Firebase CLI
firebase functions:shell
# Then type:
cleanupArchivedUsers({})
```

**Or wait for scheduled run and check logs:**
```bash
firebase functions:log --only cleanupArchivedUsers
```

---

## 🔧 Manual Admin Operations

### 1. Manually Delete User (Bypass Checks)
```bash
curl -X POST https://us-central1-chitter-chatter-f762a.cloudfunctions.net/approvePendingDeletion \
  -H "Content-Type: application/json" \
  -d '{"userId": "USER_UID_HERE"}'
```

### 2. Check Pending Deletions
Go to Firebase Database:
```
/users/
  Look for users with:
    - deletionRequested: [timestamp]
    - deletionStatus: "pending_review"
```

### 3. View Archived Users
```
/deletedUsers/
  - Each archived user
  - Includes full user data
  - Shows permanentDeletionDate
```

### 4. Manually Clean Anonymous Users
```bash
curl -X POST https://us-central1-chitter-chatter-f762a.cloudfunctions.net/manualCleanupNow
```

---

## ⚠️ Important Notes

### System Admin UID
Currently set to: `SYSTEM_ADMIN`

**To Update:**
Edit these files and change `SYSTEM_ADMIN_UID`:
- `functions/src/deletion/requestAccountDeletion.js` (line 5)
- `functions/src/deletion/approvePendingDeletion.js` (line 5)

**Options:**
1. Create a dedicated system user in Firebase Auth
2. Use your actual admin user UID
3. Keep as `SYSTEM_ADMIN` (symbolic only)

### GDPR Compliance
- ✅ Users can request deletion (self-service)
- ✅ Deleted within 30 days maximum
- ✅ Data removed from all systems
- ✅ Confirmation emails sent
- ✅ Right to be forgotten honored

### Data Retention
- **30-day archive**: Allows mistake recovery
- **Permanent deletion**: After 30 days, completely gone
- **Room messages**: Kept (anonymized) or customize in code

---

## 📊 Monitoring & Logs

### View Deletion Logs:
```bash
# All deletion activity
firebase functions:log --only requestAccountDeletion

# Archive cleanup
firebase functions:log --only cleanupArchivedUsers

# Admin approvals
firebase functions:log --only approvePendingDeletion
```

### Or in Firebase Console:
https://console.firebase.google.com/project/chitter-chatter-f762a/functions/logs

---

## 🚨 Troubleshooting

### Issue: "User not authenticated" error
**Fix**: User must be logged in. Check Firebase Auth token.

### Issue: Deletion works but no email
**Check:**
1. Email exists in Firebase Auth for that user
2. GMAIL credentials in `.env.chitter-chatter-f762a`
3. Function logs for email sending errors

### Issue: Rooms not transferring
**Check:**
1. `SYSTEM_ADMIN_UID` is set correctly
2. User actually owns rooms (check `ownedRooms` array)
3. Room documents exist in `/rooms/`

### Issue: 30-day cleanup not running
**Check:**
1. Cloud Scheduler is enabled
2. Function logs for scheduled execution
3. Schedule syntax: `0 2 * * *` (2 AM daily)

---

## 🎓 User Flow Examples

### Example 1: Simple Free User
```
User clicks Delete Account
  ↓
Instant deletion
  ↓
- Rooms transferred to SYSTEM_ADMIN
- User deleted from DB + Auth
- Data archived for 30 days
- Emails sent (user + admin)
  ↓
User signed out automatically
```

### Example 2: Subscribed User
```
User clicks Delete Account
  ↓
System detects active subscription
  ↓
- Mark as "pending_review"
- Send admin email (ACTION REQUIRED)
- Send user email (We're reviewing...)
  ↓
Admin reviews within 24 hours
  ↓
Admin calls approvePendingDeletion
  ↓
- Cancel subscription (if needed)
- Delete account
- Archive data
- Send confirmation emails
```

---

## 📝 Quick Checklist

Before going live, verify:
- [ ] Test instant deletion (free user)
- [ ] Test admin review (subscribed user)
- [ ] Verify email notifications work
- [ ] Check room transfers work
- [ ] Confirm archiving works
- [ ] Test 30-day cleanup (manual trigger)
- [ ] Update SYSTEM_ADMIN_UID if needed
- [ ] Verify GDPR compliance
- [ ] Document for your team

---

## 🆘 Emergency Recovery

**If user deleted by mistake (within 30 days):**

1. Find user in `/deletedUsers/{userId}`
2. Copy user data
3. Recreate user in Firebase Auth:
   ```javascript
   await admin.auth().createUser({
     uid: originalUserId,
     email: archivedData.authData.email,
     // ... other fields
   });
   ```
4. Restore to `/users/{userId}`
5. Remove from `/deletedUsers/`

**After 30 days:**
- Data is permanently deleted
- Cannot be recovered
- This is by design (GDPR compliance)

---

## 📞 Support

For questions or issues:
- Check Firebase logs first
- Review error messages
- Test with different user types
- Contact: toonstalk.contact@gmail.com

---

**System Status:** ✅ All deployed and ready to test!
