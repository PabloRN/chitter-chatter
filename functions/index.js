const { onValueCreated, onValueUpdated } = require('firebase-functions/v2/database');
const { defineString } = require('firebase-functions/params');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const {
  getWelcomeEmailConfig,
  getSurveyEmailConfig,
  getReportUserEmailConfig,
  getReportRoomEmailConfig,
} = require('./templates/email-helpers');

// Initialize Firebase Admin
admin.initializeApp();

// Define parameters (environment variables)
const gmailEmail = defineString('GMAIL_EMAIL', { default: 'toonstalk.contact@gmail.com' });
const gmailPassword = defineString('GMAIL_PASSWORD');

// Create SMTP transporter
const createTransporter = () => nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: gmailEmail.value(),
    pass: gmailPassword.value(),
  },
});

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

// Cloud Function to send email when survey is submitted
exports.sendSurveyEmail = onValueCreated(
  {
    ref: '/surveys/{surveyId}',
    region: 'us-central1',
  },
  async (event) => {
    const { surveyId } = event.params;
    const surveyData = event.data.val();

    // Validate survey data
    if (!surveyData || !surveyData.rating || !surveyData.userId) {
      console.error('Invalid survey data:', surveyData);
      return { success: false, error: 'Invalid survey data' };
    }

    try {
      // Create email transporter
      const transporter = createTransporter();

      // Get user nickname from database
      const userSnapshot = await admin.database().ref(`users/${surveyData.userId}`).once('value');
      const userData = userSnapshot.val();
      const nickname = userData?.nickname || 'Anonymous';

      // Get survey email configuration
      const mailOptions = getSurveyEmailConfig({
        to: 'toonstalk.contact+survey-feedback@gmail.com',
        nickname,
        rating: surveyData.rating,
        feedback: surveyData.feedback || 'No additional feedback provided.',
        userId: surveyData.userId,
        fromEmail: gmailEmail.value(),
      });

      // Send email
      const info = await transporter.sendMail(mailOptions);
      console.log('Survey email sent successfully:', info.messageId);

      // Update survey entry with delivery status
      await admin.database().ref(`surveys/${surveyId}`).update({
        emailSent: true,
        emailSentAt: admin.database.ServerValue.TIMESTAMP,
        emailMessageId: info.messageId,
        processed: true,
      });

      return { success: true };
    } catch (error) {
      console.error('Error sending survey email:', error);

      // Update survey entry with error
      try {
        await admin.database().ref(`surveys/${surveyId}`).update({
          emailSent: false,
          emailError: error.message,
          emailAttemptedAt: admin.database.ServerValue.TIMESTAMP,
          processed: true,
        });
      } catch (updateError) {
        console.error('Error updating survey entry:', updateError);
      }

      return { success: false, error: error.message };
    }
  },
);

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
