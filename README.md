# Course Feedback System

## Structure
- backend → Node.js + Express API (serverless-ready for Vercel via `api/[...route].js`)
- frontend → React (Vite)

## Recommended Database (Vercel)
- Chosen: MongoDB Atlas
  - Rationale: current backend already supports MongoDB; works well with Vercel serverless (single long‑lived connection per instance), simple schema‑less documents for feedback and users, and no code rewrite needed.
  - Alternatives: Vercel Postgres/Neon, PlanetScale, Turso. These require a larger refactor from the current Mongo code.

## Environment Variables
Create environment variables in Vercel (or a local `.env` copied from `.env.example`).

Backend (`course-feedback-system/backend`):
- `MONGODB_URI` – Atlas connection string
- `MONGODB_DB_NAME` – e.g., `course`
- `APP_SECRET` – long random string to sign auth tokens
- `ADMIN_EMAIL` / `ADMIN_PASS` – bootstrap admin login

Frontend (`course-feedback-system/frontend`):
- `VITE_API_URL` – base URL of the backend (e.g., `https://your-backend.vercel.app`). If empty, the app will call same‑origin `/api/...`.

## Vercel Deployment

Two projects (recommended):
1) Backend – set project root to `course-feedback-system/backend` (Node 18+). No build needed; Vercel will use `api/[...route].js`.
2) Frontend – set project root to `course-feedback-system/frontend`. Build with Vite; expose `VITE_API_URL` pointing to the backend URL.

Local dev:
- Backend: `cd course-feedback-system/backend && npm i && npm run start` (uses port 5000 by default)
- Frontend: `cd course-feedback-system/frontend && npm i && npm run dev`
- Set `VITE_API_URL=http://localhost:5000` for the frontend during local dev.
