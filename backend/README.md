# Backend

This folder contains the server-side (backend) portion of the Authentication project.

## What it is

A Node.js backend that provides authentication features (local sessions, Google OAuth, email notifications) and stores user data in MongoDB.

## Prerequisites

- Node.js (recommended stable LTS version)
- npm or yarn
- A running MongoDB instance or MongoDB Atlas cluster
- Google OAuth credentials (Client ID, Client Secret) if using Google sign-in
- SMTP credentials if sending email with Nodemailer

## Install

From the repository root or the backend folder (depending on where package.json lives):

```bash
# from project root
npm install

# or from backend folder if backend has its own package.json
# cd backend && npm install
```

## Environment variables

Create a `.env` file at the project root or in the backend folder (where the server code reads it) and set the following variables:

- MONGODB_URI - MongoDB connection string (e.g. mongodb://localhost:27017/authdb)
- SESSION_SECRET - secret string for express-session
- GOOGLE_CLIENT_ID - Google OAuth client id
- GOOGLE_CLIENT_SECRET - Google OAuth client secret
- GOOGLE_CALLBACK_URL - Google OAuth callback URL (e.g. http://localhost:3000/auth/google/callback)
- SMTP_HOST - (optional) SMTP host for sending emails
- SMTP_PORT - (optional) SMTP port
- SMTP_USER - (optional) SMTP username
- SMTP_PASS - (optional) SMTP password

Adjust variable names to match what the project code expects.

## Run

Start the server (adjust the entrypoint to the actual file, e.g. `index.js` or `app.js`):

```bash
# from project root
node index.js
# or if there's an npm script
npm start
```

If the backend lives under `backend/` and has its own package.json, run:

```bash
cd backend
npm install
npm start
```

## Common endpoints

- /auth/google - begin Google OAuth sign-in
- /auth/google/callback - OAuth callback
- /login, /logout, /signup - common auth endpoints (may vary depending on implementation)

Check your server source files to confirm exact routes and entrypoint names.

## Notes

- Ensure the Google OAuth callback URL is configured in the Google Cloud Console to match your app's callback.
- Keep secrets out of version control (use `.env` and `.gitignore`).

## Contributing

Make a PR with clear change descriptions. Run tests (if any) and ensure environment-specific values are not committed.

## License

See repository LICENSE (if present) or add a license as appropriate.
