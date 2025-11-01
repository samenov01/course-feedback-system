import express from "express";
import cors from "cors";
import mysql from "mysql2";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

// Optional MySQL connection (not used yet). Keeps future MySQL migration easy.
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

let dbReady = false;
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

db.connect((err) => {
  if (err) {
    console.warn("MySQL not connected (optional for now):", err?.code || err?.message);
  } else {
    console.log("MySQL connected");
    initSchema();
  }
});

const app = express();
app.use(cors());
app.use(express.json());

// Simple in-memory stores (swap with MySQL later)
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

// In-memory fallback store when DB is unavailable
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

function authMiddleware(req, _res, next) {
  const auth = req.headers["authorization"] || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  const email = verifyToken(token) || sessions.get(token) || null;
  if (email) {
    const record = users.get(email);
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
  if (dbReady) {
    try {
      const [rows] = await db.promise().execute(
        `SELECT id, comment, rating, userEmail AS user, teacher, grp AS \`group\`, lang
         FROM feedbacks WHERE courseId = ? ORDER BY created_at DESC`,
        [id]
      );
      return res.json(rows);
    } catch (e) {
      console.warn("DB read failed, falling back to memory:", e?.message);
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
  if (dbReady) {
    try {
      const [result] = await db
        .promise()
        .execute(
          `INSERT INTO feedbacks (courseId, comment, rating, userEmail, teacher, grp, lang)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [courseId, comment, Number(rating), userLabel, teacher || null, group || null, lang || null]
        );
      const entry = {
        id: result.insertId,
        comment,
        rating: Number(rating),
        user: userLabel,
        teacher: teacher || null,
        group: group || null,
        lang: lang || null,
      };
      return res.json({ message: "Feedback received", feedback: entry });
    } catch (e) {
      console.warn("DB write failed, falling back to memory:", e?.message);
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
app.post("/api/auth/register", (req, res) => {
  const { email, password, name } = req.body || {};
  const trimmedName = String(name || "").trim();
  if (!email || !password || !trimmedName) {
    return res.status(400).json({ message: "Email, password and name are required" });
  }
  if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    return res.status(400).json({ message: "Admin account is managed by the system" });
  }
  if (users.has(email)) return res.status(409).json({ message: "User already exists" });
  const passwordHash = hashPassword(password);
  users.set(email, { email, passwordHash, name: trimmedName, isAdmin: false });
  const token = createToken(email);
  sessions.set(token, email);
  return res.json({ token, user: { email, name: trimmedName, isAdmin: false } });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: "Email and password required" });
  let rec = users.get(email);
  // bootstrap or refresh admin record if credentials match
  if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASS) {
    const passwordHash = hashPassword(password);
    const existing = users.get(email) || {};
    rec = { email, passwordHash, name: existing.name || "Admin", isAdmin: true };
    users.set(email, rec);
  }
  if (!rec || rec.passwordHash !== hashPassword(password)) return res.status(401).json({ message: "Invalid credentials" });
  const token = createToken(email);
  sessions.set(token, email);
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
  if (dbReady) {
    try {
      if (courseId) {
        const [rows] = await db
          .promise()
          .execute(
            `SELECT id, courseId, comment, rating, userEmail AS user, teacher, grp AS \`group\`, lang
             FROM feedbacks WHERE courseId = ? ORDER BY created_at DESC`,
            [courseId]
          );
        return res.json(rows);
      } else {
        const [rows] = await db
          .promise()
          .query(
            `SELECT id, courseId, comment, rating, userEmail AS user, teacher, grp AS \`group\`, lang
             FROM feedbacks ORDER BY created_at DESC`
          );
        return res.json(rows);
      }
    } catch (e) {
      console.warn("DB admin list failed, using memory:", e?.message);
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
  if (dbReady) {
    try {
      const fields = [];
      const params = [];
      if (patch.comment !== undefined) { fields.push("comment = ?"); params.push(patch.comment); }
      if (patch.rating !== undefined)  { fields.push("rating = ?");  params.push(Number(patch.rating)); }
      if (patch.teacher !== undefined) { fields.push("teacher = ?"); params.push(patch.teacher || null); }
      if (patch.group !== undefined)   { fields.push("grp = ?");     params.push(patch.group || null); }
      if (patch.lang !== undefined)    { fields.push("lang = ?");    params.push(patch.lang || null); }
      if (!fields.length) return res.json({ ok: true });
      params.push(id, courseId);
      await db
        .promise()
        .execute(`UPDATE feedbacks SET ${fields.join(", ")} WHERE id = ? AND courseId = ?`, params);
      const [rows] = await db
        .promise()
        .execute(
          `SELECT id, courseId, comment, rating, userEmail AS user, teacher, grp AS \`group\`, lang FROM feedbacks WHERE id = ? AND courseId = ?`,
          [id, courseId]
        );
      return res.json(rows[0] || { ok: true });
    } catch (e) {
      console.warn("DB admin patch failed, using memory:", e?.message);
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
  if (dbReady) {
    try {
      await db.promise().execute(`DELETE FROM feedbacks WHERE id = ? AND courseId = ?`, [id, courseId]);
      return res.json({ ok: true });
    } catch (e) {
      console.warn("DB admin delete failed, using memory:", e?.message);
    }
  }
  const list = feedbacks[courseId];
  if (!list) return res.status(404).json({ message: "Course or feedback not found" });
  const idx = list.findIndex((f) => String(f.id) === String(id));
  if (idx === -1) return res.status(404).json({ message: "Feedback not found" });
  list.splice(idx, 1);
  return res.json({ ok: true });
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
