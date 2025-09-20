import { defineStore } from 'pinia';
import {
  getDatabase, ref, get, onValue, off, push, update, set, onDisconnect, onChildAdded, onChildRemoved,
} from 'firebase/database';
import {
  getStorage, ref as storageRef, getDownloadURL, listAll, uploadBytes, deleteObject,
} from 'firebase/storage';
import { createRoom, validateRoom, USER_ROOM_LIMITS } from '@/utils/roomTypes';
import useUserStore from './user';

const useRoomsStore = defineStore('rooms', {
  state: () => ({
    roomList: {},
    userAdded: {},
    userExit: {},
    gettingRoomsLoading: false,
    avatarsList: [],
    userDisconnected: false,
    usersOnlineNow: 0,
    currentRoom: {},
    pushingUser: false,
    getavatarsLoading: false,
    ownedRooms: [], // Initialize as empty array
    roomCreationLoading: false,
    roomUploadLoading: false,
  }),

  getters: {
    getAllRooms: (state) => state.roomList,
    getUserPosition: () => {
      const userStore = useUserStore();
      return userStore.usersPosition;
    },
    getAllAvatars: (state) => state.avatarsList,
    getOwnedRooms: (state) => state.ownedRooms,
    canCreateRoom: (state) => {
      const userStore = useUserStore();
      const user = userStore.getCurrentUser;
      if (!user || user.isAnonymous) return false;

      // TODO: Add paid user check when payment system is implemented
      const isPaid = false; // user.isPaid || false;

      if (isPaid) return true;

      // Free users can create only 1 room
      // Use the rooms store as the authoritative source for owned rooms count
      const ownedRoomsCount = state.ownedRooms.length;
      return ownedRoomsCount < USER_ROOM_LIMITS.free;
    },
  },

  actions: {
    async getRooms() {
      this.getRoomsLoading();
      const db = getDatabase();

      try {
        const snapshot = await get(ref(db, 'rooms/'));
        this.setRooms(snapshot.val());

        Object.keys(snapshot.val()).forEach((singleRoom) => {
          const usersRoom = ref(db, `rooms/${singleRoom}/users/`);

          onChildAdded(usersRoom, () => {
            this.addOnline1({ roomId: singleRoom });
          });

          onChildRemoved(usersRoom, () => {
            this.subOnline1({ roomId: singleRoom });
          });
        });

        return 'rooms ready';
      } catch (error) {
        this.setRoomsFail();
      }
      return 'ready';
    },

    async getRoomDetails(roomId) {
      const db = getDatabase();
      const userStore = useUserStore();

      try {
        const roomReference = ref(db, `rooms/${roomId}`);
        const snapshot = await get(roomReference);

        const usersReference = ref(db, `rooms/${roomId}/users`);
        const usersUpgradedReference = ref(db, `rooms/${roomId}/usersUpgraded`);

        onChildAdded(usersReference, (userSnap) => {
          if (userSnap.val() !== null) {
            this.enterRoom({
              roomId,
              userId: userSnap.val(),
              roomUsersKey: userSnap.key,
            });
          }
        });

        onChildRemoved(usersReference, (userSnap) => {
          const { userId } = userSnap.val();
          this.removeUser({ roomId, userId, roomUsersKey: userSnap.key });
        });

        onValue(usersUpgradedReference, (userSnap) => {
          const userUpgraded = userSnap.val();
          if (userUpgraded !== null
            && userUpgraded.verifiedUser !== null
            && userUpgraded.unverifiedUser !== null
            && userUpgraded.verifiedUser !== userStore.currentUser.userId
            && userUpgraded.unverifiedUser !== userStore.currentUser.userId) {
            userStore.upgradeNonCurrentUser({
              verifiedUser: userUpgraded.verifiedUser,
              unverifiedUser: userUpgraded.unverifiedUser,
            });
            set(usersUpgradedReference, { verifiedUser: null, unverifiedUser: null });
          }
        });

        this.setRoomDetailsSuccess(snapshot.val());
        return snapshot.val();
      } catch (error) {
        this.setRoomsFail();
        return error;
      }
    },

    async pushUser({ roomId, userId }) {
      this.setPushUser();
      const db = getDatabase();
      const userStore = useUserStore();

      try {
        const { currentUser } = userStore;

        // Get room data to find the default avatar
        const roomRef = ref(db, `rooms/${roomId}`);
        const roomSnapshot = await get(roomRef);
        const roomData = roomSnapshot.val();

        let defaultUrl; let
          defaultMiniUrl;

        // Find the default avatar from the room's allowedAvatars
        if (roomData?.allowedAvatars) {
          const defaultAvatar = roomData.allowedAvatars.find((avatar) => avatar.isDefault);
          if (defaultAvatar) {
            defaultUrl = defaultAvatar.url || defaultAvatar.avatarURL;
            defaultMiniUrl = defaultAvatar.miniUrl || defaultAvatar.miniAvatarURL;
            console.log('Found default avatar from room data:', { defaultUrl, defaultMiniUrl });
          } else {
            console.log('No default avatar found in room data');
          }
        } else {
          console.log('No avatars found in room data');
        }

        if (defaultUrl) {
          await set(ref(db, `users/${currentUser.userId}/avatar/`), defaultUrl);
        }
        if (defaultMiniUrl) {
          await set(ref(db, `users/${currentUser.userId}/miniAvatar/`), defaultMiniUrl);
        }

        const roomUsersKey = push(ref(db, `rooms/${roomId}/users/`)).key;
        const updates = {};
        updates[`/rooms/${roomId}/users/${roomUsersKey}`] = { userId };
        updates[`/users/${userId}/rooms/${roomId}`] = { roomUsersKey };

        const refRoom = ref(db, `rooms/${roomId}/users/${roomUsersKey}/`);
        // Instead of setting userId to null (which triggers onChildRemoved),
        // just remove the entire key on disconnect to avoid cleanup issues on refresh
        onDisconnect(refRoom).remove();

        await update(ref(db), updates);
        this.pushUserSuccess();
      } catch (error) {
        console.error(error);
      }
    },

    async removeUser({
      roomId, userId, roomUsersKey, isAnonymous,
    }) {
      const db = getDatabase();
      const userStore = useUserStore();

      try {
        const updates = {};
        updates[`/rooms/${roomId}/users/${roomUsersKey}`] = null;

        if (!isAnonymous) {
          updates[`/users/${userId}/rooms/${roomId}`] = null;
          updates[`/users/${userId}/messages/`] = null;
          updates[`/users/${userId}/privateMessage/`] = null;
          updates[`/users/${userId}/position/`] = null;
        } else {
          updates[`/users/${userId}`] = null;
        }

        if (userStore.currentUser.userId === userId) {
          off(ref(db, `rooms/${roomId}/messages/`));
          off(ref(db, `rooms/${roomId}/users`));
          off(ref(db, 'users/'));
        }

        await update(ref(db), updates);

        this.exitRoom({ roomId, userId, roomUsersKey });
      } catch (error) {
        console.error(error);
      }
    },

    async getAvatars(roomId) {
      this.getAvatarsLoading();
      const storage = getStorage();
      const userStore = useUserStore();

      try {
        const urlList = [];
        const avatarsRef = storageRef(storage, `rooms/${roomId}/avatars/${userStore.currentUser.level}`);
        const tempRefs = await listAll(avatarsRef);

        await Promise.all(tempRefs.items.map(async (avatarRef, index) => {
          const starsRef = storageRef(storage, avatarRef.fullPath);
          const url = await getDownloadURL(starsRef);
          urlList.push({ avatarId: index, url });
        }));

        this.getAvatarsSucceed(urlList);
      } catch (error) {
        this.getAvatarsFailed();
      }
    },

    // Mutations converted to actions
    getAvatarsLoading() {
      this.getavatarsLoading = true;
    },

    getAvatarsSucceed(data) {
      this.avatarsList = data;
      this.getavatarsLoading = false;
    },

    getAvatarsFailed() {
      this.getavatarsLoading = false;
    },

    getRoomsLoading() {
      this.gettingRoomsLoading = true;
    },

    setRooms(data) {
      this.roomList = data || {};
      this.gettingRoomsLoading = false;
    },

    setRoomsFail() {
      this.gettingRoomsLoading = false;
    },

    setPushUser() {
      this.pushingUser = true;
    },

    pushUserSuccess() {
      this.pushingUser = false;
    },

    setRoomDetailsSuccess(roomDetails) {
      this.currentRoom = roomDetails;
    },

    addOnline1({ roomId }) {
      if (!this.roomList[roomId]) return;

      const currentOnline = this.roomList[roomId].usersOnline || 0;
      this.roomList[roomId].usersOnline = currentOnline + 1;
      this.usersOnlineNow += 1;
    },

    subOnline1({ roomId }) {
      if (!this.roomList[roomId]) return;

      const currentOnline = this.roomList[roomId].usersOnline || 1;
      this.roomList[roomId].usersOnline = Math.max(0, currentOnline - 1);
      this.usersOnlineNow = Math.max(0, this.usersOnlineNow - 1);
    },

    enterRoom({ roomId, userId, roomUsersKey }) {
      const userStore = useUserStore();

      if (this.currentRoom.users) {
        Object.assign(this.currentRoom.users, { [roomUsersKey]: userId });
      } else {
        Object.assign(this.currentRoom, { users: { [roomUsersKey]: userId } });
      }

      this.userAdded = { roomId, ...userId };
      userStore.roomIn = { roomId, roomUsersKey };
    },

    exitRoom({ roomId, userId, roomUsersKey }) {
      const userStore = useUserStore();

      if (userId === userStore.currentUser.userId) {
        userStore.userData = {};
        userStore.usersPosition = {};
        userStore.roomIn = {};
        this.currentRoom = {};
        userStore.currentUser.rooms = {};
        userStore.currentUser.position = {};
      } else {
        delete userStore.userData[userId];
        delete userStore.usersPosition[userId];
        if (this.currentRoom.users) {
          delete this.currentRoom.users[roomUsersKey];
        }
      }

      userStore.userPositionModified = true;
      this.userExit = { roomId, userId };
      this.userAdded = null;
    },

    // Room Management Actions
    async fetchOwnedRooms(userId) {
      const db = getDatabase();
      try {
        // Clear existing owned rooms first
        this.ownedRooms = [];

        // Get user's owned room IDs
        const userOwnedRef = ref(db, `users/${userId}/ownedRooms`);
        const userOwnedSnapshot = await get(userOwnedRef);
        const ownedRoomIds = userOwnedSnapshot.val() || [];

        console.log('Fetching owned rooms for user:', userId);
        console.log('Owned room IDs:', ownedRoomIds);

        if (ownedRoomIds.length === 0) {
          console.log('User has no owned rooms');
          return [];
        }

        // Fetch only the specific rooms the user owns
        const ownedRooms = [];

        await Promise.all(
          ownedRoomIds.map(async (roomId) => {
            try {
              const roomRef = ref(db, `rooms/${roomId}`);
              const roomSnapshot = await get(roomRef);
              const roomData = roomSnapshot.val();

              if (roomData) {
                // If room doesn't have a picture/background, try to load it from storage
                if (!roomData.picture && !roomData.backgroundImage && !roomData.thumbnail) {
                  try {
                    const storage = getStorage();
                    const backgroundRef = storageRef(storage, `${roomId}/places/L1/background.jpg`);
                    const backgroundURL = await getDownloadURL(backgroundRef);
                    roomData.picture = backgroundURL;
                    roomData.backgroundImage = backgroundURL;
                    roomData.thumbnail = backgroundURL;
                    console.log(`Loaded background for room ${roomId}:`, backgroundURL);
                  } catch (error) {
                    console.log(`No background image found for room ${roomId}`);
                  }
                }
                ownedRooms.push({ id: roomId, ...roomData });
                console.log(`Loaded room: ${roomId}`);
              } else {
                console.warn(`Room ${roomId} not found, removing from user's ownedRooms`);
                // Room doesn't exist anymore, remove it from user's ownedRooms
                const updatedOwnedRoomIds = ownedRoomIds.filter((id) => id !== roomId);
                await set(userOwnedRef, updatedOwnedRoomIds);
              }
            } catch (error) {
              console.error(`Error fetching room ${roomId}:`, error);
            }
          }),
        );

        console.log('Found owned rooms:', ownedRooms.length);
        this.ownedRooms = ownedRooms;
        return ownedRooms;
      } catch (error) {
        console.error('Error fetching owned rooms:', error);
        // Make sure to clear owned rooms on error too
        this.ownedRooms = [];
        throw error;
      }
    },

    // Clear owned rooms (useful for user logout/switch)
    clearOwnedRooms() {
      this.ownedRooms = [];
    },

    async createRoom(roomData) {
      const db = getDatabase();
      const userStore = useUserStore();

      if (!this.canCreateRoom) {
        throw new Error('Room creation limit reached');
      }

      // Validate room data
      const validation = validateRoom(roomData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      this.roomCreationLoading = true;

      try {
        const currentUser = userStore.getCurrentUser;
        const roomRef = push(ref(db, 'rooms'));
        const roomId = roomRef.key;

        const newRoom = createRoom({
          ...roomData,
          id: roomId,
          ownerId: currentUser.userId,
        });

        // For compatibility with existing components, also set picture field
        if (roomData.backgroundImage) {
          newRoom.picture = roomData.backgroundImage;
          newRoom.thumbnail = roomData.backgroundImage; // Set thumbnail too for RoomThumbnail compatibility
        }

        await set(roomRef, newRoom);

        // Add roomId to user's ownedRooms array
        const userRef = ref(db, `users/${currentUser.userId}/ownedRooms`);
        const userOwnedSnapshot = await get(userRef);
        const currentOwnedRooms = userOwnedSnapshot.val() || [];

        if (!currentOwnedRooms.includes(roomId)) {
          currentOwnedRooms.push(roomId);
          await set(userRef, currentOwnedRooms);
        }

        // Add to local owned rooms
        this.ownedRooms.push(newRoom);

        // Add to room list
        this.roomList[roomId] = newRoom;

        return { success: true, roomId, room: newRoom };
      } catch (error) {
        console.error('Error creating room:', error);
        throw error;
      } finally {
        this.roomCreationLoading = false;
      }
    },

    async updateRoomAssets(roomId, roomData) {
      // Update room data without ownership check (used after room creation)
      const db = getDatabase();
      this.roomCreationLoading = true;

      try {
        const roomRef = ref(db, `rooms/${roomId}`);
        const roomSnapshot = await get(roomRef);
        const existingRoom = roomSnapshot.val();

        const updatedRoom = {
          ...existingRoom,
          ...roomData,
          id: roomId,
          updatedAt: new Date().toISOString(),
        };

        await set(roomRef, updatedRoom);

        // Update local store
        this.roomList[roomId] = updatedRoom;

        console.log('Room assets updated:', roomId);
      } catch (error) {
        console.error('Error updating room assets:', error);
        throw error;
      } finally {
        this.roomCreationLoading = false;
      }
    },

    async updateRoom(roomId, roomData) {
      const db = getDatabase();
      const userStore = useUserStore();

      // Validate room data
      const validation = validateRoom(roomData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      this.roomCreationLoading = true;

      try {
        const currentUser = userStore.getCurrentUser;
        const roomRef = ref(db, `rooms/${roomId}`);

        // Check if user owns the room
        const roomSnapshot = await get(roomRef);
        const existingRoom = roomSnapshot.val();

        if (!existingRoom || existingRoom.ownerId !== currentUser.userId) {
          throw new Error('You can only edit rooms you own');
        }

        const updatedRoom = {
          ...existingRoom,
          ...roomData,
          id: roomId,
          ownerId: currentUser.userId, // Ensure owner doesn't change
          updatedAt: new Date().toISOString(),
        };

        // The avatars should already be merged in the RoomForm, so this logic may be redundant
        // but keeping it as a safety net
        if (!roomData.allowedAvatars && existingRoom.allowedAvatars) {
          updatedRoom.allowedAvatars = existingRoom.allowedAvatars;
        }

        // Validate that room has at least one avatar (safety check)
        if (!updatedRoom.allowedAvatars || updatedRoom.allowedAvatars.length === 0) {
          updatedRoom.allowedAvatars = existingRoom.allowedAvatars || [];

          if (updatedRoom.allowedAvatars.length === 0) {
            throw new Error('Room must have at least one avatar. Please add an avatar before saving.');
          }
        }

        // Check for removed avatars and delete their files from storage
        if (roomData.allowedAvatars && existingRoom.allowedAvatars) {
          const existingAvatarNames = existingRoom.allowedAvatars.map((a) => a.name);
          const newAvatarNames = updatedRoom.allowedAvatars.map((a) => a.name);
          const removedAvatarNames = existingAvatarNames.filter((name) => !newAvatarNames.includes(name));

          if (removedAvatarNames.length > 0) {
            console.log('🗑️ Deleting removed avatar files:', removedAvatarNames);
            try {
              await this.deleteRoomAvatarFiles(roomId, removedAvatarNames);
            } catch (error) {
              console.warn('Failed to delete some avatar files:', error);
              // Don't fail the entire update if file deletion fails
            }
          }
        }

        // For compatibility with existing components, also set picture field
        if (roomData.backgroundImage) {
          updatedRoom.picture = roomData.backgroundImage;
          updatedRoom.thumbnail = roomData.backgroundImage; // Set thumbnail too for RoomThumbnail compatibility
        }

        await update(roomRef, updatedRoom);

        // Update local state
        const ownedRoomIndex = this.ownedRooms.findIndex((room) => room.id === roomId);
        if (ownedRoomIndex !== -1) {
          this.ownedRooms[ownedRoomIndex] = updatedRoom;
        }

        if (this.roomList[roomId]) {
          this.roomList[roomId] = updatedRoom;
        }

        return { success: true, room: updatedRoom };
      } catch (error) {
        console.error('Error updating room:', error);
        throw error;
      } finally {
        this.roomCreationLoading = false;
      }
    },

    async deleteRoom(roomId) {
      const db = getDatabase();
      const userStore = useUserStore();

      try {
        const currentUser = userStore.getCurrentUser;
        const roomRef = ref(db, `rooms/${roomId}`);

        // Check if user owns the room
        const roomSnapshot = await get(roomRef);
        const existingRoom = roomSnapshot.val();

        if (!existingRoom || existingRoom.ownerId !== currentUser.userId) {
          throw new Error('You can only delete rooms you own');
        }

        // Delete all room storage (avatars, backgrounds, etc.)
        await this.deleteRoomStorage(roomId);

        // Delete room from database
        await set(roomRef, null);

        // Remove roomId from user's ownedRooms array
        const userOwnedRef = ref(db, `users/${currentUser.userId}/ownedRooms`);
        const userOwnedSnapshot = await get(userOwnedRef);
        const currentOwnedRooms = userOwnedSnapshot.val() || [];

        const updatedOwnedRooms = currentOwnedRooms.filter((id) => id !== roomId);
        await set(userOwnedRef, updatedOwnedRooms);

        // Update local state
        this.ownedRooms = this.ownedRooms.filter((room) => room.id !== roomId);
        delete this.roomList[roomId];

        return { success: true };
      } catch (error) {
        console.error('Error deleting room:', error);
        throw error;
      }
    },

    async uploadBackgroundImage(roomId, file) {
      const storage = getStorage();
      this.roomUploadLoading = true;

      try {
        const imageRef = storageRef(storage, `rooms/${roomId}/places/L1/background.jpg`);
        const snapshot = await uploadBytes(imageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log('Background image uploaded:', downloadURL);
        return downloadURL;
      } catch (error) {
        console.error('Error uploading background image:', error);
        throw error;
      } finally {
        this.roomUploadLoading = false;
      }
    },

    async uploadRoomAvatars(roomId, avatarFiles, existingAvatarNames = []) {
      const storage = getStorage();
      this.roomUploadLoading = true;

      try {
        // Use provided existing avatar names, or fallback to store data
        let avatarNames = existingAvatarNames;
        if (!avatarNames.length) {
          const existingRoom = this.roomList[roomId] || this.ownedRooms.find((r) => r.id === roomId);
          avatarNames = existingRoom?.allowedAvatars?.map((a) => a.name) || [];
        }
        // Find the next available avatar number
        let nextAvatarNumber = 1;
        while (avatarNames.includes(`avatar_${nextAvatarNumber}`)) {
          nextAvatarNumber += 1;
        }

        const uploadedAvatars = [];
        const uploadPromises = avatarFiles.map(async ({ mainFile, miniFile, isDefault = false }, i) => {
          const avatarName = `avatar_${nextAvatarNumber + i}`;

          const avatarRef = storageRef(storage, `rooms/${roomId}/avatars/L1/${avatarName}.png`);
          const miniAvatarRef = storageRef(storage, `rooms/${roomId}/avatars/L1/miniavatars/${avatarName}.png`);

          // Upload main avatar
          const snapshot = await uploadBytes(avatarRef, mainFile);
          const avatarURL = await getDownloadURL(snapshot.ref);

          // Upload mini avatar (cropped/head version)
          const miniSnapshot = await uploadBytes(miniAvatarRef, miniFile);
          const miniAvatarURL = await getDownloadURL(miniSnapshot.ref);

          uploadedAvatars.push({
            name: avatarName,
            url: avatarURL,
            miniUrl: miniAvatarURL,
            avatarURL, // for compatibility
            miniAvatarURL, // for compatibility
            isDefault, // Preserve isDefault status from avatar manager
          });
        });

        await Promise.all(uploadPromises);

        return uploadedAvatars;
      } catch (error) {
        console.error('Error uploading room avatars:', error);
        throw error;
      } finally {
        this.roomUploadLoading = false;
      }
    },

    async deleteRoomAvatarFiles(roomId, avatarNames) {
      const storage = getStorage();

      try {
        const deletePromises = avatarNames.map(async (avatarName) => {
          // Delete main avatar file
          const avatarRef = storageRef(storage, `rooms/${roomId}/avatars/L1/${avatarName}.png`);
          const miniAvatarRef = storageRef(storage, `rooms/${roomId}/avatars/L1/miniavatars/${avatarName}.png`);

          try {
            await deleteObject(avatarRef);
          } catch (error) {
            console.warn(`Could not delete main avatar ${avatarName}:`, error.message);
          }

          try {
            await deleteObject(miniAvatarRef);
          } catch (error) {
            console.warn(`Could not delete mini avatar ${avatarName}:`, error.message);
          }
        });

        await Promise.all(deletePromises);
        return { success: true };
      } catch (error) {
        console.error('Error deleting avatar files:', error);
        throw error;
      }
    },

    async setDefaultAvatar(roomId, avatarName) {
      const db = getDatabase();
      const storage = getStorage();

      try {
        console.log(`Setting default avatar: roomId=${roomId}, avatarName=${avatarName}`);

        // Get the avatar URL
        const avatarRef = storageRef(storage, `rooms/${roomId}/avatars/L1/${avatarName}.png`);
        const miniAvatarRef = storageRef(storage, `rooms/${roomId}/avatars/L1/miniavatars/${avatarName}.png`);

        console.log('Getting avatar URLs...');
        const avatarURL = await getDownloadURL(avatarRef);
        const miniAvatarURL = await getDownloadURL(miniAvatarRef);
        console.log('Avatar URLs obtained:', { avatarURL, miniAvatarURL });

        // Store in defaultAvatar folder
        const defaultAvatarRef = storageRef(storage, `rooms/${roomId}/avatars/L1/defaultAvatar/defaultAvatar.png`);
        const defaultMiniRef = storageRef(storage, `rooms/${roomId}/avatars/L1/defaultAvatar/defaultAvatar_head.png`);

        // Copy the selected avatar to default location
        console.log('Copying avatar to default location...');
        const response = await fetch(avatarURL);
        const blob = await response.blob();
        await uploadBytes(defaultAvatarRef, blob);
        console.log('Main default avatar uploaded');

        const miniResponse = await fetch(miniAvatarURL);
        const miniBlob = await miniResponse.blob();
        await uploadBytes(defaultMiniRef, miniBlob);
        console.log('Mini default avatar uploaded');

        console.log('Default avatar successfully set!');

        // Update room data with default avatar info
        const roomRef = ref(db, `rooms/${roomId}`);
        await update(roomRef, {
          defaultAvatar: {
            name: avatarName,
            url: avatarURL,
            miniUrl: miniAvatarURL,
          },
        });

        console.log('Default avatar set:', avatarName);
        return { avatarName, avatarURL, miniAvatarURL };
      } catch (error) {
        console.error('Error setting default avatar:', error);
        throw error;
      }
    },

    async deleteRoomAvatar(roomId, avatarName) {
      const storage = getStorage();

      try {
        const avatarRef = storageRef(storage, `rooms/${roomId}/avatars/L1/${avatarName}.png`);
        const miniAvatarRef = storageRef(storage, `rooms/${roomId}/avatars/L1/miniavatars/${avatarName}.png`);

        await deleteObject(avatarRef);
        await deleteObject(miniAvatarRef);

        console.log('Avatar deleted from storage:', avatarName);
        return true;
      } catch (error) {
        console.error('Error deleting room avatar:', error);
        throw error;
      }
    },

    async deleteRoomStorage(roomId) {
      const storage = getStorage();

      try {
        console.log('🗑️ Deleting room storage for:', roomId);

        // Recursive function to delete all files and folders
        const deleteRecursively = async (folderRef, depth = 0) => {
          const indent = '  '.repeat(depth);
          console.log(`${indent}📁 Processing folder:`, folderRef.fullPath);

          try {
            const result = await listAll(folderRef);

            // Delete all files in this folder
            const filePromises = result.items.map(async (itemRef) => {
              console.log(`${indent}🗂️ Deleting file:`, itemRef.fullPath);
              try {
                await deleteObject(itemRef);
              } catch (error) {
                console.warn(`${indent}❌ Failed to delete file:`, itemRef.fullPath, error);
              }
            });

            // Recursively delete all subfolders
            const folderPromises = result.prefixes.map(async (subFolderRef) => {
              await deleteRecursively(subFolderRef, depth + 1);
            });

            // Wait for all operations in this folder to complete
            await Promise.all([...filePromises, ...folderPromises]);
            console.log(`${indent}✅ Completed folder:`, folderRef.fullPath);
          } catch (error) {
            console.warn(`${indent}❌ Failed to process folder:`, folderRef.fullPath, error);
          }
        };

        // Start recursive deletion from the room root
        const roomStorageRef = storageRef(storage, `rooms/${roomId}`);
        await deleteRecursively(roomStorageRef);

        console.log('✅ Room storage cleanup completed for:', roomId);
        return true;
      } catch (error) {
        console.error('❌ Error deleting room storage:', error);
        return false; // Don't throw error, just log and continue with room deletion
      }
    },

    async getRoomAvatars(roomId) {
      const storage = getStorage();
      const userStore = useUserStore();

      try {
        const room = this.roomList[roomId] || this.currentRoom;
        let avatarsToUse = [];

        // If room has custom avatars, use them
        if (room?.allowedAvatars && room.allowedAvatars.length > 0) {
          avatarsToUse = room.allowedAvatars;
        } else {
          // Otherwise, use default room avatars
          const urlList = [];
          const avatarsRef = storageRef(storage, `rooms/${roomId}/avatars/${userStore.currentUser.level || 'L1'}`);
          const tempRefs = await listAll(avatarsRef);

          await Promise.all(tempRefs.items.map(async (avatarRef, index) => {
            const starsRef = storageRef(storage, avatarRef.fullPath);
            const url = await getDownloadURL(starsRef);
            urlList.push({ avatarId: index, url });
          }));

          avatarsToUse = urlList;
        }

        return avatarsToUse;
      } catch (error) {
        console.error('Error getting room avatars:', error);
        throw error;
      }
    },
  },
});
export default useRoomsStore;
