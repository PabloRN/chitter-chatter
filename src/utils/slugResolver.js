import { getDatabase, ref, get } from 'firebase/database';

/**
 * Resolve slug or roomId to actual roomId
 * @param {string} slugOrId - Could be slug ("awesome-room") or roomId ("-NqR3xjKlmP9")
 * @returns {Promise<string|null>} - The roomId or null if not found
 */
export async function resolveRoomId(slugOrId) {
  const db = getDatabase();

  // First: Try direct room ID lookup (fast path for existing behavior)
  const roomRef = ref(db, `rooms/${slugOrId}`);
  const roomSnapshot = await get(roomRef);

  if (roomSnapshot.exists()) {
    // It's a valid room ID
    return slugOrId;
  }

  // Second: Try slug lookup via roomSlugs index
  const slugRef = ref(db, `roomSlugs/${slugOrId}`);
  const slugSnapshot = await get(slugRef);

  if (slugSnapshot.exists()) {
    // Found roomId from slug
    return slugSnapshot.val();
  }

  // Not found
  return null;
}

/**
 * Get slug from room data
 * @param {object} room - Room object
 * @returns {string} - Slug or roomId as fallback
 */
export function getRoomSlug(room) {
  return room?.slug || room?.id;
}
