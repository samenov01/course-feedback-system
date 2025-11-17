import { ObjectId } from "mongodb";
import { getDb, mongoConfig } from "./client.js";

function normalizeFeedback(doc) {
  if (!doc) return null;
  return {
    id: String(doc._id || doc.id),
    courseId: Number(doc.courseId),
    comment: doc.comment,
    rating: Number(doc.rating),
    user: doc.user,
    teacher: doc.teacher ?? null,
    group: doc.group ?? null,
    lang: doc.lang ?? null,
  };
}

export async function mongoListFeedbacks(courseId) {
  const db = await getDb(mongoConfig.MONGODB_FEEDBACKS_DB_NAME);
  if (!db) return null;
  const rows = await db
    .collection(mongoConfig.MONGODB_FEEDBACKS_COLLECTION)
    .find({ courseId: Number(courseId) })
    .sort({ createdAt: -1 })
    .toArray();
  return rows.map(normalizeFeedback);
}

export async function mongoInsertFeedback(entry) {
  const db = await getDb(mongoConfig.MONGODB_FEEDBACKS_DB_NAME);
  if (!db) return null;
  const now = new Date();
  const res = await db.collection(mongoConfig.MONGODB_FEEDBACKS_COLLECTION).insertOne({
    ...entry,
    createdAt: now,
    updatedAt: now,
  });
  return { ...entry, id: String(res.insertedId) };
}

export async function mongoListAllFeedbacks(courseId) {
  const db = await getDb(mongoConfig.MONGODB_FEEDBACKS_DB_NAME);
  if (!db) return null;
  const cursor = courseId
    ? db.collection(mongoConfig.MONGODB_FEEDBACKS_COLLECTION).find({ courseId: Number(courseId) }).sort({ createdAt: -1 })
    : db.collection(mongoConfig.MONGODB_FEEDBACKS_COLLECTION).find({}).sort({ createdAt: -1 });
  const rows = await cursor.toArray();
  return rows.map(normalizeFeedback);
}

export async function mongoPatchFeedback(courseId, id, patch) {
  const db = await getDb(mongoConfig.MONGODB_FEEDBACKS_DB_NAME);
  if (!db) return null;
  const update = {};
  if (patch.comment !== undefined) update.comment = patch.comment;
  if (patch.rating !== undefined) update.rating = Number(patch.rating);
  if (patch.teacher !== undefined) update.teacher = patch.teacher ?? null;
  if (patch.group !== undefined) update.group = patch.group ?? null;
  if (patch.lang !== undefined) update.lang = patch.lang ?? null;
  if (!Object.keys(update).length) return true;
  const res = await db
    .collection(mongoConfig.MONGODB_FEEDBACKS_COLLECTION)
    .findOneAndUpdate({ _id: new ObjectId(id), courseId: Number(courseId) }, { $set: update }, { returnDocument: "after" });
  return normalizeFeedback(res.value);
}

export async function mongoDeleteFeedback(courseId, id) {
  const db = await getDb(mongoConfig.MONGODB_FEEDBACKS_DB_NAME);
  if (!db) return null;
  const res = await db
    .collection(mongoConfig.MONGODB_FEEDBACKS_COLLECTION)
    .deleteOne({ _id: new ObjectId(id), courseId: Number(courseId) });
  return res.deletedCount === 1;
}
