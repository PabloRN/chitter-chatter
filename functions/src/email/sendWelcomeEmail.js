const { onValueCreated } = require('firebase-functions/v2/database');
const admin = require('firebase-admin');
const { createTransporter, gmailEmail } = require('./nodemailer-config');
const { getWelcomeEmailConfig } = require('../../templates/email-helpers');

// Cloud Function to send welcome email when user registers/upgrades
exports.sendWelcomeEmail = onValueCreated(
  {
    ref: '/users/{userId}',
    region: 'us-central1',
  },
  async (event) => {
    const { userId } = event.params;
    const userData = event.data.val();

    // Only send welcome email to non-anonymous users who haven't received it yet
    if (userData.isAnonymous || userData.welcomeEmailSent) {
      console.log('Skipping welcome email - user is anonymous or already received email');
      return { success: false, reason: 'Not applicable' };
    }

    // Get user email from Firebase Auth
    try {
      const userRecord = await admin.auth().getUser(userId);
      const userEmail = userRecord.email;

      if (!userEmail) {
        console.log('No email found for user:', userId);
        return { success: false, error: 'No email available' };
      }

      // Create email transporter
      const transporter = createTransporter();

      // Get welcome email configuration
      const mailOptions = getWelcomeEmailConfig({
        to: userEmail,
        nickname: userData.nickname || 'Friend',
        fromEmail: gmailEmail.value(),
      });

      // Send email
      const info = await transporter.sendMail(mailOptions);
      console.log('Welcome email sent successfully:', info.messageId);

      // Update user record with welcome email status
      await admin.database().ref(`users/${userId}`).update({
        welcomeEmailSent: true,
        welcomeEmailSentAt: admin.database.ServerValue.TIMESTAMP,
        welcomeEmailMessageId: info.messageId,
      });

      return { success: true };
    } catch (error) {
      console.error('Error sending welcome email:', error);

      // Update user record with error
      try {
        await admin.database().ref(`users/${userId}`).update({
          welcomeEmailSent: false,
          welcomeEmailError: error.message,
          welcomeEmailAttemptedAt: admin.database.ServerValue.TIMESTAMP,
        });
      } catch (updateError) {
        console.error('Error updating user record:', updateError);
      }

      return { success: false, error: error.message };
    }
  },
);
