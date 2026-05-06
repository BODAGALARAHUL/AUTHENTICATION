require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const passport = require("./config/passport");
const jwt = require("jsonwebtoken");

const app = express();
const SECRET = process.env.JWT_SECRET || "mysecretkey";

// Middlewares
app.use(express.json());

app.use(cors({ origin: true, credentials: true }));

app.use(session({
  secret: SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


// 🔥 VERIFY TOKEN (for dashboard)
app.get("/api/auth/me", (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.json({ success: false });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET);

    res.json({
      success: true,
      user: decoded
    });
  } catch (err) {
    res.json({ success: false });
  }
});


// 🔥 GOOGLE LOGIN
app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// 🔥 GOOGLE CALLBACK
app.get("/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "http://127.0.0.1:5500/frontend/index.html"
  }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user._id, email: req.user.email },
      SECRET,
      { expiresIn: "1d" }
    );

    res.redirect(`http://127.0.0.1:5500/frontend/index.html?token=${token}`);
  }
);


// MongoDB
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000
})
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Other routes
app.use("/api/auth", require("./routes/auth"));


const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));