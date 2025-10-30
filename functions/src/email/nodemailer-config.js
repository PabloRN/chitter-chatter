const { defineString } = require('firebase-functions/params');
const nodemailer = require('nodemailer');

// Define parameters (environment variables)
const gmailEmail = defineString('GMAIL_EMAIL', { default: 'toonstalk.contact@gmail.com' });
const gmailPassword = defineString('GMAIL_PASSWORD');

// Create SMTP transporter
const createTransporter = () => nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: gmailEmail.value(),
    pass: gmailPassword.value(),
  },
});

module.exports = {
  createTransporter,
  gmailEmail,
};
