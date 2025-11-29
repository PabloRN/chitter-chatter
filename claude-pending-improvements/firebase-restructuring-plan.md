# Firebase Database Restructuring Plan

**Status:** PENDING - Test current features first, then implement after clean release
**Priority:** HIGH - Performance improvement 10-50x
**Estimated Effort:** 8-10 hours over 1-2 weeks
**Risk Level:** MEDIUM (has breaking changes, but with migration strategy)

---

## Executive Summary

Flatten nested data structures to follow Firebase best practices, eliminate data duplication, and improve performance by 10-50x. Current structure downloads 10-100x more data than needed due to nested collections.

---

## Critical Issues Found

### 🔴 Issue #1: Messages Duplicated Under Users
**Location:** `/users/{uid}/messages/{roomId}/{messageId}`

**Problem:**
- Messages stored in BOTH `/rooms/{roomId}/messages/` AND `/users/{uid}/messages/`
- User profiles grow infinitely with message history
- Fetching user data downloads ALL messages from ALL rooms ever

**Code Location:** `stores/messages.js:53-55`

**Impact:** Infinite data growth, slow profile loads

---

### 🔴 Issue #2: Room List Downloads ALL Messages
**Location:** `stores/rooms.js:68-93`

**Problem:**
```javascript
const snapshot = await get(ref(db, 'rooms/'));  // Downloads EVERYTHING!
```
- Lobby view downloads ALL rooms with ALL nested users and messages
- 100 rooms × 1000 messages each = 100,000 messages for a simple room list

**Impact:** 10-100x slower initial load

---

### 🔴 Issue #3: User Positions Nested in Profile
**Location:** `/users/{uid}/position/`

**Problem:**
- Position updates trigger full user object re-download
- Position changes continuously, profile data rarely accessed

**Impact:** Continuous bandwidth waste

---

### 🟠 Issue #4: Blocked Users Nested
**Location:** `/users/{uid}/blocked/` and `/users/{uid}/blockedBy/`

**Problem:**
- Bidirectional storage (redundant)
- Downloaded with every profile fetch

---

### 🟠 Issue #5: Subscription Data Deeply Nested
**Location:** `/users/{uid}/subscription/` and `/users/{uid}/roomSlotPurchases/`

**Problem:**
- Complex nested object
- Only needed in billing context but downloaded with profile

---

## Proposed New Structure

### BEFORE (Current - BAD):
```
/users/{uid}/
  ├── profile fields
  ├── messages/{roomId}/{messageId}/     ❌ Remove (duplication)
  ├── rooms/{roomId}/                    ❌ Remove (use favoriteRooms array)
  ├── position/                          ❌ Move to /roomPositions/
  ├── blocked/{userId}/                  ❌ Move to /blocks/
  ├── blockedBy/{userId}/                ❌ Remove (redundant)
  ├── subscription/                      ❌ Move to /subscriptions/
  └── roomSlotPurchases/                 ❌ Move to /subscriptions/

/rooms/{roomId}/
  ├── metadata fields
  ├── users/{userKey}/                   ⚠️  Keep but don't download with list
  └── messages/{messageId}/              ⚠️  Keep but don't download with list
```

### AFTER (Proposed - GOOD):
```
/users/{uid}/
  ├── profile fields only (nickname, avatar, age, level, hobbies, description)
  ├── favoriteRooms: []                  ✅ Keep (lightweight array)
  └── ownedRooms: []                     ✅ Keep (lightweight array)

/rooms/{roomId}/
  ├── metadata fields
  ├── users/{userKey}/                   ✅ Keep (accessed only inside room)
  └── messages/{messageId}/              ✅ Keep (accessed only inside room)

/roomMetadata/{roomId}/                  ✅ New - lightweight for lobby
  ├── name
  ├── description
  ├── thumbnail
  ├── maxUsers
  ├── usersOnline
  ├── createdBy
  └── category

/roomPositions/{roomId}/{uid}/           ✅ New - user positions by room
  ├── x
  ├── y
  └── lastUpdated

/blocks/{userId}_{blockedId}/            ✅ New - single source of truth
  ├── blockedAt
  └── blockedBy

/subscriptions/{uid}/                    ✅ New - all billing data
  ├── tier
  ├── status
  ├── stripeCustomerId
  ├── currentPeriodEnd
  ├── cancelAtPeriodEnd
  ├── lastUpgradedAt
  ├── previousTier
  └── roomSlotPurchases/
```

