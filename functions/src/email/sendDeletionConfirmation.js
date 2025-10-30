const { createTransporter } = require('./nodemailer-config');

/**
 * Send deletion confirmation email to user
 * Two types:
 * 1. Instant deletion - Account deleted immediately
 * 2. Pending review - Request submitted, awaiting admin review
 *
 * @param {string} email - User's email address
 * @param {Object} data - Deletion data {userId, deletionType, reason}
 */
async function sendEmail(email, data) {
  try {
    const transporter = createTransporter();
    const { userId, deletionType, reason } = data;

    let subject;
    let htmlContent;

    if (deletionType === 'instant') {
      subject = 'Your Toonstalk Account Has Been Deleted';
      htmlContent = generateInstantDeletionEmail();
    } else if (deletionType === 'pending_review') {
      subject = 'Your Toonstalk Account Deletion Request';
      htmlContent = generatePendingReviewEmail(reason);
    } else {
      throw new Error(`Unknown deletion type: ${deletionType}`);
    }

    const mailOptions = {
      from: '"Toonstalk" <toonstalk.contact@gmail.com>',
      to: email,
      subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ User deletion confirmation sent (${deletionType}):`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending user deletion confirmation:', error);
    throw error;
  }
}

/**
 * Generate email HTML for instant deletion
 */
function generateInstantDeletionEmail() {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .info-box {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            text-align: center;
            color: #999;
            font-size: 12px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Account Deleted</h1>
          <p>Your Toonstalk account has been successfully deleted</p>
        </div>

        <div class="content">
          <p>Hi there,</p>

          <p>Your Toonstalk account has been permanently deleted as requested.</p>

          <div class="info-box">
            <strong>⏰ Important:</strong> Your data will be retained in our archives for 30 days, after which it will be permanently deleted. If you change your mind within this period, please contact us at <a href="mailto:toonstalk.contact@gmail.com">toonstalk.contact@gmail.com</a>.
          </div>

          <p><strong>What has been deleted:</strong></p>
          <ul>
            <li>Your user profile and settings</li>
            <li>Your authentication credentials</li>
            <li>Your personal data</li>
            <li>Access to all Toonstalk features</li>
          </ul>

          <p><strong>What happens to your rooms:</strong></p>
          <ul>
            <li>Rooms you created have been transferred to system administration</li>
            <li>Other users can continue using these rooms</li>
            <li>Your messages and content remain visible (anonymized)</li>
          </ul>

          <p><strong>Want to come back?</strong><br>
          You're welcome to create a new account anytime at <a href="http://localhost:8080">Toonstalk</a>. We'd love to have you back!</p>

          <p>Thank you for being part of the Toonstalk community.</p>

          <p>Best regards,<br>
          <strong>The Toonstalk Team</strong></p>
        </div>

        <div class="footer">
          <p>This email confirms your account deletion request.</p>
          <p>If you did not request this deletion, please contact us immediately at <a href="mailto:toonstalk.contact@gmail.com">toonstalk.contact@gmail.com</a></p>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate email HTML for pending review
 */
function generatePendingReviewEmail(reason) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .info-box {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .reason-box {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border: 1px solid #ddd;
          }
          .footer {
            text-align: center;
            color: #999;
            font-size: 12px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Deletion Request Submitted</h1>
          <p>We're reviewing your account deletion request</p>
        </div>

        <div class="content">
          <p>Hi there,</p>

          <p>We've received your request to delete your Toonstalk account.</p>

          <div class="info-box">
            <strong>⏰ Review Timeline:</strong> We will review your request within 24 hours and send you a confirmation email once your account has been deleted.
          </div>

          <div class="reason-box">
            <strong>Why manual review is needed:</strong><br>
            ${reason}
          </div>

          <p><strong>What happens next:</strong></p>
          <ol>
            <li>Our team will review your account details</li>
            <li>We'll handle any active subscriptions or pending items</li>
            <li>Your account will be deleted within 24 hours</li>
            <li>You'll receive a confirmation email when completed</li>
          </ol>

          <p><strong>Changed your mind?</strong><br>
          If you no longer wish to delete your account, please contact us immediately at <a href="mailto:toonstalk.contact@gmail.com">toonstalk.contact@gmail.com</a> with your request to cancel the deletion.</p>

          <p><strong>Questions or concerns?</strong><br>
          Feel free to reach out to us at <a href="mailto:toonstalk.contact@gmail.com">toonstalk.contact@gmail.com</a> and we'll be happy to help.</p>

          <p>Thank you for your patience.</p>

          <p>Best regards,<br>
          <strong>The Toonstalk Team</strong></p>
        </div>

        <div class="footer">
          <p>This email confirms we've received your deletion request.</p>
          <p>You will receive another email within 24 hours once the deletion is complete.</p>
        </div>
      </body>
    </html>
  `;
}

module.exports = { sendEmail };
