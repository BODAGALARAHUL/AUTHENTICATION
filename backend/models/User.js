const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: { type: String, required: false },
  googleId: { type: String, required: false, unique: true, sparse: true }
});

module.exports = mongoose.model("User", UserSchema);