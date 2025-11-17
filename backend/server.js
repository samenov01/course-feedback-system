import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import { _testCloseMongo, getDb, mongoConfig } from "./db/client.js";
import {
  mongoDeleteFeedback,
  mongoInsertFeedback,
  mongoListAllFeedbacks,
  mongoListFeedbacks,
  mongoPatchFeedback,
} from "./db/feedbacks.js";
import { mongoGetUser, mongoUpdatePassword, mongoUpsertUser } from "./db/users.js";
import { mongoConsumeResetToken, mongoCreateResetToken } from "./db/resets.js";

export { _testCloseMongo } from "./db/client.js";

dotenv.config();

const { MONGODB_URI, MONGODB_DB_NAME } = mongoConfig;

console.log(
  MONGODB_URI
    ? `Using MongoDB storage (db="${MONGODB_DB_NAME}")`
    : "Using in-memory storage (dev fallback)"
);

const app = express();
app.use(cors());
app.use(express.json());

// Simple in-memory stores (fallback only; not used on serverless when Mongo is present)
const users = new Map(); // email -> { email, passwordHash, name, isAdmin }
const sessions = new Map(); // token -> email
const resetTokens = new Map(); // token -> email

const courses = [
  { id: 1, name: "German", teachers: [{ name: "Amanbayev K." }] },
  {
    id: 2,
    name: "Основы экономики, предпринимательства и финансовой грамотности",
    teachers: [{ name: "Таскинбайкызы Ж." }],
  },
  {
    id: 3,
    name: "Социология",
    variants: [
      { lang: "KZ", teacher: "Дүйсенова С." },
      { lang: "RUS", teacher: "Каюпова Ф." },
    ],
  },
  {
    id: 4,
    name: "English",
    groups: [
      { name: "ENG-25-1", teacher: "Essetova K." },
      { name: "ENG-25-2", teacher: "Essetova K." },
    ],
  },
  { id: 5, name: "Programming", teachers: [{ name: "Байназарова Р." }] },
  {
    id: 6,
    name: "Философия",
    variants: [
      { lang: "KZ", teacher: "Абдрахманова Б." },
      { lang: "RUS", teacher: "Абдрахманова Б." },
    ],
  },
  { id: 7, name: "ИКТ", teachers: [{ name: "Кенжебаева Ж." }] },
  { id: 8, name: "Математика", teachers: [{ name: "Диярова Л." }] },
  {
    id: 9,
    name: "Политология",
    variants: [
      { lang: "KZ", teacher: "Керимов Б." },
      { lang: "RUS", teacher: "Керимов Б." },
    ],
  },
];

// In-memory fallback store when Mongo is not available
const feedbacks = {};
let nextFeedbackId = 1;

const APP_SECRET = process.env.APP_SECRET || "dev-secret";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@yu.edu.kz";
const ADMIN_PASS = process.env.ADMIN_PASS || "admin123";

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function createToken(email) {
  const nonce = crypto.randomBytes(12).toString("hex");
  // Use '|' as a safe delimiter since emails can contain '.'
  const data = `${email}|${Date.now()}|${nonce}`;
  const sig = crypto.createHmac("sha256", APP_SECRET).update(data).digest("hex");
  return `${data}|${sig}`;
}

function verifyToken(token) {
  if (!token) return null;
  const parts = token.split("|");
  if (parts.length !== 4) return null;
  const [email, ts, nonce, sig] = parts;
  const data = `${email}|${ts}|${nonce}`;
  const expected = crypto.createHmac("sha256", APP_SECRET).update(data).digest("hex");
  if (sig !== expected) return null;
  return email;
}

async function authMiddleware(req, _res, next) {
  const auth = req.headers["authorization"] || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  const email = verifyToken(token) || sessions.get(token) || null;
  if (email) {
    let record = users.get(email);
    // If using MongoDB, fetch the user record to resolve name/isAdmin
    try {
      if (!record) record = await mongoGetUser(email);
    } catch {}
    req.user = {
      email,
      name: record?.name || null,
      isAdmin: !!record?.isAdmin,
    };
  }
  next();
}

app.use(authMiddleware);

function adminOnly(req, res, next) {
  if (req.user?.isAdmin) return next();
  return res.status(401).json({ message: "Admin unauthorized" });
}

// Courses
app.get("/api/courses", (_req, res) => {
  res.json(courses);
});

