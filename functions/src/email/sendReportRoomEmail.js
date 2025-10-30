const { onValueCreated } = require('firebase-functions/v2/database');
const admin = require('firebase-admin');
const { createTransporter, gmailEmail } = require('./nodemailer-config');
const { getReportRoomEmailConfig } = require('../../templates/email-helpers');

// Cloud Function to send email when room is reported
exports.sendReportRoomEmail = onValueCreated(
  {
    ref: '/reports/rooms/{reportId}',
    region: 'us-central1',
  },
  async (event) => {
    const { reportId } = event.params;
    const reportData = event.data.val();

    // Validate report data
    if (!reportData || !reportData.reportedRoomId || !reportData.reason) {
      console.error('Invalid report data:', reportData);
      return { success: false, error: 'Invalid report data' };
    }

    try {
      const transporter = createTransporter();

      const mailOptions = getReportRoomEmailConfig({
        to: 'toonstalk.contact+report@gmail.com',
        reportedRoomId: reportData.reportedRoomId,
        reportedRoomName: reportData.reportedRoomName,
        reporterId: reportData.reportedBy,
        reporterNickname: reportData.reportedByNickname,
        reason: reportData.reason,
        description: reportData.description,
        reportId,
        fromEmail: gmailEmail.value(),
      });

      const info = await transporter.sendMail(mailOptions);
      console.log('Room report email sent successfully:', info.messageId);

      await admin.database().ref(`reports/rooms/${reportId}`).update({
        emailSent: true,
        emailSentAt: admin.database.ServerValue.TIMESTAMP,
        emailMessageId: info.messageId,
        processed: true,
      });

      return { success: true };
    } catch (error) {
      console.error('Error sending room report email:', error);

      try {
        await admin.database().ref(`reports/rooms/${reportId}`).update({
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
