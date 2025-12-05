const { defineString } = require('firebase-functions/params');
const { createTransporter } = require('./nodemailer-config');

const appUrl = defineString('APP_URL', { default: 'http://localhost:8080' });

/**
 * Send Owner upgrade confirmation email
 * @param {string} email - User's email address
 * @param {Object} data - Purchase data {userId, sessionId, amount}
 */
async function sendEmail(email, data) {
  try {
    const transporter = createTransporter();
    const baseUrl = appUrl.value();

    const ownerFeatures = [
      'Upload custom backgrounds',
      'Upload custom avatars',
      'Host up to 20 users per room',
      'Create private rooms',
      'Advanced moderation tools',
      'Priority support',
      'Purchase additional room slots anytime',
    ];

    const mailOptions = {
      from: '"Toonstalk" <toonstalk.contact@gmail.com>',
      to: email,
      subject: '🎉 Welcome to Room Owner! Your Upgrade is Complete',
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
              .highlight-box {
                background: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🎉 Congratulations!</h1>
              <p>You're now a Room Owner!</p>
            </div>

            <div class="content">
              <p>Hi there!</p>

              <p>Thank you for upgrading to <strong>Room Owner</strong>! Your one-time payment of <strong>$${data.amount.toFixed(2)}</strong> has been processed, and you now have access to all premium features.</p>

              <div class="feature-list">
                <h3 style="margin-top: 0;">Your Room Owner Features:</h3>
                ${ownerFeatures.map((feature) => `<div class="feature-item">${feature}</div>`).join('')}
              </div>

              <div class="highlight-box">
                <strong>💡 Pro Tip:</strong> Need more rooms? You can purchase additional room slots ($4.99 each) anytime from your profile or the pricing page!
              </div>

              <p>You can manage your rooms and view your profile here:</p>
              <center>
                <a href="${baseUrl}/profile" class="button">Go to My Profile</a>
              </center>

              <p><strong>Need Help?</strong><br>
              If you have any questions or need assistance, our support team is here to help at <a href="mailto:toonstalk.contact@gmail.com">toonstalk.contact@gmail.com</a></p>

              <p>Thanks for being part of the Toonstalk community!</p>

              <p>Best regards,<br>
              <strong>The Toonstalk Team</strong></p>
            </div>

            <div class="footer">
              <p>Payment Amount: $${data.amount.toFixed(2)} (One-time)</p>
              <p>Session ID: ${data.sessionId}</p>
              <p>This email was sent to ${email} because you upgraded to Toonstalk Room Owner.</p>
            </div>
          </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Owner upgrade confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending Owner upgrade confirmation email:', error);
    throw error;
  }
}

module.exports = { sendEmail };
