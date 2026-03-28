const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  // Configured to fallback on dummy smtp if not in .env, but usually you'd want actual creds
  // For production or tests, we'd use Gmail or SendGrid, but falling back for safe measure.
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "sandbox.smtp.mailtrap.io",
    port: process.env.SMTP_PORT || 2525,
    auth: {
      user: process.env.SMTP_EMAIL || "user",
      pass: process.env.SMTP_PASSWORD || "pass",
    },
    // Useful for gmail if you have less secure apps
    service: process.env.SMTP_SERVICE, // e.g. "gmail" (if provided)
  });

  // If using service, clear host/port above
  if (process.env.SMTP_SERVICE) {
    transporter.options.host = undefined;
    transporter.options.port = undefined;
  }

  const message = {
    from: `${process.env.FROM_NAME || "WardWatch Admin"} <${
      process.env.FROM_EMAIL || "noreply@wardwatch.local"
    }>`,
    to: options.email,
    subject: options.subject,
    text: options.message, // Plain text body
    html: options.html, // HTML body (optional)
  };

  const info = await transporter.sendMail(message);
  console.log("Message sent: %s", info.messageId);
};

module.exports = sendEmail;
