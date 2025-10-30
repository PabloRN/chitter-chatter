const { onValueCreated } = require('firebase-functions/v2/database');
const admin = require('firebase-admin');
const { createTransporter, gmailEmail } = require('./nodemailer-config');

// Cloud Function triggered when feedback is created in Realtime Database
exports.sendFeedbackEmail = onValueCreated(
  {
    ref: '/feedback/{feedbackId}',
    region: 'us-central1',
  },
  async (event) => {
    const { feedbackId } = event.params;
    const feedbackData = event.data.val();

    // Validate feedback data
    if (!feedbackData || !feedbackData.email || !feedbackData.title) {
      console.error('Invalid feedback data:', feedbackData);
      return { success: false, error: 'Invalid feedback data' };
    }

    try {
      // Create email transporter
      const transporter = createTransporter();

      // Format timestamp for email
      const timestamp = feedbackData.createdAt
        ? new Date(feedbackData.createdAt).toISOString()
        : new Date().toISOString();

      // Compose email
      const mailOptions = {
        from: `ToonsTalk Feedback <${gmailEmail.value()}>`,
        // to: 'contact+feedback@toonstalk.com',
        to: 'toonstalk.contact+feedback@gmail.com',
        subject: `Feedback: ${feedbackData.title}`,
        html: `
          <h2>New Feedback Received</h2>
          <p><strong>From:</strong> ${feedbackData.fullName} (${feedbackData.email})</p>
          <p><strong>Title:</strong> ${feedbackData.title}</p>
          <p><strong>Description:</strong></p>
          <p>${feedbackData.description.replace(/\n/g, '<br>')}</p>
          <hr>
          <p><small>User ID: ${feedbackData.userId || 'Anonymous'}</small></p>
          <p><small>Submitted: ${timestamp}</small></p>
          <p><small>Feedback ID: ${feedbackId}</small></p>
        `,
      };

      // Send email
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);

      // Update feedback entry with delivery status
      await admin.database().ref(`feedback/${feedbackId}`).update({
        emailSent: true,
        emailSentAt: admin.database.ServerValue.TIMESTAMP,
        emailMessageId: info.messageId,
        processed: true,
      });

      return { success: true };
    } catch (error) {
      console.error('Error sending feedback email:', error);

      // Update feedback entry with error
      try {
        await admin.database().ref(`feedback/${feedbackId}`).update({
          emailSent: false,
          emailError: error.message,
          emailAttemptedAt: admin.database.ServerValue.TIMESTAMP,
          processed: true,
        });
      } catch (updateError) {
        console.error('Error updating feedback entry:', updateError);
      }

      // Don't throw error - we've logged it and updated the database
      return { success: false, error: error.message };
    }
  },
);
