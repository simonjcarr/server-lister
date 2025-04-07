// The migrate command to run for test is as follows
// NODE_ENV=test TEST_DATABASE_NAME=test_xxxxxxxx npx -y dotenv -e .env.test -- drizzle-kit migrate --config=drizzle.config.test.ts

import type { Config } from "drizzle-kit";
import fs from 'fs';
import path from 'path';

// Get the test database name from our file
const TEST_DB_PATH = path.join(process.cwd(), '.test-db-name');
let databaseName = process.env.TEST_DATABASE_NAME;

// If the file exists, prefer that value
if (fs.existsSync(TEST_DB_PATH)) {
  try {
    const fileDbName = fs.readFileSync(TEST_DB_PATH, 'utf-8').trim();
    if (fileDbName) {
      databaseName = fileDbName;
      console.log(`Using test database name from file: ${databaseName}`);
    }
  } catch (error) {
    console.error('Error reading test database name from file:', error);
  }
}

// Fall back to environment variables if file method failed
if (!databaseName) {
  databaseName = process.env.TEST_DATABASE_NAME || process.env.DATABASE_NAME;
  console.log(`Using test database name from environment: ${databaseName}`);
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in .env.test');
}

if (!databaseName) {
  throw new Error('No test database name found. Set TEST_DATABASE_NAME environment variable or use the file-based mechanism.');
}

const databaseURL = `postgres://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${databaseName}`
console.log(`Database connection for migrations: ${databaseURL.replace(/:[^:]*@/, ':****@')}`);

export default {
  schema: "./src/db/schema/index.ts", // Path to schema definitions
  out: "./drizzle", // Output folder for migrations
  dialect: "postgresql",
  dbCredentials: {
    url: databaseURL,
  },
} satisfies Config;
