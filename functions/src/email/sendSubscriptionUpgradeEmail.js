const { createTransporter } = require('./nodemailer-config');
const { defineString } = require('firebase-functions/params');

const appUrl = defineString('APP_URL', { default: 'http://localhost:8080' });

/**
 * Send subscription upgrade email
 * @param {string} email - User's email address
 * @param {Object} data - Upgrade data {previousTier, newTier, userId, subscriptionId}
 */
async function sendEmail(email, data) {
  try {
    const transporter = createTransporter();
    const baseUrl = appUrl.value();

    const tierNames = {
      landlord: 'Landlord',
      creator: 'Creator',
    };

    const tierFeatures = {
      landlord: [
        'Create up to 5 rooms',
        'Upload custom backgrounds',
        'Add up to 10 custom avatars',
        'Host up to 20 users per room',
        'Advanced moderation tools',
        'Room analytics and insights',
        'Priority support',
      ],
      creator: [
        'Unlimited public and private rooms',
        'Unlimited custom avatars and backgrounds',
        'Host up to 30 users per room',
        'Creator badge on your profile',
        'Early access to experimental features',
        'Custom room URLs',
        'Top-tier support',
      ],
    };

    const previousTierName = tierNames[data.previousTier] || data.previousTier;
    const newTierName = tierNames[data.newTier] || data.newTier;
    const newFeatures = tierFeatures[data.newTier] || [];

    const mailOptions = {
      from: '"Toonstalk" <toonstalk.contact@gmail.com>',
      to: email,
      subject: `🎉 Congratulations! You've Upgraded to ${newTierName}`,
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
              .upgrade-banner {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
                margin: 20px 0;
                font-size: 1.2rem;
                font-weight: bold;
              }
              .feature-list {
                background: white;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
              }
              .feature-item {
                padding: 8px 0;
                border-bottom: 1px solid #eee;
              }
              .feature-item:last-child {
                border-bottom: none;
              }
              .feature-item:before {
                content: "✓ ";
                color: #667eea;
                font-weight: bold;
                margin-right: 8px;
              }
              .button {
                display: inline-block;
                padding: 12px 30px;
                background: #667eea;
                color: white !important;
                text-decoration: none;
                border-radius: 6px;
                margin: 20px 0;
                font-weight: bold;
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
              <h1>🎉 You've Been Upgraded!</h1>
              <p>Welcome to ${newTierName}</p>
            </div>

            <div class="content">
              <p>Hi there!</p>

              <div class="upgrade-banner">
                ${previousTierName} → ${newTierName}
              </div>

              <p>Great news! Your subscription has been upgraded to <strong>${newTierName}</strong>. You now have access to even more powerful features to create amazing Toonstalk experiences!</p>

              <div class="feature-list">
                <h3 style="margin-top: 0;">Your ${newTierName} Features:</h3>
                ${newFeatures.map(feature => `<div class="feature-item">${feature}</div>`).join('')}
              </div>

              <p><strong>What happens next?</strong><br>
              All your new features are active immediately! Log in to your profile to start creating more rooms, uploading unlimited content, and enjoying all the benefits of ${newTierName}.</p>

              <center>
                <a href="${baseUrl}/profile" class="button">Go to My Profile</a>
              </center>

              <p><strong>Need Help?</strong><br>
              If you have any questions about your new features, our support team is here to help at <a href="mailto:toonstalk.contact@gmail.com">toonstalk.contact@gmail.com</a></p>

              <p>Thank you for continuing to support Toonstalk and upgrading your experience!</p>

              <p>Best regards,<br>
              <strong>The Toonstalk Team</strong></p>
            </div>

            <div class="footer">
              <p>Subscription ID: ${data.subscriptionId}</p>
              <p>This email was sent to ${email} because you upgraded your Toonstalk subscription.</p>
            </div>
          </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Subscription upgrade email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending subscription upgrade email:', error);
    throw error;
  }
}

module.exports = { sendEmail };
