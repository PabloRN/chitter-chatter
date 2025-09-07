// Room themes/topics
export const ROOM_THEMES = [
  { value: 'general', label: 'General Discussion' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'music', label: 'Music' },
  { value: 'movies', label: 'Movies & TV' },
  { value: 'tech', label: 'Technology' },
  { value: 'sports', label: 'Sports' },
  { value: 'art', label: 'Art & Design' },
  { value: 'education', label: 'Education' },
  { value: 'business', label: 'Business' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'science', label: 'Science' },
  { value: 'food', label: 'Food & Cooking' },
  { value: 'travel', label: 'Travel' },
  { value: 'books', label: 'Books & Literature' },
  { value: 'health', label: 'Health & Fitness' },
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
  minAge: {
    min: 13,
    max: 99,
  },
};

// Default room values
export const DEFAULT_ROOM_VALUES = {
  name: '',
  theme: 'general',
  description: '',
  maxUsers: 20,
  minAge: 13,
  backgroundImage: '',
  isPrivate: false,
  allowedAvatars: [],
  defaultAvatar: null, // Avatar that new users get when entering room
  createdBy: '',
};

// Room creation limits
export const USER_ROOM_LIMITS = {
  free: 1,
  paid: -1, // -1 means unlimited
};

export function createRoom(data = {}) {
  return {
    id: data.id || null,
    ownerId: data.ownerId || null,
    name: data.name || DEFAULT_ROOM_VALUES.name,
    theme: data.theme || DEFAULT_ROOM_VALUES.theme,
    description: data.description || DEFAULT_ROOM_VALUES.description,
    maxUsers: data.maxUsers || DEFAULT_ROOM_VALUES.maxUsers,
    minAge: data.minAge || DEFAULT_ROOM_VALUES.minAge,
    backgroundImage: data.backgroundImage || DEFAULT_ROOM_VALUES.backgroundImage,
    isPrivate: data.isPrivate || DEFAULT_ROOM_VALUES.isPrivate,
    allowedAvatars: data.allowedAvatars || DEFAULT_ROOM_VALUES.allowedAvatars,
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

  // Min age validation
  if (roomData.minAge < ROOM_CONSTRAINTS.minAge.min || roomData.minAge > ROOM_CONSTRAINTS.minAge.max) {
    errors.push(`Minimum age must be between ${ROOM_CONSTRAINTS.minAge.min} and ${ROOM_CONSTRAINTS.minAge.max}`);
  }

  // Theme validation
  const validThemes = ROOM_THEMES.map((t) => t.value);
  if (!validThemes.includes(roomData.theme)) {
    errors.push('Invalid room theme selected');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
