import { MongoClient } from "mongodb";

// Mongo connection/collection configuration
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL || "";
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "feedbacks";
const MONGODB_FEEDBACKS_DB_NAME = process.env.MONGODB_FEEDBACKS_DB_NAME || MONGODB_DB_NAME;
const MONGODB_USERS_DB_NAME = process.env.MONGODB_USERS_DB_NAME || MONGODB_DB_NAME;
const MONGODB_RESETS_DB_NAME = process.env.MONGODB_RESETS_DB_NAME || MONGODB_DB_NAME;
const MONGODB_FEEDBACKS_COLLECTION = process.env.MONGODB_FEEDBACKS_COLLECTION || "feedbacks";
const MONGODB_USERS_COLLECTION = process.env.MONGODB_USERS_COLLECTION || "users";
const MONGODB_RESETS_COLLECTION = process.env.MONGODB_RESETS_COLLECTION || "password_resets";

let mongoClient = null;
let mongoReady = false;

export const mongoConfig = {
  MONGODB_URI,
  MONGODB_DB_NAME,
  MONGODB_FEEDBACKS_DB_NAME,
  MONGODB_USERS_DB_NAME,
  MONGODB_RESETS_DB_NAME,
  MONGODB_FEEDBACKS_COLLECTION,
  MONGODB_USERS_COLLECTION,
  MONGODB_RESETS_COLLECTION,
};

export async function getDb(name = MONGODB_DB_NAME) {
  if (!MONGODB_URI) return null;
  if (!mongoClient) {
    mongoClient = new MongoClient(MONGODB_URI, { maxPoolSize: 5 });
  }
  if (!mongoReady) {
    await mongoClient.connect();
    mongoReady = true;
  }
  return mongoClient.db(name);
}

// For tests: allow closing the Mongo client to avoid open handles
export async function _testCloseMongo() {
  try {
    if (mongoClient) await mongoClient.close();
  } catch {}
  mongoClient = null;
  mongoReady = false;
}
