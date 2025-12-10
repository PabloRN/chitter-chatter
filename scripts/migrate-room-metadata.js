#!/usr/bin/env node

const { getDatabase, ref, get, update } = require('firebase/database');
const { initializeApp } = require('firebase/app');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from the root .env file
const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
console.log('🔧 Initializing Firebase...');
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function migrateRoomMetadata() {
  try {
    console.log('\n📦 Starting room metadata migration...\n');

    // Read all rooms
    const roomsRef = ref(db, 'rooms/');
    console.log('📖 Reading rooms from database...');
    const roomsSnapshot = await get(roomsRef);

    if (!roomsSnapshot.exists()) {
      console.log('⚠️  No rooms found in database.');
      return;
    }

    const rooms = roomsSnapshot.val();
    const roomCount = Object.keys(rooms).length;
    console.log(`✓ Found ${roomCount} rooms to migrate\n`);

    // Build updates object
    const updates = {};
    let successCount = 0;

    Object.entries(rooms).forEach(([roomId, room]) => {
      try {
        // Extract image URL once (only modern fields - no deprecated picture field)
        const imageUrl = room.thumbnail
          || room.backgroundImage
          || '';

        const metadata = {
          name: room.name,
          description: room.description || '',
          // Both fields get the same URL (matches production pattern)
          thumbnail: imageUrl,
          backgroundImage: imageUrl,
          maxUsers: room.maxUsers || 10,
          usersOnline: room.usersOnline || 0,
          createdBy: room.createdBy || '',
          createdAt: room.createdAt || new Date().toISOString(),
          ownerId: room.ownerId || '',
          isPrivate: room.isPrivate || false,
          isFanArt: room.isFanArt || false,
          minAge: room.minAge || 13,
          topics: room.topics || [],
          addedToFavorites: room.addedToFavorites || 0,
          updatedAt: room.updatedAt || room.createdAt || new Date().toISOString(),
        };

        // Only add category if it exists (some rooms might not have it)
        if (room.category) {
          metadata.category = room.category;
        }

        updates[`roomMetadata/${roomId}`] = metadata;
        successCount += 1;
        console.log(`  ✓ Prepared metadata for: ${room.name} (${roomId})`);
      } catch (error) {
        console.error(`  ✗ Error preparing metadata for room ${roomId}:`, error.message);
      }
    });

    // Write all metadata at once
    console.log(`\n💾 Writing ${successCount} room metadata entries to database...`);
    await update(ref(db), updates);

    console.log(`\n✅ Successfully migrated ${successCount} rooms to roomMetadata/`);
    console.log('\n📊 Migration Summary:');
    console.log(`   Total rooms: ${roomCount}`);
    console.log(`   Successfully migrated: ${successCount}`);
    console.log(`   Failed: ${roomCount - successCount}`);
    console.log('\n🎉 Migration complete!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateRoomMetadata();
