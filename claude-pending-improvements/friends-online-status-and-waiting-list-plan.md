# Friends Online Status + Waiting List Implementation Plan

**Status:** PENDING - Saved for future implementation
**Priority:** HIGH - User-requested features for social connectivity
**Risk Level:** LOW - Additive features with no breaking changes
**Estimated Effort:** 4-5 days

---

## Executive Summary

Implement two interconnected social features to enhance user engagement:

1. **Friends Online Status**: Show which friends are online and their current room with direct join capability
2. **Waiting List System**: Allow users to join a FIFO queue when rooms are full, with automatic notifications

Both features use efficient bidirectional updates and Firebase real-time listeners to minimize database calls.

---

## User Requirements

### From User Discussion:

- "I want you to show in this list if the user is online and if it is in a room i can go directly to this room"
- "I was thinking on a way everytime a user logins and or enter a room, this status updates in the friends list"
- "Because the list of friends is in two ways I can check in my friends and update my status on this list for them"
- "Think in a good way that is not too complicate and doesn't cost too many calls"
- "let's create a waiting list that when user finds room full instead he seems enter he can see add me to waiting list"
- "For both, thumbnail click and icon to enter and for the new feature on list friends"

### Key Constraints:

- Minimize database calls
- Use bidirectional updates (user updates their presence in all friends' lists)
- Apply waiting list to both RoomThumbnail AND FriendsList
- Efficient O(1) operations where possible

---

## Feature 1: Friends Online Status + Direct Room Join

### Database Schema Extensions

Extend friend data structure at `friends/{userId}/{friendId}/`:

```javascript
{
  userId: string,           // existing
  status: 'accepted',       // existing
  addedAt: timestamp,       // existing
  nickname: string,         // existing
  personalAvatar: string,   // existing
  isOnline: boolean,        // NEW - is friend currently online
  currentRoom: string|null, // NEW - roomId friend is in (null if not in room)
  lastSeen: timestamp       // NEW - last activity timestamp
}
```

### Architecture: Bidirectional Batch Updates

**Concept:** When a user's status changes (login/logout/room change), update that user's entry in ALL their friends' friend lists in a single atomic write.

**Benefits:**

- O(1) complexity per status change (single write, regardless of friend count)
- No need for individual listeners on each friend
- Firebase handles atomicity and race conditions
- Minimal database reads (1 read to get friend list, then batch write)

**Flow Example:**

```
User A logs in
 ↓
Read User A's friends list (B, C, D)
 ↓
Batch update:
  - friends/B/A/isOnline = true
  - friends/C/A/isOnline = true
  - friends/D/A/isOnline = true
 ↓
Single atomic write operation
```

### Implementation: src/services/friendsService.js

Add these methods:

```javascript
/**
 * Updates a user's presence in all their friends' friend lists (bidirectional)
 * This is O(1) operation using Firebase batch updates
 * @param {string} userId - The user whose presence is changing
 * @param {object} updates - Object with fields to update: { isOnline, currentRoom, lastSeen }
 */
async updateFriendPresence(userId, updates) {
  const db = getDatabase();
  const friendsRef = ref(db, `friends/${userId}`);
  const snapshot = await get(friendsRef);

  if (!snapshot.exists()) return;

  const friends = snapshot.val();
  const batchUpdates = {};

  // Update this user's entry in each friend's friend list
  Object.keys(friends).forEach(friendId => {
    Object.keys(updates).forEach(key => {
      batchUpdates[`friends/${friendId}/${userId}/${key}`] = updates[key];
    });
  });

  // Single atomic write
  await update(ref(db), batchUpdates);
}

/**
 * Call when user logs in
 */
async syncFriendPresenceOnLogin(userId) {
  return this.updateFriendPresence(userId, {
    isOnline: true,
    currentRoom: null,
  });
}

/**
 * Call when user logs out
 */
async syncFriendPresenceOnLogout(userId) {
  return this.updateFriendPresence(userId, {
    isOnline: false,
    currentRoom: null,
    lastSeen: Date.now(),
  });
}

/**
 * Call when user enters or exits a room
 * @param {string} userId - The user
 * @param {string|null} roomId - Room ID or null if exiting room
 */
async updateFriendCurrentRoom(userId, roomId) {
  return this.updateFriendPresence(userId, {
    currentRoom: roomId,
  });
}
```

### Implementation: src/stores/user.js

Integrate friend presence updates in user lifecycle:

**Location 1: In `getUser()` action**

```javascript
// After successful auth and user data load
await friendsService.syncFriendPresenceOnLogin(user.uid);
```

**Location 2: In `userSignOut()` action**

```javascript
// Before sign out
await friendsService.syncFriendPresenceOnLogout(this.userId);
```

### Implementation: src/stores/rooms.js

Integrate room presence updates:

**Location 1: In `pushUser()` action**

```javascript
// After adding user to room
await friendsService.updateFriendCurrentRoom(userId, roomId);
```

**Location 2: In `removeUser()` action**

```javascript
// After removing user from room
await friendsService.updateFriendCurrentRoom(userId, null);

// Check if room just opened up and notify waiting list
const roomData = await get(ref(db, `rooms/${roomId}`));
const room = roomData.val();
if (room && room.usersOnline < room.maxUsers) {
  await waitingListService.notifyNextInWaitingList(roomId, room.name);
}
```

### Implementation: src/components/FriendsList.vue

Update UI to show online status and implement goToRoom:

**Template Changes:**

```vue
<template>
  <!-- Add online status badge to avatar -->
  <v-badge v-if="friend.isOnline" color="success" dot overlap>
    <v-avatar>
      <!-- existing avatar code -->
    </v-avatar>
  </v-badge>

  <!-- Show current room if friend is in one -->
  <div v-if="friend.currentRoom" class="text-caption grey--text">In: {{ getRoomName(friend.currentRoom) }}</div>

  <!-- Join button if friend is in a room -->
  <v-btn v-if="friend.currentRoom" size="small" color="primary" @click="goToRoom(friend.currentRoom)">
    Join Room
  </v-btn>
</template>
```

**Script Implementation:**

```javascript
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { getDatabase, ref as dbRef, get } from "firebase/database";
import { useUserStore } from "@/stores/user";
import { useMainStore } from "@/stores/main";
import waitingListService from "@/services/waitingListService";

const router = useRouter();
const userStore = useUserStore();
const mainStore = useMainStore();

// Cache room names to avoid repeated lookups
const roomNamesCache = ref({});

const getRoomName = async (roomId) => {
  if (roomNamesCache.value[roomId]) {
    return roomNamesCache.value[roomId];
  }

  const db = getDatabase();
  const roomData = await get(dbRef(db, `rooms/${roomId}/name`));
  const name = roomData.val() || "Unknown Room";
  roomNamesCache.value[roomId] = name;
  return name;
};

const goToRoom = async (roomId) => {
  const db = getDatabase();
  const roomData = await get(dbRef(db, `rooms/${roomId}`));

  if (!roomData.exists()) {
    mainStore.setSnackbar({
      type: "error",
      msg: "Room not found",
    });
    return;
  }

  const room = roomData.val();

  // Check if room is full
  if (room.usersOnline >= room.maxUsers) {
    // Add to waiting list
    const added = await waitingListService.addToWaitingList(userStore.currentUser.userId, roomId, {
      nickname: userStore.nickname,
      avatar: userStore.avatar,
    });

    if (added) {
      mainStore.setSnackbar({
        type: "info",
        msg: "Added to waiting list. You'll be notified when space opens up.",
      });
    } else {
      mainStore.setSnackbar({
        type: "info",
        msg: "You are already in the waiting list for this room.",
      });
    }
    return;
  }

  // Room has space, join directly
  router.push({
    name: "room",
    params: { roomId },
  });
};
```

---

## Feature 2: Waiting List System

### Database Schema

New node: `roomWaitingLists/{roomId}/{userId}/`

```javascript
{
  userId: string,
  nickname: string,
  avatar: string,
  addedAt: timestamp,      // For FIFO ordering
  notified: boolean,       // Has user been notified of room availability?
  expiresAt: timestamp     // Auto-expire after 15 minutes
}
```

### Implementation: src/services/waitingListService.js (NEW FILE)

Complete service for waiting list management:

```javascript
import { getDatabase, ref, set, get, remove, query, orderByChild, update } from "firebase/database";
import notificationsService from "./notificationsService";

const WAITING_LIST_EXPIRY = 15 * 60 * 1000; // 15 minutes
const NOTIFICATION_EXPIRY = 2 * 60 * 1000; // 2 minutes

class WaitingListService {
  /**
   * Add user to waiting list for a room
   * @returns {boolean} True if added, false if already in list
   */
  async addToWaitingList(userId, roomId, userData) {
    const db = getDatabase();
    const waitingRef = ref(db, `roomWaitingLists/${roomId}/${userId}`);

    // Check if already in waiting list
    const existing = await get(waitingRef);
    if (existing.exists()) {
      return false; // Already waiting
    }

    const entry = {
      userId,
      nickname: userData.nickname,
      avatar: userData.avatar || "",
      addedAt: Date.now(),
      notified: false,
      expiresAt: Date.now() + WAITING_LIST_EXPIRY,
    };

    await set(waitingRef, entry);
    return true;
  }

  /**
   * Remove user from waiting list
   */
  async removeFromWaitingList(userId, roomId) {
    const db = getDatabase();
    const waitingRef = ref(db, `roomWaitingLists/${roomId}/${userId}`);
    await remove(waitingRef);
  }

  /**
   * Get waiting list for a room (FIFO sorted)
   * Automatically removes expired entries
   */
  async getWaitingList(roomId) {
    const db = getDatabase();
    const waitingRef = ref(db, `roomWaitingLists/${roomId}`);
    const snapshot = await get(query(waitingRef, orderByChild("addedAt")));

    if (!snapshot.exists()) return [];

    const now = Date.now();
    const list = [];
    const expiredKeys = [];

    snapshot.forEach((child) => {
      const entry = child.val();
      if (entry.expiresAt < now) {
        expiredKeys.push(child.key);
      } else {
        list.push(entry);
      }
    });

    // Clean up expired entries
    for (const key of expiredKeys) {
      await remove(ref(db, `roomWaitingLists/${roomId}/${key}`));
    }

    return list;
  }

  /**
   * Notify next person in waiting list
   * Finds first unnotified person (FIFO) and sends notification
   * @returns {string|null} User ID of notified user, or null if none available
   */
  async notifyNextInWaitingList(roomId, roomName) {
    const waitingList = await this.getWaitingList(roomId);

    // Find first person who hasn't been notified yet
    const nextUser = waitingList.find((entry) => !entry.notified);

    if (!nextUser) return null;

    // Mark as notified
    const db = getDatabase();
    await set(ref(db, `roomWaitingLists/${roomId}/${nextUser.userId}/notified`), true);

    // Send notification
    await notificationsService.createNotification(nextUser.userId, {
      type: "ROOM_INVITE",
      title: "Room Available",
      message: `A spot opened up in "${roomName}"! Click to join.`,
      priority: "high",
      metadata: {
        roomId,
        roomName,
        expiresAt: Date.now() + NOTIFICATION_EXPIRY,
      },
    });

    return nextUser.userId;
  }

  /**
   * Check if user is in waiting list for a room
   */
  async isInWaitingList(userId, roomId) {
    const db = getDatabase();
    const waitingRef = ref(db, `roomWaitingLists/${roomId}/${userId}`);
    const snapshot = await get(waitingRef);

    if (!snapshot.exists()) return false;

    // Check if expired
    const entry = snapshot.val();
    if (entry.expiresAt < Date.now()) {
      await remove(waitingRef);
      return false;
    }

    return true;
  }
}

export default new WaitingListService();
```

[... rest of the plan continues with all sections from the original plan ...]

**Saved Date:** 2025-12-05
**Status:** PENDING - Ready for future implementation
**Priority:** HIGH (user-requested features)
