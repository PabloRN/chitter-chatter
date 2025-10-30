const { createTransporter } = require('./nodemailer-config');

/**
 * Send admin notification when a user subscribes
 * @param {Object} data - Subscription data {tier, userId, userEmail, subscriptionId}
 */
async function sendEmail(data) {
  try {
    const transporter = createTransporter();

    const tierNames = {
      landlord: 'Landlord',
      creator: 'Creator',
    };

    const tierName = tierNames[data.tier] || data.tier;
    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/New_York',
    });

    const mailOptions = {
      from: '"Toonstalk Admin" <toonstalk.contact@gmail.com>',
      to: 'toonstalk.contact@gmail.com',
      subject: `🎉 New ${tierName} Subscription!`,
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
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
                background: white;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                border-left: 4px solid #10b981;
              }
              .info-row {
                padding: 8px 0;
                border-bottom: 1px solid #eee;
              }
              .info-row:last-child {
                border-bottom: none;
              }
              .label {
                font-weight: bold;
                color: #666;
                display: inline-block;
                width: 140px;
              }
              .value {
                color: #333;
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
              <h1>🎉 New Subscription!</h1>
              <p>A user just subscribed to ${tierName}</p>
            </div>

            <div class="content">
              <p><strong>New Subscription Details:</strong></p>

              <div class="info-box">
                <div class="info-row">
                  <span class="label">Tier:</span>
                  <span class="value">${tierName}</span>
                </div>
                <div class="info-row">
                  <span class="label">User Email:</span>
                  <span class="value">${data.userEmail || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="label">User ID:</span>
                  <span class="value">${data.userId}</span>
                </div>
                <div class="info-row">
                  <span class="label">Subscription ID:</span>
                  <span class="value">${data.subscriptionId}</span>
                </div>
                <div class="info-row">
                  <span class="label">Timestamp:</span>
                  <span class="value">${timestamp}</span>
                </div>
              </div>

              <p>💰 <strong>Revenue Update:</strong> This subscription will generate recurring revenue!</p>
            </div>

            <div class="footer">
              <p>This is an automated notification from Toonstalk Admin System</p>
            </div>
          </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Admin subscription notification sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending admin subscription notification:', error);
    throw error;
  }
}

module.exports = { sendEmail };
