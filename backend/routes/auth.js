const sendOtp = require("../utils/sendOtp");
const sendWelcomeEmail = require("../utils/sendWelcomeEmail");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const express = require("express");
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'mysecretkey';

let otpStore = {}; // temp store

// SEND OTP
router.post("/send-otp", async (req, res) => {
    const { email } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
        return res.status(400).json("Email already registered");
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    otpStore[email] = otp;

    try {
        await sendOtp(email, otp);
        res.json({ success: true, message: "OTP sent" });
    } catch (err) {
        console.error("OTP send failed:", err);
        res.status(500).json({ success: false, message: "Failed to send OTP" });
    }
});

// VERIFY OTP + REGISTER
router.post("/verify-otp", async (req, res) => {
    const { email, otp, name, password } = req.body;

    try {
        if (!email || !otp || !name || !password) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        // 1. Check OTP
        if (otpStore[email] != otp) {
            return res.status(400).json({ success: false, message: "Invalid OTP" });
        }

        // 2. Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User already exists. Please login." });
        }

        // 3. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. Save user
        const user = new User({ name, email, password: hashedPassword });
        await user.save();

        // 5. Send welcome email (optional)
        try {
            await sendWelcomeEmail(email, name);
        } catch (err) {
            console.error("Welcome email failed:", err);
        }

        // 6. Generate JWT token
        const token = jwt.sign(
            { id: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: "1d" }
        );

        // 7. Clean OTP
        delete otpStore[email];

        res.json({
            success: true,
            token,
            user: { id: user._id, name: user.name, email: user.email },
            message: "Signup successful"
        });

    } catch (err) {
        console.error("Signup error:", err);
        res.status(500).json({ success: false, message: "Signup failed" });
    }
});

// RESEND OTP
router.post("/resend-otp", async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ success: false, message: "Email already registered" });
    }

    if (!otpStore[email]) {
        return res.status(400).json({ success: false, message: "No OTP request found. Please sign up again." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    otpStore[email] = otp;

    try {
        await sendOtp(email, otp);
        res.json({ success: true, message: "OTP resent" });
    } catch (err) {
        console.error("OTP resend failed:", err);
        res.status(500).json({ success: false, message: "Failed to resend OTP" });
    }
});


// Phone login route
router.post("/phone-login", async (req, res) => {
    const { phone } = req.body;

    if (!phone) {
        return res.status(400).json({ success: false, message: "Phone number is required" });
    }

    try {
        const token = jwt.sign(
            { phone },
            JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
            success: true,
            token,
            user: { phone }
        });

    } catch (err) {
        console.error("Phone login error:", err);
        res.status(500).json({ success: false, message: "Phone login failed" });
    }
});

// LOGIN
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        if (!user.password) {
            return res.status(400).json({ success: false, message: "Please login with Google" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
          success: true,
          token,
          user: { id: user._id, name: user.name, email: user.email },
          message: "Login successful"
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

module.exports = router;