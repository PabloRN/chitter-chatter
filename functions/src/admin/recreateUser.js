const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

/**
 * ADMIN FUNCTION: Recreate a user in Firebase Auth with existing database data
 * Use this when a user was accidentally deleted from Auth but data remains in database
 *
 * POST request body:
 * {
 *   "userId": "the-user-id",
 *   "email": "user@example.com"
 * }
 */
exports.recreateUser = onRequest(
  {
    region: 'us-central1',
    cors: true,
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const { userId, email } = req.body;

    if (!userId || !email) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: userId and email',
      });
      return;
    }

    console.log('🔄 Recreating user in Firebase Auth...');
    console.log(`   User ID: ${userId}`);
    console.log(`   Email: ${email}`);

    try {
      const db = admin.database();
      const auth = admin.auth();

      // Step 1: Get user data from database
      console.log('📊 Fetching user data from database...');
      const userSnapshot = await db.ref(`users/${userId}`).once('value');
      const userData = userSnapshot.val();

      if (!userData) {
        res.status(404).json({
          success: false,
          error: 'User not found in database',
        });
        return;
      }

      console.log('✅ User found in database');
      console.log(`   - Nickname: ${userData.nickname || 'N/A'}`);
      console.log(`   - Avatar: ${userData.personalAvatar ? 'Yes' : 'No'}`);
      console.log(`   - isAnonymous: ${userData.isAnonymous}`);
      console.log(`   - Subscription: ${userData.subscriptionTier || 'free'}`);

      // Step 2: Check if user already exists in Auth
      console.log('🔍 Checking if user exists in Firebase Auth...');
      let userExistsInAuth = false;
      try {
        const existingUser = await auth.getUser(userId);
        userExistsInAuth = true;
        console.log('⚠️  User already exists in Firebase Auth!');
        console.log(`   Providers: ${existingUser.providerData.map(p => p.providerId).join(', ') || 'NONE'}`);

        // If user exists but has no providers, delete and recreate
        if (existingUser.providerData.length === 0) {
          console.log('🗑️  User has no authentication providers. Deleting and recreating...');
          await auth.deleteUser(userId);
          userExistsInAuth = false;
        } else {
          // Check if request asks to recreate anyway (for adding providers)
          const forceRecreate = req.body.forceRecreate === true;
          if (forceRecreate) {
            console.log('🔄 Force recreate requested. Deleting existing user...');
            await auth.deleteUser(userId);
            userExistsInAuth = false;
          } else {
            res.status(200).json({
              success: true,
              message: 'User already exists in Firebase Auth with valid providers. Use forceRecreate=true to recreate.',
              alreadyExists: true,
              providers: existingUser.providerData.map(p => p.providerId),
            });
            return;
          }
        }
      } catch (authError) {
        if (authError.code === 'auth/user-not-found') {
          console.log('✅ Confirmed: User not in Auth (as expected)');
        } else {
          throw authError;
        }
      }

      // Step 3: Recreate user in Firebase Auth with SAME UID
      console.log('🔧 Recreating user in Firebase Auth...');

      // Generate a random temporary password
      const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!';

      const newUser = await auth.createUser({
        uid: userId, // ⭐ Using the SAME UID
        email: email,
        emailVerified: true, // Set to true so they can login immediately
        password: tempPassword, // Add password provider
        displayName: userData.nickname || 'User',
        photoURL: userData.personalAvatar || null,
      });

      console.log('✅ User successfully recreated in Firebase Auth!');
      console.log('🔑 Temporary password set - user should reset via "Forgot Password"');

      // Step 4: Update database to ensure isAnonymous is false
      console.log('📝 Updating database to ensure user is not anonymous...');
      await db.ref(`users/${userId}`).update({
        isAnonymous: false,
        onlineState: false,
        status: 'offline',
      });
      console.log('✅ Database updated');

      console.log('🎉 SUCCESS! User has been fully restored!');

      res.status(200).json({
        success: true,
        message: 'User successfully recreated in Firebase Auth',
        user: {
          uid: newUser.uid,
          email: newUser.email,
          emailVerified: newUser.emailVerified,
          displayName: newUser.displayName,
        },
        nextSteps: [
          `User can now login with: ${email}`,
          'They may need to reset password if they don\'t remember it',
          'Or they can use "Sign in with Google" if this is a Google account',
        ],
      });
    } catch (error) {
      console.error('❌ Error recreating user:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },
);
