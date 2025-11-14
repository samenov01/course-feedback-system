// Root-level catch-all for Vercel projects that deploy from the repo root.
// It simply re-exports the Express app defined in backend/server.js.
// This avoids 404s when the project root != backend/.
import app from "../backend/server.js";

export default app;

export const config = {
  api: {
    bodyParser: false,
  },
};