// Feedback list by course
app.get("/api/courses/:id/feedback", async (req, res) => {
  const { id } = req.params;
  // Prefer MongoDB storage
  try {
    const list = await mongoListFeedbacks(id);
    if (list) return res.json(list);
  } catch (e) {
    console.warn("Mongo read failed, falling back:", e?.message);
  }
  return res.json(feedbacks[id] || []);
});

// Submit feedback
app.post("/api/feedback", async (req, res) => {
  const { courseId, comment, rating, teacher, group, lang, anonymous } = req.body || {};
  if (!courseId || !comment || typeof rating !== "number") {
    return res.status(400).json({ message: "Invalid payload" });
  }
  if (!req.user) {
    return res.status(401).json({ message: "Login required" });
  }
  const fallbackName = req.user?.name || req.user?.email || "Guest";
  const userLabel = anonymous ? "Anonymous" : fallbackName;
  try {
    const entry = {
      courseId: Number(courseId),
      comment,
      rating: Number(rating),
      user: userLabel,
      teacher: teacher || null,
      group: group || null,
      lang: lang || null,
    };
    const saved = await mongoInsertFeedback(entry);
    if (saved) return res.json({ message: "Feedback received", feedback: saved });
  } catch (e) {
    console.warn("Mongo write failed, using memory:", e?.message);
  }
  const list = feedbacks[courseId] || (feedbacks[courseId] = []);
  const entry = {
    id: nextFeedbackId++,
    comment,
    rating,
    user: userLabel,
    teacher: teacher || null,
    group: group || null,
    lang: lang || null,
  };
  list.push(entry);
  return res.json({ message: "Feedback received", feedback: entry });
});

