# Frontend

This folder contains the client-side portion of the Authentication project.

## What it is

A web frontend that interacts with the backend authentication server to provide user-facing login, signup, and OAuth flows. The frontend may be a static site or a single-page application (React, Vue, etc.) depending on the project's setup.

## Prerequisites

- Node.js (recommended stable LTS version)
- npm or yarn
- The backend server running and reachable (see backend/README.md)

## Install

If the `frontend/` directory contains its own `package.json`, run the following inside the `frontend` folder:

```bash
cd frontend
npm install
# or
# yarn install
```

If there is no `package.json` in `frontend/`, the frontend may be static files — no install step required.

## Environment variables / Configuration

Set the frontend to point to your backend API. Common environment variables and approaches depending on your stack:

- For Create React App: `REACT_APP_API_URL` (example: `http://localhost:3000`)
- For Vite: `VITE_API_URL`
- For a plain static site: edit a configuration file or a constant in the source that defines the API base URL

Also ensure OAuth redirect URIs configured in the Google Console match your frontend URL (for example `http://localhost:5173` or `http://localhost:3000`).

## Run (development)

Common commands (adjust to the actual scripts in `frontend/package.json`):

```bash
cd frontend
npm start
# or
npm run dev
```

This will run a development server with hot reload (if using a framework). If the frontend is static, open `index.html` in your browser or use a static server such as `serve`:

```bash
npx serve frontend
```

## Build (production)

If a build step exists:

```bash
cd frontend
npm run build
```

Then serve the generated `dist/` or `build/` folder with any static hosting provider (Netlify, Vercel, GitHub Pages) or a static file server.

## Common client routes / actions

- `/login` — login page
- `/signup` — registration page
- `/auth/google` — link or button that initiates Google OAuth (may redirect to backend `/auth/google` endpoint)

Verify the exact routes in the frontend source code.

## Notes

- Keep API base URLs and secrets out of source control. Use environment files (`.env`) and add them to `.gitignore`.
- If your frontend performs OAuth sign-in via the backend, make sure CORS and cookies are configured correctly on the backend (same-site, secure flags, and correct origins).

## Contributing

Open PRs with clear descriptions. Include screenshots or steps to reproduce UI changes. Run linter/tests (if present) before submitting.

## License

See repository LICENSE (if present) or add a license as appropriate.
