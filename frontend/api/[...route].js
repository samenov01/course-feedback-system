// Catch-all API route for Vercel when the project root is set to "frontend".
// It re-exports the Express app from the backend so /api/* endpoints keep working.
import app from "../../backend/server.js";

export default app;

export const config = {
  api: {
    bodyParser: false,
  },
};