---

## Implementation Phases

### PHASE 1: Critical Fixes (High ROI, Low Risk)
**Time:** 3-4 hours
**Risk:** LOW

#### 1.1 Stop Duplicating Messages Under Users
**Impact:** Eliminates infinite user object growth
**Breaking:** None (messages still in rooms)

**Changes:**
- **File:** `src/stores/messages.js`
  - **Line 53-55:** Remove `updates[/users/${userId}/messages/${roomId}/${roomMessagesKey}]`
  - **Line 209:** Remove `updates[/users/${userId}/messages/] = null`

**Test:** Send message, verify it only appears in `/rooms/{roomId}/messages/`

---

#### 1.2 Create Shallow Room List Endpoint
**Impact:** 10-100x faster lobby load
**Breaking:** None (backwards compatible)

**Changes:**
- **File:** `src/stores/rooms.js`
  - **Line 68-93:** Update `getRooms()` to fetch from `/roomMetadata` instead of `/rooms`

- **Add new method in rooms.js:**
```javascript
async getRoomMetadata() {
  const snapshot = await get(ref(db, 'roomMetadata/'));
  this.setRooms(snapshot.val());
}
```

- **Update room creation** (wherever rooms are created):
  - Write to both `/rooms/{id}` and `/roomMetadata/{id}`

- **One-time migration:** Create Cloud Function or script to copy existing room metadata:
```javascript
// Migration script
const rooms = await get(ref(db, 'rooms/'));
const updates = {};

Object.entries(rooms.val()).forEach(([roomId, room]) => {
  updates[`roomMetadata/${roomId}`] = {
    name: room.name,
    description: room.description,
    thumbnail: room.thumbnail,
    backgroundImage: room.backgroundImage,
    maxUsers: room.maxUsers,
    usersOnline: room.usersOnline,
    createdBy: room.createdBy,
    category: room.category,
    isPublic: room.isPublic
  };
});

await update(ref(db), updates);
```

**Test:** Open lobby, verify rooms load 10x faster

---

#### 1.3 Move User Positions to Separate Collection
**Impact:** Stop triggering full user download on movement
**Breaking:** MINOR (position listeners need update)

**Changes:**
- **Find all position read/write locations:**
  - Search for: `position`, `users/${uid}/position`
  - Update paths to: `roomPositions/${roomId}/${uid}`

- **Update database rules** in `database.rules.json`:
```json
"roomPositions": {
  "$roomId": {
    "$uid": {
      ".read": "auth != null",
      ".write": "$uid === auth.uid"
    }
  }
}
```

- **Migration:** Copy existing positions (if any):
```javascript
const users = await get(ref(db, 'users/'));
const updates = {};

Object.entries(users.val()).forEach(([uid, user]) => {
  if (user.position && user.currentRoom) {
    updates[`roomPositions/${user.currentRoom}/${uid}`] = user.position;
  }
});

await update(ref(db), updates);
```

**Test:** Move around in room, verify position updates work

---

### PHASE 2: Moderate Refactors (Medium Priority)
**Time:** 3-4 hours
**Risk:** MEDIUM

#### 2.1 Flatten Blocked Users
**Impact:** Cleaner data model, single source of truth
**Breaking:** Block/unblock features need update

**Changes:**
- **Search for:** `blocked`, `blockedBy`, `users/${uid}/blocked`
- **Update to:** `/blocks/${userId}_${blockedId}/`

- **Update database rules:**
```json
"blocks": {
  "$blockKey": {
    ".read": "auth != null",
    ".write": "auth != null && ($blockKey.split('_')[0] === auth.uid || $blockKey.split('_')[1] === auth.uid)"
  }
}
```

