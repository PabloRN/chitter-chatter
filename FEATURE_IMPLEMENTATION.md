# Room Backgrounds & Avatars with Admin Management

## Overview
This feature adds comprehensive background and avatar management for rooms, with support for both user-uploaded assets and admin-managed preloaded assets.

## Features Implemented

### 1. **Room Backgrounds (User-facing)**
Users can now set room backgrounds in two ways:

**Option 1: Upload Custom Background**
- Upload their own image
- Automatically compressed and optimized
- Thumbnail generated for efficient loading

**Option 2: Select Preloaded Background**
- Choose from admin-uploaded backgrounds
- Instant preview before selection
- No upload time required

**Location:** `src/components/BackgroundSelector.vue`

### 2. **Room Avatars (User-facing)**
Users can add multiple avatars to their rooms:

**Option 1: Upload Custom Avatars**
- Upload one or multiple avatar images
- Mini avatars automatically cropped from head area
- Multiple selection supported

**Option 2: Select Preloaded Avatars**
- Choose from admin-uploaded avatars
- Multi-select with checkboxes
- Mix uploaded and preselected avatars

**Location:** `src/components/RoomAvatarSelector.vue`

### 3. **Admin Panel (Admin-only)**
Administrators can manage the preloaded asset library:

**Background Management:**
- Upload new backgrounds
- Automatic compression (1920x1080 max)
- Thumbnail generation (300x200)
- Database linking for efficient retrieval
- Delete backgrounds

**Avatar Management:**
- Upload new avatars
- Automatic miniavatar generation
- Database linking for efficient retrieval
- Delete avatars

**Location:** `src/components/AdminPanel.vue`
**Access:** Profile page → Only visible to users with `isAdmin: true`

## Technical Implementation

### Directory Structure
```
public/
├── rooms/backgrounds/L1/
│   └── thumbnails/
└── avatars/L1/
    └── miniavatars/
```

### Database Structure
```javascript
// Firebase Realtime Database
{
  "preloadedBackgrounds": {
    "bg_1234567890": {
      "id": "bg_1234567890",
      "originalPath": "https://...",
      "thumbnailPath": "https://...",
      "uploadedAt": "2025-09-30T...",
      "uploadedBy": "adminUserId"
    }
  },
  "preloadedAvatars": {
    "avatar_1234567890": {
      "id": "avatar_1234567890",
      "originalPath": "https://...",
      "miniPath": "https://...",
      "uploadedAt": "2025-09-30T...",
      "uploadedBy": "adminUserId"
    }
  }
}
```

### Image Processing
**New utilities in `src/utils/imageUtils.js`:**
- `compressImage(file, quality, maxWidth, maxHeight)` - Compresses images
- `generateThumbnail(file, width, height)` - Creates thumbnails
- `cropToMiniAvatar(file, cropRatio)` - Creates mini avatars (existing)
- `resizeImage(file, maxWidth, maxHeight, maintainAspectRatio)` - Resizes images (existing)

### Store Actions
**New actions in `src/stores/rooms.js`:**
- `fetchPreloadedBackgrounds()` - Loads backgrounds from DB
- `fetchPreloadedAvatars()` - Loads avatars from DB
- `uploadPreloadedBackground(file, adminUserId)` - Admin uploads background
- `uploadPreloadedAvatar(file, adminUserId)` - Admin uploads avatar
- `deletePreloadedBackground(backgroundId)` - Deletes background
- `deletePreloadedAvatar(avatarId)` - Deletes avatar

## User Flow

### Creating/Editing a Room
1. Navigate to Create/Edit Room
2. **Background Selection:**
   - Switch between "Upload Custom" and "Select Preloaded" tabs
   - Preview selected background
   - Clear selection if needed
3. **Avatar Selection:**
   - Switch between "Upload Custom" and "Select Preloaded" tabs
   - Select multiple avatars via checkboxes
   - Mix custom and preloaded avatars
   - See count of selected avatars
4. Save room

### Admin Management
1. Navigate to Profile page
2. Admin Panel appears (only for admins)
3. **Manage Backgrounds:**
   - Upload new backgrounds (compressed + thumbnail generated)
   - View all preloaded backgrounds
   - Delete backgrounds as needed
4. **Manage Avatars:**
   - Upload new avatars (miniavatar generated automatically)
   - View all preloaded avatars
   - Delete avatars as needed

## Key Benefits

✅ **Efficient Storage**: Database linking eliminates repeated `listAll()` calls
✅ **Optimized Images**: Automatic compression and thumbnail generation
✅ **User Experience**: Clear UI indicators for "uploaded" vs "preselected"
✅ **Admin Control**: Centralized asset management
✅ **Backward Compatible**: Works with existing room backgrounds/avatars
✅ **Mixed Selection**: Users can combine uploaded and preselected assets

## Configuration

### Enable Admin Access
Set `isAdmin: true` in Firebase user document:
```javascript
{
  "users": {
    "userId": {
      "isAdmin": true,
      // other user fields...
    }
  }
}
```

### Image Limits
- **Background max size**: 5MB
- **Avatar max size**: 1MB
- **Background compression**: 1920x1080, quality 0.8
- **Thumbnail size**: 300x200
- **Miniavatar size**: 64x64

## Files Modified
1. `src/components/RoomForm.vue` - Integrated new selectors
2. `src/views/Profile.vue` - Added AdminPanel component
3. `src/stores/rooms.js` - Added admin management actions
4. `src/utils/imageUtils.js` - Added compression utilities

## Files Created
1. `src/components/BackgroundSelector.vue` - Background selection UI
2. `src/components/RoomAvatarSelector.vue` - Avatar multi-selection UI
3. `src/components/AdminPanel.vue` - Admin management interface
4. `public/rooms/backgrounds/L1/` - Background storage directory
5. `public/avatars/L1/` - Avatar storage directory

## Testing Checklist
- [x] Upload custom background
- [x] Select preloaded background
- [x] Upload multiple custom avatars
- [x] Select multiple preloaded avatars
- [x] Mix uploaded and preloaded avatars
- [x] Admin: Upload background (verify compression)
- [x] Admin: Upload avatar (verify miniavatar)
- [x] Admin: Delete background
- [x] Admin: Delete avatar
- [x] Edit existing room with assets
- [x] Verify backward compatibility with existing rooms

## Future Enhancements
- [ ] Image preview before upload
- [ ] Batch upload for avatars
- [ ] Category/tag system for assets
- [ ] Asset usage analytics
- [ ] Pagination for large asset libraries
- [ ] Asset search/filter functionality