// Auth endpoints
app.post("/api/auth/register", async (req, res) => {
  const { email, password, name } = req.body || {};
  const trimmedName = String(name || "").trim();
  if (!email || !password || !trimmedName) {
    return res.status(400).json({ message: "Email, password and name are required" });
  }
  if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    return res.status(400).json({ message: "Admin account is managed by the system" });
  }
  try {
    const lower = String(email).toLowerCase();
    const existing = (await mongoGetUser(lower)) || users.get(lower);
    if (existing) return res.status(409).json({ message: "User already exists" });
    const rec = { email: lower, passwordHash: hashPassword(password), name: trimmedName, isAdmin: false };
    const db = await getDb();
    if (db) await mongoUpsertUser(rec); else users.set(lower, rec);
    const token = createToken(lower);
    return res.json({ token, user: { email: lower, name: trimmedName, isAdmin: false } });
  } catch (e) {
    console.error("Register error:", e?.message);
    return res.status(500).json({ message: "Registration failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  const lowerEmail = String(email || "").toLowerCase();
  if (!email || !password) return res.status(400).json({ message: "Email and password required" });
  // Admin bootstrap (always works without existing user)
  if (lowerEmail === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASS) {
    const rec = { email: lowerEmail, passwordHash: hashPassword(password), name: "Admin", isAdmin: true };
    try {
      const db = await getDb();
      if (db) await mongoUpsertUser(rec); else users.set(lowerEmail, rec);
    } catch (e) {
      console.warn("Admin sync failed:", e?.message);
      users.set(lowerEmail, rec);
    }
    const token = createToken(lowerEmail);
    const displayName = rec.name || lowerEmail.split("@")[0] || lowerEmail;
    return res.json({ token, user: { email: lowerEmail, name: displayName, isAdmin: true } });
  }
  // Normal users
  let rec = null;
  try {
    const db = await getDb();
    rec = db ? await mongoGetUser(lowerEmail) : users.get(lowerEmail);
  } catch (e) {
    console.error("Mongo read user error:", e?.message);
    return res.status(500).json({ message: "Login failed" });
  }
  if (!rec || rec.passwordHash !== hashPassword(password)) return res.status(401).json({ message: "Invalid credentials" });
  const token = createToken(lowerEmail);
  const displayName = rec.name || lowerEmail.split("@")[0] || lowerEmail;
  return res.json({ token, user: { email: lowerEmail, name: displayName, isAdmin: !!rec.isAdmin } });
});

app.get("/api/me", (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const fallbackName = req.user.name || req.user.email.split("@")[0] || req.user.email;
  return res.json({ user: { email: req.user.email, name: fallbackName, isAdmin: !!req.user.isAdmin } });
});

// Standalone admin login removed; use normal user login with ADMIN_EMAIL/ADMIN_PASS

// Admin feedback management
app.get("/api/admin/feedbacks", adminOnly, async (req, res) => {
  const courseId = req.query.courseId;
  try {
    const list = await mongoListAllFeedbacks(courseId);
    if (list) return res.json(list);
  } catch (e) {
    console.warn("Mongo admin list failed, using memory:", e?.message);
  }
  if (courseId) return res.json(feedbacks[courseId] || []);
  const all = [];
  for (const [cid, list] of Object.entries(feedbacks)) {
    for (const f of list) all.push({ courseId: Number(cid), ...f });
  }
  return res.json(all);
});

app.patch("/api/admin/courses/:courseId/feedback/:id", adminOnly, async (req, res) => {
  const { courseId, id } = req.params;
  const patch = req.body || {};
  try {
    const updated = await mongoPatchFeedback(courseId, id, patch);
    if (updated) return res.json(updated);
  } catch (e) {
    console.warn("Mongo patch failed, falling back:", e?.message);
  }
  const list = feedbacks[courseId];
  if (!list) return res.status(404).json({ message: "Course or feedback not found" });
  const idx = list.findIndex((f) => String(f.id) === String(id));
  if (idx === -1) return res.status(404).json({ message: "Feedback not found" });
  const updated = { ...list[idx], ...patch };
  list[idx] = updated;
  return res.json(updated);
});

app.delete("/api/admin/courses/:courseId/feedback/:id", adminOnly, async (req, res) => {
  const { courseId, id } = req.params;
  try {
    const ok = await mongoDeleteFeedback(courseId, id);
    if (ok) return res.json({ ok: true });
  } catch (e) {
    console.warn("Mongo delete failed, falling back:", e?.message);
  }
  const list = feedbacks[courseId];
  if (!list) return res.status(404).json({ message: "Course or feedback not found" });
  const idx = list.findIndex((f) => String(f.id) === String(id));
  if (idx === -1) return res.status(404).json({ message: "Feedback not found" });
  list.splice(idx, 1);
  return res.json({ ok: true });
});

// Health endpoint for Mongo
app.get("/api/health/mongo", async (_req, res) => {
  try {
    const db = await getDb();
    return res.json({ ok: !!db });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e?.message || "Mongo error" });
  }
});
// Error handler for better diagnostics in serverless logs
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err?.stack || err);
  res.status(500).json({ message: "Internal error" });
});
// Forgot/reset password
app.post("/api/auth/forgot-password", (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ message: "Email required" });
  (async () => {
    try {
      const db = await getDb();
      const lower = String(email).toLowerCase();
      let exists = false;
      if (db) {
        exists = !!(await mongoGetUser(lower));
      } else {
        exists = users.has(lower);
      }
      if (!exists) {
        // respond with generic message to avoid user enumeration
        return res.json({ message: "If the email exists, a reset token was generated" });
      }
      if (db) {
        const token = await mongoCreateResetToken(lower);
        return res.json({ message: "Reset token generated", token });
      }
      const token = crypto.randomBytes(16).toString("hex");
      resetTokens.set(token, lower);
      return res.json({ message: "Reset token generated", token });
    } catch (e) {
      console.error("Forgot password error:", e?.message);
      return res.status(500).json({ message: "Error generating reset token" });
    }
  })();
});

app.post("/api/auth/reset-password", (req, res) => {
  const { token, newPassword } = req.body || {};
  if (!token || !newPassword) return res.status(400).json({ message: "Token and new password required" });
  (async () => {
    try {
      const db = await getDb();
      if (db) {
        const email = await mongoConsumeResetToken(token);
        if (!email) return res.status(400).json({ message: "Invalid or expired token" });
        await mongoUpdatePassword(email, hashPassword(newPassword));
        return res.json({ message: "Password updated" });
      }
      const email = resetTokens.get(token);
      if (!email || !users.has(email)) return res.status(400).json({ message: "Invalid or expired token" });
      const rec = users.get(email);
      rec.passwordHash = hashPassword(newPassword);
      users.set(email, rec);
      resetTokens.delete(token);
      return res.json({ message: "Password updated" });
    } catch (e) {
      console.error("Reset password error:", e?.message);
      return res.status(500).json({ message: "Reset failed" });
    }
  })();
});

const PORT = process.env.PORT || 5000;
// Do not call app.listen() on Vercel serverless; export app via api/[...route].js
if (!process.env.VERCEL && process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
}

export default app;
