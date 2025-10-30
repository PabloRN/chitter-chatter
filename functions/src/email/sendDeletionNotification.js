const { createTransporter } = require('./nodemailer-config');

/**
 * Send admin notification for account deletion
 * Two types:
 * 1. Instant deletion (FYI) - User was deleted automatically
 * 2. Review required (ACTION NEEDED) - Admin must review and approve
 *
 * @param {Object} data - Deletion data
 */
async function sendEmail(data) {
  try {
    const transporter = createTransporter();
    const { type, userId, userEmail, userData, reason, transferredRooms } = data;

    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/New_York',
    });

    let subject;
    let htmlContent;

    if (type === 'instant') {
      // FYI Email - Instant deletion completed
      subject = `✅ Account Deleted - ${userEmail || userId}`;
      htmlContent = generateInstantDeletionEmail({
        userId,
        userEmail,
        userData,
        timestamp,
        transferredRooms: transferredRooms || [],
      });
    } else if (type === 'review_required') {
      // ACTION REQUIRED Email - Admin review needed
      subject = `🔔 Account Deletion Review Required - ${userEmail || userId}`;
      htmlContent = generateReviewRequiredEmail({
        userId,
        userEmail,
        userData,
        timestamp,
        reason,
      });
    } else {
      throw new Error(`Unknown deletion notification type: ${type}`);
    }

    const mailOptions = {
      from: '"Toonstalk Admin" <toonstalk.contact@gmail.com>',
      to: 'toonstalk.contact@gmail.com',
      subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Admin deletion notification sent (${type}):`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending admin deletion notification:', error);
    throw error;
  }
}

/**
 * Generate email HTML for instant deletion (FYI)
 */
function generateInstantDeletionEmail({ userId, userEmail, userData, timestamp, transferredRooms }) {
  const tier = userData.subscriptionTier || userData.subscription?.tier || 'free';
  const archiveDate = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

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
          <h1>✅ Account Deleted</h1>
          <p>User successfully deleted their account (instant deletion)</p>
        </div>

        <div class="content">
          <p><strong>Account Deletion Summary:</strong></p>

          <div class="info-box">
            <div class="info-row">
              <span class="label">User Email:</span>
              <span class="value">${userEmail || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">User ID:</span>
              <span class="value">${userId}</span>
            </div>
            <div class="info-row">
              <span class="label">Subscription Tier:</span>
              <span class="value">${tier.charAt(0).toUpperCase() + tier.slice(1)}</span>
            </div>
            <div class="info-row">
              <span class="label">Rooms Owned:</span>
              <span class="value">${userData.ownedRooms?.length || 0}</span>
            </div>
            <div class="info-row">
              <span class="label">Rooms Transferred:</span>
              <span class="value">${transferredRooms.length}</span>
            </div>
            <div class="info-row">
              <span class="label">Deleted At:</span>
              <span class="value">${timestamp}</span>
            </div>
            <div class="info-row">
              <span class="label">Data Archived Until:</span>
              <span class="value">${archiveDate}</span>
            </div>
          </div>

          ${transferredRooms.length > 0 ? `
            <p><strong>🏠 Transferred Rooms:</strong></p>
            <ul>
              ${transferredRooms.map(roomId => `<li>Room ID: ${roomId}</li>`).join('')}
            </ul>
          ` : '<p><em>No rooms to transfer</em></p>'}

          <p><strong>📦 Data Retention:</strong><br>
          User data has been archived and will be permanently deleted on ${archiveDate}. You can restore this account within 30 days if needed.</p>

          <p><strong>ℹ️ Status:</strong><br>
          This was an instant deletion (qualified automatically). No further action required.</p>
        </div>

        <div class="footer">
          <p>This is an automated notification from Toonstalk Admin System</p>
          <p>User deletion completed successfully</p>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate email HTML for review required (ACTION NEEDED)
 */
function generateReviewRequiredEmail({ userId, userEmail, userData, timestamp, reason }) {
  const tier = userData.subscriptionTier || userData.subscription?.tier || 'free';
  const subscriptionEnd = userData.subscription?.currentPeriodEnd
    ? new Date(userData.subscription.currentPeriodEnd).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    : 'N/A';

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
          .alert-box {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
          }
          .info-box {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #f59e0b;
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
          .action-required {
            background: #dc2626;
            color: white;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
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
          <h1>🔔 Action Required</h1>
          <p>Account deletion review needed</p>
        </div>

        <div class="content">
          <div class="action-required">
            ⚠️ ADMIN REVIEW REQUIRED - Action needed within 24 hours
          </div>

          <p><strong>Deletion Request Details:</strong></p>

          <div class="info-box">
            <div class="info-row">
              <span class="label">User Email:</span>
              <span class="value">${userEmail || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">User ID:</span>
              <span class="value">${userId}</span>
            </div>
            <div class="info-row">
              <span class="label">Subscription Tier:</span>
              <span class="value">${tier.charAt(0).toUpperCase() + tier.slice(1)}</span>
            </div>
            <div class="info-row">
              <span class="label">Subscription Ends:</span>
              <span class="value">${subscriptionEnd}</span>
            </div>
            <div class="info-row">
              <span class="label">Requested At:</span>
              <span class="value">${timestamp}</span>
            </div>
          </div>

          <div class="alert-box">
            <strong>⚠️ Review Reason:</strong><br>
            ${reason}
          </div>

          <p><strong>📋 Required Actions:</strong></p>
          <ol>
            <li>Review user's subscription status in Stripe Dashboard</li>
            <li>Cancel subscription if appropriate</li>
            <li>Check for any pending payments or refunds</li>
            <li>Approve deletion within 24 hours (GDPR compliance)</li>
          </ol>

          <p><strong>🔗 Quick Links:</strong></p>
          <ul>
            <li><a href="https://dashboard.stripe.com/customers">Stripe Dashboard</a></li>
            <li><a href="https://console.firebase.google.com/project/chitter-chatter-f762a/database">Firebase Database</a></li>
            <li><a href="https://console.firebase.google.com/project/chitter-chatter-f762a/authentication/users">Firebase Auth</a></li>
          </ul>

          <p><strong>⏰ Deadline:</strong><br>
          You must process this request within 24 hours to maintain GDPR compliance. Maximum 30 days from request date.</p>
        </div>

        <div class="footer">
          <p>This is an automated notification from Toonstalk Admin System</p>
          <p>User: ${userId}</p>
        </div>
      </body>
    </html>
  `;
}

module.exports = { sendEmail };
