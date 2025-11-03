const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

/**
 * ADMIN FUNCTION: Get all users with pagination, search, and filtering
 *
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - search: Search by nickname, email, or userId
 * - tier: Filter by subscription tier (free, landlord, creator)
 * - status: Filter by status (registered, anonymous, online, offline, admin)
 * - sortBy: Sort field (createdAt, lastOnline, level) default: createdAt
 * - sortOrder: Sort order (asc, desc) default: desc
 */
exports.getAllUsers = onRequest(
  {
    region: 'us-central1',
    cors: true,
  },
  async (req, res) => {
    // Only allow GET requests
    if (req.method !== 'GET') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    try {
      // Verify authentication
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized: No authentication token provided',
        });
        return;
      }

      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const userId = decodedToken.uid;

      // Verify user is admin
      const db = admin.database();
      const userSnapshot = await db.ref(`users/${userId}`).once('value');
      const userData = userSnapshot.val();

      if (!userData || !userData.isAdmin) {
        res.status(403).json({
          success: false,
          error: 'Forbidden: Admin privileges required',
        });
        return;
      }

      console.log(`📊 Admin ${userId} requesting user list`);

      // Parse query parameters
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
      const search = (req.query.search || '').toLowerCase().trim();
      const tierFilter = req.query.tier || null;
      const statusFilter = req.query.status || null;

      // Fetch all users from database
      const usersSnapshot = await db.ref('users').once('value');
      const usersData = usersSnapshot.val();

      if (!usersData) {
        res.status(200).json({
          success: true,
          data: [],
          pagination: {
            page: 1,
            limit,
            total: 0,
            totalPages: 0,
          },
        });
        return;
      }

      // Convert to array and add userId
      let users = Object.entries(usersData).map(([id, userRecord]) => ({
        userId: id,
        ...userRecord,
      }));

      // Apply search filter
      if (search) {
        users = users.filter((user) => {
          const nickname = (user.nickname || '').toLowerCase();
          const email = (user.email || '').toLowerCase();
          const uid = (user.userId || '').toLowerCase();

          return nickname.includes(search)
            || email.includes(search)
            || uid.includes(search);
        });
      }

      // Apply tier filter
      if (tierFilter) {
        users = users.filter((user) => (user.subscriptionTier || user.subscription?.tier || 'free') === tierFilter);
      }

      // Apply status filter
      if (statusFilter) {
        switch (statusFilter) {
          case 'registered':
            users = users.filter((user) => !user.isAnonymous);
            break;
          case 'anonymous':
            users = users.filter((user) => user.isAnonymous);
            break;
          case 'online':
            users = users.filter((user) => user.onlineState);
            break;
          case 'offline':
            users = users.filter((user) => !user.onlineState);
            break;
          case 'admin':
            users = users.filter((user) => user.isAdmin);
            break;
          default:
            // Unknown status filter: do not alter the users list
            break;
        }
      }

      // Sort users (default: by createdAt descending)
      users.sort((a, b) => {
        const aCreated = a.createdAt || 0;
        const bCreated = b.createdAt || 0;
        return bCreated - aCreated; // Newest first
      });

      // Calculate pagination
      const total = users.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      // Get paginated results
      const paginatedUsers = users.slice(startIndex, endIndex);

      // Remove sensitive data
      const sanitizedUsers = paginatedUsers.map((user) => {
        const {
          // Remove sensitive fields
          privateMessage,
          blocked,
          blockedBy,
          ...safeUser
        } = user;

        return {
          ...safeUser,
          // Add computed fields
          ownedRoomsCount: user.ownedRooms?.length || 0,
          favoriteRoomsCount: user.favoriteRooms?.length || 0,
        };
      });

      console.log(`✅ Returning ${sanitizedUsers.length} users (page ${page}/${totalPages}, total: ${total})`);

      // Return response
      res.status(200).json({
        success: true,
        data: sanitizedUsers,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
        filters: {
          search: search || null,
          tier: tierFilter,
          status: statusFilter,
        },
      });
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    }
  },
);
