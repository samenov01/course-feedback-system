import express from "express";
import cors from "cors";
import { put, list, del as blobDel } from "@vercel/blob";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

// Storage selection: use Vercel Blob when available; fallback to in-memory only (no MySQL)
// Consider Blob available only if explicit Blob envs exist
let hasBlob = !!process.env.BLOB_READ_WRITE_TOKEN || !!process.env.VERCEL_BLOB_READ_WRITE_URL;

async function initSchema() {
  try {
    const p = db.promise();
    await p.query(`CREATE TABLE IF NOT EXISTS feedbacks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      courseId INT NOT NULL,
      comment TEXT NOT NULL,
      rating DECIMAL(3,1) NOT NULL,
      userEmail VARCHAR(255),
      teacher VARCHAR(255),
      grp VARCHAR(255),
      lang VARCHAR(16),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    dbReady = true;
    console.log("MySQL schema ready");
  } catch (e) {
    dbReady = false;
    console.warn("MySQL schema init failed:", e?.code || e?.message);
  }
}

console.log(hasBlob ? "Using Vercel Blob for storage" : "Using in-memory storage (dev fallback)");

const app = express();
app.use(cors());
app.use(express.json());

// Simple in-memory stores (fallbacks when Blob недоступен)
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

// In-memory fallback store when Blob is not available
const feedbacks = {};
let nextFeedbackId = 1;

// ----- Vercel Blob helpers -----
const blobPrefix = "feedbacks"; // root folder
const usersPrefix = "users";

function makeKey(courseId, id) {
  return `${blobPrefix}/course-${courseId}/${id}.json`;
}

async function blobReadCourse(courseId) {
  // List all feedback blobs for the course and fetch JSONs
  const { blobs } = await list({ prefix: `${blobPrefix}/course-${courseId}/` });
  if (!blobs?.length) return [];
  // sort by pathname (id) descending
  const sorted = blobs
    .slice()
    .sort((a, b) => (a.pathname > b.pathname ? -1 : 1));
  const results = [];
  for (const b of sorted) {
    const url = b.url || b.downloadUrl || b.pathname; // SDK exposes .url; fallbacks for safety
    try {
      const res = await fetch(url);
      if (res.ok) {
        const item = await res.json();
        results.push(item);
      }
    } catch (e) {
      console.warn("Blob fetch failed for", b.pathname, e?.message);
    }
  }
  return results;
}

async function blobWriteFeedback(courseId, entry) {
  const key = makeKey(courseId, entry.id);
  const body = JSON.stringify(entry);
  await put(key, body, { access: "private", contentType: "application/json" });
  return key;
}

async function blobReadOne(courseId, id) {
  const key = makeKey(courseId, id);
  try {
    const { blobs } = await list({ prefix: key });
    if (!blobs?.length) return null;
    const url = blobs[0].url || blobs[0].downloadUrl || blobs[0].pathname;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function blobUpdate(courseId, id, patch) {
  const cur = await blobReadOne(courseId, id);
  if (!cur) return null;
  const updated = { ...cur, ...patch };
  await blobWriteFeedback(courseId, updated);
  return updated;
}

async function blobDelete(courseId, id) {
  const key = makeKey(courseId, id);
  try {
    await blobDel(key);
    return true;
  } catch (e) {
    console.warn("Blob delete failed:", e?.message);
    return false;
  }
}

// Users in Blob
function userKey(email) {
  return `${usersPrefix}/${encodeURIComponent(String(email).toLowerCase())}.json`;
}

async function blobReadUser(email) {
  const key = userKey(email);
  const { blobs } = await list({ prefix: key });
  if (!blobs?.length) return null;
  const url = blobs[0].url || blobs[0].downloadUrl || blobs[0].pathname;
  const res = await fetch(url);
  if (!res.ok) return null;
  return await res.json();
}

async function blobWriteUser(record) {
  const key = userKey(record.email);
  await put(key, JSON.stringify(record), { access: "private", contentType: "application/json" });
}

// Quick runtime probe for Blob availability (cached)
let blobProbeDone = false;
let blobProbeOk = false;
async function ensureBlob() {
  if (blobProbeDone) return blobProbeOk;
  try {
    await list({ prefix: `${usersPrefix}/`, limit: 1 });
    blobProbeOk = true;
  } catch {
    blobProbeOk = false;
  }
  blobProbeDone = true;
  if (blobProbeOk) hasBlob = true; // flip on if the binding works
  return blobProbeOk;
}

const APP_SECRET = process.env.APP_SECRET || "dev-secret";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@yu.edu.kz";
const ADMIN_PASS = process.env.ADMIN_PASS || "admin123";

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function createToken(email) {
  const nonce = crypto.randomBytes(12).toString("hex");
  const data = `${email}.${Date.now()}.${nonce}`;
  const sig = crypto.createHmac("sha256", APP_SECRET).update(data).digest("hex");
  return `${data}.${sig}`;
}

function verifyToken(token) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 4) return null;
  const [email, ts, nonce, sig] = [parts[0], parts[1], parts[2], parts[3]];
  const data = `${email}.${ts}.${nonce}`;
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
    if (!record && hasBlob) {
      try { record = await blobReadUser(email); } catch {}
    }
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
  // Prefer Blob storage
  if (hasBlob) {
    try {
      const list = await blobReadCourse(id);
      return res.json(list);
    } catch (e) {
      console.warn("Blob read failed, falling back:", e?.message);
    }
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
  if (hasBlob) {
    try {
      // create numeric id monotonic based on time
      const id = Date.now();
      const entry = {
        id,
        comment,
        rating: Number(rating),
        user: userLabel,
        teacher: teacher || null,
        group: group || null,
        lang: lang || null,
        courseId: Number(courseId),
      };
      await blobWriteFeedback(courseId, entry);
      return res.json({ message: "Feedback received", feedback: entry });
    } catch (e) {
      console.warn("Blob write failed, trying fallback:", e?.message);
    }
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
  if (hasBlob || (await ensureBlob())) {
    try {
      const exists = await blobReadUser(email);
      if (exists) return res.status(409).json({ message: "User already exists" });
      const rec = { email, passwordHash: hashPassword(password), name: trimmedName, isAdmin: false };
      await blobWriteUser(rec);
      const token = createToken(email);
      return res.json({ token, user: { email, name: trimmedName, isAdmin: false } });
    } catch (e) {
      console.error("Blob register error:", e?.message);
      return res.status(500).json({ message: "Storage unavailable. Enable Vercel Blob for this project." });
    }
  } else {
    if (users.has(email)) return res.status(409).json({ message: "User already exists" });
    const passwordHash = hashPassword(password);
    users.set(email, { email, passwordHash, name: trimmedName, isAdmin: false });
    const token = createToken(email);
    sessions.set(token, email);
    return res.json({ token, user: { email, name: trimmedName, isAdmin: false } });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: "Email and password required" });
  // Admin bootstrap (always works without existing user)
  if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASS) {
    const rec = { email, passwordHash: hashPassword(password), name: "Admin", isAdmin: true };
    try {
      if (hasBlob || (await ensureBlob())) {
        await blobWriteUser(rec); // ensure user exists in Blob
      } else {
        users.set(email, rec);
      }
    } catch (e) {
      console.warn("Blob admin sync failed:", e?.message);
      users.set(email, rec);
    }
    const token = createToken(email);
    const displayName = rec.name || email.split("@")[0] || email;
    return res.json({ token, user: { email, name: displayName, isAdmin: true } });
  }
  // Normal users
  let rec = null;
  try {
    if (hasBlob || (await ensureBlob())) {
      rec = await blobReadUser(email);
    } else {
      rec = users.get(email);
    }
  } catch (e) {
    console.error("Blob read user error:", e?.message);
    return res.status(500).json({ message: "Storage unavailable. Enable Vercel Blob for this project." });
  }
  if (!rec || rec.passwordHash !== hashPassword(password)) return res.status(401).json({ message: "Invalid credentials" });
  const token = createToken(email);
  const displayName = rec.name || email.split("@")[0] || email;
  return res.json({ token, user: { email, name: displayName, isAdmin: !!rec.isAdmin } });
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
  if (hasBlob) {
    try {
      if (courseId) {
        const listByCourse = await blobReadCourse(courseId);
        return res.json(listByCourse);
      } else {
        // List all courses
        const { blobs } = await list({ prefix: `${blobPrefix}/` });
        if (!blobs?.length) return res.json([]);
        const results = [];
        for (const b of blobs) {
          try {
            const url = b.url || b.downloadUrl || b.pathname;
            const res2 = await fetch(url);
            if (res2.ok) results.push(await res2.json());
          } catch (e) {
            console.warn("Blob fetch (admin) failed:", b.pathname, e?.message);
          }
        }
        // newest first
        results.sort((a, b) => (a.id > b.id ? -1 : 1));
        return res.json(results);
      }
    } catch (e) {
      console.warn("Blob admin list failed, falling back:", e?.message);
    }
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
  if (hasBlob) {
    try {
      const updated = await blobUpdate(courseId, id, patch);
      if (!updated) return res.status(404).json({ message: "Feedback not found" });
      return res.json(updated);
    } catch (e) {
      console.warn("Blob patch failed, falling back:", e?.message);
    }
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
  if (hasBlob) {
    try {
      const ok = await blobDelete(courseId, id);
      if (!ok) return res.status(404).json({ message: "Feedback not found" });
      return res.json({ ok: true });
    } catch (e) {
      console.warn("Blob delete failed, falling back:", e?.message);
    }
  }
  const list = feedbacks[courseId];
  if (!list) return res.status(404).json({ message: "Course or feedback not found" });
  const idx = list.findIndex((f) => String(f.id) === String(id));
  if (idx === -1) return res.status(404).json({ message: "Feedback not found" });
  list.splice(idx, 1);
  return res.json({ ok: true });
});

// Simple health endpoint for Blob
app.get("/api/health/blob", async (_req, res) => {
  try {
    const ok = await ensureBlob();
    return res.json({ ok });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e?.message || "Blob error" });
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
  if (!users.has(email)) {
    // respond with generic message to avoid user enumeration
    return res.json({ message: "If the email exists, a reset token was generated" });
  }
  const token = crypto.randomBytes(16).toString("hex");
  resetTokens.set(token, email);
  // For this dev setup, return the token so you can use it directly
  return res.json({ message: "Reset token generated", token });
});

app.post("/api/auth/reset-password", (req, res) => {
  const { token, newPassword } = req.body || {};
  if (!token || !newPassword) return res.status(400).json({ message: "Token and new password required" });
  const email = resetTokens.get(token);
  if (!email || !users.has(email)) return res.status(400).json({ message: "Invalid or expired token" });
  const rec = users.get(email);
  rec.passwordHash = hashPassword(newPassword);
  users.set(email, rec);
  resetTokens.delete(token);
  return res.json({ message: "Password updated" });
});

const PORT = process.env.PORT || 5000;
// Do not call app.listen() on Vercel serverless; export app via api/[...route].js
if (!process.env.VERCEL && process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
}

export default app;
