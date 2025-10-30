const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

// ============================================================================
// EMAIL FUNCTIONS - Import from src/email/
// ============================================================================
const { sendFeedbackEmail } = require('./src/email/sendFeedbackEmail');
const { sendWelcomeEmail } = require('./src/email/sendWelcomeEmail');
const { sendSurveyEmail } = require('./src/email/sendSurveyEmail');
const { sendReportUserEmail } = require('./src/email/sendReportUserEmail');
const { sendReportRoomEmail } = require('./src/email/sendReportRoomEmail');

// ============================================================================
// STRIPE FUNCTIONS - Import from src/stripe/
// ============================================================================
const { createCheckoutSession } = require('./src/stripe/createCheckoutSession');
const { createPortalSession } = require('./src/stripe/createPortalSession');
const { handleStripeWebhook } = require('./src/stripe/handleStripeWebhook');
const { purchaseRoomSlot } = require('./src/stripe/purchaseRoomSlot');

// ============================================================================
// CLEANUP FUNCTIONS - Import from src/cleanup/
// ============================================================================
const { cleanupAnonymousUsers } = require('./src/cleanup/cleanupAnonymousUsers');
const { removeGhostUsers } = require('./src/cleanup/removeGhostUsers');
const { manualCleanupNow } = require('./src/cleanup/manualCleanupNow');

// ============================================================================
// TRACKING FUNCTIONS - Import from src/tracking/
// ============================================================================
const { trackOnlineTime } = require('./src/tracking/trackOnlineTime');

// ============================================================================
// DELETION FUNCTIONS - Import from src/deletion/
// ============================================================================
const { requestAccountDeletion } = require('./src/deletion/requestAccountDeletion');
const { cleanupArchivedUsers } = require('./src/deletion/cleanupArchivedUsers');
const { approvePendingDeletion } = require('./src/deletion/approvePendingDeletion');

// ============================================================================
// EXPORTS - Export all functions
// ============================================================================

// Email Functions
exports.sendFeedbackEmail = sendFeedbackEmail;
exports.sendWelcomeEmail = sendWelcomeEmail;
exports.sendSurveyEmail = sendSurveyEmail;
exports.sendReportUserEmail = sendReportUserEmail;
exports.sendReportRoomEmail = sendReportRoomEmail;

// Stripe Functions
exports.createCheckoutSession = createCheckoutSession;
exports.createPortalSession = createPortalSession;
exports.handleStripeWebhook = handleStripeWebhook;
exports.purchaseRoomSlot = purchaseRoomSlot;

// Cleanup Functions
exports.cleanupAnonymousUsers = cleanupAnonymousUsers;
exports.removeGhostUsers = removeGhostUsers;
exports.manualCleanupNow = manualCleanupNow; // For testing - call anytime

// Tracking Functions
exports.trackOnlineTime = trackOnlineTime;

// Deletion Functions
exports.requestAccountDeletion = requestAccountDeletion;
exports.cleanupArchivedUsers = cleanupArchivedUsers;
exports.approvePendingDeletion = approvePendingDeletion;
