const { createTransporter } = require('./nodemailer-config');
const { defineString } = require('firebase-functions/params');

const appUrl = defineString('APP_URL', { default: 'http://localhost:8080' });

/**
 * Send subscription downgrade email
 * @param {string} email - User's email address
 * @param {Object} data - Downgrade data {previousTier, newTier, userId, subscriptionId, effectiveDate}
 */
async function sendEmail(email, data) {
  try {
    const transporter = createTransporter();
    const baseUrl = appUrl.value();

    const tierNames = {
      landlord: 'Landlord',
      creator: 'Creator',
    };

    const previousTierName = tierNames[data.previousTier] || data.previousTier;
    const newTierName = tierNames[data.newTier] || data.newTier;
    const effectiveDate = new Date(data.effectiveDate);
    const formattedDate = effectiveDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const tierFeatures = {
      landlord: [
        'Create up to 5 rooms',
        'Upload custom backgrounds',
        'Add up to 10 custom avatars',
        'Host up to 20 users per room',
        'Advanced moderation tools',
        'Priority support',
      ],
      creator: [
        'Unlimited public and private rooms',
        'Unlimited custom avatars and backgrounds',
        'Host up to 30 users per room',
        'Creator badge on your profile',
        'Early access to experimental features',
        'Custom room URLs',
      ],
    };

    // Features they'll lose (in previous tier but not in new tier)
    const previousFeatures = tierFeatures[data.previousTier] || [];
    const newFeatures = tierFeatures[data.newTier] || [];

    const mailOptions = {
      from: '"Toonstalk" <toonstalk.contact@gmail.com>',
      to: email,
      subject: `⚠️ Subscription Change Scheduled: ${previousTierName} → ${newTierName}`,
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
              .timing-box {
                background: #fef3c7;
                border-left: 4px solid #f59e0b;
                padding: 20px;
                margin: 20px 0;
                border-radius: 4px;
              }
              .timing-box strong {
                color: #d97706;
                font-size: 1.1rem;
              }
              .downgrade-banner {
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                color: white;
                padding: 15px;
                border-radius: 8px;
                text-align: center;
                margin: 20px 0;
                font-size: 1.1rem;
                font-weight: bold;
              }
              .feature-list {
                background: white;
                padding: 20px;
                border-radius: 8px;
                margin: 15px 0;
              }
              .feature-item {
                padding: 8px 0;
                border-bottom: 1px solid #eee;
              }
              .feature-item:last-child {
                border-bottom: none;
              }
              .feature-item.kept:before {
                content: "✓ ";
                color: #10b981;
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
              <h1>⚠️ Subscription Change Scheduled</h1>
              <p>Your plan will change at the end of your billing period</p>
            </div>

            <div class="content">
              <p>Hi there!</p>

              <div class="downgrade-banner">
                ${previousTierName} → ${newTierName}
              </div>

              <p>We've received your request to change from <strong>${previousTierName}</strong> to <strong>${newTierName}</strong>.</p>

              <div class="timing-box">
                <strong>⏰ Important: When does this take effect?</strong><br><br>
                Your subscription will change on <strong>${formattedDate}</strong> at the end of your current billing period.<br><br>
                Until then, you'll continue to have full access to all your ${previousTierName} features.
              </div>

              <p><strong>What happens to my content?</strong><br>
              All your rooms, avatars, backgrounds, and data will be preserved. However, if you currently have more content than the ${newTierName} tier allows (for example, more than 5 rooms on Landlord), you'll need to delete or archive some items before creating new ones after ${formattedDate}.</p>

              <div class="feature-list">
                <h3 style="margin-top: 0; color: #10b981;">Your ${newTierName} Features:</h3>
                ${newFeatures.map((feature) => `<div class="feature-item kept">${feature}</div>`).join('')}
              </div>

              <p><strong>Changed your mind?</strong><br>
              You can cancel this change and keep your ${previousTierName} subscription anytime before ${formattedDate}. Just visit your Stripe Customer Portal to manage your subscription.</p>

              <center>
                <a href="${baseUrl}/profile" class="button">Go to My Profile</a>
                <a href="${baseUrl}/pricing" class="button button-secondary">View All Plans</a>
              </center>

              <p>If you have any questions about your subscription change, our support team is here to help at <a href="mailto:toonstalk.contact@gmail.com">toonstalk.contact@gmail.com</a></p>

              <p>Thank you for being part of Toonstalk!</p>

              <p>Best regards,<br>
              <strong>The Toonstalk Team</strong></p>
            </div>

            <div class="footer">
              <p>Subscription ID: ${data.subscriptionId}</p>
              <p>Current plan expires: ${formattedDate}</p>
              <p>This email was sent to ${email} to confirm your subscription change.</p>
            </div>
          </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Subscription downgrade email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending subscription downgrade email:', error);
    throw error;
  }
}

module.exports = { sendEmail };
