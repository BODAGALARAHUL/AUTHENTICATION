console.log("PASSPORT FILE LOADED");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");
require("dotenv").config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:5000/auth/google/callback"
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ googleId: profile.id });
            if (!user) {
                // Also check if user exists with the same email
                const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
                if (email) {
                    user = await User.findOne({ email });
                    if (user) {
                        user.googleId = profile.id;
                        await user.save();
                        return done(null, user);
                    }
                }

                

                // If no user found, create a new one
                user = new User({
                    googleId: profile.id,
                    name: profile.displayName,
                    email: email
                });
                await user.save();

                try {
                    const sendWelcomeEmail = require("../utils/sendWelcomeEmail");
                    await sendWelcomeEmail(email, profile.displayName);
                } catch (err) {
                    console.error("Failed to send welcome email:", err);
                }
            }
            return done(null, user);
        } catch (err) {
            return done(err, null);
        }
    }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

module.exports = passport;