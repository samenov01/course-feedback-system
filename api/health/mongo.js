// Dedicated health endpoint for Vercel to avoid catch-all routing issues.
import { getDb } from "../backend/db/client.js";

export default async function handler(_req, res) {
  try {
    const db = await getDb();
    if (db) return res.status(200).json({ ok: true });
    return res.status(200).json({ ok: false, message: "MONGODB_URI not configured" });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e?.message || "Mongo error" });
  }
}
