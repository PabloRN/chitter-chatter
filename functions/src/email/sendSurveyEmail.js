const { onValueCreated } = require('firebase-functions/v2/database');
const admin = require('firebase-admin');
const { createTransporter, gmailEmail } = require('./nodemailer-config');
const { getSurveyEmailConfig } = require('../../templates/email-helpers');

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