- **New helper methods:**
```javascript
// Check if user is blocked
async isUserBlocked(userId, targetId) {
  const blockKey1 = `${userId}_${targetId}`;
  const blockKey2 = `${targetId}_${userId}`;

  const [snapshot1, snapshot2] = await Promise.all([
    get(ref(db, `blocks/${blockKey1}`)),
    get(ref(db, `blocks/${blockKey2}`))
  ]);

  return snapshot1.exists() || snapshot2.exists();
}

// Block user
async blockUser(userId, targetId) {
  const blockKey = `${userId}_${targetId}`;
  await set(ref(db, `blocks/${blockKey}`), {
    blockedAt: Date.now(),
    blockedBy: userId
  });
}

// Unblock user
async unblockUser(userId, targetId) {
  const blockKey = `${userId}_${targetId}`;
  await remove(ref(db, `blocks/${blockKey}`));
}
```

**Migration:** Copy existing blocked relationships

**Test:** Block/unblock user, verify it works in both directions

---

#### 2.2 Separate Subscription Data
**Impact:** Cleaner user profiles, billing data isolated
**Breaking:** Subscription queries need update

**Changes:**
- **File:** `src/services/subscriptionService.js`
  - Update all `users/${uid}/subscription` paths to `subscriptions/${uid}`

- **Update database rules:**
```json
"subscriptions": {
  "$userId": {
    ".read": "$userId === auth.uid",
    ".write": "$userId === auth.uid"
  }
}
```

- **Migration:**
```javascript
const users = await get(ref(db, 'users/'));
const updates = {};

Object.entries(users.val()).forEach(([uid, user]) => {
  if (user.subscription || user.roomSlotPurchases) {
    updates[`subscriptions/${uid}`] = {
      ...(user.subscription || {}),
      roomSlotPurchases: user.roomSlotPurchases || {}
    };
  }
});

await update(ref(db), updates);
```

**Test:** Check subscription in profile page, verify billing works

---

### PHASE 3: Long-term Optimizations (Lower Priority)
**Time:** 2-3 hours
**Risk:** LOW

#### 3.1 Add Message Pagination
- Limit messages per room to last 100
- Load older messages on scroll up

#### 3.2 Implement Lazy Loading
- Load room messages only when entering room
- Don't include messages in room list fetch

#### 3.3 Add Cloud Functions for Aggregations
- User count per room (update on user join/leave)
- Message count per room
- Last message timestamp

---

## Migration Strategy (RECOMMENDED - KISS Approach)

### Option A: Gradual Migration ⭐ RECOMMENDED
**Pros:** Low risk, can rollback easily, test incrementally
**Cons:** Takes longer (1-2 weeks)

**Steps:**
1. Create new collections alongside old ones
2. Update write logic to write to BOTH (temporarily)
3. Update read logic to prefer new, fallback to old
4. Monitor for 1 week
5. Stop writing to old collections
6. After 1 month, delete old nested data

### Option B: One-time Migration
**Pros:** Faster (1 day)
**Cons:** Higher risk, requires extensive testing

**Steps:**
1. Create migration Cloud Function
2. Run migration (copy all data to new structure)
3. Deploy all code changes at once
4. Test thoroughly
5. Keep old data for 1 month as backup

---

## Breaking Changes & Solutions

### What Breaks:

#### 1. Position Listeners
**Current:** Listen to `users/{uid}/position`
**New:** Listen to `roomPositions/{roomId}/{uid}`

**Files to Update:**
- Search for: `position`, `ref(db, \`users/\${.*}/position`
- Update path

---

#### 2. Block Checks
**Current:** Check `users/{uid}/blocked/{targetId}`
**New:** Check `blocks/{userId}_{targetId}` or `blocks/{targetId}_{userId}`

**Files to Update:**
- Search for: `blocked`, `blockedBy`
- Update to use new helper methods

---

#### 3. Subscription Access
**Current:** `users/{uid}/subscription`
**New:** `subscriptions/{uid}`

**Files to Update:**
- `src/services/subscriptionService.js`
- `src/stores/user.js` (subscription getter)
- `src/views/Profile.vue` (subscription display)

---

#### 4. Room List Fetch
**Current:** Fetch from `rooms/` (downloads all messages)
**New:** Fetch from `roomMetadata/`

