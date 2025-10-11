const fs = require('fs');
const path = require('path');

/**
 * Load and populate an email template
 * @param {string} templateName - Name of the template file (without extension)
 * @param {Object} variables - Key-value pairs to replace in template
 * @returns {string} Populated HTML string
 */
function loadEmailTemplate(templateName, variables = {}) {
  try {
    const templatePath = path.join(__dirname, `${templateName}.html`);
    let template = fs.readFileSync(templatePath, 'utf8');

    // Replace all {{variable}} placeholders
    Object.keys(variables).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      template = template.replace(regex, variables[key] || '');
    });

    return template;
  } catch (error) {
    console.error(`Error loading template ${templateName}:`, error);
    throw error;
  }
}

/**
 * Get email configuration for welcome email
 * @param {Object} params - Email parameters
 * @returns {Object} Email configuration for nodemailer
 */
function getWelcomeEmailConfig(params) {
  const { to, nickname, fromEmail } = params;

  const html = loadEmailTemplate('welcome-email', {
    nickname: nickname || 'Friend',
    currentYear: new Date().getFullYear(),
  });

  return {
    from: `ToonsTalk <${fromEmail}>`,
    to,
    subject: `Welcome to ToonsTalk, ${nickname || 'Friend'}! 🎉`,
    html,
  };
}

/**
 * Get email configuration for survey response
 * @param {Object} params - Email parameters
 * @returns {Object} Email configuration for nodemailer
 */
function getSurveyEmailConfig(params) {
  const {
    to, nickname, rating, feedback, userId, fromEmail,
  } = params;

  const stars = '⭐'.repeat(rating || 0);

  const html = loadEmailTemplate('survey-email', {
    nickname: nickname || 'Anonymous',
    rating: rating || 0,
    stars,
    feedback: feedback || 'No additional feedback provided.',
    userId: userId || 'Anonymous',
    timestamp: new Date().toISOString(),
  });

  return {
    from: `ToonsTalk Survey <${fromEmail}>`,
    to,
    subject: `New Survey Response: ${rating}/5 stars`,
    html,
  };
}

module.exports = {
  loadEmailTemplate,
  getWelcomeEmailConfig,
  getSurveyEmailConfig,
};
