import { getDb, mongoConfig } from "./client.js";

export async function mongoGetUser(email) {
  const db = await getDb(mongoConfig.MONGODB_USERS_DB_NAME);
  if (!db) return null;
  return db.collection(mongoConfig.MONGODB_USERS_COLLECTION).findOne({ email: String(email).toLowerCase() });
}

export async function mongoUpsertUser(record) {
  const db = await getDb(mongoConfig.MONGODB_USERS_DB_NAME);
  if (!db) return null;
  const email = String(record.email).toLowerCase();
  await db
    .collection(mongoConfig.MONGODB_USERS_COLLECTION)
    .updateOne({ email }, { $set: { ...record, email } }, { upsert: true });
  return true;
}

export async function mongoUpdatePassword(email, newPasswordHash) {
  const db = await getDb(mongoConfig.MONGODB_USERS_DB_NAME);
  if (!db) return null;
  const lower = String(email).toLowerCase();
  await db
    .collection(mongoConfig.MONGODB_USERS_COLLECTION)
    .updateOne({ email: lower }, { $set: { passwordHash: newPasswordHash } });
  return true;
}
