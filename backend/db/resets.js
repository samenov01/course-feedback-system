import crypto from "crypto";
import { getDb, mongoConfig } from "./client.js";

async function ensureResetTTLIndex() {
  const db = await getDb(mongoConfig.MONGODB_RESETS_DB_NAME);
  if (!db) return;
  try {
    await db
      .collection(mongoConfig.MONGODB_RESETS_COLLECTION)
      .createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 });
  } catch {}
}

export async function mongoCreateResetToken(email) {
  const db = await getDb(mongoConfig.MONGODB_RESETS_DB_NAME);
  if (!db) return null;
  await ensureResetTTLIndex();
  const token = crypto.randomBytes(16).toString("hex");
  await db.collection(mongoConfig.MONGODB_RESETS_COLLECTION).insertOne({ email, token, createdAt: new Date() });
  return token;
}

export async function mongoConsumeResetToken(token) {
  const db = await getDb(mongoConfig.MONGODB_RESETS_DB_NAME);
  if (!db) return null;
  const res = await db.collection(mongoConfig.MONGODB_RESETS_COLLECTION).findOneAndDelete({ token });
  return res?.value?.email || null;
}
