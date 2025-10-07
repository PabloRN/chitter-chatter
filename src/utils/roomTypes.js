// Room themes/topics
export const ROOM_TOPICS = [

  { name: 'Gaming', icon: 'mdi-gamepad-variant', color: 'purple' },
  { name: 'Music', icon: 'mdi-music', color: 'blue' },
  { name: 'Reading', icon: 'mdi-book-open-page-variant', color: 'indigo' },
  { name: 'Design', icon: 'mdi-pencil', color: 'pink' },
  { name: 'Cooking', icon: 'mdi-silverware-fork-knife', color: 'red' },
  { name: 'Traveling', icon: 'mdi-airplane', color: 'cyan' },
  { name: 'Movies', icon: 'mdi-movie-open', color: 'teal' },
  { name: 'Fitness', icon: 'mdi-dumbbell', color: 'orange' },
  { name: 'Photography', icon: 'mdi-camera', color: 'light-blue' },
  { name: 'Coding', icon: 'mdi-laptop', color: 'grey darken-1' },
  { name: 'Anime & Manga', icon: 'mdi-drama-masks', color: 'deep-purple' },
  { name: 'Collecting', icon: 'mdi-cards-variant', color: 'brown' },
  { name: 'Nature', icon: 'mdi-tree', color: 'green darken-2' },
  { name: 'Pets', icon: 'mdi-paw', color: 'amber' },
  { name: 'Sports', icon: 'mdi-soccer', color: 'green' },
  { name: 'General topics', icon: 'mdi-forum', color: 'blue' },
];

// Room validation constraints
export const ROOM_CONSTRAINTS = {
  name: {
    minLength: 3,
    maxLength: 50,
  },
  description: {
    maxLength: 200,
  },
  maxUsers: {
    min: 2,
    max: 20,
  },
};

// Default room values
export const DEFAULT_ROOM_VALUES = {
  name: '',
  topics: [{ name: 'General topics', icon: 'mdi-forum', color: 'blue' }],
  description: '',
  maxUsers: 20,
  minAge: 13,
  backgroundImage: '',
  isPrivate: false,
  publicAvatars: [],
  defaultAvatar: null, // Avatar that new users get when entering room
  createdBy: '',
};

// Room creation limits
export const USER_ROOM_LIMITS = {
  free: 1,
  paid: 10, // -1 means unlimited
  admin: 100, // -1 means unlimited
};

export function createRoom(data = {}) {
  return {
    id: data.id || null,
    ownerId: data.ownerId || null,
    name: data.name || DEFAULT_ROOM_VALUES.name,
    topics: data.topics || DEFAULT_ROOM_VALUES.topics,
    description: data.description || DEFAULT_ROOM_VALUES.description,
    maxUsers: data.maxUsers || DEFAULT_ROOM_VALUES.maxUsers,
    minAge: data.minAge || DEFAULT_ROOM_VALUES.minAge,
    backgroundImage: data.backgroundImage || DEFAULT_ROOM_VALUES.backgroundImage,
    isPrivate: data.isPrivate || DEFAULT_ROOM_VALUES.isPrivate,
    publicAvatars: data.publicAvatars || DEFAULT_ROOM_VALUES.publicAvatars,
    createdAt: data.createdAt || new Date().toISOString(),
    usersOnline: data.usersOnline || 0,
    users: data.users || {},
    createdBy: data.createdBy || '',
  };
}

export function validateRoom(roomData) {
  const errors = [];

  // Name validation
  if (!roomData.name || roomData.name.trim().length < ROOM_CONSTRAINTS.name.minLength) {
    errors.push(`Room name must be at least ${ROOM_CONSTRAINTS.name.minLength} characters long`);
  }
  if (roomData.name && roomData.name.length > ROOM_CONSTRAINTS.name.maxLength) {
    errors.push(`Room name cannot exceed ${ROOM_CONSTRAINTS.name.maxLength} characters`);
  }

  // Description validation
  if (roomData.description && roomData.description.length > ROOM_CONSTRAINTS.description.maxLength) {
    errors.push(`Description cannot exceed ${ROOM_CONSTRAINTS.description.maxLength} characters`);
  }

  // Max users validation
  if (roomData.maxUsers < ROOM_CONSTRAINTS.maxUsers.min || roomData.maxUsers > ROOM_CONSTRAINTS.maxUsers.max) {
    errors.push(`Maximum users must be between ${ROOM_CONSTRAINTS.maxUsers.min} and ${ROOM_CONSTRAINTS.maxUsers.max}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
