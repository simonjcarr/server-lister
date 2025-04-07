import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema/index";
import fs from 'fs';
import path from 'path';

// Create a temp file to store the test database name
const TEST_DB_PATH = path.join(process.cwd(), '.test-db-name');

// Global function to set test database name that will be accessible across all server components
export function setTestDatabaseName(dbName: string) {
  if (!dbName) return;
  try {
    fs.writeFileSync(TEST_DB_PATH, dbName);
  } catch (error) {
    console.error('Error saving test database name:', error);
  }
}

// Function to get the test database name
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
function isTestEnvironment() {
  return process.env.NODE_ENV === 'test' || 
         process.env.CYPRESS_TESTING === 'true' || 
         (typeof window !== 'undefined' && window.Cypress);
}

// Create a function to get the current database connection string
export function getDatabaseUrl() {
  // In development/production (non-test) environments, always use the standard DATABASE_URL
  if (!isTestEnvironment()) {
    return process.env.DATABASE_URL || '';
  }
  
  // For Cypress tests in the browser
  if (typeof window !== 'undefined' && window.Cypress) {
    // Get the database name from localStorage (set by Cypress)
    const testDbName = window.localStorage.getItem('testDatabaseName');
    if (testDbName) {
      return `postgres://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${testDbName}`;
    }
  }
  
  // For server-side in test mode, try to get the test database name from our file
  if (isTestEnvironment()) {
    const testDbNameFromFile = getTestDatabaseName();
    if (testDbNameFromFile) {
      return `postgres://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${testDbNameFromFile}`;
    }
    
    // For test mode on server-side, check if there's a dynamic database name being used
    if (process.env.DATABASE_URL === 'test' && process.env.DYNAMIC_TEST_DB) {
      return `postgres://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DYNAMIC_TEST_DB}`;
    }
    
    // Default test database connection
    if (process.env.DATABASE_URL === 'test') {
      return `postgres://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`;
    }
  }
  
  // Production/development database connection
  return process.env.DATABASE_URL || '';
}

if(!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// Create a function to get a database connection pool
export function getDbPool() {
  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    throw new Error("Unable to determine database connection string");
  }

  return new Pool({
    connectionString,
    ssl: false,
  });
}

// Create a drizzle instance with the current connection settings
const pool = getDbPool();
export const db = drizzle(pool, { schema });

// For testing purposes, export a function to refresh the connection with a new database
export function refreshDbConnection() {
  const newPool = getDbPool();
  return drizzle(newPool, { schema });
}