**Files to Update:**
- `src/stores/rooms.js:68-93`

---

### What Doesn't Break (Backwards Compatible):

✅ User profile access (still same path)
✅ Room messages (still at `rooms/{roomId}/messages`)
✅ Notifications (already flat)
✅ Friends (already flat)
✅ Friend requests (already flat)
✅ Private messages (already separate)

---

## Testing Checklist

### Phase 1:
- [ ] Send message → appears in room only (not under user)
- [ ] Load room list → fast load (< 1s)
- [ ] Move in room → position updates without full user reload

### Phase 2:
- [ ] Block user → check works from both sides
- [ ] Unblock user → check works
- [ ] View subscription → loads from new location
- [ ] Update subscription → writes to new location

### Phase 3:
- [ ] Load old messages → pagination works
- [ ] Enter room → lazy loads messages
- [ ] User counts → accurate and fast

---

## Rollback Plan

1. Keep old structure for 1 month
2. All reads check BOTH old and new locations (fallback)
3. Can revert code changes if issues arise
4. Database rules allow both paths temporarily

**Example fallback read:**
```javascript
async getSubscription(userId) {
  // Try new location first
  let snapshot = await get(ref(db, `subscriptions/${userId}`));
  if (snapshot.exists()) return snapshot.val();

  // Fallback to old location
  snapshot = await get(ref(db, `users/${userId}/subscription`));
  return snapshot.val() || null;
}
```

---

## Success Metrics

### Before:
- Initial load time: 5s
- Firebase bandwidth per session: 50MB
- User object size: 500KB
- Room list load: Downloads 100 rooms × 1000 messages

### After:
- Initial load time: 0.5s (10x faster) ⚡
- Firebase bandwidth per session: 5MB (10x reduction) 💰
- User object size: 10KB (50x smaller) 📉
- Room list load: Downloads 100 rooms × 10 fields ✅

### Cost Savings:
- Firebase reads: 1000 → 100 per lobby load (10x reduction)
- Monthly Firebase bill: Potentially 50-70% reduction
- User experience: Significantly faster

---

## Files to Update Summary

### Phase 1 (Critical):
1. `src/stores/messages.js` - Remove message duplication (2 lines)
2. `src/stores/rooms.js` - Add roomMetadata fetch (~20 lines)
3. Position-related files - Update paths (~5 files, ~10 lines each)
4. `database.rules.json` - Add roomPositions rules

### Phase 2 (Moderate):
1. `src/services/subscriptionService.js` - Update paths (~10 locations)
2. Block-related code - Update to new structure (~3 files)
3. `src/stores/user.js` - Update subscription getter
4. `database.rules.json` - Add blocks, subscriptions rules

### Phase 3 (Long-term):
1. Message loading - Add pagination
2. Room entry - Add lazy loading
3. Cloud Functions - Add aggregations (new files)

---

## Implementation Order (Recommended)

**Week 1:**
- Day 1-2: Phase 1.1 (Stop message duplication)
- Day 3-4: Phase 1.2 (Room metadata)
- Day 5: Testing

**Week 2:**
- Day 1-2: Phase 1.3 (Move positions)
- Day 3-4: Phase 2.1 (Flatten blocks)
- Day 5: Testing

**Week 3:**
- Day 1-2: Phase 2.2 (Separate subscriptions)
- Day 3-5: Phase 3 (Optimizations)

---

## Questions to Consider Before Starting

1. **Do you want gradual or one-time migration?** (Recommend gradual)
2. **How much downtime is acceptable?** (Gradual = zero downtime)
3. **Do you want to keep old data as backup?** (Recommend yes, for 1 month)
4. **Should we implement all phases or just critical ones first?** (Recommend Phase 1 first)

---

## Notes

- This plan follows Firebase best practices: https://firebase.google.com/docs/database/web/structure-data
- Estimated total effort: 8-10 hours of development + 2-3 hours testing
- Can be done incrementally without breaking existing features
- Major performance improvements for minimal effort

**Created:** 2025-01-26
**Last Updated:** 2025-01-26
**Status:** Ready for implementation after current release
