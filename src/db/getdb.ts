import { db, getTestDb, isTestEnvironment } from "@/db";

function getDbInstance() {
  if (isTestEnvironment()) return getTestDb();
  return db;
}

const dbInstance = getDbInstance();

export default dbInstance;
