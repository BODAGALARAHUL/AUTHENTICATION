const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendOtp = async (email, otp) => {
  try {
    console.log("OTP FUNCTION CALLED for:", email);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}`
    });

    console.log("OTP sent successfully");
  } catch (error) {
    console.error("Email error:", error);
    throw error;
  }
};

module.exports = sendOtp;