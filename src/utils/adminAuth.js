import { getFirebaseApp } from '@/config/firebase';
import { getAuth } from 'firebase/auth';

// Admin email addresses - in production, this should come from a database/config
const ADMIN_EMAILS = [
  // Add admin emails here
  'admin@toonstalk.com',
  'pablo.reyes.mail@gmail.com',
  // For development/testing, you can add your email here
];

/**
 * Check if current user is an admin
 */
export const isCurrentUserAdmin = () => {
  try {
    getFirebaseApp(); // Ensure Firebase is initialized
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user || !user.email) {
      return false;
    }

    return ADMIN_EMAILS.includes(user.email.toLowerCase());
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Check if current user can access admin routes
 */
export const canAccessAdminRoutes = () => {
  // In development, allow access if no user is signed in (for testing)
  if (process.env.NODE_ENV === 'development') {
    const auth = getAuth();
    const user = auth.currentUser;

    // If no user signed in during development, allow access
    if (!user) {
      console.log('🔧 Development mode: allowing admin access without authentication');
      return true;
    }
  }

  return isCurrentUserAdmin();
};

/**
 * Admin route guard middleware
 */
export const adminGuard = (to, from, next) => {
  if (canAccessAdminRoutes()) {
    next();
  } else {
    console.warn('🚫 Access denied: Admin privileges required for', to.path);
    next('/'); // Redirect to home
  }
};

export default {
  isCurrentUserAdmin,
  canAccessAdminRoutes,
  adminGuard,
};
