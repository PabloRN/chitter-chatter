const { createTransporter } = require('./nodemailer-config');
const { defineString } = require('firebase-functions/params');

const appUrl = defineString('APP_URL', { default: 'http://localhost:8080' });

/**
 * Send room slot purchase confirmation email
 * @param {string} email - User's email address
 * @param {Object} data - Purchase data {userId, sessionId, amount, newTotalSlots}
 */
async function sendEmail(email, data) {
  try {
    const transporter = createTransporter();
    const baseUrl = appUrl.value();

    const mailOptions = {
      from: '"Toonstalk" <toonstalk.contact@gmail.com>',
      to: email,
      subject: '✅ Extra Room Slot Purchased Successfully!',
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
                background: #d4edda;
                border-left: 4px solid #28a745;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
                text-align: center;
              }
              .info-box {
                background: white;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                border-left: 4px solid #667eea;
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
                min-width: 140px;
              }
              .value {
                color: #333;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>✅ Purchase Confirmed!</h1>
              <p>Your extra room slot has been added</p>
            </div>

            <div class="content">
              <p>Hi there!</p>

              <p>Thank you for purchasing an additional room slot! Your payment of <strong>$${data.amount.toFixed(2)}</strong> has been processed successfully.</p>

              <div class="highlight-box">
                <h2 style="margin: 0; color: #28a745; font-size: 2.5rem;">${data.newTotalSlots}</h2>
                <p style="margin: 10px 0 0 0; font-weight: bold;">Total Room Slots Available</p>
              </div>

              <div class="info-box">
                <h3 style="margin-top: 0;">Purchase Details:</h3>
                <div class="info-row">
                  <span class="label">Amount Paid:</span>
                  <span class="value">$${data.amount.toFixed(2)}</span>
                </div>
                <div class="info-row">
                  <span class="label">Slots Added:</span>
                  <span class="value">+1 Room Slot</span>
                </div>
                <div class="info-row">
                  <span class="label">Total Slots:</span>
                  <span class="value">${data.newTotalSlots} rooms</span>
                </div>
                <div class="info-row">
                  <span class="label">Transaction ID:</span>
                  <span class="value">${data.sessionId}</span>
                </div>
              </div>

              <p>You can now create another room and continue expanding your Toonstalk presence!</p>

              <center>
                <a href="${baseUrl}/profile" class="button">View My Rooms</a>
              </center>

              <p><strong>Need More Rooms?</strong><br>
              You can purchase additional room slots anytime for $4.99 each from your profile or the <a href="${baseUrl}/pricing">pricing page</a>.</p>

              <p><strong>Need Help?</strong><br>
              If you have any questions, contact us at <a href="mailto:toonstalk.contact@gmail.com">toonstalk.contact@gmail.com</a></p>

              <p>Thanks for being part of the Toonstalk community!</p>

              <p>Best regards,<br>
              <strong>The Toonstalk Team</strong></p>
            </div>

            <div class="footer">
              <p>Payment Amount: $${data.amount.toFixed(2)} (One-time)</p>
              <p>This email was sent to ${email} as a receipt for your room slot purchase.</p>
            </div>
          </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Room slot purchase confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending room slot purchase confirmation email:', error);
    throw error;
  }
}

module.exports = { sendEmail };
