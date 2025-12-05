const { createTransporter } = require('./nodemailer-config');

/**
 * Send admin notification when a user purchases a room slot
 * @param {Object} data - Purchase data {userId, userEmail, amount, sessionId, newTotalSlots}
 */
async function sendEmail(data) {
  try {
    const transporter = createTransporter();

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
      subject: '💎 Room Slot Purchase - $4.99!',
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
                width: 160px;
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
              .revenue {
                background: #d4edda;
                border-left: 4px solid #28a745;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>💎 Room Slot Purchase!</h1>
              <p>A user just purchased an extra room slot</p>
            </div>

            <div class="content">
              <p><strong>Room Slot Purchase Details:</strong></p>

              <div class="info-box">
                <div class="info-row">
                  <span class="label">Product:</span>
                  <span class="value">Extra Room Slot (One-time)</span>
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
                  <span class="label">Amount Paid:</span>
                  <span class="value">$${data.amount.toFixed(2)}</span>
                </div>
                <div class="info-row">
                  <span class="label">New Total Slots:</span>
                  <span class="value">${data.newTotalSlots} rooms</span>
                </div>
                <div class="info-row">
                  <span class="label">Session ID:</span>
                  <span class="value">${data.sessionId}</span>
                </div>
                <div class="info-row">
                  <span class="label">Timestamp:</span>
                  <span class="value">${timestamp}</span>
                </div>
              </div>

              <div class="revenue">
                <strong>💰 Revenue Update:</strong> $${data.amount.toFixed(2)} one-time payment received! User can now create ${data.newTotalSlots} total rooms.
              </div>
            </div>

            <div class="footer">
              <p>This is an automated notification from Toonstalk Admin System</p>
            </div>
          </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Admin room slot purchase notification sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending admin room slot purchase notification:', error);
    throw error;
  }
}

module.exports = { sendEmail };
