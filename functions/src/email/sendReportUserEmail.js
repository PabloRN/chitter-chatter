const { onValueCreated } = require('firebase-functions/v2/database');
const admin = require('firebase-admin');
const { createTransporter, gmailEmail } = require('./nodemailer-config');
const { getReportUserEmailConfig } = require('../../templates/email-helpers');

// Cloud Function to send email when user is reported
exports.sendReportUserEmail = onValueCreated(
  {
    ref: '/reports/users/{reportId}',
    region: 'us-central1',
  },
  async (event) => {
    const { reportId } = event.params;
    const reportData = event.data.val();

    // Validate report data
    if (!reportData || !reportData.reportedUserId || !reportData.reason) {
      console.error('Invalid report data:', reportData);
      return { success: false, error: 'Invalid report data' };
    }

    try {
      const transporter = createTransporter();

      const mailOptions = getReportUserEmailConfig({
        to: 'toonstalk.contact+report@gmail.com',
        reportedUserId: reportData.reportedUserId,
        reportedUserNickname: reportData.reportedUserNickname,
        reporterId: reportData.reportedBy,
        reporterNickname: reportData.reportedByNickname,
        reason: reportData.reason,
        description: reportData.description,
        reportId,
        fromEmail: gmailEmail.value(),
      });

      const info = await transporter.sendMail(mailOptions);
      console.log('User report email sent successfully:', info.messageId);

      await admin.database().ref(`reports/users/${reportId}`).update({
        emailSent: true,
        emailSentAt: admin.database.ServerValue.TIMESTAMP,
        emailMessageId: info.messageId,
        processed: true,
      });

      return { success: true };
    } catch (error) {
      console.error('Error sending user report email:', error);

      try {
        await admin.database().ref(`reports/users/${reportId}`).update({
          emailSent: false,
          emailError: error.message,
          emailAttemptedAt: admin.database.ServerValue.TIMESTAMP,
          processed: true,
        });
      } catch (updateError) {
        console.error('Error updating report entry:', updateError);
      }

      return { success: false, error: error.message };
    }
  },
);
