const { createTransporter } = require('./nodemailer-config');
const { defineString } = require('firebase-functions/params');

const appUrl = defineString('APP_URL', { default: 'http://localhost:8080' });

/**
 * Send subscription cancellation email
 * @param {string} email - User's email address
 * @param {Object} data - Cancellation data {tier, userId, subscriptionId, cancelAt, currentPeriodEnd}
 */
async function sendEmail(email, data) {
  try {
    const transporter = createTransporter();
    const baseUrl = appUrl.value();

    const tierNames = {
      landlord: 'Landlord',
      creator: 'Creator',
    };

    const tierName = tierNames[data.tier] || data.tier;
    const endDate = new Date(data.cancelAt || data.currentPeriodEnd);
    const formattedEndDate = endDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const mailOptions = {
      from: '"Toonstalk" <toonstalk.contact@gmail.com>',
      to: email,
      subject: `We're Sorry to See You Go - ${tierName} Subscription Canceled`,
      html: `
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
                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
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
              .button {
                display: inline-block;
                padding: 12px 30px;
                background: #667eea;
                color: white !important;
                text-decoration: none;
                border-radius: 6px;
                margin: 10px 5px;
                font-weight: bold;
              }
              .button-secondary {
                background: #6c757d;
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
              <h1>Subscription Canceled</h1>
              <p>Your ${tierName} subscription has been canceled</p>
            </div>

            <div class="content">
              <p>Hi there,</p>

              <p>We've received your cancellation request for your <strong>${tierName}</strong> subscription.</p>

              <div class="info-box">
                <strong>⏰ Important:</strong> You'll continue to have access to all ${tierName} features until <strong>${formattedEndDate}</strong>.
              </div>

              <p><strong>What happens next?</strong></p>
              <ul>
                <li>Your subscription will remain active until ${formattedEndDate}</li>
                <li>After that date, your account will revert to the Free tier</li>
                <li>All your rooms and data will be preserved</li>
                <li>You won't be charged again</li>
              </ul>

              <p><strong>Changed your mind?</strong><br>
              You can reactivate your subscription anytime before ${formattedEndDate}:</p>

              <center>
                <a href="${baseUrl}/profile" class="button">Reactivate Subscription</a>
                <a href="${baseUrl}/pricing" class="button button-secondary">View Plans</a>
              </center>

              <p><strong>We'd Love Your Feedback</strong><br>
              Your feedback helps us improve. If you have a moment, please let us know why you canceled at <a href="mailto:toonstalk.contact@gmail.com">toonstalk.contact@gmail.com</a></p>

              <p>Thank you for being part of the Toonstalk community. We hope to see you again!</p>

              <p>Best regards,<br>
              <strong>The Toonstalk Team</strong></p>
            </div>

            <div class="footer">
              <p>Subscription ID: ${data.subscriptionId}</p>
              <p>Service ends: ${formattedEndDate}</p>
              <p>This email was sent to ${email} to confirm your subscription cancellation.</p>
            </div>
          </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Subscription cancellation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending subscription cancellation email:', error);
    throw error;
  }
}

module.exports = { sendEmail };
