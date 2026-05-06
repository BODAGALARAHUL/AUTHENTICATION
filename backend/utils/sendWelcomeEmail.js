const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendWelcomeEmail = async (email, name) => {
  try {
    console.log("Sending welcome email to:", email);

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Welcome to Our Platform! 🎉",
      text: `Hi ${name || "there"},\n\nYour account has been successfully created. Welcome aboard!\n\nBest,\nThe Team`
    });

    console.log("Welcome email sent:", info.response);

  } catch (error) {
    console.error("Email error:", error);
    throw error;
  }
};

module.exports = sendWelcomeEmail;