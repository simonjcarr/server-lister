import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema/index";
import fs from 'fs';
import path from 'path';

// Create a temp file to store the test database name
const TEST_DB_PATH = path.join(process.cwd(), '.test-db-name');

// Define type for the database instance
type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

// Global function to set test database name that will be accessible across all server components
export function setTestDatabaseName(dbName: string) {
  if (!dbName) return;
  try {
    fs.writeFileSync(TEST_DB_PATH, dbName);
  } catch (error) {
    console.error('Error saving test database name:', error);
  }
}

// Function to get the test database name - always read directly from file
export function getTestDatabaseName(): string | null {
  try {
    if (fs.existsSync(TEST_DB_PATH)) {
      const dbName = fs.readFileSync(TEST_DB_PATH, 'utf-8').trim();
      return dbName;
    }
  } catch (error) {
    console.error('Error reading test database name:', error);
  }
  return null;
}

// Check if we're running in a test environment
export function isTestEnvironment() {
  return process.env.NODE_ENV === 'test' || 
         process.env.CYPRESS_TESTING === 'true' || 
         (typeof window !== 'undefined' && window.Cypress);
}

// Get database connection string based on environment
export function getDatabaseUrl() {
  // For non-test environments use the standard connection string
  if (!isTestEnvironment()) {
    return process.env.DATABASE_URL || '';
  }
  
  // In test environments, always read test DB name from file first
  const testDbName = getTestDatabaseName();
  if (testDbName) {
    return `postgres://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${testDbName}`;
  }
  
  // Fall back to environment variables if file doesn't exist
  if (process.env.DYNAMIC_TEST_DB) {
    return `postgres://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DYNAMIC_TEST_DB}`;
  }
  
  if (process.env.TEST_DATABASE_NAME) {
    return `postgres://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.TEST_DATABASE_NAME}`;
  }
  
  // Last resort - use DATABASE_URL if set to 'test'
  if (process.env.DATABASE_URL === 'test' && process.env.DATABASE_NAME) {
    return `postgres://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`;
  }
  
    return process.env.DATABASE_URL || '';
}

// For production environments, maintain a singleton connection
let prodPool: Pool | null = null;

function getProdPool() {
  if (!prodPool) {
    prodPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false,
    });
  }
  return prodPool;
}

// Production database instance - only used in non-test environments
const prodDb = drizzle(getProdPool(), { schema });

// Main database export - this is what most code will import
// In production, this is a singleton
// In tests, this will work but won't auto-update when test DB changes
export const db = prodDb;

// For test environments, always create a fresh connection
// This ensures we're always connecting to the correct test database
export function getTestDb(): DrizzleDB {
  if (!isTestEnvironment()) {
    return db; // In production, just use the singleton
  }
  
  // For tests, create a new connection every time
  const testDbUrl = getDatabaseUrl();
  
  const pool = new Pool({
    connectionString: testDbUrl,
    ssl: false,
  });
  
  return drizzle(pool, { schema });
}

// For backwards compatibility
export function refreshDbConnection(): DrizzleDB {
  return getTestDb();
}

// Only throw error about DATABASE_URL in non-build environments
if(!process.env.DATABASE_URL && process.env.NODE_ENV !== 'production') {
  throw new Error("DATABASE_URL is not set");
}
