const { createTransporter } = require('./nodemailer-config');

/**
 * Send admin notification when a user cancels subscription
 * @param {Object} data - Cancellation data {tier, userId, userEmail, subscriptionId, cancelAt, currentPeriodEnd, cancellationDetails}
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

    const endDate = new Date(data.cancelAt || data.currentPeriodEnd);
    const formattedEndDate = endDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Format cancellation details for admin
    let cancellationDetailsHtml = '<p><em>No cancellation feedback provided</em></p>';
    if (data.cancellationDetails) {
      const reasonMap = {
        too_expensive: 'Too Expensive',
        missing_features: 'Missing Features',
        switched_service: 'Switched to Another Service',
        unused: 'Not Using the Service',
        customer_service: 'Customer Service Issues',
        too_complex: 'Too Complex',
        low_quality: 'Quality Issues',
        other: 'Other Reasons',
      };

      const feedback = data.cancellationDetails.feedback;
      const comment = data.cancellationDetails.comment;

      cancellationDetailsHtml = '<div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">';

      if (feedback) {
        cancellationDetailsHtml += `
          <div style="margin-bottom: 10px;">
            <strong>📊 Cancellation Reason:</strong><br>
            <span style="color: #d97706; font-size: 16px;">${reasonMap[feedback] || feedback}</span>
          </div>
        `;
      }

      if (comment) {
        cancellationDetailsHtml += `
          <div>
            <strong>💬 User Comments:</strong><br>
            <span style="color: #333; font-style: italic;">"${comment}"</span>
          </div>
        `;
      }

      cancellationDetailsHtml += '</div>';
    }

    const mailOptions = {
      from: '"Toonstalk Admin" <toonstalk.contact@gmail.com>',
      to: 'toonstalk.contact@gmail.com',
      subject: `⚠️ ${tierName} Subscription Canceled - User Feedback`,
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
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
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
                border-left: 4px solid #ef4444;
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
              .feedback-section {
                margin: 20px 0;
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
              <h1>⚠️ Subscription Canceled</h1>
              <p>A ${tierName} user has canceled their subscription</p>
            </div>

            <div class="content">
              <p><strong>Cancellation Details:</strong></p>

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
                  <span class="label">Service Ends:</span>
                  <span class="value">${formattedEndDate}</span>
                </div>
                <div class="info-row">
                  <span class="label">Canceled At:</span>
                  <span class="value">${timestamp}</span>
                </div>
              </div>

              <div class="feedback-section">
                <h3 style="color: #d97706; margin-top: 0;">📝 User Feedback:</h3>
                ${cancellationDetailsHtml}
              </div>

              <p><strong>⚡ Action Items:</strong></p>
              <ul>
                <li>Review cancellation reason to improve service</li>
                <li>Consider reaching out if feedback indicates fixable issues</li>
                <li>User retains access until ${formattedEndDate}</li>
              </ul>
            </div>

            <div class="footer">
              <p>This is an automated notification from Toonstalk Admin System</p>
              <p>Review all cancellations to improve retention</p>
            </div>
          </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Admin cancellation notification sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending admin cancellation notification:', error);
    throw error;
  }
}

module.exports = { sendEmail };
